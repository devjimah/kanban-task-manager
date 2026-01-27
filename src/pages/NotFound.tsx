import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

const NotFound: React.FC = () => {
  return (
    <div className="min-h-[70vh] bg-transparent flex flex-col items-center justify-center p-4 text-center font-mono">
      <h1 className="text-9xl font-black text-black dark:text-white opacity-10">404</h1>
      <h2 className="text-4xl font-black text-black dark:text-white mt-4 mb-2 uppercase tracking-tight">Page Not Found</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md font-medium">
        The page you are looking for doesn't exist.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-black font-bold py-4 px-8 border-2 border-transparent transition-all uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]"
      >
        <Home className="w-5 h-5" />
        Return Home
      </Link>
    </div>
  );
};

export default NotFound;
