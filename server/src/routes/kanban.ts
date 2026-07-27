import { Router } from "express";
import {
  createBoardSchema,
  createColumnSchema,
  createTaskSchema,
  moveTaskSchema,
  moveColumnSchema,
  completeTaskSchema,
  objectIdSchema,
  updateBoardSchema,
  updateColumnSchema,
  updateTaskSchema,
} from "../../../shared/contracts/kanban.js";
import { inviteMemberSchema, transferOwnershipSchema, updateMemberSchema } from "../../../shared/contracts/auth.js";
import type { Environment } from "../config/env.js";
import { createAuthenticate } from "../middleware/authenticate.js";
import { requireBoardAccess } from "../middleware/board-access.js";
import { asyncHandler } from "../middleware/async-handler.js";
import { validateBody } from "../middleware/validate.js";
import { KanbanService } from "../services/kanban-service.js";
import { AppError } from "../lib/errors.js";
import { CollaborationService } from "../services/collaboration-service.js";

// What: Kanban-router factory function.
// Does: Builds authenticated board, column, task, and collaboration routes for one environment.
// If removed: The application cannot mount its protected Kanban REST API.
export function createKanbanRouter(environment: Environment) {
const service = new KanbanService();
const collaboration = new CollaborationService();
const kanbanRouter = Router();
kanbanRouter.use(createAuthenticate(environment));

// What: Express route-parameter callback function.
// Does: Rejects malformed MongoDB IDs before any route reaches Mongoose.
// If removed: Invalid IDs can produce database cast failures and incorrect 500 responses.
kanbanRouter.param("id", (_request, _response, next, value) => {
  const result = objectIdSchema.safeParse(value);
  if (!result.success) {
    return next(new AppError(400, "VALIDATION_ERROR", "Request validation failed", [
      { field: "id", message: result.error.issues[0]?.message ?? "Invalid ID" },
    ]));
  }
  next();
});

// What: Express collaborator-parameter callback function.
// Does: Rejects malformed collaborator user IDs before membership services execute.
// If removed: Invalid collaborator IDs can reach Mongoose and produce incorrect server errors.
kanbanRouter.param("userId", (_request, _response, next, value) => {
  const result = objectIdSchema.safeParse(value);
  if (!result.success) {
    return next(new AppError(400, "VALIDATION_ERROR", "Request validation failed", [
      { field: "userId", message: result.error.issues[0]?.message ?? "Invalid user ID" },
    ]));
  }
  next();
});

// What: Asynchronous board-list route-handler function.
// Does: Returns the persisted board collection in the success envelope.
// If removed: `GET /boards` no longer exists.
kanbanRouter.get("/boards", asyncHandler(async (request, response) => {
  response.json({ status: "success", data: await service.listBoards(request.auth!) });
}));

// What: Asynchronous board-creation route-handler function.
// Does: Passes validated board input to the service and returns HTTP 201.
// If removed: `POST /boards` no longer creates boards.
kanbanRouter.post("/boards", validateBody(createBoardSchema), asyncHandler(async (request, response) => {
  response.status(201).json({ status: "success", data: await service.createBoard(request.body, request.auth!.userId) });
}));

// What: Asynchronous board-detail route-handler function.
// Does: Returns a board with its ordered columns and tasks.
// If removed: `GET /boards/:id` no longer provides board detail.
kanbanRouter.get("/boards/:id", requireBoardAccess("viewer", "boardParam"), asyncHandler(async (request, response) => {
  response.json({
    status: "success",
    data: {
      ...(await service.getBoard(String(request.params.id))),
      currentUserAccess: request.auth?.role === "admin" ? "admin" : request.boardAccess,
    },
  });
}));

// What: Asynchronous board-update route-handler function.
// Does: Applies a validated, versioned board rename through the service.
// If removed: `PUT /boards/:id` no longer updates boards.
kanbanRouter.put("/boards/:id", requireBoardAccess("editor", "boardParam"), validateBody(updateBoardSchema), asyncHandler(async (request, response) => {
  response.json({ status: "success", data: await service.updateBoard(String(request.params.id), request.body) });
}));

// What: Asynchronous board-deletion route-handler function.
// Does: Requests transactional board deletion and returns HTTP 204.
// If removed: `DELETE /boards/:id` no longer removes boards.
kanbanRouter.delete("/boards/:id", requireBoardAccess("owner", "boardParam"), asyncHandler(async (request, response) => {
  await service.deleteBoard(String(request.params.id));
  response.status(204).send();
}));

// What: Asynchronous column-creation route-handler function.
// Does: Creates a validated positioned column beneath the requested board.
// If removed: `POST /boards/:id/columns` no longer creates columns.
kanbanRouter.post("/boards/:id/columns", requireBoardAccess("editor", "boardParam"), validateBody(createColumnSchema), asyncHandler(async (request, response) => {
  response.status(201).json({ status: "success", data: await service.createColumn(String(request.params.id), request.body) });
}));

// What: Asynchronous column-update route-handler function.
// Does: Applies validated title or position changes with version protection.
// If removed: `PUT /columns/:id` no longer edits columns.
kanbanRouter.put("/columns/:id", requireBoardAccess("editor", "columnParam"), validateBody(updateColumnSchema), asyncHandler(async (request, response) => {
  response.json({ status: "success", data: await service.updateColumn(String(request.params.id), request.body) });
}));

// What: Asynchronous column-move route-handler function.
// Does: Persists a versioned column position through the transactional reorder service.
// If removed: Column drag-and-drop order cannot survive reloads safely.
kanbanRouter.patch("/columns/:id/move", requireBoardAccess("editor", "columnParam"), validateBody(moveColumnSchema), asyncHandler(async (request, response) => {
  response.json({ status: "success", data: await service.moveColumn(String(request.params.id), request.body) });
}));

// What: Asynchronous column-deletion route-handler function.
// Does: Deletes an empty column and returns HTTP 204.
// If removed: `DELETE /columns/:id` no longer removes columns.
kanbanRouter.delete("/columns/:id", requireBoardAccess("editor", "columnParam"), asyncHandler(async (request, response) => {
  await service.deleteColumn(String(request.params.id));
  response.status(204).send();
}));

// What: Asynchronous task-creation route-handler function.
// Does: Persists a validated task in a verified board column and returns HTTP 201.
// If removed: `POST /tasks` no longer creates tasks.
kanbanRouter.post("/tasks", validateBody(createTaskSchema), requireBoardAccess("editor", "bodyBoard"), asyncHandler(async (request, response) => {
  response.status(201).json({ status: "success", data: await service.createTask(request.body) });
}));

// What: Asynchronous task-detail route-handler function.
// Does: Returns one persisted task in the success envelope.
// If removed: `GET /tasks/:id` no longer retrieves tasks.
kanbanRouter.get("/tasks/:id", requireBoardAccess("viewer", "taskParam"), asyncHandler(async (request, response) => {
  response.json({ status: "success", data: await service.getTask(String(request.params.id)) });
}));

// What: Asynchronous task-update route-handler function.
// Does: Applies validated task changes with destination and version checks.
// If removed: `PUT /tasks/:id` no longer edits or moves tasks.
kanbanRouter.put("/tasks/:id", requireBoardAccess("editor", "taskParam"), validateBody(updateTaskSchema), asyncHandler(async (request, response) => {
  response.json({ status: "success", data: await service.updateTask(String(request.params.id), request.body) });
}));

// What: Asynchronous task-move route-handler function.
// Does: Persists a task destination and ordered position through the transactional reorder service.
// If removed: Drag-and-drop changes cannot be saved without unsafe client-side multi-request rewrites.
kanbanRouter.patch("/tasks/:id/move", requireBoardAccess("editor", "taskParam"), validateBody(moveTaskSchema), asyncHandler(async (request, response) => {
  response.json({ status: "success", data: await service.moveTask(String(request.params.id), request.body) });
}));

// What: Asynchronous task-completion route-handler function.
// Does: Persists explicit completion or reopening with optimistic concurrency.
// If removed: Task completion has no durable, testable API behavior separate from workflow columns.
kanbanRouter.patch("/tasks/:id/complete", requireBoardAccess("editor", "taskParam"), validateBody(completeTaskSchema), asyncHandler(async (request, response) => {
  response.json({ status: "success", data: await service.completeTask(String(request.params.id), request.body) });
}));

// What: Asynchronous task-deletion route-handler function.
// Does: Deletes one task and returns HTTP 204.
// If removed: `DELETE /tasks/:id` no longer removes tasks.
kanbanRouter.delete("/tasks/:id", requireBoardAccess("editor", "taskParam"), asyncHandler(async (request, response) => {
  await service.deleteTask(String(request.params.id));
  response.status(204).send();
}));

// What: Asynchronous collaborator-list route-handler function.
// Does: Returns accepted and pending memberships to board owners.
// If removed: `GET /boards/:id/members` no longer exposes collaboration state.
kanbanRouter.get("/boards/:id/members", requireBoardAccess("owner", "boardParam"), asyncHandler(async (request, response) => {
  response.json({ status: "success", data: await collaboration.listMembers(String(request.params.id)) });
}));

// What: Asynchronous collaborator-invitation route-handler function.
// Does: Creates a pending viewer/editor invitation for an existing user.
// If removed: `POST /boards/:id/members` no longer invites collaborators.
kanbanRouter.post("/boards/:id/members", requireBoardAccess("owner", "boardParam"), validateBody(inviteMemberSchema), asyncHandler(async (request, response) => {
  const data = await collaboration.invite(String(request.params.id), request.auth!.userId, request.body);
  response.status(201).json({ status: "success", data });
}));

// What: Asynchronous invitation-acceptance route-handler function.
// Does: Allows an authenticated invited user to activate their own pending membership.
// If removed: `POST /boards/:id/members/accept` no longer accepts invitations.
kanbanRouter.post("/boards/:id/members/accept", asyncHandler(async (request, response) => {
  response.json({ status: "success", data: await collaboration.accept(String(request.params.id), request.auth!.userId) });
}));

// What: Asynchronous collaborator-role route-handler function.
// Does: Lets owners change an accepted non-owner between viewer and editor.
// If removed: `PUT /boards/:id/members/:userId` no longer changes collaborator access.
kanbanRouter.put("/boards/:id/members/:userId", requireBoardAccess("owner", "boardParam"), validateBody(updateMemberSchema), asyncHandler(async (request, response) => {
  response.json({ status: "success", data: await collaboration.updateAccess(String(request.params.id), String(request.params.userId), request.body.access) });
}));

// What: Asynchronous collaborator-removal route-handler function.
// Does: Lets owners revoke a non-owner's board membership.
// If removed: `DELETE /boards/:id/members/:userId` no longer revokes access.
kanbanRouter.delete("/boards/:id/members/:userId", requireBoardAccess("owner", "boardParam"), asyncHandler(async (request, response) => {
  await collaboration.remove(String(request.params.id), String(request.params.userId));
  response.status(204).send();
}));

// What: Asynchronous ownership-transfer route-handler function.
// Does: Atomically transfers board ownership to an accepted collaborator.
// If removed: `POST /boards/:id/transfer` no longer supports safe owner replacement.
kanbanRouter.post("/boards/:id/transfer", requireBoardAccess("owner", "boardParam"), validateBody(transferOwnershipSchema), asyncHandler(async (request, response) => {
  await collaboration.transferOwnership(String(request.params.id), request.auth!.userId, request.body.userId);
  response.status(204).send();
}));

return kanbanRouter;
}
