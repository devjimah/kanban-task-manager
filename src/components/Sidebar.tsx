import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, KanbanSquare, ShieldCheck } from 'lucide-react';
import boards from '../boards.json';

const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-white text-black border-r-2 border-black min-h-screen p-4 font-mono">
      <div className="mb-8">
        <h1 className="text-xl font-bold flex items-center gap-2 tracking-tighter uppercase">
          <KanbanSquare className="w-8 h-8 text-black" />
          Kanban.
        </h1>
      </div>
      <nav className="space-y-2">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 border-2 transition-all ${
              isActive 
                ? 'bg-black text-white border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]' 
                : 'bg-white text-black border-transparent hover:border-black hover:bg-gray-50'
            }`
          }
        >
          <LayoutDashboard className="w-5 h-5" />
          Dashboard
        </NavLink>
        
        <div className="pt-4 pb-2 text-black text-xs font-bold uppercase tracking-widest border-b-2 border-black mb-4">
          Boards
        </div>
        {boards.map((board) => (
          <NavLink
            key={board.id}
            to={`/board/${board.id}`}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2 border-2 transition-all ${
                isActive 
                  ? 'bg-black text-white border-black' 
                  : 'bg-white text-black border-transparent hover:border-black'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`w-2 h-2 border border-current ${isActive ? 'bg-white' : 'bg-black'}`}></span>
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
                  ? 'bg-black text-white border-black' 
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
