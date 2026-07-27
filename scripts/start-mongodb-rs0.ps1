param(
  [int]$Port = 27019,
  [string]$ReplicaSet = "rs0"
)

$ErrorActionPreference = "Stop"
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$runtimeDirectory = Join-Path $projectRoot ".runtime"
$dataDirectory = Join-Path $runtimeDirectory "mongodb-kanban-rs0"
$logPath = Join-Path $runtimeDirectory "mongodb-kanban-rs0.log"
$configPath = Join-Path $runtimeDirectory "mongodb-kanban-rs0.yml"
$pidPath = Join-Path $runtimeDirectory "mongodb-kanban-rs0.pid"
$hostAddress = "127.0.0.1:$Port"

function Test-TcpPort {
  param([string]$Address, [int]$TargetPort)
  $client = [System.Net.Sockets.TcpClient]::new()
  try {
    return $client.ConnectAsync($Address, $TargetPort).Wait(500)
  } catch {
    return $false
  } finally {
    $client.Dispose()
  }
}

New-Item -ItemType Directory -Force -Path $dataDirectory | Out-Null

if (-not (Test-TcpPort -Address "127.0.0.1" -TargetPort $Port)) {
  $mongoExecutable = Get-ChildItem "C:\Program Files\MongoDB\Server" -Recurse -Filter "mongod.exe" -ErrorAction SilentlyContinue |
    Sort-Object FullName -Descending |
    Select-Object -First 1
  if (-not $mongoExecutable) {
    throw "mongod.exe was not found under C:\Program Files\MongoDB\Server."
  }

  $normalizedDataPath = $dataDirectory.Replace("\", "/")
  $normalizedLogPath = $logPath.Replace("\", "/")
  $configuration = @"
storage:
  dbPath: "$normalizedDataPath"
systemLog:
  destination: file
  logAppend: true
  path: "$normalizedLogPath"
net:
  port: $Port
  bindIp: 127.0.0.1
replication:
  replSetName: $ReplicaSet
setParameter:
  diagnosticDataCollectionEnabled: false
"@
  [System.IO.File]::WriteAllText($configPath, $configuration, [System.Text.UTF8Encoding]::new($false))

  $process = Start-Process -WindowStyle Hidden -FilePath $mongoExecutable.FullName `
    -ArgumentList @("--config", "`"$configPath`"") `
    -PassThru
  [System.IO.File]::WriteAllText($pidPath, [string]$process.Id)

  for ($attempt = 0; $attempt -lt 40; $attempt += 1) {
    if (Test-TcpPort -Address "127.0.0.1" -TargetPort $Port) { break }
    Start-Sleep -Milliseconds 250
  }
}

if (-not (Test-TcpPort -Address "127.0.0.1" -TargetPort $Port)) {
  throw "MongoDB did not begin listening on $hostAddress."
}

& node (Join-Path $PSScriptRoot "mongodb-rs0.mjs") init `
  --uri "mongodb://127.0.0.1:$Port/admin?directConnection=true" `
  --host $hostAddress `
  --set $ReplicaSet
if ($LASTEXITCODE -ne 0) {
  throw "Replica-set initialization failed."
}
