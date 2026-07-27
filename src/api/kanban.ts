import type { Board, Column, Subtask, Task } from "../types";
import { apiRequest } from "./client";

interface ApiBoard { id: string; title: string; version: number; columns?: ApiColumn[]; tasks?: ApiTask[]; currentUserAccess?: Board["access"] }
interface ApiColumn { id: string; title: string; position: number; version: number }
interface ApiTask { id: string; columnId: string; title: string; description: string; position: number; version: number; dueDate?: string | null; completedAt?: string | null; subtasks: Array<{ _id?: string; id?: string; title: string; isCompleted: boolean; position: number }> }

const mapTask = (task: ApiTask, status: string): Task => ({
  id: task.id,
  title: task.title,
  description: task.description,
  status,
  subtasks: task.subtasks.map((subtask, index): Subtask => ({
    id: subtask.id ?? subtask._id ?? `${task.id}-${index}`,
    title: subtask.title,
    isCompleted: subtask.isCompleted,
    position: subtask.position,
  })),
  version: task.version,
  columnId: task.columnId,
  dueDate: task.dueDate ?? null,
  isCompleted: Boolean(task.completedAt),
});

const mapBoard = (board: ApiBoard): Board => {
  const columns = (board.columns ?? []).map((column): Column => ({
    id: column.id,
    name: column.title,
    position: column.position,
    version: column.version,
    tasks: (board.tasks ?? [])
      .filter((task) => task.columnId === column.id)
      .map((task) => mapTask(task, column.title)),
  }));
  return { id: board.id, name: board.title, version: board.version, access: board.currentUserAccess, columns };
};

const taskPayload = (task: Omit<Task, "id"> | Task) => ({
  title: task.title,
  description: task.description,
  subtasks: task.subtasks.map((subtask, position) => ({ title: subtask.title, isCompleted: subtask.isCompleted, position })),
  dueDate: task.dueDate ?? null,
});

export const kanbanApi = {
  listBoards: async () => {
    const summaries = await apiRequest<ApiBoard[]>("/boards");
    return Promise.all(summaries.map(async (summary) => mapBoard(await apiRequest<ApiBoard>(`/boards/${summary.id}`))));
  },
  getBoard: async (id: string) => mapBoard(await apiRequest<ApiBoard>(`/boards/${id}`)),
  createBoard: (title: string) => apiRequest<ApiBoard>("/boards", { method: "POST", body: JSON.stringify({ title }) }),
  updateBoard: (board: Board, title: string) => apiRequest<ApiBoard>(`/boards/${board.id}`, { method: "PUT", body: JSON.stringify({ title, version: board.version ?? 0 }) }),
  deleteBoard: (id: string) => apiRequest<void>(`/boards/${id}`, { method: "DELETE" }),
  createColumn: (boardId: string, title: string, position: number) => apiRequest<ApiColumn>(`/boards/${boardId}/columns`, { method: "POST", body: JSON.stringify({ title, position }) }),
  updateColumn: (column: Column, title: string) => apiRequest<ApiColumn>(`/columns/${column.id}`, { method: "PUT", body: JSON.stringify({ title, version: column.version ?? 0 }) }),
  moveColumn: (column: Column, position: number) => apiRequest<ApiColumn>(`/columns/${column.id}/move`, { method: "PATCH", body: JSON.stringify({ position, version: column.version ?? 0 }) }),
  deleteColumn: (id: string) => apiRequest<void>(`/columns/${id}`, { method: "DELETE" }),
  createTask: (boardId: string, column: Column, task: Omit<Task, "id">) => apiRequest<ApiTask>("/tasks", { method: "POST", body: JSON.stringify({ boardId, columnId: column.id, position: column.tasks.length, ...taskPayload(task) }) }),
  updateTask: (task: Task, changes: Partial<Task>, destination?: Column) => apiRequest<ApiTask>(`/tasks/${task.id}`, { method: "PUT", body: JSON.stringify({ ...taskPayload({ ...task, ...changes }), ...(destination ? { columnId: destination.id, position: destination.tasks.length } : {}), version: task.version ?? 0 }) }),
  moveTask: (task: Task, columnId: string, position: number) => apiRequest<ApiTask>(`/tasks/${task.id}/move`, { method: "PATCH", body: JSON.stringify({ columnId, position, version: task.version ?? 0 }) }),
  completeTask: (task: Task, isCompleted: boolean) => apiRequest<ApiTask>(`/tasks/${task.id}/complete`, { method: "PATCH", body: JSON.stringify({ isCompleted, version: task.version ?? 0 }) }),
  deleteTask: (id: string) => apiRequest<void>(`/tasks/${id}`, { method: "DELETE" }),
};
