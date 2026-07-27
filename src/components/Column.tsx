import { useState, useRef, useEffect } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useBoard } from "../store/boardStore";
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
  canEdit?: boolean;
}

export default function Column({ column, index, onTaskClick, canEdit = true }: ColumnProps) {
  const { editColumn } = useBoard();
  const { attributes, listeners, setNodeRef: setSortableNodeRef, transform, transition, isDragging } = useSortable({ id: `column:${column.id}`, disabled: !canEdit, data: { type: "column-sort", columnId: column.id } });
  const { setNodeRef, isOver } = useDroppable({ id: `column-${column.id}`, data: { type: "column", columnId: column.id } });
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
    if (!canEdit) return;
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
    <div ref={setSortableNodeRef} {...attributes} className="w-[280px] shrink-0 flex flex-col" style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}>
      {/* Column Header */}
      <div className="flex items-center gap-3 mb-6 shrink-0" {...listeners}>
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

      {/* Tasks List — also the drop target. When empty it renders as the dashed
          placeholder rather than stacking a second box beneath the list. */}
      <SortableContext items={column.tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
      <div
        ref={setNodeRef}
        className={`space-y-5 flex-1 min-h-[200px] rounded-md transition-colors${
          column.tasks.length === 0 ? " border-2 border-dashed" : ""
        }`}
        style={{
          backgroundColor: isOver ? "color-mix(in srgb, var(--main-purple) 10%, transparent)" : undefined,
          borderColor: column.tasks.length === 0 ? "var(--lines-dark, var(--medium-grey))" : undefined,
        }}
      >
        {column.tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onClick={() => onTaskClick(task)}
            columnId={column.id}
            canEdit={canEdit}
          />
        ))}
      </div>
      </SortableContext>
    </div>
  );
}
