import React, { useState, useEffect } from 'react'
import { ArrowRight, LockKeyhole, Mail, User2, X, Sparkles } from 'lucide-react'

const INITIAL_FORM = {
  name: '',
  email: '',
  password: '',
}

const EMAIL_REGEX = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+$/i

export default function AuthDialog({
  open,
  mode = 'login',
  authRequired = true,
  isSubmitting = false,
  error = '',
  onClose,
  onSubmit,
  onModeChange,
}) {
  const [form, setForm] = useState(INITIAL_FORM)
  const [localError, setLocalError] = useState('')
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (open) {
      setTimeout(() => setIsVisible(true), 10)
    } else {
      setIsVisible(false)
    }
  }, [open])

  if (!open) return null

  const isRegister = mode === 'register'

  const handleChange = (field) => (event) => {
    setForm(prev => ({ ...prev, [field]: event.target.value }))
    setLocalError('')
  }

  const validateForm = () => {
    const email = form.email.trim().toLowerCase()
    const password = form.password
    const name = form.name.trim()

    if (isRegister && !name) return 'Name is required'
    if (!email || !EMAIL_REGEX.test(email)) return 'Enter a valid email address'
    if (password.length < 8) return 'Password must be at least 8 characters long'
    return ''
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const validationError = validateForm()
    if (validationError) {
      setLocalError(validationError)
      return
    }

    onSubmit?.({
      mode,
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
    })
  }

  const displayError = localError || error

  return (
    <div className={`fixed inset-0 z-[150] flex items-center justify-center p-4 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <style>{`
        @keyframes auth-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes auth-enter {
          from { transform: scale(0.95) translateY(20px); opacity: 0; }
          to { transform: scale(1) translateY(0); opacity: 1; }
        }
        .auth-card {
          animation: auth-enter 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .field-transition {
          display: grid;
          grid-template-rows: 0fr;
          opacity: 0;
          transition: grid-template-rows 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease-out;
        }
        .field-transition.open {
          grid-template-rows: 1fr;
          opacity: 1;
          margin-bottom: 1rem;
        }
      `}</style>

      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-xl" 
        onClick={!authRequired ? onClose : undefined} 
      />

      <div className="auth-card relative w-full max-w-md overflow-hidden rounded-[32px] border border-white/10 bg-[#09090b]/90 text-white shadow-[0_0_80px_rgba(0,0,0,0.8),0_0_20px_rgba(99,102,241,0.1)] backdrop-blur-2xl">
        {/* Animated Glow */}
        <div className="absolute -top-24 -left-24 h-64 w-64 bg-indigo-500/20 blur-[100px] pointer-events-none rounded-full" />
        <div className="absolute -bottom-24 -right-24 h-64 w-64 bg-emerald-500/10 blur-[100px] pointer-events-none rounded-full" />

        <div className="relative p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-4">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400">
                  Cloud Workspace
                </span>
              </div>
              <h2 className="text-3xl font-black tracking-tight leading-none mb-3">
                {isRegister ? 'Start your journey.' : 'Welcome back.'}
              </h2>
              <p className="text-sm text-zinc-500 leading-relaxed max-w-[280px]">
                {isRegister 
                  ? 'Join the community of modern developers building the future.' 
                  : 'Your projects and AI teammates are waiting for you.'}
              </p>
            </div>

            {!authRequired && (
              <button
                onClick={onClose}
                className="group relative rounded-full p-2 text-zinc-500 hover:text-white transition-colors"
              >
                <div className="absolute inset-0 rounded-full bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <X className="h-5 w-5 relative z-10" />
              </button>
            )}
          </div>

          {/* Toggle Slider */}
          <div className="relative mb-8 p-1 bg-zinc-900/50 rounded-2xl border border-white/5 flex">
            <div 
              className="absolute h-[calc(100%-8px)] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] bg-white rounded-xl shadow-lg"
              style={{
                width: 'calc(50% - 4px)',
                left: isRegister ? 'calc(50% + 4px)' : '4px'
              }}
            />
            <button
              onClick={() => { setLocalError(''); onModeChange?.('login') }}
              className={`relative z-10 flex-1 py-2.5 text-sm font-bold transition-colors duration-300 ${!isRegister ? 'text-black' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setLocalError(''); onModeChange?.('register') }}
              className={`relative z-10 flex-1 py-2.5 text-sm font-bold transition-colors duration-300 ${isRegister ? 'text-black' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Create Account
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Field (Animated Height) */}
            <div className={`field-transition ${isRegister ? 'open' : ''}`}>
              <div className="overflow-hidden">
                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600">
                    <User2 className="h-3 w-3" />
                    Full Name
                  </span>
                  <input
                    value={form.name}
                    onChange={handleChange('name')}
                    placeholder="Enter your name"
                    className="w-full rounded-xl border border-white/5 bg-zinc-900/50 px-4 py-3.5 text-sm text-white placeholder:text-zinc-700 outline-none transition focus:border-indigo-500/50 focus:bg-zinc-900/80"
                    required={isRegister}
                  />
                </label>
              </div>
            </div>

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600">
                <Mail className="h-3 w-3" />
                Email Address
              </span>
              <input
                type="email"
                value={form.email}
                onChange={handleChange('email')}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-white/5 bg-zinc-900/50 px-4 py-3.5 text-sm text-white placeholder:text-zinc-700 outline-none transition focus:border-indigo-500/50 focus:bg-zinc-900/80"
                required
              />
            </label>

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600">
                <LockKeyhole className="h-3 w-3" />
                Secure Password
              </span>
              <input
                type="password"
                value={form.password}
                onChange={handleChange('password')}
                placeholder="••••••••"
                className="w-full rounded-xl border border-white/5 bg-zinc-900/50 px-4 py-3.5 text-sm text-white placeholder:text-zinc-700 outline-none transition focus:border-indigo-500/50 focus:bg-zinc-900/80"
                required
              />
            </label>

            {displayError && (
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-xs font-medium text-rose-400 animate-in fade-in slide-in-from-top-2 duration-300">
                {displayError}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-4 text-sm font-black text-black transition-all hover:bg-indigo-50 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-4 shadow-[0_10px_30px_rgba(255,255,255,0.1)]"
            >
              <span className="relative z-10">{isSubmitting ? 'Authenticating...' : isRegister ? 'Create My Account' : 'Sign In To Workspace'}</span>
              <ArrowRight className="h-4 w-4 relative z-10 transition-transform group-hover:translate-x-1" />
            </button>
          </form>

          {/* Footer Text */}
          <p className="mt-8 text-center text-[10px] text-zinc-600 uppercase tracking-[0.1em]">
            By continuing, you agree to our <span className="text-zinc-500 hover:text-white cursor-pointer transition-colors">Terms of Service</span>
          </p>
        </div>
      </div>
    </div>
  )
}
