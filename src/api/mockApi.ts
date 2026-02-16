// ========================================
// MOCK API SERVICE
// Simulates a real REST API with network delays
// ========================================

import type { Board } from "../types";
import initialData from "../data.json";

// Simulated network delay (ms) — adjust to test loading UX
const SIMULATED_DELAY = 3000;

// Simulate a random failure rate (0 = never fail, 1 = always fail)
const FAILURE_RATE = 0;

/**
 * Simulates a network delay and optional random failures.
 */
function simulateNetwork<T>(data: T): Promise<T> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() < FAILURE_RATE) {
        reject(new Error("Network error: Failed to fetch data from server."));
      } else {
        resolve(data);
      }
    }, SIMULATED_DELAY);
  });
}

// ========================================
// API ENDPOINTS
// ========================================

/**
 * GET /api/boards — Fetch all boards with columns and tasks
 */
export async function fetchBoards(): Promise<Board[]> {
  const boards = initialData as Board[];
  return simulateNetwork(boards);
}

/**
 * GET /api/boards/:id — Fetch a single board by ID
 */
export async function fetchBoardById(boardId: string): Promise<Board | null> {
  const boards = initialData as Board[];
  const board = boards.find((b) => b.id === boardId) || null;
  return simulateNetwork(board);
}

/**
 * POST /api/boards — Create a new board
 */
export async function createBoard(board: Board): Promise<Board> {
  return simulateNetwork(board);
}

/**
 * PUT /api/boards/:id — Update a board
 */
export async function updateBoard(board: Board): Promise<Board> {
  return simulateNetwork(board);
}

/**
 * DELETE /api/boards/:id — Delete a board
 */
export async function deleteBoard(boardId: string): Promise<{ success: boolean }> {
  return simulateNetwork({ success: true, boardId } as unknown as { success: boolean });
}
