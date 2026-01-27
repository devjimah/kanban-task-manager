import React from 'react';
import type { Task } from '../store/types';
import { useStore } from '../store/useStore';
import { X, GripVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface TaskCardProps {
  task: Task;
}

const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
  const deleteTask = useStore((state) => state.deleteTask);
  const theme = useStore((state) => state.theme);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        ${theme === 'dark' ? 'bg-gray-700 border-gray-500' : 'bg-white border-black'}
        border-2 p-3 mb-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] relative group
        ${isDragging ? 'opacity-50 z-50' : ''}
      `}
    >
      <div
        {...attributes}
        {...listeners}
        className={`absolute left-1 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing p-1 opacity-0 group-hover:opacity-100 transition-opacity ${
          theme === 'dark' ? 'hover:bg-gray-600' : 'hover:bg-gray-100'
        }`}
      >
        <GripVertical className={`w-3 h-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
      </div>
      <button
        onClick={() => deleteTask(task.id)}
        className={`absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 transition-all ${
          theme === 'dark'
            ? 'hover:bg-red-600 hover:text-white'
            : 'hover:bg-black hover:text-white'
        }`}
        title="Delete Task"
      >
        <X className="w-3 h-3" />
      </button>
      <h4 className={`font-bold text-sm mb-1 pl-4 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
        {task.title}
      </h4>
      {task.description && (
        <p className={`text-xs pl-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
          {task.description}
        </p>
      )}
    </div>
  );
};

export default TaskCard;
