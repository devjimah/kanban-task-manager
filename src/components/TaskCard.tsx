import React from 'react';
import type { Task } from '../store/types';
import { useStore } from '../store/useStore';
import { X } from 'lucide-react';

interface TaskCardProps {
  task: Task;
}

const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
  const deleteTask = useStore((state) => state.deleteTask);

  return (
    <div className="bg-white border-2 border-black p-3 mb-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] relative group">
      <button
        onClick={() => deleteTask(task.id)}
        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 hover:bg-black hover:text-white transition-all"
        title="Delete Task"
      >
        <X className="w-3 h-3" />
      </button>
      <h4 className="font-bold text-black text-sm mb-1">{task.title}</h4>
      {task.description && (
        <p className="text-xs text-gray-500">{task.description}</p>
      )}
    </div>
  );
};

export default TaskCard;
