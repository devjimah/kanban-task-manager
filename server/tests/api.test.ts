import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { connectDatabase, disconnectDatabase } from "../src/config/database.js";
import type { Environment } from "../src/config/env.js";
import { BoardModel } from "../src/models/board.js";
import { ColumnModel } from "../src/models/column.js";
import { TaskModel } from "../src/models/task.js";
import { UserModel } from "../src/models/user.js";
import { BoardMemberModel } from "../src/models/board-member.js";
import { RefreshSessionModel } from "../src/models/refresh-session.js";
import bcrypt from "bcrypt";

const environment: Environment = {
  NODE_ENV: "test",
  PORT: 5000,
  MONGODB_URI: "unused",
  ALLOWED_ORIGINS: "http://localhost:5173",
  LOG_LEVEL: "silent",
  JWT_ACCESS_SECRET: "test-access-secret-that-is-at-least-32-characters",
  JWT_REFRESH_SECRET: "test-refresh-secret-that-is-at-least-32-characters",
  ACCESS_TOKEN_TTL_MINUTES: 15,
  REFRESH_TOKEN_TTL_DAYS: 7,
  BCRYPT_ROUNDS: 10,
};

const app = createApp(environment);
let database: MongoMemoryReplSet | undefined;

// What: Asynchronous authenticated-test helper function.
// Does: Registers a unique user and returns the access token and public identity from the API.
// If removed: Protected integration tests must duplicate account and token setup.
async function registerUser(label = new mongoose.Types.ObjectId().toString()) {
  const response = await request(app)
    .post("/api/v1/auth/register")
    .send({ name: `User ${label.slice(-6)}`, email: `${label}@example.com`, password: "password1234" })
    .expect(201);
  return response.body.data as { accessToken: string; user: { id: string } };
}

// What: Authorization-header test helper function.
// Does: Formats an access JWT as the Bearer header expected by protected middleware.
// If removed: Tests must repeat security-sensitive header formatting.
function bearer(accessToken: string) {
  return `Bearer ${accessToken}`;
}

// What: Asynchronous Vitest suite-setup callback function.
// Does: Starts a MongoDB replica set, connects Mongoose, and creates required indexes.
// If removed: Persistence integration tests have no real database environment.
beforeAll(async () => {
  database = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await connectDatabase(database.getUri());
  await Promise.all([BoardModel.init(), ColumnModel.init(), TaskModel.init(), UserModel.init(), BoardMemberModel.init(), RefreshSessionModel.init()]);
});

// What: Asynchronous Vitest test-isolation callback function.
// Does: Clears data and restores indexes before every API test.
// If removed: Tests can leak state and produce order-dependent results.
beforeEach(async () => {
  await mongoose.connection.db?.dropDatabase();
  await Promise.all([BoardModel.syncIndexes(), ColumnModel.syncIndexes(), TaskModel.syncIndexes(), UserModel.syncIndexes(), BoardMemberModel.syncIndexes(), RefreshSessionModel.syncIndexes()]);
});

// What: Asynchronous Vitest suite-cleanup callback function.
// Does: Disconnects Mongoose and stops the ephemeral replica set.
// If removed: Test processes can leak database resources or hang.
afterAll(async () => {
  await disconnectDatabase();
  await database?.stop();
});

// What: Vitest operational-endpoint suite callback function.
// Does: Groups liveness, readiness, request-ID, and route-error contract tests.
// If removed: Operational API behavior loses its dedicated regression scope.
describe("operational endpoints", () => {
  // What: Asynchronous Vitest test-case callback function.
  // Does: Verifies liveness, readiness, and request-ID response behavior.
  // If removed: Deployment probe regressions can pass unnoticed.
  it("reports health and database readiness", async () => {
    await request(app).get("/health").expect(200).expect("x-request-id", /.+/);
    const response = await request(app).get("/ready").expect(200);
    expect(response.body.data.state).toBe("ready");
  });

  // What: Asynchronous Vitest test-case callback function.
  // Does: Verifies unknown routes return the documented structured error envelope.
  // If removed: Route fallthrough behavior can regress without detection.
  it("returns the standard error envelope for unknown routes", async () => {
    const response = await request(app).get("/missing").expect(404);
    expect(response.body).toMatchObject({ status: "error", code: "ROUTE_NOT_FOUND" });
    expect(response.body.requestId).toBeTypeOf("string");
  });
});

// What: Vitest persistence-API suite callback function.
// Does: Groups real MongoDB integration tests for boards, columns, and tasks.
// If removed: Core persistence behavior loses its end-to-end API regression suite.
describe("persistent Kanban API", () => {
  // What: Asynchronous Vitest test-case callback function.
  // Does: Proves board, column, task, and subtask data persist and reload together.
  // If removed: The primary persistence vertical slice is no longer verified.
  it("creates and retrieves a board with ordered columns and tasks", async () => {
    const owner = await registerUser();
    const boardResponse = await request(app)
      .post("/api/v1/boards")
      .set("authorization", bearer(owner.accessToken))
      .send({ title: "Product Roadmap" })
      .expect(201);
    const boardId = boardResponse.body.data.id as string;

    const columnResponse = await request(app)
      .post(`/api/v1/boards/${boardId}/columns`)
      .set("authorization", bearer(owner.accessToken))
      .send({ title: "Todo", position: 0 })
      .expect(201);
    const columnId = columnResponse.body.data.id as string;

    await request(app)
      .post("/api/v1/tasks")
      .set("authorization", bearer(owner.accessToken))
      .send({
        boardId,
        columnId,
        title: "Connect API",
        description: "Replace the mock boundary",
        position: 0,
        subtasks: [{ title: "Write contract", position: 0, isCompleted: true }],
      })
      .expect(201);

    const response = await request(app).get(`/api/v1/boards/${boardId}`).set("authorization", bearer(owner.accessToken)).expect(200);
    expect(response.body.data).toMatchObject({ title: "Product Roadmap" });
    expect(response.body.data.columns).toHaveLength(1);
    expect(response.body.data.tasks[0]).toMatchObject({ title: "Connect API", columnId });
  });

  // What: Asynchronous Vitest test-case callback function.
  // Does: Verifies strict schemas reject malformed values and unknown fields.
  // If removed: Boundary-validation regressions can reach service code unnoticed.
  it("rejects malformed and unknown request fields", async () => {
    const owner = await registerUser();
    const response = await request(app)
      .post("/api/v1/boards")
      .set("authorization", bearer(owner.accessToken))
      .send({ title: "A", ownerId: "invalid", surprise: true })
      .expect(400);
    expect(response.body.code).toBe("VALIDATION_ERROR");
    expect(response.body.errors.length).toBeGreaterThan(0);
  });

  // What: Asynchronous Vitest test-case callback function.
  // Does: Verifies absent boards produce the standard 404 application error.
  // If removed: Not-found response behavior can regress without detection.
  it("returns not found for a missing board", async () => {
    const owner = await registerUser();
    const response = await request(app)
      .get(`/api/v1/boards/${new mongoose.Types.ObjectId()}`)
      .set("authorization", bearer(owner.accessToken))
      .expect(404);
    expect(response.body.code).toBe("NOT_FOUND");
  });

  // What: Asynchronous Vitest test-case callback function.
  // Does: Proves optimistic concurrency rejects a second update using a stale version.
  // If removed: Lost-update protection is no longer covered by an integration test.
  it("rejects a stale board update", async () => {
    const owner = await registerUser();
    const createdResponse = await request(app).post("/api/v1/boards").set("authorization", bearer(owner.accessToken)).send({ title: "Original" }).expect(201);
    const created = createdResponse.body.data as { id: string };
    await request(app)
      .put(`/api/v1/boards/${created.id}`)
      .set("authorization", bearer(owner.accessToken))
      .send({ title: "Current", version: 0 })
      .expect(200);
    const response = await request(app)
      .put(`/api/v1/boards/${created.id}`)
      .set("authorization", bearer(owner.accessToken))
      .send({ title: "Stale", version: 0 })
      .expect(409);
    expect(response.body.code).toBe("VERSION_CONFLICT");
  });

  // What: Asynchronous Vitest test-case callback function.
  // Does: Proves dependency-ordered board deletion removes related columns and tasks.
  // If removed: Cascade cleanup behavior can regress and leave orphan data.
  it("deletes a board and its children", async () => {
    const owner = await registerUser();
    const boardResponse = await request(app).post("/api/v1/boards").set("authorization", bearer(owner.accessToken)).send({ title: "Disposable" }).expect(201);
    const board = { id: boardResponse.body.data.id as string };
    const column = await ColumnModel.create({ boardId: board.id, title: "Todo", position: 0 });
    await TaskModel.create({ boardId: board.id, columnId: column.id, title: "Delete me", position: 0 });

    await request(app).delete(`/api/v1/boards/${board.id}`).set("authorization", bearer(owner.accessToken)).expect(204);
    expect(await ColumnModel.countDocuments()).toBe(0);
    expect(await TaskModel.countDocuments()).toBe(0);
  });

  // What: Asynchronous Vitest task-reorder test-case callback function.
  // Does: Proves a cross-column move persists contiguous order and rejects replay with the stale task version.
  // If removed: Durable drag-and-drop ordering and its concurrency guard can regress unnoticed.
  it("transactionally moves and reorders a task", async () => {
    const owner = await registerUser();
    const boardResponse = await request(app).post("/api/v1/boards").set("authorization", bearer(owner.accessToken)).send({ title: "Movable" }).expect(201);
    const boardId = boardResponse.body.data.id as string;
    const [source, destination] = await ColumnModel.create([{ boardId, title: "Todo", position: 0 }, { boardId, title: "Doing", position: 1 }]);
    if (!source || !destination) throw new Error("Columns were not created");
    const moving = await TaskModel.create({ boardId, columnId: source.id, title: "Move me", position: 0 });
    await TaskModel.create({ boardId, columnId: destination.id, title: "Existing", position: 0 });

    const moved = await request(app)
      .patch(`/api/v1/tasks/${moving.id}/move`)
      .set("authorization", bearer(owner.accessToken))
      .send({ columnId: destination.id, position: 0, version: 0 })
      .expect(200);
    expect(moved.body.data).toMatchObject({ columnId: destination.id, position: 0, version: 1 });
    const ordered = await TaskModel.find({ columnId: destination.id }).sort({ position: 1 });
    // What: Ordered-task-title mapping callback function.
    // Does: Projects persisted task documents into their human-readable order assertion.
    // If removed: The test cannot clearly verify the final destination sequence.
    expect(ordered.map((task) => task.title)).toEqual(["Move me", "Existing"]);
    await request(app)
      .patch(`/api/v1/tasks/${moving.id}/move`)
      .set("authorization", bearer(owner.accessToken))
      .send({ columnId: source.id, position: 0, version: 0 })
      .expect(409);
  });

  // What: Asynchronous Vitest column-reorder test-case callback function.
  // Does: Proves a versioned column move persists a contiguous board sequence and rejects stale replay.
  // If removed: Durable column drag-and-drop ordering can regress without an integration failure.
  it("transactionally reorders columns", async () => {
    const owner = await registerUser();
    const boardResponse = await request(app).post("/api/v1/boards").set("authorization", bearer(owner.accessToken)).send({ title: "Ordered" }).expect(201);
    const boardId = boardResponse.body.data.id as string;
    const [first, second] = await ColumnModel.create([{ boardId, title: "First", position: 0 }, { boardId, title: "Second", position: 1 }]);
    if (!first || !second) throw new Error("Columns were not created");
    const moved = await request(app).patch(`/api/v1/columns/${second.id}/move`).set("authorization", bearer(owner.accessToken)).send({ position: 0, version: 0 }).expect(200);
    expect(moved.body.data).toMatchObject({ position: 0, version: 1 });
    const ordered = await ColumnModel.find({ boardId }).sort({ position: 1 });
    // What: Ordered-column-title mapping callback function.
    // Does: Projects persisted columns into their human-readable order assertion.
    // If removed: The test cannot clearly prove the final column sequence.
    expect(ordered.map((column) => column.title)).toEqual(["Second", "First"]);
    await request(app).patch(`/api/v1/columns/${second.id}/move`).set("authorization", bearer(owner.accessToken)).send({ position: 1, version: 0 }).expect(409);
  });

  // What: Asynchronous Vitest advanced-task test-case callback function.
  // Does: Proves due dates persist and explicit completion/reopening updates timestamps with version protection.
  // If removed: Mandatory advanced task fields and completion semantics can regress unnoticed.
  it("persists due dates and explicit task completion", async () => {
    const owner = await registerUser();
    const boardResponse = await request(app).post("/api/v1/boards").set("authorization", bearer(owner.accessToken)).send({ title: "Deadlines" }).expect(201);
    const boardId = boardResponse.body.data.id as string;
    const column = await ColumnModel.create({ boardId, title: "Todo", position: 0 });
    const dueDate = "2026-08-01T12:00:00.000Z";
    const created = await request(app).post("/api/v1/tasks").set("authorization", bearer(owner.accessToken)).send({ boardId, columnId: column.id, title: "Submit lab", description: "", position: 0, dueDate, subtasks: [] }).expect(201);
    expect(created.body.data.dueDate).toBe(dueDate);
    const taskId = created.body.data.id as string;
    const completed = await request(app).patch(`/api/v1/tasks/${taskId}/complete`).set("authorization", bearer(owner.accessToken)).send({ isCompleted: true, version: 0 }).expect(200);
    expect(completed.body.data.completedAt).toBeTypeOf("string");
    const reopened = await request(app).patch(`/api/v1/tasks/${taskId}/complete`).set("authorization", bearer(owner.accessToken)).send({ isCompleted: false, version: 1 }).expect(200);
    expect(reopened.body.data.completedAt).toBeNull();
  });
});

// What: Vitest authentication suite callback function.
// Does: Groups password, access-token, refresh-rotation, and logout security tests.
// If removed: Session lifecycle security loses its integration regression suite.
describe("authentication lifecycle", () => {
  // What: Asynchronous Vitest test-case callback function.
  // Does: Proves registration stores a bcrypt hash and never returns password material.
  // If removed: Password-storage and response-redaction regressions can pass unnoticed.
  it("hashes passwords and returns only public user data", async () => {
    const response = await request(app)
      .post("/api/v1/auth/register")
      .send({ name: "Secure User", email: "secure@example.com", password: "password1234" })
      .expect(201);
    expect(response.body.data.user).not.toHaveProperty("passwordHash");
    const user = await UserModel.findOne({ email: "secure@example.com" }).select("+passwordHash");
    expect(user?.passwordHash).not.toBe("password1234");
    expect(await bcrypt.compare("password1234", user!.passwordHash)).toBe(true);
  });

  // What: Asynchronous Vitest test-case callback function.
  // Does: Verifies bad credentials receive one generic unauthorized response.
  // If removed: Account-enumeration-safe login behavior can regress.
  it("rejects invalid credentials without revealing account existence", async () => {
    const response = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "missing@example.com", password: "wrong-password" })
      .expect(401);
    expect(response.body).toMatchObject({ code: "UNAUTHORIZED", message: "Invalid email or password" });
  });

  // What: Asynchronous Vitest test-case callback function.
  // Does: Verifies protected board routes reject requests without an access token.
  // If removed: Accidental removal of authentication middleware can pass unnoticed.
  it("protects Kanban routes", async () => {
    await request(app).get("/api/v1/boards").expect(401);
  });

  // What: Asynchronous Vitest test-case callback function.
  // Does: Proves refresh tokens rotate once and a consumed token cannot be replayed.
  // If removed: Refresh-token replay vulnerabilities can regress undetected.
  it("rotates refresh tokens and rejects replay", async () => {
    const registration = await request(app)
      .post("/api/v1/auth/register")
      .send({ name: "Refresh User", email: "refresh@example.com", password: "password1234" })
      .expect(201);
    const originalCookie = registration.get("set-cookie")?.[0]?.split(";")[0];
    expect(originalCookie).toBeTypeOf("string");
    const refreshed = await request(app).post("/api/v1/auth/refresh").set("cookie", originalCookie!).expect(200);
    const rotatedCookie = refreshed.get("set-cookie")?.[0]?.split(";")[0];
    expect(rotatedCookie).not.toBe(originalCookie);
    await request(app).post("/api/v1/auth/refresh").set("cookie", originalCookie!).expect(401);
  });

  // What: Asynchronous Vitest test-case callback function.
  // Does: Proves logout revokes the refresh session and clears the browser cookie.
  // If removed: Session-revocation regressions can pass unnoticed.
  it("revokes the current refresh session on logout", async () => {
    const registration = await request(app)
      .post("/api/v1/auth/register")
      .send({ name: "Logout User", email: "logout@example.com", password: "password1234" })
      .expect(201);
    const cookie = registration.get("set-cookie")?.[0]?.split(";")[0];
    await request(app).post("/api/v1/auth/logout").set("cookie", cookie!).expect(204);
    await request(app).post("/api/v1/auth/refresh").set("cookie", cookie!).expect(401);
  });
});

// What: Vitest board-RBAC suite callback function.
// Does: Groups owner, editor, viewer, invitation, and cross-board authorization tests.
// If removed: Board-level access control loses its explicit permission-matrix coverage.
describe("board collaboration and RBAC", () => {
  // What: Asynchronous Vitest test-case callback function.
  // Does: Proves viewers can read but cannot modify board content.
  // If removed: Viewer read-only enforcement can regress unnoticed.
  it("enforces viewer read-only access", async () => {
    const owner = await registerUser("owner-viewer");
    const viewer = await registerUser("viewer-user");
    const boardResponse = await request(app).post("/api/v1/boards").set("authorization", bearer(owner.accessToken)).send({ title: "Viewer Board" }).expect(201);
    const boardId = boardResponse.body.data.id as string;
    await request(app).post(`/api/v1/boards/${boardId}/members`).set("authorization", bearer(owner.accessToken)).send({ email: "viewer-user@example.com", access: "viewer" }).expect(201);
    await request(app).post(`/api/v1/boards/${boardId}/members/accept`).set("authorization", bearer(viewer.accessToken)).expect(200);
    await request(app).get(`/api/v1/boards/${boardId}`).set("authorization", bearer(viewer.accessToken)).expect(200);
    await request(app).post(`/api/v1/boards/${boardId}/columns`).set("authorization", bearer(viewer.accessToken)).send({ title: "Blocked", position: 0 }).expect(403);
  });

  // What: Asynchronous Vitest test-case callback function.
  // Does: Proves editors can modify content but cannot delete or administer the board.
  // If removed: Editor-versus-owner privilege separation can regress unnoticed.
  it("allows editor content changes but blocks owner operations", async () => {
    const owner = await registerUser("owner-editor");
    const editor = await registerUser("editor-user");
    const boardResponse = await request(app).post("/api/v1/boards").set("authorization", bearer(owner.accessToken)).send({ title: "Editor Board" }).expect(201);
    const boardId = boardResponse.body.data.id as string;
    await request(app).post(`/api/v1/boards/${boardId}/members`).set("authorization", bearer(owner.accessToken)).send({ email: "editor-user@example.com", access: "editor" }).expect(201);
    await request(app).post(`/api/v1/boards/${boardId}/members/accept`).set("authorization", bearer(editor.accessToken)).expect(200);
    await request(app).post(`/api/v1/boards/${boardId}/columns`).set("authorization", bearer(editor.accessToken)).send({ title: "Doing", position: 0 }).expect(201);
    await request(app).delete(`/api/v1/boards/${boardId}`).set("authorization", bearer(editor.accessToken)).expect(403);
    await request(app).get(`/api/v1/boards/${boardId}/members`).set("authorization", bearer(editor.accessToken)).expect(403);
  });

  // What: Asynchronous Vitest test-case callback function.
  // Does: Proves unrelated authenticated users cannot read another user's board.
  // If removed: Object-level authorization probing can regress unnoticed.
  it("blocks cross-board access", async () => {
    const owner = await registerUser("private-owner");
    const stranger = await registerUser("private-stranger");
    const boardResponse = await request(app).post("/api/v1/boards").set("authorization", bearer(owner.accessToken)).send({ title: "Private Board" }).expect(201);
    await request(app).get(`/api/v1/boards/${boardResponse.body.data.id}`).set("authorization", bearer(stranger.accessToken)).expect(403);
  });

  // What: Asynchronous Vitest test-case callback function.
  // Does: Proves global admins can inspect boards without ordinary membership records.
  // If removed: The explicitly documented admin bypass policy can regress unnoticed.
  it("allows the explicit global-admin bypass", async () => {
    const owner = await registerUser("admin-board-owner");
    const boardResponse = await request(app).post("/api/v1/boards").set("authorization", bearer(owner.accessToken)).send({ title: "Admin Visible" }).expect(201);
    const passwordHash = await bcrypt.hash("password1234", 10);
    await UserModel.create({ name: "Global Admin", email: "admin@example.com", passwordHash, role: "admin" });
    const login = await request(app).post("/api/v1/auth/login").send({ email: "admin@example.com", password: "password1234" }).expect(200);
    await request(app).get(`/api/v1/boards/${boardResponse.body.data.id}`).set("authorization", bearer(login.body.data.accessToken)).expect(200);
  });

  // What: Asynchronous Vitest test-case callback function.
  // Does: Proves ownership transfer atomically changes which user can perform owner-only actions.
  // If removed: Last-owner and transfer authorization can regress unnoticed.
  it("transfers ownership to an accepted collaborator", async () => {
    const owner = await registerUser("transfer-owner");
    const nextOwner = await registerUser("transfer-next");
    const boardResponse = await request(app).post("/api/v1/boards").set("authorization", bearer(owner.accessToken)).send({ title: "Transfer Board" }).expect(201);
    const boardId = boardResponse.body.data.id as string;
    await request(app).post(`/api/v1/boards/${boardId}/members`).set("authorization", bearer(owner.accessToken)).send({ email: "transfer-next@example.com", access: "editor" }).expect(201);
    await request(app).post(`/api/v1/boards/${boardId}/members/accept`).set("authorization", bearer(nextOwner.accessToken)).expect(200);
    await request(app).post(`/api/v1/boards/${boardId}/transfer`).set("authorization", bearer(owner.accessToken)).send({ userId: nextOwner.user.id }).expect(204);
    await request(app).delete(`/api/v1/boards/${boardId}`).set("authorization", bearer(owner.accessToken)).expect(403);
    await request(app).delete(`/api/v1/boards/${boardId}`).set("authorization", bearer(nextOwner.accessToken)).expect(204);
  });
});
