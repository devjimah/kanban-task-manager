param(
  [string]$HostUrl = "http://127.0.0.1:5000"
)

$ErrorActionPreference = "Stop"
$apiUrl = "$HostUrl/api/v1"
$runtimeDirectory = Join-Path $PSScriptRoot "..\.runtime\curl-smoke"
New-Item -ItemType Directory -Force -Path $runtimeDirectory | Out-Null

$script:results = [System.Collections.Generic.List[object]]::new()
$script:createdBoardId = $null
$script:cleanupToken = $null

function Invoke-ApiCurl {
  param(
    [Parameter(Mandatory)][string]$Name,
    [Parameter(Mandatory)][string]$Method,
    [Parameter(Mandatory)][string]$Url,
    [Parameter(Mandatory)][int[]]$Expected,
    [string]$Token,
    [object]$Body,
    [string]$CookieJar
  )

  $responseFile = Join-Path $runtimeDirectory ("response-" + [guid]::NewGuid().ToString("N") + ".json")
  $requestFile = $null
  $arguments = @("-sS", "-o", $responseFile, "-w", "%{http_code}", "-X", $Method, $Url)

  if ($Token) {
    $arguments += @("-H", "Authorization: Bearer $Token")
  }
  if ($null -ne $Body) {
    $requestFile = Join-Path $runtimeDirectory ("request-" + [guid]::NewGuid().ToString("N") + ".json")
    $requestJson = $Body | ConvertTo-Json -Depth 10 -Compress
    [System.IO.File]::WriteAllText($requestFile, $requestJson, [System.Text.UTF8Encoding]::new($false))
    $arguments += @("-H", "Content-Type: application/json", "--data-binary", "@$requestFile")
  }
  if ($CookieJar) {
    $arguments += @("-b", $CookieJar, "-c", $CookieJar)
  }

  $statusText = (& curl.exe @arguments).Trim()
  $exitCode = $LASTEXITCODE
  $raw = if (Test-Path $responseFile) { Get-Content -Raw $responseFile } else { "" }
  Remove-Item -LiteralPath $responseFile -Force -ErrorAction SilentlyContinue
  if ($requestFile) {
    Remove-Item -LiteralPath $requestFile -Force -ErrorAction SilentlyContinue
  }

  if ($exitCode -ne 0 -or $statusText -notmatch "^\d{3}$") {
    throw "curl failed for $Method $Url (exit $exitCode, status '$statusText')."
  }

  $status = [int]$statusText
  $json = $null
  if ($raw) {
    try {
      $json = $raw | ConvertFrom-Json
    } catch {
      $json = $null
    }
  }

  $passed = $Expected -contains $status
  $script:results.Add([pscustomobject]@{
    Name = $Name
    Method = $Method
    Path = $Url.Replace($HostUrl, "")
    Expected = ($Expected -join "|")
    Actual = $status
    Pass = $passed
    ErrorCode = if (-not $passed -and $json -and $json.code) { $json.code } else { "" }
    Message = if (-not $passed -and $json -and $json.message) { $json.message } else { "" }
  })

  return [pscustomobject]@{
    Status = $status
    Json = $json
    Raw = $raw
    Passed = $passed
  }
}

function Assert-Data {
  param(
    [Parameter(Mandatory)][object]$Response,
    [Parameter(Mandatory)][string]$Step
  )

  if (-not $Response.Passed -or -not $Response.Json -or -not $Response.Json.data) {
    throw "$Step did not return a usable success payload. Cleanup will still be attempted."
  }
  return $Response.Json.data
}

$stamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
$password = "password1234"
$ownerEmail = "curl-owner-$stamp@example.test"
$viewerEmail = "curl-viewer-$stamp@example.test"
$editorEmail = "curl-editor-$stamp@example.test"
$ownerJar = Join-Path $runtimeDirectory "owner-$stamp.cookies"
$viewerJar = Join-Path $runtimeDirectory "viewer-$stamp.cookies"
$editorJar = Join-Path $runtimeDirectory "editor-$stamp.cookies"

try {
  Invoke-ApiCurl -Name "Health" -Method GET -Url "$HostUrl/health" -Expected 200 | Out-Null
  Invoke-ApiCurl -Name "Readiness" -Method GET -Url "$HostUrl/ready" -Expected 200 | Out-Null
  Invoke-ApiCurl -Name "Unknown route without token" -Method GET -Url "$apiUrl/not-a-route" -Expected 401 | Out-Null
  Invoke-ApiCurl -Name "Boards without token" -Method GET -Url "$apiUrl/boards" -Expected 401 | Out-Null

  $ownerRegistration = Invoke-ApiCurl -Name "Register owner" -Method POST -Url "$apiUrl/auth/register" -Expected 201 -CookieJar $ownerJar -Body @{
    name = "Curl Owner"
    email = $ownerEmail
    password = $password
  }
  $ownerData = Assert-Data $ownerRegistration "Owner registration"
  $ownerToken = $ownerData.accessToken

  $viewerRegistration = Invoke-ApiCurl -Name "Register viewer" -Method POST -Url "$apiUrl/auth/register" -Expected 201 -CookieJar $viewerJar -Body @{
    name = "Curl Viewer"
    email = $viewerEmail
    password = $password
  }
  $viewerData = Assert-Data $viewerRegistration "Viewer registration"
  $viewerToken = $viewerData.accessToken
  $viewerId = $viewerData.user.id

  $editorRegistration = Invoke-ApiCurl -Name "Register editor" -Method POST -Url "$apiUrl/auth/register" -Expected 201 -CookieJar $editorJar -Body @{
    name = "Curl Editor"
    email = $editorEmail
    password = $password
  }
  $editorData = Assert-Data $editorRegistration "Editor registration"
  $editorToken = $editorData.accessToken
  $editorId = $editorData.user.id

  $ownerLogin = Invoke-ApiCurl -Name "Login" -Method POST -Url "$apiUrl/auth/login" -Expected 200 -CookieJar $ownerJar -Body @{
    email = $ownerEmail
    password = $password
  }
  $ownerToken = (Assert-Data $ownerLogin "Owner login").accessToken
  Invoke-ApiCurl -Name "Unknown route with token" -Method GET -Url "$apiUrl/not-a-route" -Expected 404 -Token $ownerToken | Out-Null

  Invoke-ApiCurl -Name "Current user" -Method GET -Url "$apiUrl/auth/me" -Expected 200 -Token $ownerToken | Out-Null
  $refresh = Invoke-ApiCurl -Name "Refresh token" -Method POST -Url "$apiUrl/auth/refresh" -Expected 200 -CookieJar $ownerJar
  $ownerToken = (Assert-Data $refresh "Token refresh").accessToken
  $script:cleanupToken = $ownerToken

  $boardCreate = Invoke-ApiCurl -Name "Create board" -Method POST -Url "$apiUrl/boards" -Expected 201 -Token $ownerToken -Body @{
    title = "Curl Smoke Board $stamp"
  }
  $board = Assert-Data $boardCreate "Board creation"
  $boardId = $board.id
  $script:createdBoardId = $boardId
  $boardVersion = [int]$board.version

  Invoke-ApiCurl -Name "List boards" -Method GET -Url "$apiUrl/boards" -Expected 200 -Token $ownerToken | Out-Null
  Invoke-ApiCurl -Name "Get board" -Method GET -Url "$apiUrl/boards/$boardId" -Expected 200 -Token $ownerToken | Out-Null

  $boardUpdate = Invoke-ApiCurl -Name "Update board" -Method PUT -Url "$apiUrl/boards/$boardId" -Expected 200 -Token $ownerToken -Body @{
    title = "Curl Smoke Board Updated $stamp"
    version = $boardVersion
  }
  $boardVersion = [int](Assert-Data $boardUpdate "Board update").version

  $todoResponse = Invoke-ApiCurl -Name "Create first column" -Method POST -Url "$apiUrl/boards/$boardId/columns" -Expected 201 -Token $ownerToken -Body @{
    title = "Todo"
    position = 0
  }
  $todo = Assert-Data $todoResponse "First column creation"

  $doingResponse = Invoke-ApiCurl -Name "Create second column" -Method POST -Url "$apiUrl/boards/$boardId/columns" -Expected 201 -Token $ownerToken -Body @{
    title = "Doing"
    position = 1
  }
  $doing = Assert-Data $doingResponse "Second column creation"

  $emptyResponse = Invoke-ApiCurl -Name "Create disposable column" -Method POST -Url "$apiUrl/boards/$boardId/columns" -Expected 201 -Token $ownerToken -Body @{
    title = "Disposable"
    position = 2
  }
  $emptyColumn = Assert-Data $emptyResponse "Disposable column creation"

  $columnUpdate = Invoke-ApiCurl -Name "Update column" -Method PUT -Url "$apiUrl/columns/$($todo.id)" -Expected 200 -Token $ownerToken -Body @{
    title = "Backlog"
    version = [int]$todo.version
  }
  $todo = Assert-Data $columnUpdate "Column update"

  $columnMove = Invoke-ApiCurl -Name "Move column" -Method PATCH -Url "$apiUrl/columns/$($doing.id)/move" -Expected 200 -Token $ownerToken -Body @{
    position = 0
    version = [int]$doing.version
  }
  if ($columnMove.Passed -and $columnMove.Json.data) {
    $doing = $columnMove.Json.data
  }

  Invoke-ApiCurl -Name "Delete empty column" -Method DELETE -Url "$apiUrl/columns/$($emptyColumn.id)" -Expected 204 -Token $ownerToken | Out-Null

  $taskCreate = Invoke-ApiCurl -Name "Create task" -Method POST -Url "$apiUrl/tasks" -Expected 201 -Token $ownerToken -Body @{
    boardId = $boardId
    columnId = $todo.id
    title = "Curl smoke task"
    description = "Created by the all-endpoint curl smoke test"
    position = 0
    dueDate = [DateTime]::UtcNow.AddDays(7).ToString("o")
    subtasks = @(@{
      title = "Verify response"
      isCompleted = $false
      position = 0
    })
  }
  $task = Assert-Data $taskCreate "Task creation"

  Invoke-ApiCurl -Name "Get task" -Method GET -Url "$apiUrl/tasks/$($task.id)" -Expected 200 -Token $ownerToken | Out-Null

  $taskUpdate = Invoke-ApiCurl -Name "Update task" -Method PUT -Url "$apiUrl/tasks/$($task.id)" -Expected 200 -Token $ownerToken -Body @{
    title = "Curl smoke task updated"
    version = [int]$task.version
  }
  $task = Assert-Data $taskUpdate "Task update"

  $taskComplete = Invoke-ApiCurl -Name "Complete task" -Method PATCH -Url "$apiUrl/tasks/$($task.id)/complete" -Expected 200 -Token $ownerToken -Body @{
    isCompleted = $true
    version = [int]$task.version
  }
  $task = Assert-Data $taskComplete "Task completion"

  $taskMove = Invoke-ApiCurl -Name "Move task" -Method PATCH -Url "$apiUrl/tasks/$($task.id)/move" -Expected 200 -Token $ownerToken -Body @{
    columnId = $doing.id
    position = 0
    version = [int]$task.version
  }
  if ($taskMove.Passed -and $taskMove.Json.data) {
    $task = $taskMove.Json.data
  }

  Invoke-ApiCurl -Name "Invite viewer" -Method POST -Url "$apiUrl/boards/$boardId/members" -Expected 201 -Token $ownerToken -Body @{
    email = $viewerEmail
    access = "viewer"
  } | Out-Null
  Invoke-ApiCurl -Name "Accept viewer invitation" -Method POST -Url "$apiUrl/boards/$boardId/members/accept" -Expected 200 -Token $viewerToken | Out-Null
  Invoke-ApiCurl -Name "Viewer reads board" -Method GET -Url "$apiUrl/boards/$boardId" -Expected 200 -Token $viewerToken | Out-Null
  Invoke-ApiCurl -Name "Viewer cannot edit board" -Method PUT -Url "$apiUrl/boards/$boardId" -Expected 403 -Token $viewerToken -Body @{
    title = "Forbidden viewer update"
    version = $boardVersion
  } | Out-Null

  Invoke-ApiCurl -Name "Invite editor" -Method POST -Url "$apiUrl/boards/$boardId/members" -Expected 201 -Token $ownerToken -Body @{
    email = $editorEmail
    access = "editor"
  } | Out-Null
  Invoke-ApiCurl -Name "Accept editor invitation" -Method POST -Url "$apiUrl/boards/$boardId/members/accept" -Expected 200 -Token $editorToken | Out-Null
  Invoke-ApiCurl -Name "List members" -Method GET -Url "$apiUrl/boards/$boardId/members" -Expected 200 -Token $ownerToken | Out-Null

  Invoke-ApiCurl -Name "Update member access" -Method PUT -Url "$apiUrl/boards/$boardId/members/$editorId" -Expected 200 -Token $ownerToken -Body @{
    access = "viewer"
  } | Out-Null
  Invoke-ApiCurl -Name "Restore member access" -Method PUT -Url "$apiUrl/boards/$boardId/members/$editorId" -Expected 200 -Token $ownerToken -Body @{
    access = "editor"
  } | Out-Null
  Invoke-ApiCurl -Name "Remove member" -Method DELETE -Url "$apiUrl/boards/$boardId/members/$viewerId" -Expected 204 -Token $ownerToken | Out-Null

  Invoke-ApiCurl -Name "Delete task" -Method DELETE -Url "$apiUrl/tasks/$($task.id)" -Expected 204 -Token $ownerToken | Out-Null

  $transfer = Invoke-ApiCurl -Name "Transfer ownership" -Method POST -Url "$apiUrl/boards/$boardId/transfer" -Expected 204 -Token $ownerToken -Body @{
    userId = $editorId
  }
  if ($transfer.Passed) {
    $script:cleanupToken = $editorToken
  }

  $cleanup = Invoke-ApiCurl -Name "Delete board" -Method DELETE -Url "$apiUrl/boards/$boardId" -Expected 204 -Token $script:cleanupToken
  if ($cleanup.Passed) {
    $script:createdBoardId = $null
  }

  Invoke-ApiCurl -Name "Logout" -Method POST -Url "$apiUrl/auth/logout" -Expected 204 -CookieJar $ownerJar | Out-Null
  Invoke-ApiCurl -Name "Refresh after logout" -Method POST -Url "$apiUrl/auth/refresh" -Expected 401 -CookieJar $ownerJar | Out-Null
}
finally {
  if ($script:createdBoardId -and $script:cleanupToken) {
    try {
      $cleanupResponse = Invoke-ApiCurl -Name "Emergency board cleanup" -Method DELETE -Url "$apiUrl/boards/$script:createdBoardId" -Expected @(204, 404) -Token $script:cleanupToken
      if ($cleanupResponse.Passed) {
        $script:createdBoardId = $null
      }
    } catch {
      Write-Warning "Emergency cleanup failed: $($_.Exception.Message)"
    }
  }

  Remove-Item -LiteralPath $ownerJar, $viewerJar, $editorJar -Force -ErrorAction SilentlyContinue
  $summaryPath = Join-Path $runtimeDirectory "latest-results.json"
  $script:results | ConvertTo-Json -Depth 5 | Set-Content -Path $summaryPath

  $script:results | Format-Table Name, Method, Path, Expected, Actual, Pass, ErrorCode -AutoSize
  $passedCount = @($script:results | Where-Object Pass).Count
  $failedCount = @($script:results | Where-Object { -not $_.Pass }).Count
  Write-Host ""
  Write-Host "Result: $passedCount passed, $failedCount failed, $($script:results.Count) total"
  Write-Host "Cleanup: $(if ($script:createdBoardId) { "FAILED (board $script:createdBoardId remains)" } else { "passed" })"
  Write-Host "JSON report: $summaryPath"

  if ($failedCount -gt 0) {
    exit 1
  }
}
