import React, { useState } from 'react';
import type { Column as ColumnType, Task } from '../store/types';
import TaskCard from './TaskCard';
import { useStore } from '../store/useStore';
import { Plus } from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

interface ColumnProps {
  column: ColumnType;
  tasks: Task[];
}

const Column: React.FC<ColumnProps> = ({ column, tasks }) => {
  const addTask = useStore((state) => state.addTask);
  const theme = useStore((state) => state.theme);
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskTitle.trim()) {
      addTask(column.id, newTaskTitle);
      setNewTaskTitle('');
      setIsAdding(false);
    }
  };

  return (
    <div
      className={`
        min-w-[300px] border-2 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] h-full flex flex-col
        ${theme === 'dark'
          ? 'bg-gray-800 border-gray-600'
          : 'bg-white border-black'
        }
        ${isOver ? (theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100') : ''}
        transition-colors
      `}
    >
      <h3 className={`font-bold mb-4 flex items-center justify-between uppercase tracking-tight border-b-2 pb-2 ${
        theme === 'dark' ? 'text-white border-gray-600' : 'text-black border-black'
      }`}>
        {column.title}
        <span className={`text-xs px-2 py-1 font-mono ${
          theme === 'dark' ? 'bg-gray-600 text-white' : 'bg-black text-white'
        }`}>
          {tasks.length}
        </span>
      </h3>
      
      <div ref={setNodeRef} className="flex-1 overflow-y-auto min-h-[100px]">
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </SortableContext>
        {tasks.length === 0 && !isAdding && (
           <div className={`h-24 border-2 border-dashed flex items-center justify-center text-sm font-medium ${
             theme === 'dark' ? 'border-gray-600 text-gray-500' : 'border-gray-300 text-gray-400'
           }`}>
             Drop tasks here
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
            className={`w-full border-2 p-2 text-sm font-mono mb-2 focus:outline-none ${
              theme === 'dark'
                ? 'bg-gray-700 border-gray-500 text-white placeholder-gray-400 focus:bg-gray-600'
                : 'bg-white border-black text-black focus:bg-gray-50'
            }`}
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className={`px-3 py-1 text-xs font-bold uppercase ${
                theme === 'dark'
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-black text-white hover:bg-gray-800'
              }`}
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className={`px-3 py-1 border-2 text-xs font-bold uppercase ${
                theme === 'dark'
                  ? 'border-gray-500 text-gray-300 hover:bg-gray-700'
                  : 'border-black text-black hover:bg-gray-100'
              }`}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className={`mt-4 flex items-center justify-center gap-1 w-full border-2 border-dashed py-2 text-sm font-bold uppercase transition-colors ${
            theme === 'dark'
              ? 'border-gray-600 text-gray-400 hover:border-gray-400 hover:text-gray-300'
              : 'border-gray-400 text-gray-500 hover:border-black hover:text-black'
          }`}
        >
          <Plus className="w-4 h-4" />
          Add Task
        </button>
      )}
    </div>
  );
};

export default Column;
