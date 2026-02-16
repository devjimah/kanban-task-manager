// ========================================
// TaskCard Component Tests
// ========================================

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TaskCard from "../../components/TaskCard";
import { mockTask, mockTaskNoSubtasks } from "../helpers";

describe("TaskCard", () => {
  it("renders the task title", () => {
    render(<TaskCard task={mockTask} onClick={vi.fn()} />);
    expect(screen.getByText("Build UI for onboarding flow")).toBeInTheDocument();
  });

  it("renders subtask progress when subtasks exist", () => {
    render(<TaskCard task={mockTask} onClick={vi.fn()} />);
    // 1 of 3 subtasks completed
    expect(screen.getByText("1 of 3 subtasks")).toBeInTheDocument();
  });

  it("does not render subtask text when there are no subtasks", () => {
    render(<TaskCard task={mockTaskNoSubtasks} onClick={vi.fn()} />);
    expect(screen.queryByText(/subtasks/)).not.toBeInTheDocument();
  });

  it("calls onClick when the card is clicked", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<TaskCard task={mockTask} onClick={handleClick} />);

    await user.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("renders as a button element for accessibility", () => {
    render(<TaskCard task={mockTask} onClick={vi.fn()} />);
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent("Build UI for onboarding flow");
  });

  it("displays correct count with all subtasks completed", () => {
    const allDoneTask = {
      ...mockTask,
      subtasks: mockTask.subtasks.map((st) => ({ ...st, isCompleted: true })),
    };
    render(<TaskCard task={allDoneTask} onClick={vi.fn()} />);
    expect(screen.getByText("3 of 3 subtasks")).toBeInTheDocument();
  });
});
