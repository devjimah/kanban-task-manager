import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Board, Task, Subtask } from "../types";
import initialData from "../data.json";

// Generate unique IDs
const generateId = () =>
  `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

interface BoardState {
  // State
  boards: Board[];
  activeBoard: Board | null;

  // Board Actions
  setActiveBoard: (board: Board) => void;
  setActiveBoardById: (boardId: string) => boolean;
  addBoard: (name: string, columns: string[]) => void;
  editBoard: (
    boardId: string,
    name: string,
    columns: { id: string; name: string }[],
  ) => void;
  deleteBoard: (boardId: string) => void;

  // Column Actions
  addColumn: (boardId: string, columnName: string) => void;
  editColumn: (columnId: string, newName: string) => void;

  // Task Actions
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
}

export const useBoardStore = create<BoardState>()(
  persist(
    (set, get) => ({
      boards: initialData as Board[],
      activeBoard: (initialData as Board[])[0] || null,

      setActiveBoard: (board) => set({ activeBoard: board }),

      setActiveBoardById: (boardId) => {
        const board = get().boards.find((b) => b.id === boardId);
        if (board) {
          set({ activeBoard: board });
          return true;
        }
        return false;
      },

      addBoard: (name, columnNames) => {
        const newBoard: Board = {
          id: generateId(),
          name,
          columns: columnNames.map((colName) => ({
            id: generateId(),
            name: colName,
            tasks: [],
          })),
        };
        set((state) => ({
          boards: [...state.boards, newBoard],
          activeBoard: newBoard,
        }));
      },

      editBoard: (boardId, name, columns) =>
        set((state) => {
          const updatedBoards = state.boards.map((board) => {
            if (board.id !== boardId) return board;

            const updatedColumns = columns.map((col) => {
              const existingColumn = board.columns.find((c) => c.id === col.id);
              return {
                id: col.id || generateId(),
                name: col.name,
                tasks: existingColumn?.tasks || [],
              };
            });

            return { ...board, name, columns: updatedColumns };
          });

          const activeBoard = updatedBoards.find((b) => b.id === boardId);
          return {
            boards: updatedBoards,
            activeBoard:
              state.activeBoard?.id === boardId
                ? activeBoard || null
                : state.activeBoard,
          };
        }),

      deleteBoard: (boardId) =>
        set((state) => {
          const filtered = state.boards.filter((b) => b.id !== boardId);
          return {
            boards: filtered,
            activeBoard:
              state.activeBoard?.id === boardId
                ? filtered[0] || null
                : state.activeBoard,
          };
        }),

      addColumn: (boardId, columnName) =>
        set((state) => {
          const updatedBoards = state.boards.map((board) => {
            if (board.id !== boardId) return board;
            return {
              ...board,
              columns: [
                ...board.columns,
                { id: generateId(), name: columnName, tasks: [] },
              ],
            };
          });

          const activeBoard = updatedBoards.find((b) => b.id === boardId);
          return {
            boards: updatedBoards,
            activeBoard:
              state.activeBoard?.id === boardId
                ? activeBoard || null
                : state.activeBoard,
          };
        }),

      editColumn: (columnId, newName) =>
        set((state) => {
          const updatedBoards = state.boards.map((board) => ({
            ...board,
            columns: board.columns.map((col) =>
              col.id === columnId ? { ...col, name: newName } : col,
            ),
          }));

          return {
            boards: updatedBoards,
            activeBoard: state.activeBoard
              ? updatedBoards.find((b) => b.id === state.activeBoard!.id) ||
                null
              : null,
          };
        }),

      addTask: (columnId, taskData) => {
        const newTask: Task = {
          ...taskData,
          id: generateId(),
          subtasks: taskData.subtasks.map((st: Subtask) => ({
            ...st,
            id: generateId(),
          })),
        };

        set((state) => {
          const updatedBoards = state.boards.map((board) => ({
            ...board,
            columns: board.columns.map((col) => {
              if (col.id === columnId || col.name === taskData.status) {
                return { ...col, tasks: [...col.tasks, newTask] };
              }
              return col;
            }),
          }));

          return {
            boards: updatedBoards,
            activeBoard: state.activeBoard
              ? updatedBoards.find((b) => b.id === state.activeBoard!.id) ||
                null
              : null,
          };
        });
      },

      editTask: (taskId, updates) =>
        set((state) => {
          const updatedBoards = state.boards.map((board) => {
            let taskToMove: Task | null = null;
            let sourceColumnId: string | null = null;

            // Check if status changed and we need to move
            board.columns.forEach((col) => {
              const task = col.tasks.find((t) => t.id === taskId);
              if (task && updates.status && updates.status !== col.name) {
                taskToMove = { ...task, ...updates };
                sourceColumnId = col.id;
              }
            });

            // If status changed, move task
            if (taskToMove && sourceColumnId && updates.status) {
              return {
                ...board,
                columns: board.columns.map((col) => {
                  if (col.id === sourceColumnId) {
                    return {
                      ...col,
                      tasks: col.tasks.filter((t) => t.id !== taskId),
                    };
                  }
                  if (col.name === updates.status) {
                    return { ...col, tasks: [...col.tasks, taskToMove!] };
                  }
                  return col;
                }),
              };
            }

            // Otherwise update in place
            return {
              ...board,
              columns: board.columns.map((col) => ({
                ...col,
                tasks: col.tasks.map((task) =>
                  task.id === taskId ? { ...task, ...updates } : task,
                ),
              })),
            };
          });

          return {
            boards: updatedBoards,
            activeBoard: state.activeBoard
              ? updatedBoards.find((b) => b.id === state.activeBoard!.id) ||
                null
              : null,
          };
        }),

      deleteTask: (taskId) =>
        set((state) => {
          const updatedBoards = state.boards.map((board) => ({
            ...board,
            columns: board.columns.map((col) => ({
              ...col,
              tasks: col.tasks.filter((t) => t.id !== taskId),
            })),
          }));

          return {
            boards: updatedBoards,
            activeBoard: state.activeBoard
              ? updatedBoards.find((b) => b.id === state.activeBoard!.id) ||
                null
              : null,
          };
        }),

      moveTask: (taskId, fromColumnId, toColumnId, newIndex) =>
        set((state) => {
          const updatedBoards = state.boards.map((board) => {
            let taskToMove: Task | null = null;

            const columnsAfterRemoval = board.columns.map((col) => {
              if (col.id === fromColumnId) {
                const task = col.tasks.find((t) => t.id === taskId);
                if (task) {
                  taskToMove = {
                    ...task,
                    status:
                      board.columns.find((c) => c.id === toColumnId)?.name ||
                      task.status,
                  };
                }
                return {
                  ...col,
                  tasks: col.tasks.filter((t) => t.id !== taskId),
                };
              }
              return col;
            });

            if (!taskToMove) return board;

            return {
              ...board,
              columns: columnsAfterRemoval.map((col) => {
                if (col.id === toColumnId) {
                  const newTasks = [...col.tasks];
                  if (newIndex !== undefined) {
                    newTasks.splice(newIndex, 0, taskToMove!);
                  } else {
                    newTasks.push(taskToMove!);
                  }
                  return { ...col, tasks: newTasks };
                }
                return col;
              }),
            };
          });

          return {
            boards: updatedBoards,
            activeBoard: state.activeBoard
              ? updatedBoards.find((b) => b.id === state.activeBoard!.id) ||
                null
              : null,
          };
        }),

      toggleSubtask: (taskId, subtaskId) =>
        set((state) => {
          const updatedBoards = state.boards.map((board) => ({
            ...board,
            columns: board.columns.map((col) => ({
              ...col,
              tasks: col.tasks.map((task) => {
                if (task.id !== taskId) return task;
                return {
                  ...task,
                  subtasks: task.subtasks.map((st) =>
                    st.id === subtaskId
                      ? { ...st, isCompleted: !st.isCompleted }
                      : st,
                  ),
                };
              }),
            })),
          }));

          return {
            boards: updatedBoards,
            activeBoard: state.activeBoard
              ? updatedBoards.find((b) => b.id === state.activeBoard!.id) ||
                null
              : null,
          };
        }),
    }),
    {
      name: "kanban-boards",
    },
  ),
);

// Backward compatibility - alias for useBoard
export const useBoard = useBoardStore;
