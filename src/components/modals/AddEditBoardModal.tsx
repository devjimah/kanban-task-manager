import { useState, useEffect, useId } from "react";
import Modal from "./Modal";
import { useBoard } from "../../store/boardStore";
import { useToastStore } from "../../store/toastStore";
import { IconCross } from "../Icons";
import type { Board } from "../../types";

// Validation constants
const NAME_MAX_LENGTH = 50;
const NAME_MIN_LENGTH = 2;
const COLUMN_MAX_LENGTH = 30;

interface AddEditBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  board?: Board | null; // If provided, we're editing; otherwise, adding
}

export default function AddEditBoardModal({
  isOpen,
  onClose,
  board,
}: Readonly<AddEditBoardModalProps>) {
  const { addBoard, editBoard } = useBoard();
  const { addToast } = useToastStore();
  const isEditing = !!board;

  // Generate unique IDs for accessibility
  const formId = useId();
  const nameId = `${formId}-name`;
  const nameErrorId = `${formId}-name-error`;

  const [name, setName] = useState("");
  const [columns, setColumns] = useState<Array<{ id: string; name: string }>>(
    [],
  );
  const [errors, setErrors] = useState<{
    name?: string;
    columns?: { index: number; message: string }[];
  }>({});

  // Initialize form when modal opens or board changes
  useEffect(() => {
    if (isOpen) {
      if (board) {
        setName(board.name);
        setColumns(
          board.columns.map((col) => ({ id: col.id, name: col.name })),
        );
      } else {
        setName("");
        setColumns([
          { id: `temp-${Date.now()}-1`, name: "Todo" },
          { id: `temp-${Date.now()}-2`, name: "Doing" },
        ]);
      }
      setErrors({});
    }
  }, [isOpen, board]);

  const handleAddColumn = () => {
    setColumns([...columns, { id: `temp-${Date.now()}`, name: "" }]);
  };

  const handleRemoveColumn = (index: number) => {
    setColumns(columns.filter((_, i) => i !== index));
    // Clear error for removed column
    if (errors.columns) {
      setErrors({
        ...errors,
        columns: errors.columns.filter((e) => e.index !== index),
      });
    }
  };

  const handleColumnChange = (index: number, value: string) => {
    const updated = [...columns];
    updated[index].name = value;
    setColumns(updated);

    // Clear error for this column if valid
    if (value.trim() && errors.columns?.some((e) => e.index === index)) {
      setErrors({
        ...errors,
        columns: errors.columns.filter((e) => e.index !== index),
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: {
      name?: string;
      columns?: { index: number; message: string }[];
    } = {};

    // Name validation
    const trimmedName = name.trim();
    if (!trimmedName) {
      newErrors.name = "Board name is required";
    } else if (trimmedName.length < NAME_MIN_LENGTH) {
      newErrors.name = `Name must be at least ${NAME_MIN_LENGTH} characters`;
    } else if (trimmedName.length > NAME_MAX_LENGTH) {
      newErrors.name = `Name must be less than ${NAME_MAX_LENGTH} characters`;
    }

    // Columns validation
    const columnErrors: { index: number; message: string }[] = [];
    columns.forEach((col, i) => {
      const trimmedColumn = col.name.trim();
      if (!trimmedColumn) {
        columnErrors.push({ index: i, message: "Column name cannot be empty" });
      } else if (trimmedColumn.length > COLUMN_MAX_LENGTH) {
        columnErrors.push({
          index: i,
          message: `Column name must be less than ${COLUMN_MAX_LENGTH} characters`,
        });
      }
    });

    if (columnErrors.length > 0) {
      newErrors.columns = columnErrors;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      addToast("Please fix the errors in the form", "error");
      return;
    }

    const validColumns = columns.filter((col) => col.name.trim());

    if (isEditing && board) {
      editBoard(
        board.id,
        name.trim(),
        validColumns.map((col) => ({ id: col.id, name: col.name.trim() })),
      );
      addToast("Board updated successfully!", "success");
    } else {
      addBoard(
        name.trim(),
        validColumns.map((col) => col.name.trim()),
      );
      addToast("Board created successfully!", "success");
    }

    onClose();
  };

  const getColumnError = (index: number) =>
    errors.columns?.find((e) => e.index === index)?.message;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Board" : "Add New Board"}
    >
      {/* Board Name */}
      <div className="mb-6">
        <label htmlFor={nameId} className="input-label">
          Board Name{" "}
          <span className="text-xs ml-2 font-normal" style={{ color: "var(--medium-grey)" }}>({name.length}/{NAME_MAX_LENGTH})</span>
        </label>
        <input
          id={nameId}
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (errors.name) setErrors({ ...errors, name: undefined });
          }}
          placeholder="e.g. Web Design"
          className={`input-field ${errors.name ? "error" : ""}`}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? nameErrorId : undefined}
          maxLength={NAME_MAX_LENGTH + 10}
        />
        {errors.name && (
          <span
            id={nameErrorId}
            className="text-xs mt-1 block"
            style={{ color: "var(--red)" }}
            role="alert"
          >
            {errors.name}
          </span>
        )}
      </div>

      {/* Columns */}
      <fieldset className="mb-6 border-0 p-0 m-0">
        <legend className="input-label">Board Columns</legend>
        <ul className="space-y-3 list-none p-0 m-0">
          {columns.map((column, index) => {
            const columnError = getColumnError(index);
            const columnInputId = `${formId}-column-${index}`;
            const columnErrorId = `${formId}-column-error-${index}`;

            return (
              <li key={column.id}>
                <div className="flex items-center gap-4">
                  <input
                    id={columnInputId}
                    type="text"
                    value={column.name}
                    onChange={(e) => handleColumnChange(index, e.target.value)}
                    placeholder="e.g. Todo"
                    className={`input-field flex-1 ${columnError ? "error" : ""}`}
                    aria-invalid={!!columnError}
                    aria-describedby={columnError ? columnErrorId : undefined}
                    aria-label={`Column ${index + 1}`}
                    maxLength={COLUMN_MAX_LENGTH + 10}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveColumn(index)}
                    className="p-1 hover:opacity-75 transition-opacity"
                    aria-label={`Remove column ${index + 1}`}
                  >
                    <IconCross />
                  </button>
                </div>
                {columnError && (
                  <span
                    id={columnErrorId}
                    className="text-xs mt-1 block"
                    style={{ color: "var(--red)" }}
                    role="alert"
                  >
                    {columnError}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
        <button
          type="button"
          onClick={handleAddColumn}
          className="btn btn-secondary w-full mt-3"
        >
          + Add New Column
        </button>
      </fieldset>

      {/* Submit Button */}
      <button
        type="button"
        onClick={handleSubmit}
        className="btn btn-primary-sm w-full"
      >
        {isEditing ? "Save Changes" : "Create New Board"}
      </button>
    </Modal>
  );
}
