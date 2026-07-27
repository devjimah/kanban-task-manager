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
import { AppError } from "../lib/errors.js";
import { KanbanController } from "../controllers/kanban-controller.js";
import { CollaborationController } from "../controllers/collaboration-controller.js";

// What: Kanban-router factory function.
// Does: Maps authenticated board, column, task, and collaboration routes onto controller actions.
// If removed: The application cannot mount its protected Kanban REST API.
export function createKanbanRouter(environment: Environment) {
const boards = new KanbanController();
const collaboration = new CollaborationController();
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

// Board routes.
kanbanRouter.get("/boards", asyncHandler(boards.listBoards));
kanbanRouter.post("/boards", validateBody(createBoardSchema), asyncHandler(boards.createBoard));
kanbanRouter.get("/boards/:id", requireBoardAccess("viewer", "boardParam"), asyncHandler(boards.getBoard));
kanbanRouter.put("/boards/:id", requireBoardAccess("editor", "boardParam"), validateBody(updateBoardSchema), asyncHandler(boards.updateBoard));
kanbanRouter.delete("/boards/:id", requireBoardAccess("owner", "boardParam"), asyncHandler(boards.deleteBoard));

// Column routes.
kanbanRouter.post("/boards/:id/columns", requireBoardAccess("editor", "boardParam"), validateBody(createColumnSchema), asyncHandler(boards.createColumn));
kanbanRouter.put("/columns/:id", requireBoardAccess("editor", "columnParam"), validateBody(updateColumnSchema), asyncHandler(boards.updateColumn));
kanbanRouter.patch("/columns/:id/move", requireBoardAccess("editor", "columnParam"), validateBody(moveColumnSchema), asyncHandler(boards.moveColumn));
kanbanRouter.delete("/columns/:id", requireBoardAccess("editor", "columnParam"), asyncHandler(boards.deleteColumn));

// Task routes. Body validation runs before board access so `bodyBoard` reads a parsed boardId.
kanbanRouter.post("/tasks", validateBody(createTaskSchema), requireBoardAccess("editor", "bodyBoard"), asyncHandler(boards.createTask));
kanbanRouter.get("/tasks/:id", requireBoardAccess("viewer", "taskParam"), asyncHandler(boards.getTask));
kanbanRouter.put("/tasks/:id", requireBoardAccess("editor", "taskParam"), validateBody(updateTaskSchema), asyncHandler(boards.updateTask));
kanbanRouter.patch("/tasks/:id/move", requireBoardAccess("editor", "taskParam"), validateBody(moveTaskSchema), asyncHandler(boards.moveTask));
kanbanRouter.patch("/tasks/:id/complete", requireBoardAccess("editor", "taskParam"), validateBody(completeTaskSchema), asyncHandler(boards.completeTask));
kanbanRouter.delete("/tasks/:id", requireBoardAccess("editor", "taskParam"), asyncHandler(boards.deleteTask));

// Collaboration routes. Membership management is owner-only; acceptance is performed
// by the invitee, so it is authenticated but deliberately not board-access guarded.
kanbanRouter.get("/boards/:id/members", requireBoardAccess("owner", "boardParam"), asyncHandler(collaboration.listMembers));
kanbanRouter.post("/boards/:id/members", requireBoardAccess("owner", "boardParam"), validateBody(inviteMemberSchema), asyncHandler(collaboration.invite));
kanbanRouter.post("/boards/:id/members/accept", asyncHandler(collaboration.accept));
kanbanRouter.put("/boards/:id/members/:userId", requireBoardAccess("owner", "boardParam"), validateBody(updateMemberSchema), asyncHandler(collaboration.updateAccess));
kanbanRouter.delete("/boards/:id/members/:userId", requireBoardAccess("owner", "boardParam"), asyncHandler(collaboration.remove));
kanbanRouter.post("/boards/:id/transfer", requireBoardAccess("owner", "boardParam"), validateBody(transferOwnershipSchema), asyncHandler(collaboration.transferOwnership));

return kanbanRouter;
}
