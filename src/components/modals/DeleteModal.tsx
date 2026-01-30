import Modal from "./Modal";

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  type: "board" | "task";
  title: string;
}

export default function DeleteModal({
  isOpen,
  onClose,
  onConfirm,
  type,
  title,
}: DeleteModalProps) {
  const handleDelete = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="heading-l mb-6" style={{ color: "var(--red)" }}>
        Delete this {type}?
      </h2>

      <p className="body-l mb-6" style={{ color: "var(--medium-grey)" }}>
        {type === "board" ? (
          <>
            Are you sure you want to delete the '{title}' board? This action
            will remove all columns and tasks and cannot be reversed.
          </>
        ) : (
          <>
            Are you sure you want to delete the '{title}' task and its subtasks?
            This action cannot be reversed.
          </>
        )}
      </p>

      <div className="flex gap-4">
        <button onClick={handleDelete} className="btn btn-destructive flex-1">
          Delete
        </button>
        <button onClick={onClose} className="btn btn-secondary flex-1">
          Cancel
        </button>
      </div>
    </Modal>
  );
}
