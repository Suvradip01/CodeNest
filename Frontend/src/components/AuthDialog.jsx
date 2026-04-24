import React, { useState, useEffect, useRef } from 'react'
import { ArrowRight, LockKeyhole, Mail, User2, X } from 'lucide-react'

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
  const isRegister = mode === 'register'
  
  const contentRef = useRef(null)
  const [height, setHeight] = useState('auto')

  useEffect(() => {
    if (open && contentRef.current) {
      setHeight(contentRef.current.scrollHeight)
    }
  }, [open, isRegister, localError, error])

  if (!open) return null

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
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 p-4 animate-in fade-in duration-300">
      <div className="absolute inset-0" onClick={!authRequired ? onClose : undefined} />

      <div 
        className="relative w-full max-w-md overflow-hidden rounded-3xl border-2 border-zinc-800 bg-zinc-950 text-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)] transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]" 
        style={{ height }}
      >
        <div ref={contentRef}>
          {/* Header Banner */}
          <div className="relative h-44 bg-zinc-900 bg-grid-pattern flex flex-col justify-end px-8 pb-6">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-indigo-400">
                  Secure Gateway
                </p>
                <h2 className="mt-2 text-4xl font-bold tracking-tight text-white leading-none">
                  {isRegister ? 'Join CodeNest' : 'Welcome Back'}
                </h2>
              </div>
              {!authRequired && (
                <button
                  onClick={onClose}
                  className="rounded-xl border border-zinc-800 bg-zinc-950 p-2.5 text-zinc-500 transition-all hover:text-white hover:border-zinc-700 hover:scale-110"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div className="px-8 pt-8">
            {/* Premium Tab Toggle */}
            <div className="grid grid-cols-2 gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 p-1.5">
              <button
                type="button"
                onClick={() => {
                  setLocalError('')
                  onModeChange?.('login')
                }}
                className={`relative rounded-xl py-2.5 text-xs font-bold transition-all duration-300 ${
                  !isRegister 
                    ? 'bg-zinc-950 text-white shadow-[0_2px_10px_rgba(0,0,0,0.3)]' 
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {!isRegister && <div className="absolute inset-x-0 -bottom-1 h-0.5 bg-indigo-500/50 mx-4 blur-sm" />}
                SIGN IN
              </button>
              <button
                type="button"
                onClick={() => {
                  setLocalError('')
                  onModeChange?.('register')
                }}
                className={`relative rounded-xl py-2.5 text-xs font-bold transition-all duration-300 ${
                  isRegister 
                    ? 'bg-zinc-950 text-white shadow-[0_2px_10px_rgba(0,0,0,0.3)]' 
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {isRegister && <div className="absolute inset-x-0 -bottom-1 h-0.5 bg-indigo-500/50 mx-4 blur-sm" />}
                CREATE ACCOUNT
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 px-8 py-8">
            <div className="space-y-4">
              {isRegister && (
                <div className="group relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 transition-colors group-focus-within:text-indigo-400">
                    <User2 className="h-4 w-4" />
                  </span>
                  <input
                    id="auth-name"
                    name="name"
                    value={form.name}
                    onChange={handleChange('name')}
                    placeholder="Full Name"
                    className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 py-4 pl-12 pr-4 text-sm text-white placeholder:text-zinc-600 outline-none transition-all focus:border-indigo-500/50 focus:bg-zinc-950 focus:ring-4 focus:ring-indigo-500/5"
                    required={isRegister}
                  />
                </div>
              )}

              <div className="group relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 transition-colors group-focus-within:text-indigo-400">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  id="auth-email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange('email')}
                  placeholder="Email Address"
                  className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 py-4 pl-12 pr-4 text-sm text-white placeholder:text-zinc-600 outline-none transition-all focus:border-indigo-500/50 focus:bg-zinc-950 focus:ring-4 focus:ring-indigo-500/5"
                  required
                />
              </div>

              <div className="group relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 transition-colors group-focus-within:text-indigo-400">
                  <LockKeyhole className="h-4 w-4" />
                </span>
                <input
                  id="auth-password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange('password')}
                  placeholder="Password"
                  className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 py-4 pl-12 pr-4 text-sm text-white placeholder:text-zinc-600 outline-none transition-all focus:border-indigo-500/50 focus:bg-zinc-950 focus:ring-4 focus:ring-indigo-500/5"
                  required
                />
              </div>
            </div>

            {displayError && (
              <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/5 px-4 py-3 text-xs font-medium text-rose-400 animate-in slide-in-from-top-2 duration-300">
                <div className="h-1 w-1 rounded-full bg-rose-400" />
                {displayError}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-premium-hover group flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-4 text-sm font-bold text-white transition-all hover:bg-indigo-500 hover:shadow-[0_0_20px_rgba(79,70,229,0.4)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Processing...' : isRegister ? 'Launch Workspace' : 'Enter Workspace'}</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
            
            <p className="text-center text-[11px] text-zinc-600 uppercase tracking-widest font-medium">
              Protected by CodeNest Security
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
