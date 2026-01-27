import React from 'react';
import { Link } from 'react-router-dom';
import boards from '../boards.json';
import { KanbanSquare, ArrowRight } from 'lucide-react';

const Dashboard: React.FC = () => {
  return (
    <div className="font-mono">
      <h1 className="text-4xl font-black text-black dark:text-white mb-8 uppercase tracking-tighter decoration-4 underline decoration-black dark:decoration-white">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {boards.map((board) => (
          <Link
            key={board.id}
            to={`/board/${board.id}`}
            className="group block bg-white dark:bg-gray-800 p-6 border-2 border-black dark:border-white text-black dark:text-white hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px]"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-2 border-2 border-black dark:border-white group-hover:border-white dark:group-hover:border-black group-hover:bg-white dark:group-hover:bg-black group-hover:text-black dark:group-hover:text-white transition-colors">
                <KanbanSquare className="w-6 h-6" />
              </div>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </div>
            <h3 className="text-xl font-bold mb-2 uppercase tracking-tight">
              {board.title}
            </h3>
            <p className="text-sm opacity-70 font-medium">
              {board.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
