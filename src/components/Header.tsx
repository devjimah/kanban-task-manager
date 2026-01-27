import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, User, Sun, Moon } from 'lucide-react';
import { useStore } from '../store/useStore';

const Header: React.FC = () => {
  const { isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useStore((state) => state.theme);
  const toggleTheme = useStore((state) => state.toggleTheme);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Don't show header on login page
  if (location.pathname === '/login') return null;

  return (
    <header className={`h-16 border-b-2 flex items-center justify-between px-6 font-mono ${
      theme === 'dark'
        ? 'bg-gray-800 border-gray-600 text-white'
        : 'bg-white border-black text-black'
    }`}>
      <h2 className="text-lg font-bold tracking-tight uppercase">
        Workspace // Main
      </h2>
      <div className="flex items-center gap-4">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className={`p-2 border-2 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] ${
            theme === 'dark'
              ? 'border-gray-500 bg-gray-700 hover:bg-gray-600 text-yellow-400'
              : 'border-black bg-white hover:bg-gray-100 text-gray-800'
          }`}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {isLoggedIn ? (
          <>
            <div className={`flex items-center gap-2 text-sm font-bold p-1 border-2 ${
              theme === 'dark'
                ? 'border-gray-500 bg-gray-700'
                : 'border-black bg-gray-50'
            }`}>
              <div className={`w-6 h-6 flex items-center justify-center ${
                theme === 'dark' ? 'bg-gray-500 text-white' : 'bg-black text-white'
              }`}>
                <User className="w-4 h-4" />
              </div>
              user@example.com
            </div>
            <button
              onClick={handleLogout}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-bold border-2 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] ${
                theme === 'dark'
                  ? 'border-gray-500 text-white hover:bg-red-600 hover:border-red-600'
                  : 'border-black text-black hover:bg-black hover:text-white'
              }`}
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </>
        ) : (
          <button
            onClick={() => navigate('/login')}
            className="text-sm font-bold hover:underline uppercase tracking-wider"
          >
            Login
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
