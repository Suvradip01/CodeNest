import React, { useState, useEffect } from 'react';
import { Monitor, Wifi, Battery, Search, Power } from 'lucide-react';

export default function MenuBar({ onPowerOff }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formatDate = (date) => date.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });

  return (
    <div className="absolute top-0 left-0 right-0 h-7 bg-black/10 backdrop-blur-xl flex items-center justify-between px-5 text-[12px] text-white/90 z-[100] border-b border-white/5">
      <div className="flex items-center gap-4">
        <div className="flex items-center hover:bg-white/10 px-1 py-0.5 rounded transition-colors cursor-default font-bold">
          <img src="/logo.png" alt="CodeNest" className="w-16 sm:w-20 h-4 sm:h-5 object-cover object-center" />
        </div>
        <span className="opacity-80 hover:opacity-100 transition-opacity cursor-default">File</span>
        <span className="opacity-80 hover:opacity-100 transition-opacity cursor-default">Edit</span>
        <span className="opacity-80 hover:opacity-100 transition-opacity cursor-default">View</span>
      </div>
      <div className="flex items-center gap-4">
        <Wifi className="w-3.5 h-3.5" />
        <Battery className="w-3.5 h-3.5" />
        <Search className="w-3.5 h-3.5" />
        <button 
          onClick={onPowerOff} 
          title="Power Off"
          className="opacity-70 hover:opacity-100 hover:text-red-400 transition-all duration-300 ml-1"
        >
          <Power className="w-3.5 h-3.5" />
        </button>
        <div className="flex items-center gap-2 tabular-nums opacity-90 ml-1">
          <span>{formatDate(time)}</span>
          <span>{formatTime(time)}</span>
        </div>
      </div>
    </div>
  );
}
