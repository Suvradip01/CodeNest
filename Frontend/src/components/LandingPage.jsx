import React, { useEffect, useState } from 'react'
import {
  ArrowRight,
  Bot,
  ChevronRight,
  Clock,
  Code2,
  FolderOpen,
  GitFork,
  Play,
  ShieldCheck,
  Terminal,
  UserRound,
} from 'lucide-react'

function useTyping(words, speed = 75, pause = 2000) {
  const [idx, setIdx] = useState(0)
  const [char, setChar] = useState(0)
  const [del, setDel] = useState(false)

  useEffect(() => {
    const word = words[idx]
    let timeoutId

    if (!del && char < word.length) timeoutId = setTimeout(() => setChar(c => c + 1), speed)
    else if (!del && char === word.length) timeoutId = setTimeout(() => setDel(true), pause)
    else if (del && char > 0) timeoutId = setTimeout(() => setChar(c => c - 1), speed / 2)
    else {
      timeoutId = setTimeout(() => {
        setDel(false)
        setIdx(current => (current + 1) % words.length)
      }, 50)
    }

    return () => clearTimeout(timeoutId)
  }, [char, del, idx, pause, speed, words])

  return words[idx].slice(0, char)
}

const CODE_LINES = [
  [{ t: 'kw', v: 'const ' }, { t: 'fn', v: 'analyze' }, { t: 'pl', v: ' = ' }, { t: 'kw', v: 'async ' }, { t: 'pl', v: '(code) => {' }],
  [{ t: 'cm', v: '  // Ask the engine for a deep architectural review' }],
  [{ t: 'pl', v: '  ' }, { t: 'kw', v: 'const ' }, { t: 'pl', v: 'review = ' }, { t: 'kw', v: 'await ' }, { t: 'fn', v: 'getReview' }, { t: 'pl', v: '(code)' }],
  [{ t: 'pl', v: '  ' }, { t: 'kw', v: 'return ' }, { t: 'pl', v: '{ rating, issues, refactor }' }],
  [{ t: 'pl', v: '}' }],
]

const CLR = {
  kw: 'text-indigo-400',
  fn: 'text-sky-300',
  cm: 'text-zinc-600 italic',
  pl: 'text-zinc-300',
}

const CARDS = [
  {
    title: 'Instant Execution',
    desc: 'Multi-runtime execution for JavaScript, Python, Java, and C with guarded limits.',
    grad: 'from-sky-500/[0.18] to-sky-600/[0.04]',
    border: 'border-sky-500/30',
    dot: 'bg-sky-400',
    iconClass: 'text-sky-400',
    glow: '0 0 40px rgba(14,165,233,0.18)',
    Icon: Play,
  },
  {
    title: 'AI Review',
    desc: 'Architecture, security, and performance analysis with reusable caching.',
    grad: 'from-purple-500/[0.18] to-purple-600/[0.04]',
    border: 'border-purple-500/30',
    dot: 'bg-purple-400',
    iconClass: 'text-purple-400',
    glow: '0 0 40px rgba(168,85,247,0.18)',
    Icon: Bot,
  },
  {
    title: 'Visual Flow',
    desc: 'Turn logic into flowcharts so review and debugging stay understandable.',
    grad: 'from-emerald-500/[0.18] to-emerald-600/[0.04]',
    border: 'border-emerald-500/30',
    dot: 'bg-emerald-400',
    iconClass: 'text-emerald-400',
    glow: '0 0 40px rgba(16,185,129,0.18)',
    Icon: GitFork,
  },
  {
    title: 'Version History',
    desc: 'Keep snapshots, compare diffs, and restore working states quickly.',
    grad: 'from-indigo-500/[0.18] to-indigo-600/[0.04]',
    border: 'border-indigo-500/30',
    dot: 'bg-indigo-400',
    iconClass: 'text-indigo-400',
    glow: '0 0 40px rgba(99,102,241,0.18)',
    Icon: Clock,
  },
  {
    title: 'AI Debug',
    desc: 'Convert runtime failures into focused explanations and candidate fixes.',
    grad: 'from-amber-500/[0.18] to-amber-600/[0.04]',
    border: 'border-amber-500/30',
    dot: 'bg-amber-400',
    iconClass: 'text-amber-400',
    glow: '0 0 40px rgba(245,158,11,0.18)',
    Icon: Terminal,
  },
  {
    title: 'Secure Projects',
    desc: 'Use account-backed workspaces with isolated project ownership when enabled.',
    grad: 'from-rose-500/[0.18] to-rose-600/[0.04]',
    border: 'border-rose-500/30',
    dot: 'bg-rose-400',
    iconClass: 'text-rose-400',
    glow: '0 0 40px rgba(244,63,94,0.18)',
    Icon: FolderOpen,
  },
]

const STAGGER = [-14, 0, -10, 6, -8, 2]
const FLOAT = [
  { dur: '5.2s', delay: '0.0s' },
  { dur: '6.6s', delay: '0.7s' },
  { dur: '4.9s', delay: '1.4s' },
  { dur: '5.8s', delay: '0.3s' },
  { dur: '6.2s', delay: '1.0s' },
  { dur: '5.5s', delay: '1.7s' },
]

const LANGS = ['JavaScript', 'Python', 'Java', 'C']

export default function LandingPage({
  onLaunch,
  onSignIn,
  onSignUp,
  session = null,
  isBooting = false,
}) {
  const typed = useTyping(['Write code.', 'Run instantly.', 'Review with AI.', 'Ship faster.'])
  const [exit, setExit] = useState(false)

  const launch = () => {
    setExit(true)
    setTimeout(onLaunch, 500)
  }

  return (
    <div
      className="min-h-screen bg-[#080808] text-white flex flex-col overflow-x-hidden overflow-y-auto"
      style={{
        transition: 'opacity 0.5s ease, transform 0.5s ease',
        opacity: exit ? 0 : 1,
        transform: exit ? 'scale(1.015)' : 'scale(1)',
      }}
    >
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute top-[-20rem] left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full"
          style={{
            background: 'radial-gradient(ellipse, rgba(99,102,241,0.13) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
      </div>

      <nav className="relative z-10 flex items-center justify-between px-8 py-5 border-b border-white/[0.05]">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30">
            <Code2 className="w-4 h-4 text-indigo-400" />
          </div>
          <span className="font-semibold text-[15px] tracking-tight">CodeNest</span>
        </div>

        <div className="flex items-center gap-3 sm:gap-5">
          {session?.user ? (
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-sm text-zinc-300">
              <UserRound className="w-4 h-4 text-indigo-400" />
              <span>{session.user.name || session.user.email}</span>
            </div>
          ) : (
            <>
              <button
                onClick={onSignIn}
                disabled={isBooting}
                className="hidden sm:flex items-center gap-1.5 text-sm text-zinc-500 hover:text-white transition-colors duration-200"
              >
                Sign In
              </button>
              <button
                onClick={onSignUp}
                disabled={isBooting}
                className="hidden sm:flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-sm text-zinc-200 hover:bg-white/[0.06] transition-colors duration-200"
              >
                Create Account
              </button>
            </>
          )}


        </div>
      </nav>

      <main className="relative z-10 flex-1 flex flex-col items-center text-center px-6 pt-20 pb-32">
        <div className="flex items-center gap-2.5 mb-8" style={{ animation: 'land-up 0.5s ease-out forwards' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" style={{ animationDuration: '2s' }} />
          <span className="text-[11px] font-semibold text-indigo-400 tracking-[0.18em] uppercase">
            AI-Powered Code Playground
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
        </div>

        <h1
          className="text-[clamp(2.8rem,8vw,6.5rem)] font-black leading-[0.9] tracking-tight mb-8 max-w-3xl"
          style={{ animation: 'land-up 0.5s ease-out 0.08s both' }}
        >
          <span className="text-white">Code without</span>
          <br />
          <span
            style={{
              background: 'linear-gradient(135deg,#a5b4fc 0%,#818cf8 50%,#6366f1 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            limits.
          </span>
        </h1>

        <p className="font-mono text-base text-zinc-500 mb-3 h-6" style={{ animation: 'land-up 0.5s ease-out 0.16s both' }}>
          <span className="text-zinc-600">&gt;&nbsp;</span>
          {typed}
          <span
            className="inline-block w-px h-[14px] bg-indigo-400/80 ml-0.5 align-middle"
            style={{ animation: 'cur-blink 1s step-end infinite' }}
          />
        </p>

        <p className="text-zinc-500 text-sm max-w-md leading-relaxed mb-12" style={{ animation: 'land-up 0.5s ease-out 0.22s both' }}>
          Write, run and get AI reviews for JavaScript, Python, Java and C from a polished browser IDE with zero local setup.
        </p>

        <div
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-xs font-semibold tracking-[0.12em] text-emerald-200 uppercase"
          style={{ animation: 'land-up 0.5s ease-out 0.26s both' }}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Secure sign-in required for workspace access
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 mb-20" style={{ animation: 'land-up 0.5s ease-out 0.3s both' }}>
          <button
            onClick={launch}
            disabled={isBooting}
            className="group relative flex items-center gap-2.5 px-8 py-4 bg-white text-black rounded-xl font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_20px_50px_rgba(255,255,255,0.15)] overflow-hidden disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/[0.05] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            <Code2 className="w-5 h-5 text-indigo-600" />
            <span>{isBooting ? 'Connecting...' : session?.user ? 'Open Workspace' : 'Create Account To Continue'}</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>

          <span className="flex items-center gap-2 text-xs text-zinc-600">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/70 animate-pulse" />
            Account-backed cloud isolation
          </span>
        </div>

        <div
          className="w-full max-w-2xl rounded-2xl border border-white/[0.07] bg-zinc-950/80 backdrop-blur overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.6)] mb-5"
          style={{ animation: 'land-up 0.6s ease-out 0.38s both' }}
        >
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.05] bg-white/[0.02]">
            <span className="w-3 h-3 rounded-full bg-zinc-800" />
            <span className="w-3 h-3 rounded-full bg-zinc-800" />
            <span className="w-3 h-3 rounded-full bg-zinc-800" />
            <span className="ml-4 text-[11px] text-zinc-600 font-mono">system_init.js - CodeNest</span>
          </div>
          <div className="p-5 font-mono text-[13px] leading-7 text-left space-y-0.5 select-none">
            {CODE_LINES.map((line, index) => (
              <div key={index}>
                {line.map((token, tokenIndex) => (
                  <span key={tokenIndex} className={CLR[token.t]}>
                    {token.v}
                  </span>
                ))}
              </div>
            ))}
            <div className="flex items-center">
              <span className="text-zinc-700">{'  // '}</span>
              <span className="inline-block w-2 h-4 bg-indigo-400/60 rounded-sm ml-0.5" style={{ animation: 'cur-blink 1s step-end infinite' }} />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 mb-2" style={{ animation: 'land-up 0.5s ease-out 0.44s both' }}>
          {LANGS.map(language => (
            <span
              key={language}
              className="px-3 py-1 rounded-full border border-white/[0.07] bg-white/[0.03] text-zinc-400 text-[11px] font-medium tracking-wide"
            >
              {language}
            </span>
          ))}
        </div>

        <p className="text-[11px] text-zinc-700 tracking-widest uppercase mb-20">
          4 languages - protected execution - AI review
        </p>

        <div className="w-full max-w-4xl" style={{ animation: 'land-up 0.6s ease-out 0.52s both' }}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-5" style={{ alignItems: 'start' }}>
            {CARDS.map((card, index) => {
              const float = FLOAT[index]

              return (
                <div key={card.title} style={{ transform: `translateY(${STAGGER[index]}px)` }}>
                  <div
                    className={`rounded-2xl border bg-gradient-to-br ${card.grad} ${card.border} backdrop-blur-md p-5 text-left flex flex-col gap-3 cursor-default`}
                    style={{
                      boxShadow: `0 8px 32px rgba(0,0,0,0.45), ${card.glow}`,
                      animation: `card-bob-${index} ${float.dur} ease-in-out ${float.delay} infinite`,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${card.dot}`} />
                      <card.Icon className={`w-4 h-4 flex-shrink-0 ${card.iconClass}`} />
                    </div>
                    <div>
                      <p className="text-white text-[13px] font-semibold leading-snug mb-1.5">{card.title}</p>
                      <p className="text-zinc-400/80 text-[11px] leading-relaxed">{card.desc}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </main>

      <footer className="relative z-10 border-t border-white/[0.04] py-5 text-center text-[11px] text-zinc-700 tracking-wide">
        CodeNest - 2026
      </footer>

      <style>{`
        @keyframes land-up {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes cur-blink {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0; }
        }
        @keyframes card-bob-0 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes card-bob-1 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-14px)} }
        @keyframes card-bob-2 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes card-bob-3 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes card-bob-4 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-9px)} }
        @keyframes card-bob-5 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-11px)} }
      `}</style>
    </div>
  )
}
