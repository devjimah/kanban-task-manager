

import { render, type RenderOptions } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";
import { ThemeProvider } from "../context/ThemeContext";
import type { ReactElement, ReactNode } from "react";

/**
 * Wraps component with all necessary providers for testing.
 */
function AllProviders({ children }: { children: ReactNode }) {
  return (
    <MemoryRouter>
      <ThemeProvider>
        <AuthProvider>{children}</AuthProvider>
      </ThemeProvider>
    </MemoryRouter>
  );
}

/**
 * Custom render that wraps components with Router + Theme + Auth providers.
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) {
  return render(ui, { wrapper: AllProviders, ...options });
}

// ----------------------------------------
// Shared mock data fixtures
// ----------------------------------------

export const mockTask = {
  id: "task-1",
  title: "Build UI for onboarding flow",
  description: "Design screens for signin, signup, and dashboard.",
  status: "Todo",
  subtasks: [
    { id: "st-1", title: "Sign up page", isCompleted: true },
    { id: "st-2", title: "Sign in page", isCompleted: false },
    { id: "st-3", title: "Welcome page", isCompleted: false },
  ],
};

export const mockTaskNoSubtasks = {
  id: "task-2",
  title: "Write README",
  description: "",
  status: "Todo",
  subtasks: [],
};

export const mockColumn = {
  id: "col-1",
  name: "Todo",
  tasks: [mockTask],
};

export const mockEmptyColumn = {
  id: "col-2",
  name: "Doing",
  tasks: [],
};

export const mockBoard = {
  id: "board-1",
  name: "Platform Launch",
  columns: [
    mockColumn,
    {
      id: "col-2",
      name: "Doing",
      tasks: [
        {
          id: "task-3",
          title: "Design settings page",
          description: "",
          status: "Doing",
          subtasks: [
            { id: "st-4", title: "Settings UI", isCompleted: true },
          ],
        },
      ],
    },
  ],
};

export const mockBoardEmpty = {
  id: "board-2",
  name: "Marketing Plan",
  columns: [],
};
