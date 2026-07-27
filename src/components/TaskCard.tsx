import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Task } from "../types";

interface TaskCardProps {
  task: Task;
  onClick: () => void;
  columnId?: string;
  canEdit?: boolean;
}

export default function TaskCard({ task, onClick, columnId = "", canEdit = true }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id, disabled: !canEdit, data: { type: "task", columnId } });
  const completedSubtasks = task.subtasks.filter((st) => st.isCompleted).length;
  const totalSubtasks = task.subtasks.length;

  return (
    <button
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="w-full text-left py-[23px] px-4 rounded-lg group cursor-pointer"
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.45 : 1,
        backgroundColor: "var(--bg-secondary)",
        boxShadow: "0px 4px 6px rgba(54, 78, 126, 0.10)",
        borderRadius: "8px",
      }}
      aria-label={`${task.title}. Press Space to pick up and arrow keys to move.`}
    >
      <h4
        className="heading-m mb-2 group-hover:text-[var(--main-purple)] transition-colors"
        style={{ color: "var(--text-primary)" }}
      >
        {task.title}
      </h4>
      {totalSubtasks > 0 && (
        <p className="body-m" style={{ color: "var(--medium-grey)" }}>
          {completedSubtasks} of {totalSubtasks} subtasks
        </p>
      )}
    </button>
  );
}
