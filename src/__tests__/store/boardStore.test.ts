// ========================================
// Board Store (Zustand) Unit Tests
// ========================================

import { describe, it, expect, vi, beforeEach } from "vitest";
import { useBoardStore } from "../../store/boardStore";
import { mockBoard, mockBoardEmpty } from "../helpers";
import type { Board } from "../../types";

// Mock the API module
vi.mock("../../api/mockApi", () => ({
  fetchBoards: vi.fn(),
}));

// Get the mocked function for control in tests
import { fetchBoards as apiFetchBoards } from "../../api/mockApi";
const mockedFetchBoards = vi.mocked(apiFetchBoards);

describe("boardStore", () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useBoardStore.setState({
      boards: [],
      activeBoard: null,
      isLoading: false,
      error: null,
      hasFetched: false,
    });
    vi.clearAllMocks();
  });

  // ----------------------------------------
  // fetchBoards
  // ----------------------------------------
  describe("fetchBoards", () => {
    it("sets isLoading to true while fetching", async () => {
      mockedFetchBoards.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve([mockBoard]), 50)),
      );

      const fetchPromise = useBoardStore.getState().fetchBoards();

      // Check loading state immediately
      expect(useBoardStore.getState().isLoading).toBe(true);
      expect(useBoardStore.getState().error).toBeNull();

      await fetchPromise;
    });

    it("populates boards and activeBoard on success", async () => {
      const boards: Board[] = [mockBoard, mockBoardEmpty];
      mockedFetchBoards.mockResolvedValueOnce(boards);

      await useBoardStore.getState().fetchBoards();

      const state = useBoardStore.getState();
      expect(state.boards).toEqual(boards);
      expect(state.activeBoard).toEqual(boards[0]);
      expect(state.isLoading).toBe(false);
      expect(state.hasFetched).toBe(true);
      expect(state.error).toBeNull();
    });

    it("sets error on fetch failure", async () => {
      mockedFetchBoards.mockRejectedValueOnce(new Error("Network error"));

      await useBoardStore.getState().fetchBoards();

      const state = useBoardStore.getState();
      expect(state.error).toBe("Network error");
      expect(state.isLoading).toBe(false);
      expect(state.boards).toEqual([]);
    });

    it("skips fetch if already loading", async () => {
      useBoardStore.setState({ isLoading: true });
      mockedFetchBoards.mockResolvedValueOnce([]);

      await useBoardStore.getState().fetchBoards();

      expect(mockedFetchBoards).not.toHaveBeenCalled();
    });
  });

  // ----------------------------------------
  // Board CRUD
  // ----------------------------------------
  describe("addBoard", () => {
    it("adds a new board and sets it as active", () => {
      useBoardStore.getState().addBoard("New Board", ["Todo", "Doing"]);

      const state = useBoardStore.getState();
      expect(state.boards).toHaveLength(1);
      expect(state.boards[0].name).toBe("New Board");
      expect(state.boards[0].columns).toHaveLength(2);
      expect(state.boards[0].columns[0].name).toBe("Todo");
      expect(state.activeBoard?.name).toBe("New Board");
    });
  });

  describe("deleteBoard", () => {
    it("removes the board and updates activeBoard", () => {
      // Setup: add two boards
      useBoardStore.setState({
        boards: [mockBoard, mockBoardEmpty],
        activeBoard: mockBoard,
      });

      useBoardStore.getState().deleteBoard(mockBoard.id);

      const state = useBoardStore.getState();
      expect(state.boards).toHaveLength(1);
      expect(state.boards[0].id).toBe(mockBoardEmpty.id);
      expect(state.activeBoard?.id).toBe(mockBoardEmpty.id);
    });

    it("sets activeBoard to null when last board is deleted", () => {
      useBoardStore.setState({
        boards: [mockBoard],
        activeBoard: mockBoard,
      });

      useBoardStore.getState().deleteBoard(mockBoard.id);

      expect(useBoardStore.getState().boards).toHaveLength(0);
      expect(useBoardStore.getState().activeBoard).toBeNull();
    });
  });

  describe("setActiveBoardById", () => {
    it("sets active board when found", () => {
      useBoardStore.setState({ boards: [mockBoard, mockBoardEmpty] });

      const result = useBoardStore.getState().setActiveBoardById(mockBoardEmpty.id);

      expect(result).toBe(true);
      expect(useBoardStore.getState().activeBoard?.id).toBe(mockBoardEmpty.id);
    });

    it("returns false when board not found", () => {
      useBoardStore.setState({ boards: [mockBoard] });

      const result = useBoardStore.getState().setActiveBoardById("nonexistent");

      expect(result).toBe(false);
    });
  });

  // ----------------------------------------
  // Task CRUD
  // ----------------------------------------
  describe("addTask", () => {
    it("adds a task to the specified column", () => {
      useBoardStore.setState({ boards: [mockBoard], activeBoard: mockBoard });

      useBoardStore.getState().addTask("col-1", {
        title: "New Task",
        description: "A new task",
        status: "Todo",
        subtasks: [],
      });

      const state = useBoardStore.getState();
      const todoCol = state.boards[0].columns.find((c) => c.id === "col-1");
      expect(todoCol?.tasks).toHaveLength(2);
      expect(todoCol?.tasks[1].title).toBe("New Task");
    });
  });

  describe("deleteTask", () => {
    it("removes a task from its column", () => {
      useBoardStore.setState({ boards: [mockBoard], activeBoard: mockBoard });

      useBoardStore.getState().deleteTask("task-1");

      const state = useBoardStore.getState();
      const todoCol = state.boards[0].columns.find((c) => c.id === "col-1");
      expect(todoCol?.tasks).toHaveLength(0);
    });
  });

  describe("toggleSubtask", () => {
    it("toggles a subtask completion status", () => {
      useBoardStore.setState({ boards: [mockBoard], activeBoard: mockBoard });

      // st-2 starts as false
      useBoardStore.getState().toggleSubtask("task-1", "st-2");

      const state = useBoardStore.getState();
      const task = state.boards[0].columns[0].tasks.find((t) => t.id === "task-1");
      const subtask = task?.subtasks.find((st) => st.id === "st-2");
      expect(subtask?.isCompleted).toBe(true);
    });
  });

  // ----------------------------------------
  // Column operations
  // ----------------------------------------
  describe("addColumn", () => {
    it("adds a new column to the board", () => {
      useBoardStore.setState({ boards: [mockBoard], activeBoard: mockBoard });

      useBoardStore.getState().addColumn(mockBoard.id, "Done");

      const state = useBoardStore.getState();
      expect(state.boards[0].columns).toHaveLength(3);
      expect(state.boards[0].columns[2].name).toBe("Done");
    });
  });

  describe("editColumn", () => {
    it("renames a column", () => {
      useBoardStore.setState({ boards: [mockBoard], activeBoard: mockBoard });

      useBoardStore.getState().editColumn("col-1", "Backlog");

      const state = useBoardStore.getState();
      expect(state.boards[0].columns[0].name).toBe("Backlog");
    });
  });

  describe("moveTask", () => {
    it("moves a task from one column to another", () => {
      useBoardStore.setState({ boards: [mockBoard], activeBoard: mockBoard });

      useBoardStore.getState().moveTask("task-1", "col-1", "col-2");

      const state = useBoardStore.getState();
      const fromCol = state.boards[0].columns.find((c) => c.id === "col-1");
      const toCol = state.boards[0].columns.find((c) => c.id === "col-2");
      expect(fromCol?.tasks).toHaveLength(0);
      expect(toCol?.tasks).toHaveLength(2);
      expect(toCol?.tasks[1].id).toBe("task-1");
    });
  });
});
