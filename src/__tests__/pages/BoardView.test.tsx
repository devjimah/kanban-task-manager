

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "../../context/ThemeContext";
import { AuthProvider } from "../../context/AuthContext";
import BoardView from "../../pages/BoardView";
import { useBoardStore } from "../../store/boardStore";
import { mockBoard, mockBoardEmpty } from "../helpers";
import type { Board } from "../../types";

// Mock the API
vi.mock("../../api/mockApi", () => ({
  fetchBoards: vi.fn(),
}));

import { fetchBoards as apiFetchBoards } from "../../api/mockApi";
const mockedFetchBoards = vi.mocked(apiFetchBoards);

/**
 * Render BoardView at a specific route path.
 */
function renderBoardView(boardId: string) {
  const onTaskClick = vi.fn();
  const onOpenModal = vi.fn();

  const result = render(
    <MemoryRouter initialEntries={[`/board/${boardId}`]}>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            <Route
              path="/board/:boardId"
              element={
                <BoardView onTaskClick={onTaskClick} onOpenModal={onOpenModal} />
              }
            />
            <Route path="/" element={<div data-testid="dashboard">Dashboard</div>} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </MemoryRouter>,
  );

  return { ...result, onTaskClick, onOpenModal };
}

describe("BoardView", () => {
  beforeEach(() => {
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
  // Loading State
  // ----------------------------------------
  it("shows skeleton UI while loading", () => {
    mockedFetchBoards.mockImplementation(() => new Promise(() => {}));

    renderBoardView("board-1");

    const skeletons = document.querySelectorAll(".skeleton-shimmer");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  // ----------------------------------------
  // Error State
  // ----------------------------------------
  it("shows error screen when fetch fails", () => {
    // Directly set the error state to test the error UI rendering
    useBoardStore.setState({
      isLoading: false,
      error: "Connection refused",
      hasFetched: false,
    });

    renderBoardView("board-1");

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("Connection refused")).toBeInTheDocument();
  });

  // ----------------------------------------
  // Success State — Board with columns
  // ----------------------------------------
  it("renders board columns and tasks after loading", async () => {
    const boards: Board[] = [mockBoard];
    mockedFetchBoards.mockResolvedValueOnce(boards);

    renderBoardView("board-1");

    await waitFor(() => {
      expect(screen.getByText("TODO (1)")).toBeInTheDocument();
      expect(screen.getByText("DOING (1)")).toBeInTheDocument();
      expect(screen.getByText("Build UI for onboarding flow")).toBeInTheDocument();
      expect(screen.getByText("Design settings page")).toBeInTheDocument();
    });
  });

  it("shows + New Column button", async () => {
    mockedFetchBoards.mockResolvedValueOnce([mockBoard]);

    renderBoardView("board-1");

    await waitFor(() => {
      expect(screen.getByText("+ New Column")).toBeInTheDocument();
    });
  });

  // ----------------------------------------
  // Empty board
  // ----------------------------------------
  it("shows empty board message when board has no columns", async () => {
    mockedFetchBoards.mockResolvedValueOnce([mockBoardEmpty]);

    renderBoardView("board-2");

    await waitFor(() => {
      expect(
        screen.getByText(/this board is empty/i),
      ).toBeInTheDocument();
      expect(screen.getByText("+ Add New Column")).toBeInTheDocument();
    });
  });

  // ----------------------------------------
  // Redirect on invalid board
  // ----------------------------------------
  it("redirects to dashboard when board ID is not found", async () => {
    mockedFetchBoards.mockResolvedValueOnce([mockBoard]);

    renderBoardView("nonexistent-id");

    await waitFor(() => {
      expect(screen.getByTestId("dashboard")).toBeInTheDocument();
    });
  });

  // ----------------------------------------
  // Task click interaction
  // ----------------------------------------
  it("calls onTaskClick when a task card is clicked", async () => {
    const user = userEvent.setup();
    mockedFetchBoards.mockResolvedValueOnce([mockBoard]);

    const { onTaskClick } = renderBoardView("board-1");

    await waitFor(() => {
      expect(screen.getByText("Build UI for onboarding flow")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Build UI for onboarding flow"));
    expect(onTaskClick).toHaveBeenCalledTimes(1);
  });

  // ----------------------------------------
  // Already fetched — uses store data
  // ----------------------------------------
  it("uses pre-fetched store data without calling API", async () => {
    useBoardStore.setState({
      boards: [mockBoard],
      activeBoard: mockBoard,
      hasFetched: true,
    });

    renderBoardView("board-1");

    expect(mockedFetchBoards).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.getByText("TODO (1)")).toBeInTheDocument();
    });
  });
});
