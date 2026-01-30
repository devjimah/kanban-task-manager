// ========================================
// KANBAN APP TYPE DEFINITIONS
// ========================================

export interface Subtask {
  id: string;
  title: string;
  isCompleted: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  subtasks: Subtask[];
}

export interface Column {
  id: string;
  name: string;
  tasks: Task[];
}

export interface Board {
  id: string;
  name: string;
  columns: Column[];
}

// Modal types
export type ModalType =
  | "addTask"
  | "editTask"
  | "viewTask"
  | "addBoard"
  | "editBoard"
  | "deleteBoard"
  | "deleteTask"
  | null;

// Context types
export interface BoardContextType {
  boards: Board[];
  activeBoard: Board | null;
  setActiveBoard: (board: Board) => void;
  addBoard: (name: string, columns: string[]) => void;
  editBoard: (
    boardId: string,
    name: string,
    columns: { id: string; name: string }[],
  ) => void;
  deleteBoard: (boardId: string) => void;
  addTask: (columnId: string, task: Omit<Task, "id">) => void;
  editTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  moveTask: (
    taskId: string,
    fromColumnId: string,
    toColumnId: string,
    newIndex?: number,
  ) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  addColumn: (boardId: string, columnName: string) => void;
  editColumn: (columnId: string, newName: string) => void;
}
