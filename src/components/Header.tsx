import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, User, Sun, Moon } from 'lucide-react';

const Header: React.FC = () => {
  const { isLoggedIn, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Don't show header on login page
  if (location.pathname === '/login') return null;

  return (
    <header className="h-16 bg-white dark:bg-gray-900 border-b-2 border-black dark:border-white flex items-center justify-between px-6 font-mono">
      <h2 className="text-lg font-bold text-black dark:text-white tracking-tight uppercase">
        Workspace // Main
      </h2>
      <div className="flex items-center gap-4">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 border-2 border-black dark:border-white text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.5)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </button>

        {isLoggedIn ? (
          <>
            <div className="flex items-center gap-2 text-sm font-bold text-black dark:text-white p-1 border-2 border-black dark:border-white bg-gray-50 dark:bg-gray-800">
              <div className="w-6 h-6 bg-black dark:bg-white text-white dark:text-black flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              user@example.com
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-black dark:text-white border-2 border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.5)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </>
        ) : (
          <button
            onClick={() => navigate('/login')}
            className="text-sm font-bold text-black dark:text-white hover:underline uppercase tracking-wider"
          >
            Login
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
