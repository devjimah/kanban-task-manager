import { useState, useEffect, useRef, useId } from "react";
import Modal from "./Modal";
import { useBoard } from "../../store/boardStore";
import { useToastStore } from "../../store/toastStore";
import { IconCross, IconChevronDown } from "../Icons";
import type { Task } from "../../types";

// Validation constants
const TITLE_MAX_LENGTH = 100;
const TITLE_MIN_LENGTH = 3;
const DESCRIPTION_MAX_LENGTH = 500;
const SUBTASK_MAX_LENGTH = 100;

interface AddEditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: Task | null; // If provided, we're editing; otherwise, adding
}

export default function AddEditTaskModal({
  isOpen,
  onClose,
  task,
}: Readonly<AddEditTaskModalProps>) {
  const { activeBoard, addTask, editTask } = useBoard();
  const { addToast } = useToastStore();
  const isEditing = !!task;

  // Generate unique IDs for accessibility
  const formId = useId();
  const titleId = `${formId}-title`;
  const titleErrorId = `${formId}-title-error`;
  const descriptionId = `${formId}-description`;
  const statusId = `${formId}-status`;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subtasks, setSubtasks] = useState<
    Array<{ id: string; title: string; isCompleted: boolean }>
  >([]);
  const [status, setStatus] = useState("");
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [focusedDropdownIndex, setFocusedDropdownIndex] = useState(-1);
  const [errors, setErrors] = useState<{
    title?: string;
    description?: string;
    subtasks?: { index: number; message: string }[];
  }>({});

  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownButtonRef = useRef<HTMLButtonElement>(null);

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
      setIsStatusDropdownOpen(false);
      setFocusedDropdownIndex(-1);
    }
  }, [isOpen, task, activeBoard]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsStatusDropdownOpen(false);
        setFocusedDropdownIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const columns = activeBoard?.columns || [];

  const handleAddSubtask = () => {
    setSubtasks([
      ...subtasks,
      { id: `temp-${Date.now()}`, title: "", isCompleted: false },
    ]);
  };

  const handleRemoveSubtask = (index: number) => {
    setSubtasks(subtasks.filter((_, i) => i !== index));
    // Clear error for removed subtask
    if (errors.subtasks) {
      setErrors({
        ...errors,
        subtasks: errors.subtasks.filter((e) => e.index !== index),
      });
    }
  };

  const handleSubtaskChange = (index: number, value: string) => {
    const updated = [...subtasks];
    updated[index].title = value;
    setSubtasks(updated);

    // Clear error for this subtask if valid
    if (value.trim() && errors.subtasks?.some((e) => e.index === index)) {
      setErrors({
        ...errors,
        subtasks: errors.subtasks.filter((e) => e.index !== index),
      });
    }
  };

  const handleDropdownKeyDown = (e: React.KeyboardEvent) => {
    if (!isStatusDropdownOpen) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setIsStatusDropdownOpen(true);
        setFocusedDropdownIndex(0);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setFocusedDropdownIndex((prev) =>
          prev < columns.length - 1 ? prev + 1 : 0,
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusedDropdownIndex((prev) =>
          prev > 0 ? prev - 1 : columns.length - 1,
        );
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (focusedDropdownIndex >= 0 && columns[focusedDropdownIndex]) {
          setStatus(columns[focusedDropdownIndex].name);
          setIsStatusDropdownOpen(false);
          setFocusedDropdownIndex(-1);
          dropdownButtonRef.current?.focus();
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsStatusDropdownOpen(false);
        setFocusedDropdownIndex(-1);
        dropdownButtonRef.current?.focus();
        break;
      case "Tab":
        setIsStatusDropdownOpen(false);
        setFocusedDropdownIndex(-1);
        break;
    }
  };

  const validateForm = (): boolean => {
    const newErrors: {
      title?: string;
      description?: string;
      subtasks?: { index: number; message: string }[];
    } = {};

    // Title validation
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      newErrors.title = "Title is required";
    } else if (trimmedTitle.length < TITLE_MIN_LENGTH) {
      newErrors.title = `Title must be at least ${TITLE_MIN_LENGTH} characters`;
    } else if (trimmedTitle.length > TITLE_MAX_LENGTH) {
      newErrors.title = `Title must be less than ${TITLE_MAX_LENGTH} characters`;
    }

    // Description validation
    if (description.length > DESCRIPTION_MAX_LENGTH) {
      newErrors.description = `Description must be less than ${DESCRIPTION_MAX_LENGTH} characters`;
    }

    // Subtasks validation
    const subtaskErrors: { index: number; message: string }[] = [];
    subtasks.forEach((st, i) => {
      const trimmedSubtask = st.title.trim();
      if (!trimmedSubtask) {
        subtaskErrors.push({ index: i, message: "Subtask cannot be empty" });
      } else if (trimmedSubtask.length > SUBTASK_MAX_LENGTH) {
        subtaskErrors.push({
          index: i,
          message: `Subtask must be less than ${SUBTASK_MAX_LENGTH} characters`,
        });
      }
    });

    if (subtaskErrors.length > 0) {
      newErrors.subtasks = subtaskErrors;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      addToast("Please fix the errors in the form", "error");
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
      addToast("Task updated successfully!", "success");
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
      addToast("Task created successfully!", "success");
    }

    onClose();
  };

  const getSubtaskError = (index: number) =>
    errors.subtasks?.find((e) => e.index === index)?.message;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Task" : "Add New Task"}
    >
      {/* Title */}
      <div className="mb-6">
        <label htmlFor={titleId} className="input-label">
          Title{" "}
          <span className="text-xs ml-2 font-normal" style={{ color: "var(--medium-grey)" }}>({title.length}/{TITLE_MAX_LENGTH})</span>
        </label>
        <input
          id={titleId}
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (errors.title) setErrors({ ...errors, title: undefined });
          }}
          placeholder="e.g. Take coffee break"
          className={`input-field ${errors.title ? "error" : ""}`}
          aria-invalid={!!errors.title}
          aria-describedby={errors.title ? titleErrorId : undefined}
          maxLength={TITLE_MAX_LENGTH + 10}
        />
        {errors.title && (
          <span
            id={titleErrorId}
            className="text-xs mt-1 block"
            style={{ color: "var(--red)" }}
            role="alert"
          >
            {errors.title}
          </span>
        )}
      </div>

      {/* Description */}
      <div className="mb-6">
        <label htmlFor={descriptionId} className="input-label">
          Description{" "}
          <span className="text-xs ml-2 font-normal" style={{ color: "var(--medium-grey)" }}>({description.length}/{DESCRIPTION_MAX_LENGTH})</span>
        </label>
        <textarea
          id={descriptionId}
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            if (errors.description) setErrors({ ...errors, description: undefined });
          }}
          placeholder="e.g. It's always good to take a break. This 15 minute break will recharge the batteries a little."
          className={`input-field ${errors.description ? "error" : ""}`}
          aria-invalid={!!errors.description}
          maxLength={DESCRIPTION_MAX_LENGTH + 50}
        />
        {errors.description && (
          <span
            className="text-xs mt-1 block"
            style={{ color: "var(--red)" }}
            role="alert"
          >
            {errors.description}
          </span>
        )}
      </div>

      {/* Subtasks */}
      <fieldset className="mb-6 border-0 p-0 m-0">
        <legend className="input-label">Subtasks</legend>
        <ul className="space-y-3 list-none p-0 m-0">
          {subtasks.map((subtask, index) => {
            const subtaskError = getSubtaskError(index);
            const subtaskInputId = `${formId}-subtask-${index}`;
            const subtaskErrorId = `${formId}-subtask-error-${index}`;

            return (
              <li key={subtask.id}>
                <div className="flex items-center gap-4">
                  <input
                    id={subtaskInputId}
                    type="text"
                    value={subtask.title}
                    onChange={(e) => handleSubtaskChange(index, e.target.value)}
                    placeholder="e.g. Make coffee"
                    className={`input-field flex-1 ${subtaskError ? "error" : ""}`}
                    aria-invalid={!!subtaskError}
                    aria-describedby={subtaskError ? subtaskErrorId : undefined}
                    aria-label={`Subtask ${index + 1}`}
                    maxLength={SUBTASK_MAX_LENGTH + 10}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveSubtask(index)}
                    className="p-1 hover:opacity-75 transition-opacity"
                    aria-label={`Remove subtask ${index + 1}`}
                  >
                    <IconCross />
                  </button>
                </div>
                {subtaskError && (
                  <span
                    id={subtaskErrorId}
                    className="text-xs mt-1 block"
                    style={{ color: "var(--red)" }}
                    role="alert"
                  >
                    {subtaskError}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
        <button
          type="button"
          onClick={handleAddSubtask}
          className="btn btn-secondary w-full mt-3"
        >
          + Add New Subtask
        </button>
      </fieldset>

      {/* Status */}
      <div className="mb-6 relative" ref={dropdownRef}>
        <label id={statusId} className="input-label">
          Status
        </label>
        <button
          ref={dropdownButtonRef}
          type="button"
          onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
          onKeyDown={handleDropdownKeyDown}
          className="dropdown-trigger"
          aria-haspopup="listbox"
          aria-expanded={isStatusDropdownOpen}
          aria-labelledby={statusId}
        >
          <span>{status || "Select a column"}</span>
          <IconChevronDown
            className={`transition-transform ${isStatusDropdownOpen ? "rotate-180" : ""}`}
          />
        </button>

        {isStatusDropdownOpen && (
          <ul
            className="dropdown-menu list-none p-0 m-0"
            role="listbox"
            tabIndex={-1}
            aria-labelledby={statusId}
            aria-activedescendant={
              focusedDropdownIndex >= 0
                ? `status-option-${focusedDropdownIndex}`
                : undefined
            }
          >
            {columns.map((column, index) => (
              <li
                key={column.id}
                id={`status-option-${index}`}
                role="option"
                tabIndex={0}
                aria-selected={status === column.name}
                onClick={() => {
                  setStatus(column.name);
                  setIsStatusDropdownOpen(false);
                  setFocusedDropdownIndex(-1);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setStatus(column.name);
                    setIsStatusDropdownOpen(false);
                    setFocusedDropdownIndex(-1);
                    dropdownButtonRef.current?.focus();
                  }
                }}
                className={`dropdown-item ${status === column.name ? "font-bold" : ""} ${focusedDropdownIndex === index ? "bg-(--main-purple)/10" : ""}`}
              >
                {column.name}
              </li>
            ))}
          </ul>
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
