import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import Column from '../components/Column';
import { ArrowLeft } from 'lucide-react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import type { DragEndEvent, DragOverEvent } from '@dnd-kit/core';

const BoardView: React.FC = () => {
  const { boardId } = useParams<{ boardId: string }>();
  const board = useStore((state) => state.boards.find((b) => b.id === boardId));
  const allColumns = useStore((state) => state.columns);
  const allTasks = useStore((state) => state.tasks);
  const moveTask = useStore((state) => state.moveTask);
  const theme = useStore((state) => state.theme);

  const columns = allColumns.filter((c) => c.boardId === boardId);
  const tasks = allTasks;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeTask = tasks.find((t) => t.id === activeId);
    if (!activeTask) return;

    // Check if dropping over a column
    const overColumn = columns.find((c) => c.id === overId);
    if (overColumn && activeTask.columnId !== overColumn.id) {
      moveTask(activeId, overColumn.id);
      return;
    }

    // Check if dropping over another task
    const overTask = tasks.find((t) => t.id === overId);
    if (overTask && activeTask.columnId !== overTask.columnId) {
      moveTask(activeId, overTask.columnId);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeTask = tasks.find((t) => t.id === activeId);
    if (!activeTask) return;

    // Final move to column
    const overColumn = columns.find((c) => c.id === overId);
    if (overColumn && activeTask.columnId !== overColumn.id) {
      moveTask(activeId, overColumn.id);
    }
  };

  if (!board) {
    return (
      <div className={`text-center py-20 font-mono ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
        <h2 className="text-2xl font-bold mb-4 uppercase">Board not found</h2>
        <Link to="/" className={`underline hover:no-underline font-bold ${theme === 'dark' ? 'text-blue-400' : 'text-black'}`}>
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="font-mono h-full flex flex-col">
      <div className="mb-6 flex-none">
        <Link to="/" className={`inline-flex items-center text-sm font-bold hover:underline uppercase tracking-wide ${
          theme === 'dark' ? 'text-gray-300' : 'text-black'
        }`}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Dashboard
        </Link>
      </div>
      
      <div className={`flex items-center justify-between mb-8 border-b-4 pb-4 flex-none ${
        theme === 'dark' ? 'border-gray-600' : 'border-black'
      }`}>
        <div>
          <h1 className={`text-3xl font-black uppercase tracking-tighter ${
            theme === 'dark' ? 'text-white' : 'text-black'
          }`}>{board.title}</h1>
          <p className={`mt-1 font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-black'}`}>
            {board.description}
          </p>
        </div>
        <span className={`text-xs font-bold px-3 py-1 border-2 uppercase tracking-widest ${
          theme === 'dark'
            ? 'bg-green-600 text-white border-green-500'
            : 'bg-black text-white border-black'
        }`}>
          Active
        </span>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-6 overflow-x-auto pb-6 flex-1">
          {columns.map((col) => (
            <Column 
              key={col.id} 
              column={col} 
              tasks={tasks.filter(t => t.columnId === col.id)} 
            />
          ))}
          {columns.length === 0 && (
            <div className={`flex items-center justify-center p-8 border-2 border-dashed w-full font-medium ${
              theme === 'dark' ? 'border-gray-600 text-gray-500' : 'border-gray-300 text-gray-400'
            }`}>
              No columns defined for this board.
            </div>
          )}
        </div>
      </DndContext>
    </div>
  );
};

export default BoardView;
