import type { RequestHandler } from "express";
import { BoardMemberModel } from "../models/board-member.js";
import { BoardModel } from "../models/board.js";
import { ColumnModel } from "../models/column.js";
import { TaskModel } from "../models/task.js";
import { ForbiddenError, NotFoundError, UnauthorizedError } from "../lib/errors.js";

type BoardAccess = "viewer" | "editor" | "owner";
type BoardSource = "boardParam" | "columnParam" | "taskParam" | "bodyBoard";
const accessRank: Record<BoardAccess, number> = { viewer: 1, editor: 2, owner: 3 };

// What: Board-authorization middleware factory function.
// Does: Builds a policy guard for a required access level and resource-to-board lookup strategy.
// If removed: Routes must duplicate board membership and resource ownership checks.
export function requireBoardAccess(required: BoardAccess, source: BoardSource): RequestHandler {
  // What: Asynchronous Express board-authorization middleware function.
  // Does: Resolves the target board, applies admin bypass, and enforces accepted membership rank.
  // If removed: Authenticated users can read or mutate boards they do not belong to.
  return async (request, _response, next) => {
    try {
      if (!request.auth) throw new UnauthorizedError();
      let boardId: string | undefined;
      if (source === "boardParam") boardId = String(request.params.id);
      if (source === "bodyBoard") boardId = String(request.body.boardId);
      if (source === "columnParam") {
        const column = await ColumnModel.findById(request.params.id).select("boardId");
        if (!column) throw new NotFoundError("Column");
        boardId = String(column.boardId);
      }
      if (source === "taskParam") {
        const task = await TaskModel.findById(request.params.id).select("boardId");
        if (!task) throw new NotFoundError("Task");
        boardId = String(task.boardId);
      }
      if (!boardId || !(await BoardModel.exists({ _id: boardId }))) throw new NotFoundError("Board");
      if (request.auth.role === "admin") {
        request.authorizedBoardId = boardId;
        request.boardAccess = "owner";
        return next();
      }
      const membership = await BoardMemberModel.findOne({
        boardId,
        userId: request.auth.userId,
        status: "accepted",
      });
      if (!membership || accessRank[membership.access as BoardAccess] < accessRank[required]) {
        throw new ForbiddenError();
      }
      request.authorizedBoardId = boardId;
      request.boardAccess = membership.access as BoardAccess;
      next();
    } catch (error) {
      next(error);
    }
  };
}
