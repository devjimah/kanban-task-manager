import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { KanbanSquare } from 'lucide-react';

const Login: React.FC = () => {
  const { login, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    if (isLoggedIn) {
      navigate(from, { replace: true });
    }
  }, [isLoggedIn, navigate, from]);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center p-4 font-mono">
      <div className="bg-white dark:bg-gray-800 p-8 border-4 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.3)] w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="bg-black dark:bg-white p-4">
            <KanbanSquare className="w-12 h-12 text-white dark:text-black" />
          </div>
        </div>
        <h2 className="text-3xl font-black text-center text-black dark:text-white mb-2 uppercase tracking-tighter">Welcome Back</h2>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-8 font-medium">Sign in to access your boards</p>
        
        <button
          onClick={login}
          className="w-full bg-black dark:bg-white text-white dark:text-black hover:bg-white dark:hover:bg-black hover:text-black dark:hover:text-white hover:border-black dark:hover:border-white border-2 border-transparent font-bold py-4 px-4 transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
        >
          Sign In
        </button>
        <p className="mt-4 text-center text-xs text-gray-400 font-mono">
          (MOCK LOGIN)
        </p>
      </div>
    </div>
  );
};

export default Login;
