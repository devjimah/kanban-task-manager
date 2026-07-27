// ========================================
// KANBAN APP TYPE DEFINITIONS
// ========================================

export interface Subtask {
  id: string;
  title: string;
  isCompleted: boolean;
  position?: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  subtasks: Subtask[];
  version?: number;
  columnId?: string;
  dueDate?: string | null;
  isCompleted?: boolean;
}

export interface Column {
  id: string;
  name: string;
  tasks: Task[];
  version?: number;
  position?: number;
}

export interface Board {
  id: string;
  name: string;
  columns: Column[];
  version?: number;
  access?: "viewer" | "editor" | "owner" | "admin";
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

