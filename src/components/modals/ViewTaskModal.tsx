import { useState, useRef, useEffect } from "react";
import Modal from "./Modal";
import { useBoard } from "../../store/boardStore";
import { IconVerticalEllipsis, IconCheck, IconChevronDown } from "../Icons";
import type { Task } from "../../types";

interface ViewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onEdit: () => void;
  onDelete: () => void;
}

export default function ViewTaskModal({
  isOpen,
  onClose,
  task,
  onEdit,
  onDelete,
}: ViewTaskModalProps) {
  const { activeBoard, toggleSubtask, editTask } = useBoard();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsStatusDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!task || !activeBoard) return null;

  const completedSubtasks = task.subtasks.filter((st) => st.isCompleted).length;
  const totalSubtasks = task.subtasks.length;
  const columns = activeBoard.columns;

  const handleStatusChange = (newStatus: string) => {
    editTask(task.id, { status: newStatus });
    setIsStatusDropdownOpen(false);
  };

  const handleSubtaskToggle = (subtaskId: string) => {
    toggleSubtask(task.id, subtaskId);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      {/* Header with Menu */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <h2 className="heading-l" style={{ color: "var(--text-primary)" }}>
          {task.title}
        </h2>
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 -mr-2 -mt-1"
            aria-label="Task options"
          >
            <IconVerticalEllipsis />
          </button>

          {isMenuOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-48 py-4 rounded-lg shadow-lg z-10"
              style={{ backgroundColor: "var(--bg-primary)" }}
            >
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onEdit();
                }}
                className="w-full text-left px-4 py-2 body-l hover:opacity-75"
                style={{ color: "var(--medium-grey)" }}
              >
                Edit Task
              </button>
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onDelete();
                }}
                className="w-full text-left px-4 py-2 body-l hover:opacity-75"
                style={{ color: "var(--red)" }}
              >
                Delete Task
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {task.description && (
        <p className="body-l mb-6" style={{ color: "var(--medium-grey)" }}>
          {task.description}
        </p>
      )}

      {/* Subtasks */}
      {totalSubtasks > 0 && (
        <div className="mb-6">
          <label className="input-label mb-4">
            Subtasks ({completedSubtasks} of {totalSubtasks})
          </label>
          <div className="space-y-2">
            {task.subtasks.map((subtask) => (
              <div
                key={subtask.id}
                onClick={() => handleSubtaskToggle(subtask.id)}
                className="checkbox-container"
              >
                <div
                  className={`checkbox ${subtask.isCompleted ? "checked" : ""}`}
                >
                  {subtask.isCompleted && <IconCheck />}
                </div>
                <span
                  className={`checkbox-label ${subtask.isCompleted ? "completed" : ""}`}
                >
                  {subtask.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Current Status */}
      <div ref={dropdownRef}>
        <label className="input-label">Current Status</label>
        <button
          onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
          className="dropdown-trigger"
        >
          <span>{task.status}</span>
          <IconChevronDown
            className={`transition-transform ${isStatusDropdownOpen ? "rotate-180" : ""}`}
          />
        </button>

        {isStatusDropdownOpen && (
          <div className="dropdown-menu">
            {columns.map((column) => (
              <div
                key={column.id}
                onClick={() => handleStatusChange(column.name)}
                className={`dropdown-item ${task.status === column.name ? "font-bold" : ""}`}
              >
                {column.name}
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
