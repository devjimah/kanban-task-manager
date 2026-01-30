import { useState, useEffect } from "react";
import Modal from "./Modal";
import { useBoard } from "../../store/boardStore";
import { IconCross } from "../Icons";
import type { Board } from "../../types";

interface AddEditBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  board?: Board | null; // If provided, we're editing; otherwise, adding
}

export default function AddEditBoardModal({
  isOpen,
  onClose,
  board,
}: AddEditBoardModalProps) {
  const { addBoard, editBoard } = useBoard();
  const isEditing = !!board;

  const [name, setName] = useState("");
  const [columns, setColumns] = useState<Array<{ id: string; name: string }>>(
    [],
  );
  const [errors, setErrors] = useState<{ name?: boolean; columns?: number[] }>(
    {},
  );

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
  };

  const handleColumnChange = (index: number, value: string) => {
    const updated = [...columns];
    updated[index].name = value;
    setColumns(updated);

    // Clear error for this column if value provided
    if (value.trim() && errors.columns?.includes(index)) {
      setErrors({
        ...errors,
        columns: errors.columns.filter((i) => i !== index),
      });
    }
  };

  const handleSubmit = () => {
    // Validate
    const newErrors: { name?: boolean; columns?: number[] } = {};

    if (!name.trim()) {
      newErrors.name = true;
    }

    const emptyColumns = columns
      .map((col, i) => (!col.name.trim() ? i : -1))
      .filter((i) => i !== -1);

    if (emptyColumns.length > 0) {
      newErrors.columns = emptyColumns;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const validColumns = columns.filter((col) => col.name.trim());

    if (isEditing && board) {
      editBoard(
        board.id,
        name.trim(),
        validColumns.map((col) => ({ id: col.id, name: col.name.trim() })),
      );
    } else {
      addBoard(
        name.trim(),
        validColumns.map((col) => col.name.trim()),
      );
    }

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Board" : "Add New Board"}
    >
      {/* Board Name */}
      <div className="mb-6">
        <label className="input-label">Board Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (errors.name) setErrors({ ...errors, name: false });
          }}
          placeholder="e.g. Web Design"
          className={`input-field ${errors.name ? "error" : ""}`}
        />
        {errors.name && (
          <span className="text-xs mt-1 block" style={{ color: "var(--red)" }}>
            Can't be empty
          </span>
        )}
      </div>

      {/* Columns */}
      <div className="mb-6">
        <label className="input-label">Board Columns</label>
        <div className="space-y-3">
          {columns.map((column, index) => (
            <div key={column.id} className="flex items-center gap-4">
              <input
                type="text"
                value={column.name}
                onChange={(e) => handleColumnChange(index, e.target.value)}
                placeholder="e.g. Todo"
                className={`input-field flex-1 ${errors.columns?.includes(index) ? "error" : ""}`}
              />
              <button
                type="button"
                onClick={() => handleRemoveColumn(index)}
                className="p-1 hover:opacity-75 transition-opacity"
              >
                <IconCross />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={handleAddColumn}
          className="btn btn-secondary w-full mt-3"
        >
          + Add New Column
        </button>
      </div>

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
