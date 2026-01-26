import React from 'react';
import { ShieldAlert } from 'lucide-react';

const Admin: React.FC = () => {
  return (
    <div className="bg-white p-6 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] font-mono">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-black text-white">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-black uppercase tracking-tighter">Admin Panel</h1>
          <p className="text-gray-600 font-bold">Restricted access area</p>
        </div>
      </div>
      
      <div className="p-4 bg-gray-100 text-black border-2 border-black mb-8 font-medium">
        <span className="font-bold">NOTICE:</span> This route is protected. You can only see this if you are logged in.
      </div>

      <div className="space-y-4">
        <h3 className="font-bold text-black uppercase tracking-wider border-b-2 border-black pb-2">System Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Users', value: '1' },
            { label: 'Boards', value: '3' },
            { label: 'Status', value: 'OK' }
          ].map((stat) => (
            <div key={stat.label} className="p-4 bg-white border-2 border-black hover:bg-black hover:text-white transition-colors cursor-default">
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
