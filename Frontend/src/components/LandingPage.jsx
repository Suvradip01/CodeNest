import React, { useEffect, useState } from 'react'
import { Code2, Play, Sparkles, Globe, Shield, ArrowRight, Terminal, Bot, ChevronRight, GitFork, Clock, FolderOpen } from 'lucide-react'

/* ─── Typing hook ─────────────────────────────────────────── */
function useTyping(words, speed = 75, pause = 2000) {
  const [idx, setIdx] = useState(0)
  const [char, setChar] = useState(0)
  const [del, setDel] = useState(false)
  useEffect(() => {
    const word = words[idx]
    let t
    if (!del && char < word.length)        t = setTimeout(() => setChar(c => c + 1), speed)
    else if (!del && char === word.length)  t = setTimeout(() => setDel(true), pause)
    else if (del && char > 0)              t = setTimeout(() => setChar(c => c - 1), speed / 2)
    else { t = setTimeout(() => { setDel(false); setIdx(i => (i + 1) % words.length) }, 50) }
    return () => clearTimeout(t)
  }, [char, del, idx, words, speed, pause])
  return words[idx].slice(0, char)
}

/* ─── Code preview ────────────────────────────────────────── */
/* ─── Code preview ────────────────────────────────────────── */
const CODE_LINES = [
  [{ t: 'kw', v: 'const ' }, { t: 'fn', v: 'analyze' }, { t: 'pl', v: ' = ' }, { t: 'kw', v: 'async ' }, { t: 'pl', v: '(code) => {' }],
  [{ t: 'cm', v: '  // Ask Grok for a deep architectural review' }],
  [{ t: 'pl', v: '  ' }, { t: 'kw', v: 'const ' }, { t: 'pl', v: 'review = ' }, { t: 'kw', v: 'await ' }, { t: 'fn', v: 'getReview' }, { t: 'pl', v: '(code)' }],
  [{ t: 'pl', v: '  ' }, { t: 'kw', v: 'return ' }, { t: 'pl', v: '{ rating, issues, refactor }' }],
  [{ t: 'pl', v: '}' }],
]
const CLR = { kw: 'text-indigo-400', fn: 'text-sky-300', cm: 'text-zinc-600 italic', pl: 'text-zinc-300' }

/* ─── Feature cards ───────────────────────────────────────── */
const CARDS = [
  { title: 'Instant Execution',     desc: 'Sandboxed cloud runner with local Node.js fallback for 4 languages.',
    grad: 'from-sky-500/[0.18] to-sky-600/[0.04]', border: 'border-sky-500/30', dot: 'bg-sky-400',    iconClass: 'text-sky-400',    glow: '0 0 40px rgba(14,165,233,0.18)',   Icon: Play     },
  { title: 'Grok AI Review',         desc: 'Deep architecture, security & Big-O analysis powered by Grok AI.',
    grad: 'from-purple-500/[0.18] to-purple-600/[0.04]', border: 'border-purple-500/30', dot: 'bg-purple-400', iconClass: 'text-purple-400', glow: '0 0 40px rgba(168,85,247,0.18)',  Icon: Bot      },
  { title: 'Visual Flow Diagram',    desc: 'Realtime flowchart diagrams for better logic understanding.',
    grad: 'from-emerald-500/[0.18] to-emerald-600/[0.04]', border: 'border-emerald-500/30', dot: 'bg-emerald-400', iconClass: 'text-emerald-400', glow: '0 0 40px rgba(16,185,129,0.18)', Icon: GitFork },
  { title: 'Smart Versioning',       desc: 'Time-travel through code snapshots with AI-powered diff explanations.',
    grad: 'from-indigo-500/[0.18] to-indigo-600/[0.04]', border: 'border-indigo-500/30', dot: 'bg-indigo-400', iconClass: 'text-indigo-400', glow: '0 0 40px rgba(99,102,241,0.18)', Icon: Clock },
  { title: 'AI Debug Mode',          desc: 'Caught an error? Grok instantly explains and fixes it for you.',
    grad: 'from-amber-500/[0.18] to-amber-600/[0.04]', border: 'border-amber-500/30', dot: 'bg-amber-400', iconClass: 'text-amber-400', glow: '0 0 40px rgba(245,158,11,0.18)',   Icon: Terminal },
  { title: 'Cloud Project System',   desc: 'Multi-file file management synced to MongoDB Atlas for persistence.',
    grad: 'from-rose-500/[0.18] to-rose-600/[0.04]', border: 'border-rose-500/30', dot: 'bg-rose-400',  iconClass: 'text-rose-400',   glow: '0 0 40px rgba(244,63,94,0.18)',    Icon: FolderOpen },
]

// Static Y offset for visual stagger — applied via a wrapper so it composes with the float animation
const STAGGER = [-14, 0, -10, 6, -8, 2]

// Float params — each card has its own rhythm
const FLOAT = [
  { dur: '5.2s', delay: '0.0s', amp: '-10px' },
  { dur: '6.6s', delay: '0.7s', amp: '-14px' },
  { dur: '4.9s', delay: '1.4s', amp: '-8px'  },
  { dur: '5.8s', delay: '0.3s', amp: '-12px' },
  { dur: '6.2s', delay: '1.0s', amp: '-9px'  },
  { dur: '5.5s', delay: '1.7s', amp: '-11px' },
]

const LANGS = ['JavaScript', 'Python', 'Java', 'C']

export default function LandingPage({ onLaunch }) {
  const typed = useTyping(['Write code.', 'Run instantly.', 'Review with AI.', 'Ship faster.'])
  const [exit, setExit] = useState(false)
  const launch = () => { setExit(true); setTimeout(onLaunch, 500) }

  return (
    <div
      className="min-h-screen bg-[#080808] text-white flex flex-col overflow-x-hidden overflow-y-auto"
      style={{ transition: 'opacity 0.5s ease, transform 0.5s ease', opacity: exit ? 0 : 1, transform: exit ? 'scale(1.015)' : 'scale(1)' }}
    >
      {/* ── Ambient orb (single, restrained) ────────────────── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-[-20rem] left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(ellipse, rgba(99,102,241,0.13) 0%, transparent 70%)', filter: 'blur(40px)' }} />
      </div>

      {/* ── Nav ─────────────────────────────────────────────── */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-5 border-b border-white/[0.05]">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30">
            <Code2 className="w-4 h-4 text-indigo-400" />
          </div>
          <span className="font-semibold text-[15px] tracking-tight">CodeNest</span>
        </div>
        <div className="flex items-center gap-6">

          <button onClick={launch} className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors duration-200">
            Open editor <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────── */}
      <main className="relative z-10 flex-1 flex flex-col items-center text-center px-6 pt-20 pb-32">

        {/* Eyebrow — dots ● text ● */}
        <div className="flex items-center gap-2.5 mb-8" style={{ animation: 'land-up 0.5s ease-out forwards' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" style={{ animationDuration: '2s' }} />
          <span className="text-[11px] font-semibold text-indigo-400 tracking-[0.18em] uppercase">AI-Powered Code Playground</span>
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
        </div>

        {/* Headline */}
        <h1 className="text-[clamp(2.8rem,8vw,6.5rem)] font-black leading-[0.9] tracking-tight mb-8 max-w-3xl"
          style={{ animation: 'land-up 0.5s ease-out 0.08s both' }}>
          <span className="text-white">Code without</span><br />
          <span style={{ background: 'linear-gradient(135deg,#a5b4fc 0%,#818cf8 50%,#6366f1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            limits.
          </span>
        </h1>

        {/* Typing */}
        <p className="font-mono text-base text-zinc-500 mb-3 h-6" style={{ animation: 'land-up 0.5s ease-out 0.16s both' }}>
          <span className="text-zinc-600">&gt;&nbsp;</span>{typed}
          <span className="inline-block w-px h-[14px] bg-indigo-400/80 ml-0.5 align-middle" style={{ animation: 'cur-blink 1s step-end infinite' }} />
        </p>

        <p className="text-zinc-500 text-sm max-w-md leading-relaxed mb-12" style={{ animation: 'land-up 0.5s ease-out 0.22s both' }}>
          Write, run and get AI reviews for JavaScript, Python, Java & C — all from your browser with zero setup.
        </p>

        {/* ── CTA ─── white on black, clean ───────────────── */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-20" style={{ animation: 'land-up 0.5s ease-out 0.3s both' }}>
          <button
            onClick={launch}
            className="group flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-white text-black text-sm font-bold hover:bg-zinc-100 active:scale-[0.98] transition-all duration-200 shadow-[0_1px_3px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.1)] hover:shadow-[0_4px_24px_rgba(255,255,255,0.12)]"
          >
            <Terminal className="w-4 h-4 text-indigo-600" />
            Launch Editor
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </button>
          <span className="flex items-center gap-2 text-xs text-zinc-600">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/70 animate-pulse" />
            No account · Runs in your browser
          </span>
        </div>

        {/* ── Code preview window ──────────────────────────── */}
        <div className="w-full max-w-2xl rounded-2xl border border-white/[0.07] bg-zinc-950/80 backdrop-blur overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.6)] mb-5"
          style={{ animation: 'land-up 0.6s ease-out 0.38s both' }}>
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.05] bg-white/[0.02]">
            <span className="w-3 h-3 rounded-full bg-zinc-800" />
            <span className="w-3 h-3 rounded-full bg-zinc-800" />
            <span className="w-3 h-3 rounded-full bg-zinc-800" />
            <span className="ml-4 text-[11px] text-zinc-600 font-mono">main.js — CodeNest</span>
          </div>
          <div className="p-5 font-mono text-[13px] leading-7 text-left space-y-0.5 select-none">
            {CODE_LINES.map((line, i) => (
              <div key={i}>
                {line.map((tok, j) => <span key={j} className={CLR[tok.t]}>{tok.v}</span>)}
              </div>
            ))}
            <div className="flex items-center">
              <span className="text-zinc-700">{'  // '}</span>
              <span className="inline-block w-2 h-4 bg-indigo-400/60 rounded-sm ml-0.5" style={{ animation: 'cur-blink 1s step-end infinite' }} />
            </div>
          </div>
        </div>

        {/* Language pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-2" style={{ animation: 'land-up 0.5s ease-out 0.44s both' }}>
          {LANGS.map(l => (
            <span key={l} className="px-3 py-1 rounded-full border border-white/[0.07] bg-white/[0.03] text-zinc-400 text-[11px] font-medium tracking-wide">{l}</span>
          ))}
        </div>
        <p className="text-[11px] text-zinc-700 tracking-widest uppercase mb-20">
          4 languages · cloud execution · AI review
        </p>

        {/* ── Floating feature cards ────────────────────────── */}
        <div className="w-full max-w-4xl" style={{ animation: 'land-up 0.6s ease-out 0.52s both' }}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-5" style={{ alignItems: 'start' }}>
            {CARDS.map((c, i) => {
              const f = FLOAT[i]
              return (
                /* Outer wrapper applies static stagger — does NOT animate, so the inner animation is relative to this offset */
                <div key={c.title} style={{ transform: `translateY(${STAGGER[i]}px)` }}>
                  <div
                    className={`rounded-2xl border bg-gradient-to-br ${c.grad} ${c.border} backdrop-blur-md p-5 text-left flex flex-col gap-3 cursor-default`}
                    style={{
                      boxShadow: `0 8px 32px rgba(0,0,0,0.45), ${c.glow}`,
                      animation: `card-bob-${i} ${f.dur} ease-in-out ${f.delay} infinite`,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${c.dot}`} />
                      <c.Icon className={`w-4 h-4 flex-shrink-0 ${c.iconClass}`} />
                    </div>
                    <div>
                      <p className="text-white text-[13px] font-semibold leading-snug mb-1.5">{c.title}</p>
                      <p className="text-zinc-400/80 text-[11px] leading-relaxed">{c.desc}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </main>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-white/[0.04] py-5 text-center text-[11px] text-zinc-700 tracking-wide">
        CodeNest · © 2026
      </footer>

      {/* ── Keyframes ──────────────────────────────────────── */}
      <style>{`
        @keyframes land-up {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes cur-blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
        /* Each card gets its own keyframe so amplitudes differ */
        @keyframes card-bob-0 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes card-bob-1 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-14px)} }
        @keyframes card-bob-2 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)}  }
        @keyframes card-bob-3 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes card-bob-4 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-9px)}  }
        @keyframes card-bob-5 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-11px)} }
      `}</style>
    </div>
  )
}
