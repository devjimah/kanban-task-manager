

import { describe, it, expect, vi, beforeEach } from "vitest";

// We test the actual mock API module (not mocked)
// But we control timers so tests run fast
describe("mockApi", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("fetchBoards resolves with board data after delay", async () => {
    // Dynamic import to get the real module
    const { fetchBoards } = await import("../../api/mockApi");

    const promise = fetchBoards();

    // Advance timers past the SIMULATED_DELAY
    vi.advanceTimersByTime(5000);

    const boards = await promise;
    expect(Array.isArray(boards)).toBe(true);
    expect(boards.length).toBeGreaterThan(0);
    expect(boards[0]).toHaveProperty("id");
    expect(boards[0]).toHaveProperty("name");
    expect(boards[0]).toHaveProperty("columns");
  });

  it("fetchBoardById resolves with a single board", async () => {
    const { fetchBoardById } = await import("../../api/mockApi");

    const promise = fetchBoardById("board-1");
    vi.advanceTimersByTime(5000);

    const board = await promise;
    expect(board).not.toBeNull();
    expect(board?.id).toBe("board-1");
  });

  it("fetchBoardById resolves with null for nonexistent board", async () => {
    const { fetchBoardById } = await import("../../api/mockApi");

    const promise = fetchBoardById("nonexistent");
    vi.advanceTimersByTime(5000);

    const board = await promise;
    expect(board).toBeNull();
  });

  it("createBoard echoes back the board data", async () => {
    const { createBoard } = await import("../../api/mockApi");

    const newBoard = {
      id: "test-1",
      name: "Test Board",
      columns: [],
    };
    const promise = createBoard(newBoard);
    vi.advanceTimersByTime(5000);

    const result = await promise;
    expect(result).toEqual(newBoard);
  });

  it("deleteBoard resolves with success", async () => {
    const { deleteBoard } = await import("../../api/mockApi");

    const promise = deleteBoard("board-1");
    vi.advanceTimersByTime(5000);

    const result = await promise;
    expect(result).toHaveProperty("success", true);
  });
});
