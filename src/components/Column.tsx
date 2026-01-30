import { useState, useRef, useEffect } from "react";
import { useBoard } from "../context/BoardContext";
import type { Column as ColumnType, Task } from "../types";
import TaskCard from "./TaskCard";

// Column indicator colors (matching Figma design)
const COLUMN_COLORS = [
  "#49C4E5", // Cyan
  "#8471F2", // Purple
  "#67E2AE", // Green
  "#E5A449", // Orange
  "#E54949", // Red
  "#49E5C4", // Teal
];

interface ColumnProps {
  column: ColumnType;
  index: number;
  onTaskClick: (task: Task) => void;
}

export default function Column({ column, index, onTaskClick }: ColumnProps) {
  const { editColumn } = useBoard();
  const colorIndex = index % COLUMN_COLORS.length;
  const indicatorColor = COLUMN_COLORS[colorIndex];

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(column.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = () => {
    setEditName(column.name);
    setIsEditing(true);
  };

  const handleBlur = () => {
    if (editName.trim() && editName.trim() !== column.name) {
      editColumn(column.id, editName.trim());
    } else {
      setEditName(column.name);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleBlur();
    } else if (e.key === "Escape") {
      setEditName(column.name);
      setIsEditing(false);
    }
  };

  return (
    <div className="w-[280px] shrink-0">
      {/* Column Header */}
      <div className="flex items-center gap-3 mb-6">
        <span
          className="w-[15px] h-[15px] rounded-full"
          style={{ backgroundColor: indicatorColor }}
        />
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="heading-s bg-transparent border-b-2 outline-none uppercase"
            style={{
              borderColor: "var(--main-purple)",
              width: "100%",
              letterSpacing: "2.4px",
            }}
          />
        ) : (
          <h3
            className="heading-s cursor-pointer hover:opacity-75 transition-opacity"
            onDoubleClick={handleDoubleClick}
            title="Double-click to edit"
          >
            {column.name.toUpperCase()} ({column.tasks.length})
          </h3>
        )}
      </div>

      {/* Tasks List */}
      <div className="space-y-5">
        {column.tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onClick={() => onTaskClick(task)}
          />
        ))}
      </div>

      {/* Empty Column */}
      {column.tasks.length === 0 && (
        <div
          className="h-full min-h-[200px] rounded-md border-2 border-dashed"
          style={{ borderColor: "var(--medium-grey)", opacity: 0.25 }}
        />
      )}
    </div>
  );
}
