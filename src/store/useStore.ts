import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Board, Column, Task } from './types';

interface AppState {
  boards: Board[];
  columns: Column[];
  tasks: Task[];

  // Board Actions
  addBoard: (title: string, description: string) => void;
  deleteBoard: (id: string) => void;

  // Column Actions
  addColumn: (boardId: string, title: string) => void;
  deleteColumn: (id: string) => void;

  // Task Actions
  addTask: (columnId: string, title: string, description?: string) => void;
  deleteTask: (id: string) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  moveTask: (taskId: string, targetColumnId: string) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      boards: [
        { id: '1', title: 'Project Alpha', description: 'Main project development board' },
        { id: '2', title: 'Marketing Campaign', description: 'Q3 Marketing tasks' },
        { id: '3', title: 'Personal Tasks', description: 'Daily to-dos and reminders' },
      ],
      columns: [
          { id: 'c1', title: 'To Do', boardId: '1' },
          { id: 'c2', title: 'In Progress', boardId: '1' },
          { id: 'c3', title: 'Done', boardId: '1' },
          { id: 'c4', title: 'To Do', boardId: '2' },
          { id: 'c5', title: 'In Progress', boardId: '2' },
          { id: 'c6', title: 'To Do', boardId: '3' },
          { id: 'c7', title: 'Done', boardId: '3' },
      ],
      tasks: [],

      addBoard: (title, description) =>
        set((state) => ({
          boards: [
            ...state.boards,
            { id: crypto.randomUUID(), title, description },
          ],
        })),
        
      deleteBoard: (id) =>
        set((state) => ({
          boards: state.boards.filter((b) => b.id !== id),
          columns: state.columns.filter((c) => c.boardId !== id),
          tasks: state.tasks.filter((t) => !state.columns.find(c => c.boardId === id && c.id === t.columnId)),
        })),

      addColumn: (boardId, title) =>
        set((state) => ({
          columns: [
            ...state.columns,
            { id: crypto.randomUUID(), title, boardId },
          ],
        })),

      deleteColumn: (id) =>
        set((state) => ({
          columns: state.columns.filter((c) => c.id !== id),
          tasks: state.tasks.filter((t) => t.columnId !== id),
        })),

      addTask: (columnId, title, description = '') =>
        set((state) => ({
          tasks: [
            ...state.tasks,
            {
              id: crypto.randomUUID(),
              title,
              description,
              columnId,
            },
          ],
        })),

      deleteTask: (id) =>
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
        })),

      updateTask: (id, updates) =>
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        })),

      moveTask: (taskId, targetColumnId) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId ? { ...t, columnId: targetColumnId } : t
          ),
        })),
    }),
    {
      name: 'kanban-storage',
    }
  )
);
