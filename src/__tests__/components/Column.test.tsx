// ========================================
// Column Component Tests
// ========================================

import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Column from "../../components/Column";
import { renderWithProviders, mockColumn, mockEmptyColumn } from "../helpers";

describe("Column", () => {
  it("renders the column name and task count", () => {
    renderWithProviders(
      <Column column={mockColumn} index={0} onTaskClick={vi.fn()} />,
    );
    // Column name is uppercased with count
    expect(screen.getByText("TODO (1)")).toBeInTheDocument();
  });

  it("renders all task cards in the column", () => {
    renderWithProviders(
      <Column column={mockColumn} index={0} onTaskClick={vi.fn()} />,
    );
    expect(
      screen.getByText("Build UI for onboarding flow"),
    ).toBeInTheDocument();
  });

  it("shows a dashed placeholder when the column is empty", () => {
    renderWithProviders(
      <Column column={mockEmptyColumn} index={1} onTaskClick={vi.fn()} />,
    );
    // Column header with 0 count
    expect(screen.getByText("DOING (0)")).toBeInTheDocument();
  });

  it("calls onTaskClick when a task card is clicked", async () => {
    const user = userEvent.setup();
    const handleTaskClick = vi.fn();
    renderWithProviders(
      <Column column={mockColumn} index={0} onTaskClick={handleTaskClick} />,
    );

    await user.click(screen.getByText("Build UI for onboarding flow"));
    expect(handleTaskClick).toHaveBeenCalledTimes(1);
    expect(handleTaskClick).toHaveBeenCalledWith(mockColumn.tasks[0]);
  });

  it("enters edit mode on double-click of column name", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <Column column={mockColumn} index={0} onTaskClick={vi.fn()} />,
    );

    const heading = screen.getByText("TODO (1)");
    await user.dblClick(heading);

    // An input should now appear with the column name
    const input = screen.getByDisplayValue("Todo");
    expect(input).toBeInTheDocument();
  });

  it("exits edit mode and reverts on Escape key", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <Column column={mockColumn} index={0} onTaskClick={vi.fn()} />,
    );

    await user.dblClick(screen.getByText("TODO (1)"));
    const input = screen.getByDisplayValue("Todo");

    await user.clear(input);
    await user.type(input, "New Name");
    await user.keyboard("{Escape}");

    // Should revert to original name
    expect(screen.getByText("TODO (1)")).toBeInTheDocument();
  });
});
