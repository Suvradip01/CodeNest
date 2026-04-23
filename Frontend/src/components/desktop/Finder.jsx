import React, { useState } from 'react';
import { X, Minus, Maximize2, FileText, Globe, Briefcase, Trash2, Play, Bot, GitFork, Terminal } from 'lucide-react';

export default function Finder({ isOpen, isMinimized, onClose, onMinimize }) {
  const [selectedFile, setSelectedFile] = useState(null);

  if (!isOpen) return null;

  const sidebarItems = [
    { id: 'work', label: 'Work', icon: Briefcase },
    { id: 'trash', label: 'Trash', icon: Trash2 },
  ];

  return (
    <div 
      className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[520px] bg-[#f6f6f6] dark:bg-[#1e1e1e] rounded-xl shadow-[0_40px_120px_rgba(0,0,0,0.6)] flex overflow-hidden border border-white/20 z-50 transition-all duration-300 ${isMinimized ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
    >
      {/* Sidebar */}
      <div className="w-[200px] bg-[#ececec]/80 dark:bg-[#262626]/80 backdrop-blur-xl border-r border-black/5 dark:border-white/5 flex flex-col pt-12 px-3 gap-1">
        <span className="text-[10px] font-bold text-black/40 dark:text-white/30 px-3 mb-2 uppercase tracking-wider">Favorites</span>
        {sidebarItems.map(item => (
          <div key={item.id} className="flex items-center gap-3 px-3 py-2 rounded-md transition-colors hover:bg-black/5 dark:hover:bg-white/5 cursor-default">
            <item.icon className="w-4 h-4 text-blue-500" />
            <span className="text-[14px] text-black/80 dark:text-white/80 font-medium">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-white dark:bg-[#1a1a1a] relative">
        {/* Header */}
        <div className="h-14 flex items-center px-4 justify-between border-b border-black/5 dark:border-white/5 bg-[#f6f6f6] dark:bg-[#1e1e1e]">
          <div className="flex gap-2.5 group px-2">
            <button onClick={onClose} className="w-3.5 h-3.5 rounded-full bg-[#ff5f56] border border-black/10 flex items-center justify-center group-hover:after:content-['×'] after:text-[9px] after:text-black/60" />
            <button onClick={onMinimize} className="w-3.5 h-3.5 rounded-full bg-[#ffbd2e] border border-black/10 flex items-center justify-center group-hover:after:content-['−'] after:text-[9px] after:text-black/60" />
            <button className="w-3.5 h-3.5 rounded-full bg-[#27c93f] border border-black/10 flex items-center justify-center group-hover:after:content-['+'] after:text-[9px] after:text-black/60" />
          </div>
          <div className="flex-1 text-center font-bold text-[14px] text-black/70 dark:text-white/70">
            {selectedFile ? 'Getting Started.pdf' : 'User Guide'}
          </div>
          <div className="w-16 flex justify-end">
            {selectedFile && (
              <button onClick={() => setSelectedFile(null)} className="text-[12px] text-blue-500 font-medium hover:underline">Back</button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {!selectedFile ? (
            <div className="p-8 grid grid-cols-4 gap-10 content-start h-full">
              <div onClick={() => setSelectedFile('guide')} className="flex flex-col items-center gap-2 group cursor-pointer">
                <FileText className="w-16 h-16 text-zinc-400 group-hover:text-zinc-300 transition-colors drop-shadow-sm" />
                <span className="text-[13px] text-black dark:text-white/80 font-medium">Getting Started.pdf</span>
              </div>
              <div className="flex flex-col items-center gap-2 group cursor-pointer opacity-60">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg">
                  <Globe className="w-10 h-10 text-white" />
                </div>
                <span className="text-[13px] text-black dark:text-white/80 font-medium">Welcome.url</span>
              </div>
            </div>
          ) : (
            <div className="p-10 max-w-2xl mx-auto space-y-8 bg-white dark:bg-[#1a1a1a] min-h-full">
              <div className="space-y-2 border-b border-black/10 dark:border-white/10 pb-6 text-center">
                <h1 className="text-3xl font-black text-black dark:text-white tracking-tight tracking-tight">Welcome to CodeNest</h1>
                <p className="text-zinc-500 font-medium italic">Professional AI-Augmented Development</p>
              </div>
              <div className="grid gap-8">
                <GuideFeature icon={Play} color="indigo" title="Instant Cloud Execution" desc="Run JavaScript, Python, Java, and C code instantly. Our secure backend handles the heavy lifting while you focus on logic." />
                <GuideFeature icon={Bot} color="purple" title="Grok AI Code Review" desc="Receive industry-standard feedback on your architecture, performance bottlenecks, and potential security vulnerabilities." />
                <GuideFeature icon={GitFork} color="emerald" title="Real-time Visual Flows" desc="Toggle the Flowchart view to see your code's logic visually. Perfect for understanding complex algorithms and branching." />
                <GuideFeature icon={Terminal} color="amber" title="Smart AI Debugging" desc="When code fails, Debug Mode explains the root cause in plain English and suggests the most efficient patch." />
              </div>
              <div className="pt-10 text-center border-t border-black/5 dark:border-white/5">
                <p className="text-[13px] text-zinc-400 font-medium">To begin your journey, click the <b>CodeNest</b> icon in the dock below.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function GuideFeature({ icon: Icon, color, title, desc }) {
  const colors = {
    indigo: 'bg-indigo-500/10 text-indigo-500',
    purple: 'bg-purple-500/10 text-purple-500',
    emerald: 'bg-emerald-500/10 text-emerald-500',
    amber: 'bg-amber-500/10 text-amber-500'
  };
  return (
    <div className="flex gap-5">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${colors[color]}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <h3 className="font-bold text-[16px] text-black dark:text-white">{title}</h3>
        <p className="text-[14px] text-zinc-500 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
