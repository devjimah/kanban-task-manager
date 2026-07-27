import { useEffect } from "react";
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, horizontalListSortingStrategy, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useParams, useNavigate } from "react-router-dom";
import { useBoard } from "../store/boardStore";
import Column from "../components/Column";
import {
  BoardViewSkeleton,
  ErrorScreen,
} from "../components/LoadingErrorStates";
import type { Task, ModalType } from "../types";

interface BoardViewProps {
  onTaskClick: (task: Task) => void;
  onOpenModal: (type: ModalType) => void;
}

export default function BoardView({
  onTaskClick,
  onOpenModal,
}: BoardViewProps) {
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const {
    activeBoard,
    setActiveBoardById,
    addColumn,
    isLoading,
    error,
    hasFetched,
    fetchBoards,
  } = useBoard();

  // Fetch boards if not yet loaded
  useEffect(() => {
    if (!hasFetched && !isLoading && !error) {
      fetchBoards();
    }
  }, [hasFetched, isLoading, error, fetchBoards]);

  // Set active board based on URL parameter
  useEffect(() => {
    if (boardId && hasFetched) {
      const found = setActiveBoardById(boardId);
      if (!found) {
        // Board not found, navigate to dashboard
        navigate("/", { replace: true });
      }
    }
  }, [boardId, hasFetched, setActiveBoardById, navigate]);

  // Loading state — show skeleton UI
  if (isLoading || (!hasFetched && !error)) {
    return <BoardViewSkeleton />;
  }

  // Error state — show error with retry
  if (error) {
    return <ErrorScreen message={error} onRetry={fetchBoards} />;
  }

  if (!activeBoard) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <p className="heading-l mb-6" style={{ color: "var(--medium-grey)" }}>
            No boards found. Create a new board to get started.
          </p>
          <button
            onClick={() => onOpenModal("addBoard")}
            className="btn btn-primary-lg"
          >
            + Create New Board
          </button>
        </div>
      </div>
    );
  }

  const canEdit = activeBoard.access !== "viewer";

  if (activeBoard.columns.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <p className="heading-l mb-6" style={{ color: "var(--medium-grey)" }}>
            This board is empty. Create a new column to get started.
          </p>
          {canEdit && <button
            onClick={() => onOpenModal("editBoard")}
            className="btn btn-primary-lg"
          >
            + Add New Column
          </button>}
        </div>
      </div>
    );
  }

  const handleAddColumn = () => {
    const columnCount = activeBoard.columns.length + 1;
    void addColumn(activeBoard.id, `Column ${columnCount}`).catch(() => undefined);
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || !canEdit || active.id === over.id) return;
    if (active.data.current?.type === "column-sort") {
      if (over.data.current?.type !== "column-sort") return;
      const columnId = String(active.data.current.columnId);
      const targetId = String(over.data.current.columnId);
      const targetIndex = activeBoard.columns.findIndex((column) => column.id === targetId);
      if (targetIndex >= 0) void useBoard.getState().moveColumn(columnId, targetIndex).catch(() => undefined);
      return;
    }
    const sourceColumnId = String(active.data.current?.columnId ?? "");
    const destinationColumnId = String(over.data.current?.columnId ?? "");
    if (!sourceColumnId || !destinationColumnId) return;
    const destination = activeBoard.columns.find((column) => column.id === destinationColumnId);
    if (!destination) return;
    const targetIndex = over.data.current?.type === "task"
      ? destination.tasks.findIndex((task) => task.id === over.id)
      : destination.tasks.length;
    void useBoard.getState().moveTask(String(active.id), sourceColumnId, destinationColumnId, Math.max(0, targetIndex)).catch(() => undefined);
  };

  return (
    <div
      className="flex-1 overflow-x-auto p-6"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={activeBoard.columns.map((column) => `column:${column.id}`)} strategy={horizontalListSortingStrategy}>
      <div className="flex gap-6 items-stretch min-h-full pb-2">
        {/* Columns */}
        {activeBoard.columns.map((column, index) => (
          <Column
            key={column.id}
            column={column}
            index={index}
            onTaskClick={onTaskClick}
            canEdit={canEdit}
          />
        ))}

        {/* New Column Button */}
        {canEdit && <button
          onClick={handleAddColumn}
          className="w-[280px] shrink-0 self-stretch rounded-md flex items-center justify-center transition-colors heading-xl"
          style={{
            background:
              "linear-gradient(180deg, rgba(43, 44, 55, 0.25) 0%, rgba(43, 44, 55, 0.125) 100%)",
            color: "var(--medium-grey)",
            // Offset the column header row above so the slab aligns with the task lists.
            marginTop: "39px",
          }}
        >
          <span className="hover:text-[var(--main-purple)] transition-colors">
            + New Column
          </span>
        </button>}
      </div>
      </SortableContext>
      </DndContext>
    </div>
  );
}
