import { beforeEach, describe, expect, it, vi } from "vitest";
import { kanbanApi } from "../../api/kanban";
import { queryClient } from "../../queryClient";
import { useBoardStore } from "../../store/boardStore";
import { mockBoard, mockBoardEmpty } from "../helpers";

vi.mock("../../api/kanban", () => ({
  kanbanApi: {
    listBoards: vi.fn(), getBoard: vi.fn(), createBoard: vi.fn(), updateBoard: vi.fn(), deleteBoard: vi.fn(),
    createColumn: vi.fn(), updateColumn: vi.fn(), moveColumn: vi.fn(), deleteColumn: vi.fn(), createTask: vi.fn(), updateTask: vi.fn(), moveTask: vi.fn(), completeTask: vi.fn(), deleteTask: vi.fn(),
  },
}));

const api = vi.mocked(kanbanApi);

describe("boardStore API integration", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
    useBoardStore.setState({ boards: [], activeBoard: null, isLoading: false, error: null, hasFetched: false });
    api.listBoards.mockResolvedValue([mockBoard, mockBoardEmpty]);
    api.getBoard.mockImplementation(async (id) => id === mockBoard.id ? mockBoard : mockBoardEmpty);
  });

  it("loads boards through the query cache", async () => {
    await useBoardStore.getState().fetchBoards();
    expect(useBoardStore.getState().boards).toEqual([mockBoard, mockBoardEmpty]);
    expect(useBoardStore.getState().hasFetched).toBe(true);
  });

  it("records a list failure for retry UI", async () => {
    api.listBoards.mockRejectedValue(new Error("Network error"));
    await useBoardStore.getState().fetchBoards();
    expect(useBoardStore.getState().error).toBe("Network error");
  });

  it("loads full board detail when a summary becomes active", async () => {
    useBoardStore.setState({ boards: [mockBoardEmpty] });
    expect(useBoardStore.getState().setActiveBoardById(mockBoardEmpty.id)).toBe(true);
    await vi.waitFor(() => expect(api.getBoard).toHaveBeenCalledWith(mockBoardEmpty.id));
  });

  it("creates a board and its requested columns", async () => {
    api.createBoard.mockResolvedValue({ id: "new", title: "New Board", version: 0 });
    api.getBoard.mockResolvedValue({ id: "new", name: "New Board", version: 0, columns: [] });
    await useBoardStore.getState().addBoard("New Board", ["Todo", "Doing"]);
    expect(api.createColumn).toHaveBeenCalledTimes(2);
    expect(api.getBoard).toHaveBeenCalledWith("new");
  });

  it("persists task creation with its board and column", async () => {
    useBoardStore.setState({ boards: [mockBoard], activeBoard: mockBoard });
    await useBoardStore.getState().addTask("col-1", { title: "New Task", description: "", status: "Todo", subtasks: [] });
    expect(api.createTask).toHaveBeenCalledWith(mockBoard.id, mockBoard.columns[0], expect.objectContaining({ title: "New Task" }));
  });

  it("persists subtask completion with optimistic version data", async () => {
    useBoardStore.setState({ boards: [mockBoard], activeBoard: mockBoard });
    await useBoardStore.getState().toggleSubtask("task-1", "st-2");
    expect(api.updateTask).toHaveBeenCalledWith(expect.objectContaining({ id: "task-1" }), expect.objectContaining({ subtasks: expect.arrayContaining([expect.objectContaining({ id: "st-2", isCompleted: true })]) }));
  });

  it("moves a task by persisting the destination column", async () => {
    useBoardStore.setState({ boards: [mockBoard], activeBoard: mockBoard });
    await useBoardStore.getState().moveTask("task-1", "col-1", "col-2", 0);
    expect(api.moveTask).toHaveBeenCalledWith(expect.objectContaining({ id: "task-1" }), "col-2", 0);
  });

  it("persists explicit task completion", async () => {
    useBoardStore.setState({ boards: [mockBoard], activeBoard: mockBoard });
    await useBoardStore.getState().toggleTaskCompletion("task-1");
    expect(api.completeTask).toHaveBeenCalledWith(expect.objectContaining({ id: "task-1" }), true);
  });

  it("moves a column by persisting its target position", async () => {
    useBoardStore.setState({ boards: [mockBoard], activeBoard: mockBoard });
    await useBoardStore.getState().moveColumn("col-2", 0);
    expect(api.moveColumn).toHaveBeenCalledWith(mockBoard.columns[1], 0);
  });

  it("deletes a board through the server", async () => {
    await useBoardStore.getState().deleteBoard(mockBoard.id);
    expect(api.deleteBoard).toHaveBeenCalledWith(mockBoard.id);
  });
});
