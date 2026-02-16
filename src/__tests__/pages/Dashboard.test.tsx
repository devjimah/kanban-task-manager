// ========================================
// Dashboard Page Tests
// Tests loading, error, and success states
// Also tests API mock integration
// ========================================

import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Dashboard from "../../pages/Dashboard";
import { renderWithProviders, mockBoard, mockBoardEmpty } from "../helpers";
import { useBoardStore } from "../../store/boardStore";
import type { Board } from "../../types";

// Mock the API
vi.mock("../../api/mockApi", () => ({
  fetchBoards: vi.fn(),
}));

import { fetchBoards as apiFetchBoards } from "../../api/mockApi";
const mockedFetchBoards = vi.mocked(apiFetchBoards);

describe("Dashboard", () => {
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
  it("shows skeleton loading UI while fetching boards", () => {
    // Keep promise pending to simulate loading
    mockedFetchBoards.mockImplementation(() => new Promise(() => {}));

    renderWithProviders(<Dashboard />);

    // The DashboardSkeleton has skeleton-shimmer elements
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
      error: "Server down",
      hasFetched: false,
    });

    renderWithProviders(<Dashboard />);

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("Server down")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });

  it("retries fetching when Try Again is clicked", async () => {
    const user = userEvent.setup();
    const boards: Board[] = [mockBoard];

    // Start with error state already set
    useBoardStore.setState({
      isLoading: false,
      error: "Temporary failure",
      hasFetched: false,
    });

    // When retry is clicked, fetchBoards will call this and succeed
    mockedFetchBoards.mockResolvedValueOnce(boards);

    renderWithProviders(<Dashboard />);

    // Error should be visible
    expect(screen.getByText("Temporary failure")).toBeInTheDocument();

    // Click retry
    await user.click(screen.getByRole("button", { name: /try again/i }));

    // Should now show board data
    await waitFor(() => {
      expect(screen.getByText("Platform Launch")).toBeInTheDocument();
    });
  });

  // ----------------------------------------
  // Success State
  // ----------------------------------------
  it("shows boards after successful fetch", async () => {
    const boards: Board[] = [mockBoard, mockBoardEmpty];
    mockedFetchBoards.mockResolvedValueOnce(boards);

    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText("Platform Launch")).toBeInTheDocument();
      expect(screen.getByText("Marketing Plan")).toBeInTheDocument();
    });
  });

  it("shows column and task counts on board cards", async () => {
    mockedFetchBoards.mockResolvedValueOnce([mockBoard]);

    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      // mockBoard has 2 columns and 2 total tasks
      expect(screen.getByText(/2 columns/)).toBeInTheDocument();
      expect(screen.getByText(/2 tasks/)).toBeInTheDocument();
    });
  });

  it("shows empty state when no boards exist", async () => {
    mockedFetchBoards.mockResolvedValueOnce([]);

    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText("No boards yet")).toBeInTheDocument();
    });
  });

  it("shows the Create New Board card", async () => {
    mockedFetchBoards.mockResolvedValueOnce([mockBoard]);

    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText("+ Create New Board")).toBeInTheDocument();
    });
  });

  // ----------------------------------------
  // Already fetched — no re-fetch
  // ----------------------------------------
  it("does not re-fetch if hasFetched is true", () => {
    useBoardStore.setState({
      boards: [mockBoard],
      activeBoard: mockBoard,
      hasFetched: true,
    });

    renderWithProviders(<Dashboard />);

    expect(mockedFetchBoards).not.toHaveBeenCalled();
    expect(screen.getByText("Platform Launch")).toBeInTheDocument();
  });
});
