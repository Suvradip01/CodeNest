import React, { useState } from 'react';

export default function Dock({ apps, isFinderOpen, onLaunchApp }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [dockScale, setDockScale] = useState(Array(apps.length).fill(1));

  const handleDockHover = (index) => {
    if (index === null) {
      setDockScale(Array(apps.length).fill(1));
      setHoveredIndex(null);
      return;
    }
    setHoveredIndex(index);
    const newScales = Array(apps.length).fill(1).map((_, i) => {
      const distance = Math.abs(i - index);
      if (distance === 0) return 1.5;
      if (distance === 1) return 1.25;
      return 1;
    });
    setDockScale(newScales);
  };

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-end gap-2 px-3 py-2.5 rounded-[28px] bg-black/10 backdrop-blur-xl border border-white/10 z-[110] h-[88px]">
      {apps.map((app, i) => (
        <div
          key={app.id}
          className="dock-item relative flex flex-col items-center group transition-all duration-300 ease-out"
          onMouseEnter={() => handleDockHover(i)}
          onMouseLeave={() => handleDockHover(null)}
          onClick={() => onLaunchApp(app.id)}
          style={{ 
            width: `${64 * dockScale[i]}px`,
            height: `${64 * dockScale[i]}px`,
            marginBottom: `${(dockScale[i] - 1) * 24}px`
          }}
        >
          {/* Tooltip */}
          <div className={`absolute bottom-full mb-10 px-4 py-1.5 rounded-lg bg-[#1a1a1a]/80 backdrop-blur-xl border border-white/10 text-white text-[13px] font-medium transition-all duration-200 ${hoveredIndex === i ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-90 pointer-events-none'}`}>
            {app.label}
          </div>

          {/* Icon Container */}
          <div 
            className={`w-full h-full rounded-[16px] cursor-pointer shadow-lg flex items-center justify-center transition-transform duration-300 overflow-hidden ${app.id === 'vscode' ? 'animate-macos-bounce shadow-[0_0_20px_rgba(59,130,246,0.3)]' : ''}`}
          >
            <img 
              src={app.path} 
              className="w-full h-full object-cover select-none pointer-events-none" 
              alt={app.label}
            />
          </div>

          {/* Running Indicator */}
          {(app.id === 'vscode' || (app.id === 'finder' && isFinderOpen)) && (
            <div className="absolute -bottom-2 w-[4px] h-[4px] rounded-full bg-white/90" />
          )}
        </div>
      ))}
    </div>
  );
}
