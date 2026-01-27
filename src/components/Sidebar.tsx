import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, KanbanSquare, ShieldCheck } from 'lucide-react';
import { useStore } from '../store/useStore';

const Sidebar: React.FC = () => {
  const boards = useStore((state) => state.boards);
  const theme = useStore((state) => state.theme);
  
  return (
    <aside className={`w-64 border-r-2 min-h-screen p-4 font-mono ${
      theme === 'dark'
        ? 'bg-gray-800 border-gray-600 text-white'
        : 'bg-white border-black text-black'
    }`}>
      <div className="mb-8">
        <h1 className="text-xl font-bold flex items-center gap-2 tracking-tighter uppercase">
          <KanbanSquare className="w-8 h-8" />
          Kanban.
        </h1>
      </div>
      <nav className="space-y-2">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 border-2 transition-all ${
              isActive 
                ? theme === 'dark'
                  ? 'bg-blue-600 text-white border-blue-500 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]'
                  : 'bg-black text-white border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]'
                : theme === 'dark'
                  ? 'bg-gray-800 text-gray-300 border-transparent hover:border-gray-500 hover:bg-gray-700'
                  : 'bg-white text-black border-transparent hover:border-black hover:bg-gray-50'
            }`
          }
        >
          <LayoutDashboard className="w-5 h-5" />
          Dashboard
        </NavLink>
        
        <div className={`pt-4 pb-2 text-xs font-bold uppercase tracking-widest border-b-2 mb-4 ${
          theme === 'dark' ? 'text-gray-400 border-gray-600' : 'text-black border-black'
        }`}>
          Boards
        </div>
        {boards.map((board) => (
          <NavLink
            key={board.id}
            to={`/board/${board.id}`}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2 border-2 transition-all ${
                isActive 
                  ? theme === 'dark'
                    ? 'bg-blue-600 text-white border-blue-500'
                    : 'bg-black text-white border-black'
                  : theme === 'dark'
                    ? 'bg-gray-800 text-gray-300 border-transparent hover:border-gray-500'
                    : 'bg-white text-black border-transparent hover:border-black'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`w-2 h-2 border border-current ${
                  isActive 
                    ? 'bg-white' 
                    : theme === 'dark' ? 'bg-gray-400' : 'bg-black'
                }`}></span>
                {board.title}
              </>
            )}
          </NavLink>
        ))}

        <div className="pt-8 mt-auto">
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 border-2 transition-all ${
                isActive 
                  ? theme === 'dark'
                    ? 'bg-blue-600 text-white border-blue-500'
                    : 'bg-black text-white border-black'
                  : theme === 'dark'
                    ? 'bg-gray-800 text-gray-300 border-gray-500 hover:bg-gray-700'
                    : 'bg-white text-black border-black hover:bg-gray-100'
              }`
            }
          >
            <ShieldCheck className="w-5 h-5" />
            Admin Panel
          </NavLink>
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;
