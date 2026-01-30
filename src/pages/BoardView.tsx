import { useBoard } from "../context/BoardContext";
import Column from "../components/Column";
import type { Task, ModalType } from "../types";

interface BoardViewProps {
  onTaskClick: (task: Task) => void;
  onOpenModal: (type: ModalType) => void;
}

export default function BoardView({
  onTaskClick,
  onOpenModal,
}: BoardViewProps) {
  const { activeBoard, addColumn } = useBoard();

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

  if (activeBoard.columns.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <p className="heading-l mb-6" style={{ color: "var(--medium-grey)" }}>
            This board is empty. Create a new column to get started.
          </p>
          <button
            onClick={() => onOpenModal("editBoard")}
            className="btn btn-primary-lg"
          >
            + Add New Column
          </button>
        </div>
      </div>
    );
  }

  const handleAddColumn = () => {
    const columnCount = activeBoard.columns.length + 1;
    addColumn(activeBoard.id, `Column ${columnCount}`);
  };

  return (
    <div
      className="flex-1 overflow-x-auto p-6"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      <div className="flex gap-6 h-full">
        {/* Columns */}
        {activeBoard.columns.map((column, index) => (
          <Column
            key={column.id}
            column={column}
            index={index}
            onTaskClick={onTaskClick}
          />
        ))}

        {/* New Column Button */}
        <button
          onClick={handleAddColumn}
          className="w-[280px] flex-shrink-0 rounded-md flex items-center justify-center mt-10 transition-colors heading-xl"
          style={{
            background:
              "linear-gradient(180deg, rgba(43, 44, 55, 0.25) 0%, rgba(43, 44, 55, 0.125) 100%)",
            color: "var(--medium-grey)",
            minHeight: "calc(100% - 40px)",
          }}
        >
          <span className="hover:text-[var(--main-purple)] transition-colors">
            + New Column
          </span>
        </button>
      </div>
    </div>
  );
}
