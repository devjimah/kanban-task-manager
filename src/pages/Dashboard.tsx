import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { KanbanSquare, ArrowRight } from 'lucide-react';

const Dashboard: React.FC = () => {
  const boards = useStore((state) => state.boards);
  const theme = useStore((state) => state.theme);

  return (
    <div className="font-mono">
      <h1 className={`text-4xl font-black mb-8 uppercase tracking-tighter decoration-4 underline ${
        theme === 'dark' ? 'text-white decoration-gray-500' : 'text-black decoration-black'
      }`}>Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {boards.map((board) => (
          <Link
            key={board.id}
            to={`/board/${board.id}`}
            className={`group block p-6 border-2 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] ${
              theme === 'dark'
                ? 'bg-gray-800 border-gray-600 text-white hover:bg-blue-600 hover:border-blue-500'
                : 'bg-white border-black hover:bg-black hover:text-white'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-2 border-2 transition-colors ${
                theme === 'dark'
                  ? 'border-gray-500 group-hover:border-white group-hover:bg-white group-hover:text-blue-600'
                  : 'border-black group-hover:border-white group-hover:bg-white group-hover:text-black'
              }`}>
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
