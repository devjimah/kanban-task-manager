import type { Request, Response } from "express";
import { KanbanService } from "../services/kanban-service.js";

// What: Kanban HTTP controller class.
// Does: Translates validated board, column, and task requests into service calls
//       and success envelopes, keeping routing files limited to wiring.
// If removed: Route definitions must re-embed request/response handling logic.
export class KanbanController {
  constructor(private readonly service: KanbanService = new KanbanService()) {}

  // What: Asynchronous board-list handler method.
  // Does: Returns the boards visible to the authenticated identity.
  // If removed: `GET /boards` has no controller action.
  listBoards = async (request: Request, response: Response) => {
    response.json({ status: "success", data: await this.service.listBoards(request.auth!) });
  };

  // What: Asynchronous board-creation handler method.
  // Does: Persists validated board input and returns HTTP 201.
  // If removed: `POST /boards` has no controller action.
  createBoard = async (request: Request, response: Response) => {
    response
      .status(201)
      .json({ status: "success", data: await this.service.createBoard(request.body, request.auth!.userId) });
  };

  // What: Asynchronous board-detail handler method.
  // Does: Returns one board with ordered children plus the caller's effective access.
  // If removed: `GET /boards/:id` has no controller action.
  getBoard = async (request: Request, response: Response) => {
    response.json({
      status: "success",
      data: {
        ...(await this.service.getBoard(String(request.params.id))),
        currentUserAccess: request.auth?.role === "admin" ? "admin" : request.boardAccess,
      },
    });
  };

  // What: Asynchronous board-update handler method.
  // Does: Applies a validated, versioned board rename.
  // If removed: `PUT /boards/:id` has no controller action.
  updateBoard = async (request: Request, response: Response) => {
    response.json({ status: "success", data: await this.service.updateBoard(String(request.params.id), request.body) });
  };

  // What: Asynchronous board-deletion handler method.
  // Does: Requests transactional board deletion and returns HTTP 204.
  // If removed: `DELETE /boards/:id` has no controller action.
  deleteBoard = async (request: Request, response: Response) => {
    await this.service.deleteBoard(String(request.params.id));
    response.status(204).send();
  };

  // What: Asynchronous column-creation handler method.
  // Does: Creates a validated positioned column beneath the requested board.
  // If removed: `POST /boards/:id/columns` has no controller action.
  createColumn = async (request: Request, response: Response) => {
    response
      .status(201)
      .json({ status: "success", data: await this.service.createColumn(String(request.params.id), request.body) });
  };

  // What: Asynchronous column-update handler method.
  // Does: Applies validated title or position changes with version protection.
  // If removed: `PUT /columns/:id` has no controller action.
  updateColumn = async (request: Request, response: Response) => {
    response.json({ status: "success", data: await this.service.updateColumn(String(request.params.id), request.body) });
  };

  // What: Asynchronous column-move handler method.
  // Does: Persists a versioned column position through the transactional reorder service.
  // If removed: `PATCH /columns/:id/move` has no controller action.
  moveColumn = async (request: Request, response: Response) => {
    response.json({ status: "success", data: await this.service.moveColumn(String(request.params.id), request.body) });
  };

  // What: Asynchronous column-deletion handler method.
  // Does: Deletes an empty column and returns HTTP 204.
  // If removed: `DELETE /columns/:id` has no controller action.
  deleteColumn = async (request: Request, response: Response) => {
    await this.service.deleteColumn(String(request.params.id));
    response.status(204).send();
  };

  // What: Asynchronous task-creation handler method.
  // Does: Persists a validated task in a verified board column and returns HTTP 201.
  // If removed: `POST /tasks` has no controller action.
  createTask = async (request: Request, response: Response) => {
    response.status(201).json({ status: "success", data: await this.service.createTask(request.body) });
  };

  // What: Asynchronous task-detail handler method.
  // Does: Returns one persisted task in the success envelope.
  // If removed: `GET /tasks/:id` has no controller action.
  getTask = async (request: Request, response: Response) => {
    response.json({ status: "success", data: await this.service.getTask(String(request.params.id)) });
  };

  // What: Asynchronous task-update handler method.
  // Does: Applies validated task changes with destination and version checks.
  // If removed: `PUT /tasks/:id` has no controller action.
  updateTask = async (request: Request, response: Response) => {
    response.json({ status: "success", data: await this.service.updateTask(String(request.params.id), request.body) });
  };

  // What: Asynchronous task-move handler method.
  // Does: Persists a task destination and ordered position transactionally.
  // If removed: `PATCH /tasks/:id/move` has no controller action.
  moveTask = async (request: Request, response: Response) => {
    response.json({ status: "success", data: await this.service.moveTask(String(request.params.id), request.body) });
  };

  // What: Asynchronous task-completion handler method.
  // Does: Persists explicit completion or reopening with optimistic concurrency.
  // If removed: `PATCH /tasks/:id/complete` has no controller action.
  completeTask = async (request: Request, response: Response) => {
    response.json({ status: "success", data: await this.service.completeTask(String(request.params.id), request.body) });
  };

  // What: Asynchronous task-deletion handler method.
  // Does: Deletes one task and returns HTTP 204.
  // If removed: `DELETE /tasks/:id` has no controller action.
  deleteTask = async (request: Request, response: Response) => {
    await this.service.deleteTask(String(request.params.id));
    response.status(204).send();
  };
}
