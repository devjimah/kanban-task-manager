import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Circle, Clock } from 'lucide-react';
import boards from '../boards.json';

const TaskView: React.FC = () => {
  const { boardId, taskId } = useParams<{ boardId: string; taskId: string }>();
  
  const board = boards.find((b) => b.id === boardId);
  
  let task = null;
  let columnName = '';
  
  if (board) {
    for (const column of board.columns) {
      const foundTask = column.tasks.find((t) => t.id === taskId);
      if (foundTask) {
        task = foundTask;
        columnName = column.name;
        break;
      }
    }
  }

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

  if (!task) {
    return (
      <div className="text-center py-20 font-mono">
        <h2 className="text-2xl font-bold text-black dark:text-white mb-4 uppercase">Task not found</h2>
        <Link to={`/board/${boardId}`} className="text-black dark:text-white underline hover:no-underline font-bold">
          Return to Board
        </Link>
      </div>
    );
  }

  const getStatusIcon = () => {
    switch (columnName) {
      case 'Done':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'In Progress':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="font-mono max-w-2xl">
      <div className="mb-6">
        <Link 
          to={`/board/${boardId}`} 
          className="inline-flex items-center text-sm font-bold text-black dark:text-white hover:underline uppercase tracking-wide"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to {board.title}
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 border-4 border-black dark:border-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.3)]">
        <div className="flex items-center gap-2 mb-4">
          {getStatusIcon()}
          <span className="text-sm font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">
            {columnName}
          </span>
        </div>

        <h1 className="text-3xl font-black text-black dark:text-white uppercase tracking-tighter mb-4">
          {task.title}
        </h1>

        <div className="border-t-2 border-black dark:border-white pt-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-2">
            Description
          </h3>
          <p className="text-black dark:text-white font-medium">
            {task.description || 'No description provided.'}
          </p>
        </div>

        <div className="border-t-2 border-black dark:border-white pt-4 mt-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-2">
            Details
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-bold text-gray-600 dark:text-gray-400">Task ID:</span>
              <span className="ml-2 text-black dark:text-white">{task.id}</span>
            </div>
            <div>
              <span className="font-bold text-gray-600 dark:text-gray-400">Board:</span>
              <span className="ml-2 text-black dark:text-white">{board.title}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskView;
