import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import type { ReactNode } from "react";
import type { Board, Task, BoardContextType } from "../types";
import initialData from "../data.json";

const STORAGE_KEY = "kanban-boards";

// Generate unique IDs
const generateId = () =>
  `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const BoardContext = createContext<BoardContextType | undefined>(undefined);

export const BoardProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // Initialize state from localStorage or default data
  const [boards, setBoards] = useState<Board[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return initialData as Board[];
      }
    }
    return initialData as Board[];
  });

  const [activeBoard, setActiveBoard] = useState<Board | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return parsed[0] || null;
      } catch {
        return (initialData as Board[])[0] || null;
      }
    }
    return (initialData as Board[])[0] || null;
  });

  // Persist to localStorage whenever boards change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(boards));
  }, [boards]);

  // Keep activeBoard in sync when boards change
  useEffect(() => {
    if (activeBoard) {
      const updated = boards.find((b) => b.id === activeBoard.id);
      if (updated) {
        setActiveBoard(updated);
      } else if (boards.length > 0) {
        setActiveBoard(boards[0]);
      } else {
        setActiveBoard(null);
      }
    }
  }, [boards, activeBoard?.id]);

  // Board CRUD operations
  const addBoard = useCallback((name: string, columnNames: string[]) => {
    const newBoard: Board = {
      id: generateId(),
      name,
      columns: columnNames.map((colName) => ({
        id: generateId(),
        name: colName,
        tasks: [],
      })),
    };
    setBoards((prev) => [...prev, newBoard]);
    setActiveBoard(newBoard);
  }, []);

  const editBoard = useCallback(
    (
      boardId: string,
      name: string,
      columns: { id: string; name: string }[],
    ) => {
      setBoards((prev) =>
        prev.map((board) => {
          if (board.id !== boardId) return board;

          // Preserve existing tasks when editing columns
          const updatedColumns = columns.map((col) => {
            const existingColumn = board.columns.find((c) => c.id === col.id);
            return {
              id: col.id || generateId(),
              name: col.name,
              tasks: existingColumn?.tasks || [],
            };
          });

          return { ...board, name, columns: updatedColumns };
        }),
      );
    },
    [],
  );

  const deleteBoard = useCallback((boardId: string) => {
    setBoards((prev) => {
      const filtered = prev.filter((b) => b.id !== boardId);
      return filtered;
    });
  }, []);

  // Column operations
  const addColumn = useCallback((boardId: string, columnName: string) => {
    setBoards((prev) =>
      prev.map((board) => {
        if (board.id !== boardId) return board;
        return {
          ...board,
          columns: [
            ...board.columns,
            { id: generateId(), name: columnName, tasks: [] },
          ],
        };
      }),
    );
  }, []);

  const editColumn = useCallback((columnId: string, newName: string) => {
    setBoards((prev) =>
      prev.map((board) => ({
        ...board,
        columns: board.columns.map((col) =>
          col.id === columnId ? { ...col, name: newName } : col,
        ),
      })),
    );
  }, []);

  // Task CRUD operations
  const addTask = useCallback(
    (columnId: string, taskData: Omit<Task, "id">) => {
      const newTask: Task = {
        ...taskData,
        id: generateId(),
        subtasks: taskData.subtasks.map((st) => ({ ...st, id: generateId() })),
      };

      setBoards((prev) =>
        prev.map((board) => ({
          ...board,
          columns: board.columns.map((col) => {
            if (col.id !== columnId && col.name !== taskData.status) return col;
            // Match by column ID or by status name
            if (col.id === columnId || col.name === taskData.status) {
              return { ...col, tasks: [...col.tasks, newTask] };
            }
            return col;
          }),
        })),
      );
    },
    [],
  );

  const editTask = useCallback((taskId: string, updates: Partial<Task>) => {
    setBoards((prev) =>
      prev.map((board) => {
        // Check if we need to move the task to a different column
        let taskToMove: Task | null = null;
        let sourceColumnId: string | null = null;

        // First, find the task and check if status changed
        board.columns.forEach((col) => {
          const task = col.tasks.find((t) => t.id === taskId);
          if (task && updates.status && updates.status !== col.name) {
            taskToMove = { ...task, ...updates };
            sourceColumnId = col.id;
          }
        });

        // If status changed, move task to new column
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

        // Otherwise, just update in place
        return {
          ...board,
          columns: board.columns.map((col) => ({
            ...col,
            tasks: col.tasks.map((task) =>
              task.id === taskId ? { ...task, ...updates } : task,
            ),
          })),
        };
      }),
    );
  }, []);

  const deleteTask = useCallback((taskId: string) => {
    setBoards((prev) =>
      prev.map((board) => ({
        ...board,
        columns: board.columns.map((col) => ({
          ...col,
          tasks: col.tasks.filter((t) => t.id !== taskId),
        })),
      })),
    );
  }, []);

  const moveTask = useCallback(
    (
      taskId: string,
      fromColumnId: string,
      toColumnId: string,
      newIndex?: number,
    ) => {
      setBoards((prev) =>
        prev.map((board) => {
          let taskToMove: Task | null = null;

          // Find and remove task from source column
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

          // Add task to destination column
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
        }),
      );
    },
    [],
  );

  const toggleSubtask = useCallback((taskId: string, subtaskId: string) => {
    setBoards((prev) =>
      prev.map((board) => ({
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
      })),
    );
  }, []);

  const value = useMemo(
    () => ({
      boards,
      activeBoard,
      setActiveBoard,
      addBoard,
      editBoard,
      deleteBoard,
      addTask,
      editTask,
      deleteTask,
      moveTask,
      toggleSubtask,
      addColumn,
      editColumn,
    }),
    [
      boards,
      activeBoard,
      addBoard,
      editBoard,
      deleteBoard,
      addTask,
      editTask,
      deleteTask,
      moveTask,
      toggleSubtask,
      addColumn,
      editColumn,
    ],
  );

  return (
    <BoardContext.Provider value={value}>{children}</BoardContext.Provider>
  );
};

export const useBoard = () => {
  const context = useContext(BoardContext);
  if (!context) {
    throw new Error("useBoard must be used within a BoardProvider");
  }
  return context;
};
