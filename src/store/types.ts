export interface Task {
  id: string;
  title: string;
  description: string;
  columnId: string;
}

export interface Column {
  id: string;
  title: string;
  boardId: string;
}

export interface Board {
  id: string;
  title: string;
  description: string;
}
