import React, { useState } from 'react';
import MenuBar from './desktop/MenuBar';
import Dock from './desktop/Dock';
import Finder from './desktop/Finder';
import DesktopIcon from './desktop/DesktopIcon';

// Container representing the macOS desktop surface, coordinating shortcuts, top menubars, and base docks.
export default function Desktop({ onLaunchEditor, onPowerOff }) {
  const [isFinderOpen, setIsFinderOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isBgLoaded, setIsBgLoaded] = useState(false);
  const [launchingApp, setLaunchingApp] = useState(null);

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
    if (id === 'vscode') {
      setLaunchingApp('vscode');
      setTimeout(() => {
        onLaunchEditor();
        setLaunchingApp(null);
      }, 350); // 350ms match with zoom keyframe open duration
    }
    if (id === 'finder') {
      setIsFinderOpen(true);
      setIsMinimized(false);
    }
  };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#000] font-sans select-none animate-in fade-in duration-700">
      {/* ── App Zoom Launch Overlay ── */}
      {launchingApp === 'vscode' && (
        <div className="fixed bg-[#09090b] border border-white/5 z-[999] shadow-[0_0_50px_rgba(0,0,0,0.8)] animate-app-zoom-open" />
      )}

      {/* ── Background Layer ── */}
      <div className="absolute inset-0 bg-[#080808]">
        <img 
          src="/icons/bg1.jpg" 
          className={`w-full h-full object-cover select-none pointer-events-none transition-opacity duration-1000 ease-in-out ${isBgLoaded ? 'opacity-100' : 'opacity-0'}`} 
          alt="wallpaper" 
          onLoad={() => setIsBgLoaded(true)}
          fetchpriority="high"
          decoding="async"
        />
        <div className="absolute inset-0 bg-black/10 pointer-events-none" />
      </div>

      {/* ── Modular Components ── */}
      <MenuBar onPowerOff={onPowerOff} />

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
        launchingApp={launchingApp}
      />
    </div>
  );
}
