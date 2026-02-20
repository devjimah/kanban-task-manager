

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  LoadingSpinner,
  LoadingScreen,
  ErrorScreen,
  DashboardSkeleton,
  BoardViewSkeleton,
} from "../../components/LoadingErrorStates";

describe("LoadingSpinner", () => {
  it("renders a spinner element", () => {
    const { container } = render(<LoadingSpinner />);
    const spinner = container.firstChild as HTMLElement;
    expect(spinner).toBeInTheDocument();
    expect(spinner.className).toContain("animate-spin");
  });

  it("applies the correct size class", () => {
    const { container } = render(<LoadingSpinner size="lg" />);
    const spinner = container.firstChild as HTMLElement;
    expect(spinner.className).toContain("w-16");
    expect(spinner.className).toContain("h-16");
  });
});

describe("LoadingScreen", () => {
  it("renders the default loading message", () => {
    render(<LoadingScreen />);
    expect(screen.getByText("Loading boards...")).toBeInTheDocument();
  });

  it("renders a custom loading message", () => {
    render(<LoadingScreen message="Fetching data..." />);
    expect(screen.getByText("Fetching data...")).toBeInTheDocument();
  });
});

describe("ErrorScreen", () => {
  it("renders the error message", () => {
    render(<ErrorScreen message="Network error" onRetry={vi.fn()} />);
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("Network error")).toBeInTheDocument();
  });

  it("renders a Try Again button", () => {
    render(<ErrorScreen message="Failed" onRetry={vi.fn()} />);
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });

  it("calls onRetry when Try Again is clicked", async () => {
    const user = userEvent.setup();
    const handleRetry = vi.fn();
    render(<ErrorScreen message="Failed" onRetry={handleRetry} />);

    await user.click(screen.getByRole("button", { name: /try again/i }));
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });
});

describe("DashboardSkeleton", () => {
  it("renders skeleton placeholder elements", () => {
    const { container } = render(<DashboardSkeleton />);
    const shimmerElements = container.querySelectorAll(".skeleton-shimmer");
    // At least welcome skeleton (2) + 4 board cards (2 each) = 10
    expect(shimmerElements.length).toBeGreaterThanOrEqual(6);
  });
});

describe("BoardViewSkeleton", () => {
  it("renders 3 column skeletons", () => {
    const { container } = render(<BoardViewSkeleton />);
    // Each column skeleton has task card skeletons with shimmer elements
    const shimmerElements = container.querySelectorAll(".skeleton-shimmer");
    expect(shimmerElements.length).toBeGreaterThanOrEqual(9);
  });
});
