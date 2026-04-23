import React, { useState } from 'react';
import MenuBar from './desktop/MenuBar';
import Dock from './desktop/Dock';
import Finder from './desktop/Finder';
import DesktopIcon from './desktop/DesktopIcon';

export default function Desktop({ onLaunchEditor }) {
  const [isFinderOpen, setIsFinderOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const apps = [
    { id: 'finder', label: 'Finder', path: '/icons/finder.png' },
    { id: 'vscode', label: 'CodeNest', path: '/icons/vscode.svg' },
    { id: 'terminal', label: 'Terminal', path: '/icons/terminal.png' },
    { id: 'safari', label: 'Safari', path: '/icons/safari.svg' },
    { id: 'photos', label: 'Photos', path: '/icons/photos.svg' },
    { id: 'music', label: 'Music', path: '/icons/music.svg' },
    { id: 'settings', label: 'Settings', path: '/icons/settings.svg' },
  ];

  const handleLaunchApp = (id) => {
    if (id === 'vscode') onLaunchEditor();
    if (id === 'finder') {
      setIsFinderOpen(true);
      setIsMinimized(false);
    }
  };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#000] font-sans select-none animate-in fade-in duration-700">
      {/* Global Performance Styles */}
      <style>{`
        @keyframes macos-bounce {
          0%, 100% { transform: translate3d(0, 0, 0); }
          50% { transform: translate3d(0, -20px, 0); }
        }
        .animate-macos-bounce {
          animation: macos-bounce 0.8s ease-in-out infinite;
          will-change: transform;
        }
        .dock-item {
          will-change: transform, width, height, margin-bottom;
        }
      `}</style>
      
      {/* ── Background Layer ── */}
      <div className="absolute inset-0">
        <img 
          src="/icons/bg1.jpg" 
          className="w-full h-full object-cover select-none pointer-events-none" 
          alt="wallpaper" 
        />
        <div className="absolute inset-0 bg-black/10" />
      </div>

      {/* ── Modular Components ── */}
      <MenuBar />

      <DesktopIcon 
        label="User Guide" 
        iconPath="/icons/folder.svg" 
        onOpen={() => { setIsFinderOpen(true); setIsMinimized(false); }} 
      />

      <Finder 
        isOpen={isFinderOpen} 
        isMinimized={isMinimized} 
        onClose={() => setIsFinderOpen(false)} 
        onMinimize={() => setIsMinimized(true)} 
      />

      <Dock 
        apps={apps} 
        isFinderOpen={isFinderOpen} 
        onLaunchApp={handleLaunchApp} 
      />
    </div>
  );
}
