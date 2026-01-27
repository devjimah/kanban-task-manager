import React from 'react';
import { useParams, Link } from 'react-router-dom';
import boards from '../boards.json';
import { ArrowLeft, ExternalLink } from 'lucide-react';

const BoardView: React.FC = () => {
  const { boardId } = useParams<{ boardId: string }>();
  const board = boards.find((b) => b.id === boardId);

  if (!board) {
    return (
      <div className="text-center py-20 font-mono">
        <h2 className="text-2xl font-bold text-black dark:text-white mb-4 uppercase">Board not found</h2>
        <Link to="/" className="text-black dark:text-white underline hover:no-underline font-bold">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="font-mono">
      <div className="mb-6">
        <Link to="/" className="inline-flex items-center text-sm font-bold text-black dark:text-white hover:underline uppercase tracking-wide">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Dashboard
        </Link>
      </div>
      
      <div className="flex items-center justify-between mb-8 border-b-4 border-black dark:border-white pb-4">
        <div>
          <h1 className="text-3xl font-black text-black dark:text-white uppercase tracking-tighter">{board.title}</h1>
          <p className="text-black dark:text-gray-300 mt-1 font-medium">{board.description}</p>
        </div>
        <span className="bg-black dark:bg-white text-white dark:text-black text-xs font-bold px-3 py-1 border-2 border-black dark:border-white uppercase tracking-widest">
          Active
        </span>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-6">
        {board.columns.map((column) => (
          <div key={column.id} className="min-w-[300px] bg-white dark:bg-gray-800 border-2 border-black dark:border-white p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)]">
            <h3 className="font-bold text-black dark:text-white mb-4 flex items-center justify-between uppercase tracking-tight border-b-2 border-black dark:border-white pb-2">
              {column.name}
              <span className="bg-black dark:bg-white text-white dark:text-black text-xs px-2 py-1 font-mono">
                {column.tasks.length}
              </span>
            </h3>
            <div className="space-y-3">
              {column.tasks.length === 0 ? (
                <div className="h-20 border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-400 text-sm font-medium">
                  No tasks yet
                </div>
              ) : (
                column.tasks.map((task) => (
                  <Link
                    key={task.id}
                    to={`/board/${boardId}/task/${task.id}`}
                    className="block p-3 bg-gray-50 dark:bg-gray-700 border-2 border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all group"
                  >
                    <div className="flex items-start justify-between">
                      <span className="font-bold text-sm">{task.title}</span>
                      <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    {task.description && (
                      <p className="text-xs mt-1 opacity-70 line-clamp-2">{task.description}</p>
                    )}
                  </Link>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BoardView;
