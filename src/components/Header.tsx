import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';

const Header: React.FC = () => {
  const { isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Don't show header on login page
  if (location.pathname === '/login') return null;

  return (
    <header className="h-16 bg-white border-b-2 border-black flex items-center justify-between px-6 font-mono">
      <h2 className="text-lg font-bold text-black tracking-tight uppercase">
        Workspace // Main
      </h2>
      <div className="flex items-center gap-4">
        {isLoggedIn ? (
          <>
            <div className="flex items-center gap-2 text-sm font-bold text-black p-1 border-2 border-black bg-gray-50">
              <div className="w-6 h-6 bg-black text-white flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              user@example.com
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-black border-2 border-black hover:bg-black hover:text-white transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </>
        ) : (
          <button
            onClick={() => navigate('/login')}
            className="text-sm font-bold text-black hover:underline uppercase tracking-wider"
          >
            Login
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
