import React, { useState, useRef } from 'react';

export default function DesktopIcon({ label, iconPath, onOpen }) {
  const [pos, setPos] = useState({ x: 50, y: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const handlePointerDown = (e) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    dragOffset.current = {
      x: e.clientX - pos.x,
      y: e.clientY - pos.y
    };
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    setPos({
      x: e.clientX - dragOffset.current.x,
      y: e.clientY - dragOffset.current.y
    });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  return (
    <div 
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onDoubleClick={onOpen}
      style={{ left: pos.x, top: pos.y }}
      className={`absolute flex flex-col items-center gap-1 text-center cursor-pointer active:cursor-grabbing z-40 group touch-none transition-shadow ${isDragging ? 'drop-shadow-2xl scale-105' : ''}`}
    >
      <div className="w-20 h-20 bg-transparent rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 active:scale-95 pointer-events-none">
        <img src={iconPath} className="w-20 h-20 drop-shadow-lg" alt={label} />
      </div>
      <span className="text-[12px] text-white font-medium drop-shadow-2xl px-2 py-0.5 rounded group-hover:bg-blue-600/60 transition-colors pointer-events-none">
        {label}
      </span>
    </div>
  );
}
