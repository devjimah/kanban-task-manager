import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Board, Column, Task } from './types';

export type Theme = 'light' | 'dark';

interface AppState {
  boards: Board[];
  columns: Column[];
  tasks: Task[];
  theme: Theme;

  // Theme Actions
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;

  // Board Actions
  addBoard: (title: string, description: string) => void;
  updateBoard: (id: string, updates: Partial<Omit<Board, 'id'>>) => void;
  deleteBoard: (id: string) => void;

  // Column Actions
  addColumn: (boardId: string, title: string) => void;
  updateColumn: (id: string, updates: Partial<Omit<Column, 'id' | 'boardId'>>) => void;
  deleteColumn: (id: string) => void;

  // Task Actions
  addTask: (columnId: string, title: string, description?: string) => void;
  deleteTask: (id: string) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  moveTask: (taskId: string, targetColumnId: string) => void;
  reorderTasks: (columnId: string, taskIds: string[]) => void;
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
      theme: 'light',

      toggleTheme: () =>
        set((state) => ({
          theme: state.theme === 'light' ? 'dark' : 'light',
        })),

      setTheme: (theme) => set({ theme }),

      addBoard: (title, description) =>
        set((state) => ({
          boards: [
            ...state.boards,
            { id: crypto.randomUUID(), title, description },
          ],
        })),
        
      updateBoard: (id, updates) =>
        set((state) => ({
          boards: state.boards.map((b) => (b.id === id ? { ...b, ...updates } : b)),
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

      updateColumn: (id, updates) =>
        set((state) => ({
          columns: state.columns.map((c) => (c.id === id ? { ...c, ...updates } : c)),
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

      reorderTasks: (columnId, taskIds) =>
        set((state) => {
          const columnTasks = state.tasks.filter((t) => t.columnId === columnId);
          const otherTasks = state.tasks.filter((t) => t.columnId !== columnId);
          const reorderedTasks = taskIds
            .map((id) => columnTasks.find((t) => t.id === id))
            .filter((t): t is Task => t !== undefined);
          return { tasks: [...otherTasks, ...reorderedTasks] };
        }),
    }),
    {
      name: 'kanban-storage',
    }
  )
);
