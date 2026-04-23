import React, { useEffect, useRef, useState } from 'react'
import Markdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import { Bot, GitFork, Loader2, ZoomIn, ZoomOut, Maximize2, Download, RefreshCw } from 'lucide-react'
import mermaid from 'mermaid'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import { toPng } from 'html-to-image'

// MermaidRenderer — renders a mermaid diagram string into SVG with Zoom/Pan
function MermaidRenderer({ diagram }) {
  const ref = useRef(null)
  const [error, setError] = useState(null)
  const [isDarkMode, setIsDarkMode] = useState(document.documentElement.classList.contains('dark'))
  const [isRendering, setIsRendering] = useState(false)

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains('dark'))
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!ref.current || !diagram) return
    setIsRendering(true)
    const id = `mermaid-svg-${Math.random().toString(36).substr(2, 9)}`
    
    mermaid.initialize({
      startOnLoad: false,
      theme: isDarkMode ? 'dark' : 'neutral',
      securityLevel: 'loose',
      fontFamily: 'Inter, sans-serif',
    })

    // Clear previous
    ref.current.innerHTML = ''

    mermaid.render(id, diagram)
      .then(({ svg }) => {
        setError(null)
        if (ref.current) {
          ref.current.innerHTML = svg
          // Ensure SVG has proper scaling attributes
          const svgEl = ref.current.querySelector('svg')
          if (svgEl) {
            svgEl.style.maxWidth = 'none'
            svgEl.style.height = 'auto'
          }
        }
      })
      .catch(err => {
        console.error('Mermaid render error:', err)
        setError('Diagram syntax error. Please try adjusting your code.')
      })
      .finally(() => setIsRendering(false))
  }, [diagram, isDarkMode])

  const handleDownload = async () => {
    const svgEl = ref.current?.querySelector('svg')
    if (!svgEl) return
    try {
      const dataUrl = await toPng(svgEl, { 
        backgroundColor: isDarkMode ? '#09090b' : '#ffffff',
        pixelRatio: 3, // High resolution
        style: { transform: 'none', padding: '20px' }
      })
      const link = document.createElement('a')
      link.download = `code-flow-${Date.now()}.png`
      link.href = dataUrl
      link.click()
    } catch (err) {
      console.error('Download failed:', err)
      alert('Failed to generate PNG. Try again or check console.')
    }
  }

  if (error) return (
    <div className="flex items-center justify-center h-full p-6 text-center">
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
        <p className="text-xs text-red-400 font-medium">{error}</p>
      </div>
    </div>
  )

  return (
    <div className="relative w-full h-full flex flex-col group/render bg-zinc-950/20">
      {isRendering && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-background/20 backdrop-blur-[2px]">
          <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
        </div>
      )}

      <TransformWrapper
        initialScale={1}
        centerOnInit={true}
        minScale={0.1}
        maxScale={5}
        doubleClick={{ disabled: false }}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            {/* Toolbar */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 p-1.5 bg-background/80 backdrop-blur-xl border border-border rounded-2xl shadow-2xl opacity-0 group-hover/render:opacity-100 transition-all duration-300 transform translate-y-2 group-hover/render:translate-y-0">
              <div className="flex items-center gap-1 px-1 border-r border-border mr-1">
                <button onClick={() => zoomIn()} className="p-2 hover:bg-muted rounded-xl text-muted-foreground hover:text-foreground transition-colors" title="Zoom In"><ZoomIn className="w-4 h-4" /></button>
                <button onClick={() => zoomOut()} className="p-2 hover:bg-muted rounded-xl text-muted-foreground hover:text-foreground transition-colors" title="Zoom Out"><ZoomOut className="w-4 h-4" /></button>
                <button onClick={() => resetTransform()} className="p-2 hover:bg-muted rounded-xl text-muted-foreground hover:text-foreground transition-colors" title="Reset View"><RefreshCw className="w-4 h-4" /></button>
              </div>
              <button 
                onClick={handleDownload} 
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[11px] font-bold shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                Download PNG
              </button>
            </div>
            
            <div className="flex-1 w-full h-full cursor-grab active:cursor-grabbing overflow-hidden">
              <TransformComponent
                wrapperStyle={{ width: '100%', height: '100%' }}
                contentStyle={{ 
                  width: '100%', 
                  height: '100%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  minWidth: '1000px',
                  minHeight: '800px'
                }}
              >
                <div
                  ref={ref}
                  className="p-10 [&_svg]:drop-shadow-2xl"
                />
              </TransformComponent>
            </div>
          </>
        )}
      </TransformWrapper>
    </div>
  )
}


export default function ReviewPanel({ review, mermaidDiagram, isVisualizing }) {
  const [activeTab, setActiveTab] = useState('review')

  // Switch to visual tab when diagram arrives
  useEffect(() => {
    if (mermaidDiagram) {
      setTimeout(() => setActiveTab('visual'), 0)
    }
  }, [mermaidDiagram])

  return (
    <div className="bg-white/60 dark:bg-zinc-900/50 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl overflow-hidden flex flex-col h-full min-h-0 shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] transition-all hover:shadow-[0_12px_40px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)] group relative">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/30 backdrop-blur-md z-10 shrink-0">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('review')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'review'
                ? 'bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-500/25'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            AI Review
          </button>
          <button
            onClick={() => setActiveTab('visual')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'visual'
                ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border border-indigo-500/25'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <GitFork className="w-3.5 h-3.5" />
            Visual Flow
            {isVisualizing && <Loader2 className="w-3 h-3 animate-spin ml-1" />}
          </button>
        </div>

        {review && activeTab === 'review' && (
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-purple-500/10 border border-purple-500/20 animate-pulse">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            <span className="text-[9px] font-bold text-purple-600 dark:text-purple-300 uppercase">Live Analysis</span>
          </div>
        )}
      </div>

      {/* ── AI Review Tab Content ── */}
      {activeTab === 'review' && (
        <div className="p-6 card-scroll-container custom-scrollbar">
          {review ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
              <div className="prose prose-sm max-w-none
                prose-p:text-muted-foreground prose-p:leading-relaxed
                prose-headings:text-foreground
                prose-strong:text-purple-600 dark:prose-strong:text-purple-400
                prose-code:text-purple-600 dark:prose-code:text-purple-300 prose-code:bg-purple-100 dark:prose-code:bg-purple-500/10 prose-code:px-1.5 prose-code:rounded
                prose-pre:bg-muted dark:prose-pre:bg-black/40 prose-pre:border prose-pre:border-border">
                <Markdown rehypePlugins={[rehypeHighlight]}>{review}</Markdown>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center h-full min-h-[300px]">
              <div className="relative mb-8">
                <div className="absolute -inset-10 bg-purple-500/5 dark:bg-purple-600/10 rounded-full blur-3xl animate-pulse" />
                <div className="relative animate-[float_3s_ease-in-out_infinite]">
                  <style>{`
                    @keyframes float {
                      0%, 100% { transform: translateY(0px); }
                      50% { transform: translateY(-20px); }
                    }
                  `}</style>
                  <div className="p-7 rounded-[2.5rem] bg-gradient-to-b from-white/50 to-white/10 dark:from-white/[0.05] dark:to-transparent border border-black/5 dark:border-white/10 shadow-xl dark:shadow-2xl backdrop-blur-sm transition-transform duration-700 hover:scale-110">
                    <Bot className="w-12 h-12 text-purple-600 dark:text-purple-400/80 drop-shadow-sm dark:drop-shadow-[0_0_15px_rgba(168,85,247,0.4)]" />
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-center gap-3">
                <p className="text-[11px] font-medium tracking-[0.3em] text-muted-foreground uppercase animate-pulse text-center">
                  Ready to analyze your code logic
                </p>
                <div className="flex gap-1.5 opacity-60">
                  <div className="w-1 h-1 rounded-full bg-purple-400 animate-pulse" />
                  <div className="w-1 h-1 rounded-full bg-purple-400 animate-pulse [animation-delay:200ms]" />
                  <div className="w-1 h-1 rounded-full bg-purple-400 animate-pulse [animation-delay:400ms]" />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Visual Flow Tab Content ── */}
      {activeTab === 'visual' && (
        <div className="flex-1 overflow-hidden relative min-h-0 bg-background/20">
          {isVisualizing && !mermaidDiagram ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-indigo-500/20 animate-ping" />
                <GitFork className="w-10 h-10 text-indigo-400 relative" />
              </div>
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-3 rounded-full bg-indigo-500/10 animate-pulse" style={{ width: `${120 + i * 30}px` }} />
                ))}
              </div>
              <p className="text-xs text-muted-foreground animate-pulse">Generating flow diagram...</p>
            </div>
          ) : mermaidDiagram ? (
            <MermaidRenderer diagram={mermaidDiagram} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-4 px-6 text-center">
              <div className="p-6 rounded-2xl bg-indigo-500/5 border border-indigo-500/10">
                <GitFork className="w-10 h-10 text-indigo-400/40 mx-auto mb-3" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Click <span className="text-indigo-400 font-semibold">Visualize</span> in the toolbar<br />to generate a flow diagram of your code.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}