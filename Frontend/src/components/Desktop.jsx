import React, { useState, useEffect, useRef } from 'react'
import {
  Code2, Terminal, Globe, Search, Wifi, Battery, Folder, Settings,
  MessageSquare, Music, LayoutGrid, Monitor, X, Minus, Maximize2,
  FileText, User, Trash2, Briefcase, Play, Bot, GitFork
} from 'lucide-react'

export default function Desktop({ onLaunchEditor }) {
  const [time, setTime] = useState(new Date())
  const [hoveredIndex, setHoveredIndex] = useState(null)
  const [dockScale, setDockScale] = useState(Array(7).fill(1))

  // Window & Folder States
  const [isFinderOpen, setIsFinderOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)

  // Draggable Folder Logic (Pointer Capture Fix)
  const [folderPos, setFolderPos] = useState({ x: 50, y: 80 })
  const [isDragging, setIsDragging] = useState(false)
  const dragOffset = useRef({ x: 0, y: 0 })

  // Finder Content State
  const [selectedFile, setSelectedFile] = useState(null)

  const handlePointerDown = (e) => {
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    setIsDragging(true)
    dragOffset.current = {
      x: e.clientX - folderPos.x,
      y: e.clientY - folderPos.y
    }
  }

  const handlePointerMove = (e) => {
    if (!isDragging) return
    setFolderPos({
      x: e.clientX - dragOffset.current.x,
      y: e.clientY - dragOffset.current.y
    })
  }

  const handlePointerUp = (e) => {
    setIsDragging(false)
  }

  // Proximity Magnification Logic
  const handleDockHover = (index) => {
    if (index === null) {
      setDockScale(Array(7).fill(1))
      setHoveredIndex(null)
      return
    }
    setHoveredIndex(index)
    const newScales = Array(7).fill(1).map((_, i) => {
      const distance = Math.abs(i - index)
      if (distance === 0) return 1.5
      if (distance === 1) return 1.25
      return 1
    })
    setDockScale(newScales)
  }

  const formatTime = (date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const formatDate = (date) => date.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })

  const apps = [
    { id: 'finder', label: 'Finder', path: '/icons/finder.png' },
    { id: 'vscode', label: 'CodeNest', path: '/icons/vscode.svg', primary: true },
    { id: 'terminal', label: 'Terminal', path: '/icons/terminal.png' },
    { id: 'safari', label: 'Safari', path: '/icons/safari.svg' },
    { id: 'photos', label: 'Photos', path: '/icons/photos.svg' },
    { id: 'music', label: 'Music', path: '/icons/music.svg' },
    { id: 'settings', label: 'Settings', path: '/icons/settings.svg' },
  ]

  const sidebarItems = [
    { id: 'work', label: 'Work', icon: Briefcase },
    { id: 'trash', label: 'Trash', icon: Trash2 },
  ]

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#000] font-sans select-none animate-in fade-in duration-700">
      <style>{`
        @keyframes macos-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        .animate-macos-bounce {
          animation: macos-bounce 0.8s ease-in-out infinite;
        }
      `}</style>

      {/* ── Authentic macOS Wallpaper ── */}
      <div className="absolute inset-0">
        <img src="/icons/bg1.jpg" className="w-full h-full object-cover select-none pointer-events-none" alt="wallpaper" />
        <div className="absolute inset-0 bg-black/10" />
      </div>

      {/* ── macOS Menu Bar ── */}
      <div className="absolute top-0 left-0 right-0 h-7 bg-black/20 backdrop-blur-3xl flex items-center justify-between px-5 text-[12px] text-white/90 z-[100] border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 hover:bg-white/10 px-2 py-0.5 rounded transition-colors cursor-default font-bold">
            <Monitor className="w-3 h-3" />
            <span>CodeNest</span>
          </div>
          <span className="opacity-80 hover:opacity-100 transition-opacity cursor-default">File</span>
          <span className="opacity-80 hover:opacity-100 transition-opacity cursor-default">Edit</span>
          <span className="opacity-80 hover:opacity-100 transition-opacity cursor-default">View</span>
        </div>
        <div className="flex items-center gap-4">
          <Wifi className="w-3.5 h-3.5" />
          <Battery className="w-3.5 h-3.5" />
          <Search className="w-3.5 h-3.5" />
          <div className="flex items-center gap-2 tabular-nums opacity-90">
            <span>{formatDate(time)}</span>
            <span>{formatTime(time)}</span>
          </div>
        </div>
      </div>

      {/* ── Draggable Desktop Icon (Pointer Capture) ── */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onDoubleClick={() => { setIsFinderOpen(true); setIsMinimized(false) }}
        style={{ left: folderPos.x, top: folderPos.y }}
        className={`absolute flex flex-col items-center gap-1 text-center cursor-pointer active:cursor-grabbing z-40 group touch-none transition-shadow ${isDragging ? 'drop-shadow-2xl scale-105' : ''}`}
      >
        <div
          className="w-20 h-20 bg-transparent rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 active:scale-95 pointer-events-none"
        >
          <img src="/icons/folder.svg" className="w-20 h-20 drop-shadow-lg" alt="folder" />
        </div>
        <span className="text-[12px] text-white font-medium drop-shadow-2xl px-2 py-0.5 rounded group-hover:bg-blue-600/60 transition-colors pointer-events-none">User Guide</span>
      </div>

      {/* ── Interactive Finder Window ── */}
      {isFinderOpen && (
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[520px] bg-[#f6f6f6] dark:bg-[#1e1e1e] rounded-xl shadow-[0_40px_120px_rgba(0,0,0,0.6)] flex overflow-hidden border border-white/20 z-50 transition-all duration-300 ${isMinimized ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
        >
          {/* Sidebar */}
          <div className="w-[200px] bg-[#ececec]/80 dark:bg-[#262626]/80 backdrop-blur-xl border-r border-black/5 dark:border-white/5 flex flex-col pt-12 px-3 gap-1">
            <span className="text-[10px] font-bold text-black/40 dark:text-white/30 px-3 mb-2 uppercase tracking-wider">Favorites</span>
            {sidebarItems.map(item => (
              <div key={item.id} className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${item.id === 'work' ? 'bg-black/5 dark:bg-white/10' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}>
                <item.icon className="w-4 h-4 text-blue-500" />
                <span className="text-[14px] text-black/80 dark:text-white/80 font-medium">{item.label}</span>
              </div>
            ))}
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col bg-white dark:bg-[#1a1a1a] relative z-0">
            {/* Header / Toolbar */}
            <div className="h-14 flex items-center px-4 justify-between border-b border-black/5 dark:border-white/5 bg-[#f6f6f6] dark:bg-[#1e1e1e] relative z-20">
              <div className="flex gap-2.5 group px-2">
                <button onClick={() => { setIsFinderOpen(false); setSelectedFile(null); }} className="w-3.5 h-3.5 rounded-full bg-[#ff5f56] border border-black/10 flex items-center justify-center group-hover:after:content-['×'] after:text-[9px] after:text-black/60" />
                <button onClick={() => setIsMinimized(true)} className="w-3.5 h-3.5 rounded-full bg-[#ffbd2e] border border-black/10 flex items-center justify-center group-hover:after:content-['−'] after:text-[9px] after:text-black/60" />
                <button className="w-3.5 h-3.5 rounded-full bg-[#27c93f] border border-black/10 flex items-center justify-center group-hover:after:content-['+'] after:text-[9px] after:text-black/60" />
              </div>
              <div className="flex-1 text-center font-bold text-[14px] text-black/70 dark:text-white/70">
                {selectedFile ? 'Getting Started.pdf' : 'User Guide'}
              </div>
              <div className="w-16">
                {selectedFile && (
                  <button onClick={() => setSelectedFile(null)} className="text-[12px] text-blue-500 font-medium hover:underline">Back</button>
                )}
              </div>
            </div>

            {/* Content Icons / PDF View */}
            <div className="flex-1 overflow-y-auto bg-white dark:bg-[#1a1a1a] relative z-10">
              {!selectedFile ? (
                <div className="p-8 grid grid-cols-4 gap-10 content-start h-full">
                  <div
                    onClick={() => setSelectedFile('guide')}
                    className="flex flex-col items-center gap-2 group cursor-pointer"
                  >
                    <FileText className="w-16 h-16 text-zinc-400 group-hover:text-zinc-300 transition-colors drop-shadow-sm" />
                    <span className="text-[13px] text-black dark:text-white/80 font-medium">Getting Started.pdf</span>
                  </div>
                  <div className="flex flex-col items-center gap-2 group cursor-pointer">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg">
                      <Globe className="w-10 h-10 text-white" />
                    </div>
                    <span className="text-[13px] text-black dark:text-white/80 font-medium">Welcome.url</span>
                  </div>
                </div>
              ) : (
                <div className="p-10 max-w-2xl mx-auto space-y-8 bg-white dark:bg-[#1a1a1a] min-h-full">
                  <div className="space-y-2 border-b border-black/10 dark:border-white/10 pb-6 text-center">
                    <h1 className="text-3xl font-black text-black dark:text-white tracking-tight">Welcome to CodeNest</h1>
                    <p className="text-zinc-500 font-medium italic">Professional AI-Augmented Development</p>
                  </div>

                  <div className="grid gap-8">
                    <div className="flex gap-5">
                      <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center flex-shrink-0"><Play className="w-6 h-6 text-indigo-500" /></div>
                      <div>
                        <h3 className="font-bold text-[16px] text-black dark:text-white">Instant Cloud Execution</h3>
                        <p className="text-[14px] text-zinc-500 leading-relaxed">Run JavaScript, Python, Java, and C code instantly. Our secure backend handles the heavy lifting while you focus on logic.</p>
                      </div>
                    </div>

                    <div className="flex gap-5">
                      <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center flex-shrink-0"><Bot className="w-6 h-6 text-purple-500" /></div>
                      <div>
                        <h3 className="font-bold text-[16px] text-black dark:text-white">Grok AI Code Review</h3>
                        <p className="text-[14px] text-zinc-500 leading-relaxed">Receive industry-standard feedback on your architecture, performance bottlenecks, and potential security vulnerabilities.</p>
                      </div>
                    </div>

                    <div className="flex gap-5">
                      <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0"><GitFork className="w-6 h-6 text-emerald-500" /></div>
                      <div>
                        <h3 className="font-bold text-[16px] text-black dark:text-white">Real-time Visual Flows</h3>
                        <p className="text-[14px] text-zinc-500 leading-relaxed">Toggle the Flowchart view to see your code's logic visually. Perfect for understanding complex algorithms and branching.</p>
                      </div>
                    </div>

                    <div className="flex gap-5">
                      <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0"><Terminal className="w-6 h-6 text-amber-500" /></div>
                      <div>
                        <h3 className="font-bold text-[16px] text-black dark:text-white">Smart AI Debugging</h3>
                        <p className="text-[14px] text-zinc-500 leading-relaxed">When code fails, Debug Mode explains the root cause in plain English and suggests the most efficient patch.</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-10 text-center border-t border-black/5 dark:border-white/5">
                    <p className="text-[13px] text-zinc-400 font-medium">To begin your journey, click the <b>CodeNest</b> icon in the dock below.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── The Pro Dock ── */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-end gap-2 px-3 py-2.5 rounded-[28px] bg-black/20 backdrop-blur-3xl border border-white/10 z-[110] h-[88px]">
        {apps.map((app, i) => (
          <div
            key={app.id}
            className="relative flex flex-col items-center group transition-all duration-300 ease-out"
            onMouseEnter={() => handleDockHover(i)}
            onMouseLeave={() => handleDockHover(null)}
            onClick={() => {
              if (app.id === 'vscode') onLaunchEditor();
              if (app.id === 'finder') { setIsFinderOpen(true); setIsMinimized(false); }
            }}
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
    </div>
  )
}
