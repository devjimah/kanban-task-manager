import { create } from "zustand";
import { kanbanApi } from "../api/kanban";
import { queryClient } from "../queryClient";
import type { Board, Task } from "../types";

interface BoardState {
  boards: Board[];
  activeBoard: Board | null;
  isLoading: boolean;
  error: string | null;
  hasFetched: boolean;
  fetchBoards: () => Promise<void>;
  setActiveBoard: (board: Board) => void;
  setActiveBoardById: (boardId: string) => boolean;
  addBoard: (name: string, columns: string[]) => Promise<void>;
  editBoard: (boardId: string, name: string, columns: { id: string; name: string }[]) => Promise<void>;
  deleteBoard: (boardId: string) => Promise<void>;
  addColumn: (boardId: string, columnName: string) => Promise<void>;
  editColumn: (columnId: string, newName: string) => Promise<void>;
  moveColumn: (columnId: string, position: number) => Promise<void>;
  addTask: (columnId: string, task: Omit<Task, "id">) => Promise<void>;
  editTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  moveTask: (taskId: string, fromColumnId: string, toColumnId: string, newIndex?: number) => Promise<void>;
  toggleSubtask: (taskId: string, subtaskId: string) => Promise<void>;
  toggleTaskCompletion: (taskId: string) => Promise<void>;
}

const message = (error: unknown) => error instanceof Error ? error.message : "An unexpected error occurred.";

export const useBoardStore = create<BoardState>((set, get) => {
  const loadDetail = async (boardId: string) => {
    const board = await queryClient.fetchQuery({ queryKey: ["board", boardId], queryFn: () => kanbanApi.getBoard(boardId), staleTime: 0 });
    set((state) => ({ activeBoard: board, boards: state.boards.map((item) => item.id === board.id ? board : item) }));
    return board;
  };
  const mutate = async (operation: () => Promise<unknown>, boardId?: string) => {
    set({ error: null });
    try {
      await operation();
      await queryClient.invalidateQueries({ queryKey: ["boards"] });
      if (boardId) await loadDetail(boardId);
      const boards = await queryClient.fetchQuery({ queryKey: ["boards"], queryFn: kanbanApi.listBoards, staleTime: 0 });
      set((state) => ({ boards: boards.map((board) => state.activeBoard?.id === board.id ? state.activeBoard : board) }));
    } catch (error) {
      set({ error: message(error) });
      throw error;
    }
  };
  const findTask = (taskId: string) => {
    const board = get().activeBoard;
    if (!board) return null;
    for (const column of board.columns) {
      const task = column.tasks.find((item) => item.id === taskId);
      if (task) return { board, column, task };
    }
    return null;
  };

  return {
    boards: [], activeBoard: null, isLoading: false, error: null, hasFetched: false,
    fetchBoards: async () => {
      if (get().isLoading) return;
      set({ isLoading: true, error: null });
      try {
        const boards = await queryClient.fetchQuery({ queryKey: ["boards"], queryFn: kanbanApi.listBoards });
        set({ boards, activeBoard: get().activeBoard, isLoading: false, hasFetched: true });
      } catch (error) { set({ isLoading: false, hasFetched: true, error: message(error) }); }
    },
    setActiveBoard: (board) => set({ activeBoard: board }),
    setActiveBoardById: (boardId) => {
      const summary = get().boards.find((board) => board.id === boardId);
      if (!summary) return false;
      set({ activeBoard: summary, isLoading: true });
      void loadDetail(boardId).catch((error) => set({ error: message(error) })).finally(() => set({ isLoading: false }));
      return true;
    },
    addBoard: async (name, columns) => {
      let createdId = "";
      await mutate(async () => {
        const created = await kanbanApi.createBoard(name);
        createdId = created.id;
        await Promise.all(columns.map((title, position) => kanbanApi.createColumn(created.id, title, position)));
      });
      if (createdId) await loadDetail(createdId);
    },
    editBoard: async (boardId, name, columns) => {
      const board = get().boards.find((item) => item.id === boardId);
      if (!board) return;
      await mutate(async () => {
        if (board.name !== name) await kanbanApi.updateBoard(board, name);
        const existing = new Map(board.columns.map((column) => [column.id, column]));
        for (const [position, column] of columns.entries()) {
          const current = existing.get(column.id);
          if (!current) await kanbanApi.createColumn(boardId, column.name, position);
          else if (current.name !== column.name) await kanbanApi.updateColumn(current, column.name);
          existing.delete(column.id);
        }
        for (const removed of existing.values()) await kanbanApi.deleteColumn(removed.id);
      }, boardId);
    },
    deleteBoard: async (boardId) => mutate(() => kanbanApi.deleteBoard(boardId)),
    addColumn: async (boardId, name) => {
      const board = get().boards.find((item) => item.id === boardId);
      await mutate(() => kanbanApi.createColumn(boardId, name, board?.columns.length ?? 0), boardId);
    },
    editColumn: async (columnId, name) => {
      const board = get().activeBoard; const column = board?.columns.find((item) => item.id === columnId);
      if (board && column) await mutate(() => kanbanApi.updateColumn(column, name), board.id);
    },
    moveColumn: async (columnId, position) => {
      const board = get().activeBoard; const column = board?.columns.find((item) => item.id === columnId);
      if (board && column) await mutate(() => kanbanApi.moveColumn(column, position), board.id);
    },
    addTask: async (columnId, task) => {
      const board = get().activeBoard; const column = board?.columns.find((item) => item.id === columnId);
      if (board && column) await mutate(() => kanbanApi.createTask(board.id, column, task), board.id);
    },
    editTask: async (taskId, updates) => {
      const found = findTask(taskId); if (!found) return;
      const destination = updates.status ? found.board.columns.find((column) => column.name === updates.status) : undefined;
      await mutate(() => kanbanApi.updateTask(found.task, updates, destination), found.board.id);
    },
    deleteTask: async (taskId) => {
      const found = findTask(taskId); if (found) await mutate(() => kanbanApi.deleteTask(taskId), found.board.id);
    },
    moveTask: async (taskId, _from, to, newIndex) => {
      const found = findTask(taskId); const destination = found?.board.columns.find((column) => column.id === to);
      if (found && destination) await mutate(() => kanbanApi.moveTask(found.task, destination.id, newIndex ?? destination.tasks.length), found.board.id);
    },
    toggleSubtask: async (taskId, subtaskId) => {
      const found = findTask(taskId); if (!found) return;
      const subtasks = found.task.subtasks.map((item) => item.id === subtaskId ? { ...item, isCompleted: !item.isCompleted } : item);
      await mutate(() => kanbanApi.updateTask(found.task, { subtasks }), found.board.id);
    },
    toggleTaskCompletion: async (taskId) => {
      const found = findTask(taskId); if (!found) return;
      await mutate(() => kanbanApi.completeTask(found.task, !found.task.isCompleted), found.board.id);
    },
  };
});

export const useBoard = useBoardStore;
