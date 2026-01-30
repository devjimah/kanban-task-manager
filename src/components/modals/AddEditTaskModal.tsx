import { useState, useEffect } from "react";
import Modal from "./Modal";
import { useBoard } from "../../context/BoardContext";
import { IconCross, IconChevronDown } from "../Icons";
import type { Task, Subtask } from "../../types";

interface AddEditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: Task | null; // If provided, we're editing; otherwise, adding
}

export default function AddEditTaskModal({
  isOpen,
  onClose,
  task,
}: AddEditTaskModalProps) {
  const { activeBoard, addTask, editTask } = useBoard();
  const isEditing = !!task;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subtasks, setSubtasks] = useState<
    Array<{ id: string; title: string; isCompleted: boolean }>
  >([]);
  const [status, setStatus] = useState("");
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [errors, setErrors] = useState<{
    title?: boolean;
    subtasks?: number[];
  }>({});

  // Initialize form when modal opens or task changes
  useEffect(() => {
    if (isOpen) {
      if (task) {
        setTitle(task.title);
        setDescription(task.description);
        setSubtasks(task.subtasks.map((st) => ({ ...st })));
        setStatus(task.status);
      } else {
        setTitle("");
        setDescription("");
        setSubtasks([
          { id: `temp-${Date.now()}`, title: "", isCompleted: false },
        ]);
        setStatus(activeBoard?.columns[0]?.name || "");
      }
      setErrors({});
    }
  }, [isOpen, task, activeBoard]);

  const columns = activeBoard?.columns || [];

  const handleAddSubtask = () => {
    setSubtasks([
      ...subtasks,
      { id: `temp-${Date.now()}`, title: "", isCompleted: false },
    ]);
  };

  const handleRemoveSubtask = (index: number) => {
    setSubtasks(subtasks.filter((_, i) => i !== index));
  };

  const handleSubtaskChange = (index: number, value: string) => {
    const updated = [...subtasks];
    updated[index].title = value;
    setSubtasks(updated);

    // Clear error for this subtask if value provided
    if (value.trim() && errors.subtasks?.includes(index)) {
      setErrors({
        ...errors,
        subtasks: errors.subtasks.filter((i) => i !== index),
      });
    }
  };

  const handleSubmit = () => {
    // Validate
    const newErrors: { title?: boolean; subtasks?: number[] } = {};

    if (!title.trim()) {
      newErrors.title = true;
    }

    const emptySubtasks = subtasks
      .map((st, i) => (!st.title.trim() ? i : -1))
      .filter((i) => i !== -1);

    if (emptySubtasks.length > 0) {
      newErrors.subtasks = emptySubtasks;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Find the target column
    const targetColumn = columns.find((col) => col.name === status);
    if (!targetColumn) return;

    if (isEditing && task) {
      editTask(task.id, {
        title: title.trim(),
        description: description.trim(),
        status,
        subtasks: subtasks
          .filter((st) => st.title.trim())
          .map((st) => ({
            id: st.id,
            title: st.title.trim(),
            isCompleted: st.isCompleted,
          })),
      });
    } else {
      addTask(targetColumn.id, {
        title: title.trim(),
        description: description.trim(),
        status,
        subtasks: subtasks
          .filter((st) => st.title.trim())
          .map((st) => ({
            id: st.id,
            title: st.title.trim(),
            isCompleted: false,
          })),
      });
    }

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Task" : "Add New Task"}
    >
      {/* Title */}
      <div className="mb-6">
        <label className="input-label">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (errors.title) setErrors({ ...errors, title: false });
          }}
          placeholder="e.g. Take coffee break"
          className={`input-field ${errors.title ? "error" : ""}`}
        />
        {errors.title && (
          <span className="text-xs mt-1 block" style={{ color: "var(--red)" }}>
            Can't be empty
          </span>
        )}
      </div>

      {/* Description */}
      <div className="mb-6">
        <label className="input-label">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. It's always good to take a break. This 15 minute break will recharge the batteries a little."
          className="input-field"
        />
      </div>

      {/* Subtasks */}
      <div className="mb-6">
        <label className="input-label">Subtasks</label>
        <div className="space-y-3">
          {subtasks.map((subtask, index) => (
            <div key={subtask.id} className="flex items-center gap-4">
              <input
                type="text"
                value={subtask.title}
                onChange={(e) => handleSubtaskChange(index, e.target.value)}
                placeholder="e.g. Make coffee"
                className={`input-field flex-1 ${errors.subtasks?.includes(index) ? "error" : ""}`}
              />
              <button
                type="button"
                onClick={() => handleRemoveSubtask(index)}
                className="p-1 hover:opacity-75 transition-opacity"
              >
                <IconCross />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={handleAddSubtask}
          className="btn btn-secondary w-full mt-3"
        >
          + Add New Subtask
        </button>
      </div>

      {/* Status */}
      <div className="mb-6 relative">
        <label className="input-label">Status</label>
        <button
          type="button"
          onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
          className="dropdown-trigger"
        >
          <span>{status || "Select a column"}</span>
          <IconChevronDown
            className={`transition-transform ${isStatusDropdownOpen ? "rotate-180" : ""}`}
          />
        </button>

        {isStatusDropdownOpen && (
          <div className="dropdown-menu">
            {columns.map((column) => (
              <div
                key={column.id}
                onClick={() => {
                  setStatus(column.name);
                  setIsStatusDropdownOpen(false);
                }}
                className={`dropdown-item ${status === column.name ? "font-bold" : ""}`}
              >
                {column.name}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="button"
        onClick={handleSubmit}
        className="btn btn-primary-sm w-full"
      >
        {isEditing ? "Save Changes" : "Create Task"}
      </button>
    </Modal>
  );
}
