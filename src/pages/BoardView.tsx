import React from 'react';
import { useParams, Link } from 'react-router-dom';
import boards from '../boards.json';
import { ArrowLeft } from 'lucide-react';

const BoardView: React.FC = () => {
  const { boardId } = useParams<{ boardId: string }>();
  const board = boards.find((b) => b.id === boardId);

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
    <div className="font-mono">
      <div className="mb-6">
        <Link to="/" className="inline-flex items-center text-sm font-bold text-black hover:underline uppercase tracking-wide">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Dashboard
        </Link>
      </div>
      
      <div className="flex items-center justify-between mb-8 border-b-4 border-black pb-4">
        <div>
          <h1 className="text-3xl font-black text-black uppercase tracking-tighter">{board.title}</h1>
          <p className="text-black mt-1 font-medium">{board.description}</p>
        </div>
        <span className="bg-black text-white text-xs font-bold px-3 py-1 border-2 border-black uppercase tracking-widest">
          Active
        </span>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-6">
        {/* Mock Columns */}
        {['To Do', 'In Progress', 'Done'].map((col) => (
          <div key={col} className="min-w-[300px] bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="font-bold text-black mb-4 flex items-center justify-between uppercase tracking-tight border-b-2 border-black pb-2">
              {col}
              <span className="bg-black text-white text-xs px-2 py-1 font-mono">
                0
              </span>
            </h3>
            <div className="h-32 border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-sm font-medium">
              No tasks yet
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BoardView;
