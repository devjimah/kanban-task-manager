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
    <div className="min-h-screen bg-white flex items-center justify-center p-4 font-mono">
      <div className="bg-white p-8 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="bg-black p-4">
            <KanbanSquare className="w-12 h-12 text-white" />
          </div>
        </div>
        <h2 className="text-3xl font-black text-center text-black mb-2 uppercase tracking-tighter">Welcome Back</h2>
        <p className="text-center text-gray-600 mb-8 font-medium">Sign in to access your boards</p>
        
        <button
          onClick={login}
          className="w-full bg-black text-white hover:bg-white hover:text-black hover:border-black border-2 border-transparent font-bold py-4 px-4 transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
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
