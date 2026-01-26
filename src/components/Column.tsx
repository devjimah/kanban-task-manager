import React, { useState } from 'react';
import type { Column as ColumnType, Task } from '../store/types';
import TaskCard from './TaskCard';
import { useStore } from '../store/useStore';
import { Plus } from 'lucide-react';

interface ColumnProps {
  column: ColumnType;
  tasks: Task[];
}

const Column: React.FC<ColumnProps> = ({ column, tasks }) => {
  const addTask = useStore((state) => state.addTask);
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskTitle.trim()) {
      addTask(column.id, newTaskTitle);
      setNewTaskTitle('');
      setIsAdding(false);
    }
  };

  return (
    <div className="min-w-[300px] bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] h-full flex flex-col">
      <h3 className="font-bold text-black mb-4 flex items-center justify-between uppercase tracking-tight border-b-2 border-black pb-2">
        {column.title}
        <span className="bg-black text-white text-xs px-2 py-1 font-mono">
          {tasks.length}
        </span>
      </h3>
      
      <div className="flex-1 overflow-y-auto min-h-[100px]">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
        {tasks.length === 0 && !isAdding && (
           <div className="h-24 border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-sm font-medium">
             No tasks
           </div>
        )}
      </div>

      {isAdding ? (
        <form onSubmit={handleAddTask} className="mt-4">
          <input
            autoFocus
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Task title..."
            className="w-full border-2 border-black p-2 text-sm font-mono mb-2 focus:outline-none focus:bg-gray-50"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-3 py-1 bg-black text-white text-xs font-bold uppercase hover:bg-gray-800"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1 border-2 border-black text-black text-xs font-bold uppercase hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="mt-4 flex items-center justify-center gap-1 w-full border-2 border-dashed border-gray-400 text-gray-500 hover:border-black hover:text-black py-2 text-sm font-bold uppercase transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Task
        </button>
      )}
    </div>
  );
};

export default Column;
