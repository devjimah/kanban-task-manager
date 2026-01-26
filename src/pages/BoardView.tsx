import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import Column from '../components/Column';
import { ArrowLeft } from 'lucide-react';

const BoardView: React.FC = () => {
  const { boardId } = useParams<{ boardId: string }>();
  const board = useStore((state) => state.boards.find((b) => b.id === boardId));
  const allColumns = useStore((state) => state.columns);
  const allTasks = useStore((state) => state.tasks);

  const columns = allColumns.filter((c) => c.boardId === boardId);
  const tasks = allTasks; // Or filter if needed globally, but we pass filtering to Column component or filter here. The previous code passed all tasks to Column and filtered there? No, it filtered in map.
  // Previous code: tasks={tasks.filter(t => t.columnId === col.id)}
  // So 'tasks' here was just all tasks. 
  // Wait, my previous code was: const tasks = useStore((state) => state.tasks); 
  // ensuring tasks is just the array. That one was fine.
  // The problematic one was: const columns = useStore((state) => state.columns.filter((c) => c.boardId === boardId));

  if (!board) {
    return (
      <div className="text-center py-20 font-mono">
        <h2 className="text-2xl font-bold text-black mb-4 uppercase">Board not found</h2>
        <Link to="/" className="text-black underline hover:no-underline font-bold">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="font-mono h-full flex flex-col">
      <div className="mb-6 flex-none">
        <Link to="/" className="inline-flex items-center text-sm font-bold text-black hover:underline uppercase tracking-wide">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Dashboard
        </Link>
      </div>
      
      <div className="flex items-center justify-between mb-8 border-b-4 border-black pb-4 flex-none">
        <div>
          <h1 className="text-3xl font-black text-black uppercase tracking-tighter">{board.title}</h1>
          <p className="text-black mt-1 font-medium">{board.description}</p>
        </div>
        <span className="bg-black text-white text-xs font-bold px-3 py-1 border-2 border-black uppercase tracking-widest">
          Active
        </span>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-6 flex-1">
        {columns.map((col) => (
          <Column 
            key={col.id} 
            column={col} 
            tasks={tasks.filter(t => t.columnId === col.id)} 
          />
        ))}
        {columns.length === 0 && (
            <div className="flex items-center justify-center p-8 border-2 border-dashed border-gray-300 w-full text-gray-400 font-medium">
                No columns defined for this board.
            </div>
        )}
      </div>
    </div>
  );
};

export default BoardView;
