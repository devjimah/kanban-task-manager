import mongoose from "mongoose";
import type {
  CreateBoardInput,
  CreateColumnInput,
  CreateTaskInput,
  UpdateBoardInput,
  UpdateColumnInput,
  UpdateTaskInput,
  MoveTaskInput,
  MoveColumnInput,
  CompleteTaskInput,
} from "../../../shared/contracts/kanban.js";
import type { GlobalRole } from "../../../shared/contracts/auth.js";
import { BoardModel } from "../models/board.js";
import { ColumnModel } from "../models/column.js";
import { TaskModel } from "../models/task.js";
import { ConflictError, NotFoundError } from "../lib/errors.js";
import { BoardMemberModel } from "../models/board-member.js";

// What: Persistence-to-API serialization function.
// Does: Converts a Mongoose document into a plain object with public id and version fields.
// If removed: API responses expose internal `_id`/`__v` shapes or require repeated conversion logic.
function serialize(document: { toObject(): Record<string, unknown> }) {
  const value = document.toObject();
  const { _id, __v: version, ...fields } = value;
  return { ...fields, id: String(_id), version };
}

// What: Kanban application-service class.
// Does: Centralizes persistent board, column, and task business operations.
// If removed: Route handlers lose the domain layer that enforces relationships and conflicts.
export class KanbanService {
  // What: Asynchronous board-query method.
  // Does: Returns every board in deterministic creation order.
  // If removed: The board-list endpoint cannot retrieve persisted boards.
  async listBoards(user: { userId: string; role: GlobalRole }) {
    if (user.role === "admin") {
      return (await BoardModel.find().sort({ createdAt: 1 })).map(serialize);
    }
    const memberships = await BoardMemberModel.find({ userId: user.userId, status: "accepted" }).select("boardId");
    // What: Membership-board-ID mapping callback function.
    // Does: Extracts the board IDs visible to the authenticated non-admin user.
    // If removed: Board listing cannot scope its database query to accepted memberships.
    return (await BoardModel.find({ _id: { $in: memberships.map((membership) => membership.boardId) } }).sort({ createdAt: 1 })).map(serialize);
  }

  // What: Asynchronous board-detail query method.
  // Does: Loads one board with its columns and tasks in deterministic position order.
  // If removed: Clients cannot reconstruct a complete persisted board view.
  async getBoard(id: string) {
    const board = await BoardModel.findById(id);
    if (!board) throw new NotFoundError("Board");
    const [columns, tasks] = await Promise.all([
      ColumnModel.find({ boardId: id }).sort({ position: 1 }),
      TaskModel.find({ boardId: id }).sort({ columnId: 1, position: 1 }),
    ]);
    return { ...serialize(board), columns: columns.map(serialize), tasks: tasks.map(serialize) };
  }

  // What: Asynchronous board-command method.
  // Does: Persists a validated board and returns its public representation.
  // If removed: New boards cannot be created through the API.
  async createBoard(input: CreateBoardInput, ownerId: string) {
    const board = await BoardModel.create({ ...input, ownerId });
    try {
      await BoardMemberModel.create({ boardId: board.id, userId: ownerId, access: "owner", status: "accepted", invitedBy: ownerId });
      return serialize(board);
    } catch (error) {
      await BoardModel.deleteOne({ _id: board.id });
      throw error;
    }
  }

  // What: Asynchronous optimistic-concurrency command method.
  // Does: Renames a board only when the caller supplies its current version.
  // If removed: Board edits are unavailable or risk silently overwriting concurrent changes.
  async updateBoard(id: string, input: UpdateBoardInput) {
    const board = await BoardModel.findOneAndUpdate(
      { _id: id, __v: input.version },
      { $set: { title: input.title }, $inc: { __v: 1 } },
      { returnDocument: "after" },
    );
    if (board) return serialize(board);
    if (!(await BoardModel.exists({ _id: id }))) throw new NotFoundError("Board");
    throw new ConflictError();
  }

  // What: Asynchronous dependency-ordered deletion method.
  // Does: Removes board children and memberships before deleting the board record last.
  // If removed: Boards cannot be deleted without leaving persistent related records.
  async deleteBoard(id: string) {
    if (!(await BoardModel.exists({ _id: id }))) throw new NotFoundError("Board");
    await TaskModel.deleteMany({ boardId: id });
    await ColumnModel.deleteMany({ boardId: id });
    await BoardMemberModel.deleteMany({ boardId: id });
    await BoardModel.deleteOne({ _id: id });
  }

  // What: Asynchronous column-command method.
  // Does: Verifies the parent board and persists a positioned column.
  // If removed: Boards cannot gain new workflow columns.
  async createColumn(boardId: string, input: CreateColumnInput) {
    if (!(await BoardModel.exists({ _id: boardId }))) throw new NotFoundError("Board");
    return serialize(await ColumnModel.create({ ...input, boardId }));
  }

  // What: Asynchronous optimistic-concurrency command method.
  // Does: Updates column title or position while rejecting stale versions.
  // If removed: Columns cannot be renamed or repositioned safely.
  async updateColumn(id: string, input: UpdateColumnInput) {
    const { version, ...changes } = input;
    const column = await ColumnModel.findOneAndUpdate(
      { _id: id, __v: version },
      { $set: changes, $inc: { __v: 1 } },
      { returnDocument: "after" },
    );
    if (column) return serialize(column);
    if (!(await ColumnModel.exists({ _id: id }))) throw new NotFoundError("Column");
    throw new ConflictError();
  }

  // What: Asynchronous transactional column-reorder method.
  // Does: Moves one versioned column and rewrites its board's contiguous column positions atomically.
  // If removed: Column drag-and-drop can create duplicate positions or persist only part of an ordering change.
  async moveColumn(id: string, input: MoveColumnInput) {
    const session = await mongoose.startSession();
    try {
      let moved: ReturnType<typeof serialize> | undefined;
      // What: MongoDB column-reorder transaction callback function.
      // Does: Validates the expected version, stages collision-free positions, and commits the requested sequence.
      // If removed: Unique position constraints can reject intermediate column updates or expose partial order.
      await session.withTransaction(async () => {
        const column = await ColumnModel.findOne({ _id: id, __v: input.version }).session(session);
        if (!column) {
          if (!(await ColumnModel.exists({ _id: id }).session(session))) throw new NotFoundError("Column");
          throw new ConflictError();
        }
        const columns = await ColumnModel.find({ boardId: column.boardId, _id: { $ne: id } }).sort({ position: 1 }).session(session);
        columns.splice(Math.min(input.position, columns.length), 0, column);
        await ColumnModel.updateMany({ boardId: column.boardId }, { $inc: { position: -1_000_000 } }, { session });
        for (const [position, item] of columns.entries()) {
          const update = item.id === id
            ? { $set: { position }, $inc: { __v: 1 } }
            : { $set: { position } };
          await ColumnModel.updateOne({ _id: item.id }, update, { session });
        }
        const updated = await ColumnModel.findById(id).session(session);
        if (!updated) throw new NotFoundError("Column");
        moved = serialize(updated);
      });
      if (!moved) throw new Error("Column move failed");
      return moved;
    } finally {
      await session.endSession();
    }
  }

  // What: Asynchronous guarded-deletion method.
  // Does: Deletes an empty column and rejects deletion when it still owns tasks.
  // If removed: Column deletion is unavailable or can orphan tasks.
  async deleteColumn(id: string) {
    const column = await ColumnModel.findById(id);
    if (!column) throw new NotFoundError("Column");
    if (await TaskModel.exists({ columnId: id })) {
      throw new ConflictError("Move or delete all tasks before deleting this column");
    }
    await column.deleteOne();
  }

  // What: Asynchronous task-command method.
  // Does: Verifies board-column membership before persisting a task.
  // If removed: New tasks cannot be created with valid workflow relationships.
  async createTask(input: CreateTaskInput) {
    const column = await ColumnModel.findOne({ _id: input.columnId, boardId: input.boardId });
    if (!column) throw new NotFoundError("Column");
    await this.assertAssignee(input.boardId, input.assignedTo);
    return serialize(await TaskModel.create(input));
  }

  // What: Asynchronous task-query method.
  // Does: Retrieves one persisted task or raises the standard not-found error.
  // If removed: Task detail endpoints cannot load individual tasks.
  async getTask(id: string) {
    const task = await TaskModel.findById(id);
    if (!task) throw new NotFoundError("Task");
    return serialize(task);
  }

  // What: Asynchronous optimistic-concurrency command method.
  // Does: Validates destination columns and updates task fields only at the expected version.
  // If removed: Task editing and movement cannot be persisted safely.
  async updateTask(id: string, input: UpdateTaskInput) {
    const { version, ...changes } = input;
    const existingTask = await TaskModel.findById(id).select("boardId");
    if (!existingTask) throw new NotFoundError("Task");
    if (changes.columnId) {
      const column = await ColumnModel.findOne({ _id: changes.columnId, boardId: existingTask.boardId });
      if (!column) throw new NotFoundError("Column");
    }
    await this.assertAssignee(String(existingTask.boardId), changes.assignedTo);
    const task = await TaskModel.findOneAndUpdate(
      { _id: id, __v: version },
      { $set: changes, $inc: { __v: 1 } },
      { returnDocument: "after" },
    );
    if (task) return serialize(task);
    if (!(await TaskModel.exists({ _id: id }))) throw new NotFoundError("Task");
    throw new ConflictError();
  }

  // What: Asynchronous transactional task-reorder method.
  // Does: Moves one versioned task within or across columns and rewrites both affected order sequences atomically.
  // If removed: Concurrent drag operations can duplicate positions, lose ordering, or persist only half of a cross-column move.
  async moveTask(id: string, input: MoveTaskInput) {
    const session = await mongoose.startSession();
    try {
      let moved: ReturnType<typeof serialize> | undefined;
      // What: MongoDB task-reorder transaction callback function.
      // Does: Validates the destination, stages collision-free positions, and commits contiguous source/destination ordering.
      // If removed: Unique position indexes can reject intermediate updates or expose partially reordered columns.
      await session.withTransaction(async () => {
        const task = await TaskModel.findOne({ _id: id, __v: input.version }).session(session);
        if (!task) {
          if (!(await TaskModel.exists({ _id: id }).session(session))) throw new NotFoundError("Task");
          throw new ConflictError();
        }
        if (!(await ColumnModel.exists({ _id: input.columnId, boardId: task.boardId }).session(session))) throw new NotFoundError("Column");
        const sourceId = String(task.columnId);
        const destinationId = input.columnId;
        const affectedIds = sourceId === destinationId ? [sourceId] : [sourceId, destinationId];
        const documents = await TaskModel.find({ columnId: { $in: affectedIds } }).sort({ position: 1 }).session(session);
        // What: Source-column task-filter callback function.
        // Does: Selects the non-moving tasks that must close the source ordering gap.
        // If removed: Cross-column moves leave an incomplete or duplicated source sequence.
        const source = documents.filter((item) => String(item.columnId) === sourceId && item.id !== id);
        const destination = sourceId === destinationId
          ? source
          // What: Destination-column task-filter callback function.
          // Does: Selects destination tasks while excluding the moving task from its insertion list.
          // If removed: Cross-column moves cannot construct the destination order without duplicates.
          : documents.filter((item) => String(item.columnId) === destinationId && item.id !== id);
        destination.splice(Math.min(input.position, destination.length), 0, task);
        await TaskModel.updateMany({ columnId: { $in: affectedIds } }, { $inc: { position: -1_000_000 } }, { session });
        // What: Source-order operation-mapping callback function.
        // Does: Converts remaining source tasks into contiguous persistence operations.
        // If removed: Tasks left behind retain staged negative positions after a cross-column move.
        const sourceOperations = sourceId === destinationId ? [] : source.map((item, position) => ({ item, columnId: sourceId, position }));
        // What: Destination-order operation-mapping callback function.
        // Does: Converts the inserted destination sequence into contiguous persistence operations.
        // If removed: The destination column cannot persist the requested task position.
        const destinationOperations = destination.map((item, position) => ({ item, columnId: destinationId, position }));
        const operations = [...sourceOperations, ...destinationOperations];
        for (const operation of operations) {
          const update = operation.item.id === id
            ? { $set: { columnId: operation.columnId, position: operation.position }, $inc: { __v: 1 } }
            : { $set: { columnId: operation.columnId, position: operation.position } };
          await TaskModel.updateOne({ _id: operation.item.id }, update, { session });
        }
        const updated = await TaskModel.findById(id).session(session);
        if (!updated) throw new NotFoundError("Task");
        moved = serialize(updated);
      });
      if (!moved) throw new Error("Task move failed");
      return moved;
    } finally {
      await session.endSession();
    }
  }

  // What: Asynchronous optimistic-concurrency task-completion method.
  // Does: Sets a completion timestamp or clears it when reopening a task at the expected version.
  // If removed: The application cannot distinguish explicit completion from merely placing a task in a named column.
  async completeTask(id: string, input: CompleteTaskInput) {
    const task = await TaskModel.findOneAndUpdate(
      { _id: id, __v: input.version },
      { $set: { completedAt: input.isCompleted ? new Date() : null }, $inc: { __v: 1 } },
      { returnDocument: "after" },
    );
    if (task) return serialize(task);
    if (!(await TaskModel.exists({ _id: id }))) throw new NotFoundError("Task");
    throw new ConflictError();
  }

  // What: Asynchronous task-deletion method.
  // Does: Removes one task and reports absence through the standard not-found error.
  // If removed: Users cannot delete persisted tasks.
  async deleteTask(id: string) {
    if (!(await TaskModel.findByIdAndDelete(id))) throw new NotFoundError("Task");
  }

  // What: Asynchronous task-assignee invariant method.
  // Does: Ensures a non-null assignee is an accepted collaborator on the task's board.
  // If removed: Tasks can be assigned to unrelated or uninvited users.
  private async assertAssignee(boardId: string, assignedTo: string | null | undefined) {
    if (!assignedTo) return;
    if (!(await BoardMemberModel.exists({ boardId, userId: assignedTo, status: "accepted" }))) {
      throw new ConflictError("Assignee must be an accepted board collaborator");
    }
  }
}
