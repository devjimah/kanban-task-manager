// ========================================
// LOADING & ERROR UI COMPONENTS
// ========================================

import React from "react";

// ----------------------------------------
// Loading Spinner
// ----------------------------------------
export function LoadingSpinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "w-5 h-5 border-2",
    md: "w-10 h-10 border-3",
    lg: "w-16 h-16 border-4",
  };

  return (
    <div
      className={`${sizeClasses[size]} rounded-full animate-spin`}
      style={{
        borderColor: "var(--border-color)",
        borderTopColor: "var(--main-purple)",
      }}
    />
  );
}

// ----------------------------------------
// Full Page Loading State
// ----------------------------------------
export function LoadingScreen({ message = "Loading boards..." }: { message?: string }) {
  return (
    <div
      className="flex-1 flex flex-col items-center justify-center p-6 gap-4"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      <LoadingSpinner size="lg" />
      <p className="body-l animate-pulse" style={{ color: "var(--medium-grey)" }}>
        {message}
      </p>
    </div>
  );
}

// ----------------------------------------
// Error State with Retry
// ----------------------------------------
interface ErrorScreenProps {
  message: string;
  onRetry: () => void;
}

export function ErrorScreen({ message, onRetry }: ErrorScreenProps) {
  return (
    <div
      className="flex-1 flex flex-col items-center justify-center p-6 gap-6"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      {/* Error Icon */}
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center"
        style={{ backgroundColor: "rgba(234, 85, 85, 0.1)" }}
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#EA5555"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>

      <div className="text-center max-w-md">
        <h2 className="heading-l mb-2">Something went wrong</h2>
        <p className="body-l mb-6" style={{ color: "var(--medium-grey)" }}>
          {message}
        </p>
        <button onClick={onRetry} className="btn btn-primary-lg">
          Try Again
        </button>
      </div>
    </div>
  );
}

// ----------------------------------------
// Board Card Skeleton (Dashboard)
// ----------------------------------------
export function BoardCardSkeleton() {
  return (
    <div
      className="p-6 rounded-lg animate-pulse"
      style={{
        backgroundColor: "var(--bg-sidebar)",
        border: "1px solid var(--border-color)",
      }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-4 h-4 rounded skeleton-shimmer"
          style={{ backgroundColor: "var(--border-color)" }}
        />
        <div
          className="h-5 w-36 rounded skeleton-shimmer"
          style={{ backgroundColor: "var(--border-color)" }}
        />
      </div>
      <div
        className="h-4 w-24 rounded skeleton-shimmer"
        style={{ backgroundColor: "var(--border-color)" }}
      />
    </div>
  );
}

// ----------------------------------------
// Dashboard Loading Skeleton
// ----------------------------------------
export function DashboardSkeleton() {
  return (
    <div
      className="flex-1 overflow-y-auto p-6 lg:p-8"
      style={{ backgroundColor: "var(--bg-main)" }}
    >
      {/* Welcome Skeleton */}
      <div className="mb-8 animate-pulse">
        <div
          className="h-8 w-64 rounded mb-3 skeleton-shimmer"
          style={{ backgroundColor: "var(--border-color)" }}
        />
        <div
          className="h-5 w-80 rounded skeleton-shimmer"
          style={{ backgroundColor: "var(--border-color)" }}
        />
      </div>

      {/* Board Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <BoardCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

// ----------------------------------------
// Column Skeleton (Board View)
// ----------------------------------------
function TaskCardSkeleton() {
  return (
    <div
      className="p-4 rounded-lg animate-pulse"
      style={{
        backgroundColor: "var(--bg-secondary)",
        boxShadow: "var(--task-shadow)",
      }}
    >
      <div
        className="h-4 w-full rounded mb-2 skeleton-shimmer"
        style={{ backgroundColor: "var(--border-color)" }}
      />
      <div
        className="h-4 w-3/4 rounded mb-3 skeleton-shimmer"
        style={{ backgroundColor: "var(--border-color)" }}
      />
      <div
        className="h-3 w-1/2 rounded skeleton-shimmer"
        style={{ backgroundColor: "var(--border-color)" }}
      />
    </div>
  );
}

export function ColumnSkeleton() {
  return (
    <div className="w-[280px] shrink-0">
      {/* Column Header Skeleton */}
      <div className="flex items-center gap-3 mb-6 animate-pulse">
        <div
          className="w-[15px] h-[15px] rounded-full skeleton-shimmer"
          style={{ backgroundColor: "var(--border-color)" }}
        />
        <div
          className="h-4 w-28 rounded skeleton-shimmer"
          style={{ backgroundColor: "var(--border-color)" }}
        />
      </div>

      {/* Task Card Skeletons */}
      <div className="space-y-5">
        {Array.from({ length: 3 }).map((_, i) => (
          <TaskCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

// ----------------------------------------
// Board View Loading Skeleton
// ----------------------------------------
export function BoardViewSkeleton() {
  return (
    <div
      className="flex-1 overflow-x-auto p-6"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      <div className="flex gap-6 h-full">
        {Array.from({ length: 3 }).map((_, i) => (
          <ColumnSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
