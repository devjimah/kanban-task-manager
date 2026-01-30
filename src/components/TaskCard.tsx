import type { Task } from "../types";

interface TaskCardProps {
  task: Task;
  onClick: () => void;
}

export default function TaskCard({ task, onClick }: TaskCardProps) {
  const completedSubtasks = task.subtasks.filter((st) => st.isCompleted).length;
  const totalSubtasks = task.subtasks.length;

  return (
    <button
      onClick={onClick}
      className="w-full text-left py-[23px] px-4 rounded-lg group cursor-pointer"
      style={{
        backgroundColor: "var(--bg-secondary)",
        boxShadow: "0px 4px 6px rgba(54, 78, 126, 0.10)",
        borderRadius: "8px",
      }}
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
