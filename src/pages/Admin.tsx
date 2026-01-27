import React from 'react';
import { ShieldAlert } from 'lucide-react';

const Admin: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 border-4 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.3)] font-mono">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-black dark:bg-white text-white dark:text-black">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-black dark:text-white uppercase tracking-tighter">Admin Panel</h1>
          <p className="text-gray-600 dark:text-gray-400 font-bold">Restricted access area</p>
        </div>
      </div>
      
      <div className="p-4 bg-gray-100 dark:bg-gray-700 text-black dark:text-white border-2 border-black dark:border-white mb-8 font-medium">
        <span className="font-bold">NOTICE:</span> This route is protected. You can only see this if you are logged in.
      </div>

      <div className="space-y-4">
        <h3 className="font-bold text-black dark:text-white uppercase tracking-wider border-b-2 border-black dark:border-white pb-2">System Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Users', value: '1' },
            { label: 'Boards', value: '3' },
            { label: 'Status', value: 'OK' }
          ].map((stat) => (
            <div key={stat.label} className="p-4 bg-white dark:bg-gray-900 border-2 border-black dark:border-white text-black dark:text-white hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-colors cursor-default">
               <div className="text-xs font-bold uppercase mb-2 opacity-70">{stat.label}</div>
               <div className="text-4xl font-black">{stat.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Admin;
