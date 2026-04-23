import React, { useState } from 'react'
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

    if (isRegister && !name) {
      return 'Name is required'
    }

    if (
      !email ||
      email.length > 254 ||
      !EMAIL_REGEX.test(email) ||
      email.includes('..')
    ) {
      return 'Enter a valid email address'
    }

    if (password.length < 8) {
      return 'Password must be at least 8 characters long'
    }

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
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <div className="absolute inset-0" onClick={!authRequired ? onClose : undefined} />

      <div className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-white/10 bg-[#0d0d11] text-white shadow-[0_40px_120px_rgba(0,0,0,0.55)]">
        <div className="absolute inset-x-0 top-0 h-36 bg-[radial-gradient(circle_at_top,rgba(129,140,248,0.28),transparent_68%)] pointer-events-none" />

        <div className="relative flex items-start justify-between px-6 pt-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-300/80">
              Secure Workspace
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight">
              {isRegister ? 'Create your session.' : 'Welcome back.'}
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Sign in to access your private workspace. Account creation is required before entering CodeNest.
            </p>
          </div>

          {!authRequired && (
            <button
              onClick={onClose}
              className="rounded-full border border-white/10 p-2 text-zinc-400 transition-colors hover:text-white hover:border-white/20"
              aria-label="Close authentication dialog"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="relative px-6 pt-5">
          <div className="inline-flex rounded-2xl border border-white/10 bg-white/[0.03] p-1">
            <button
              onClick={() => {
                setLocalError('')
                onModeChange?.('login')
              }}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                !isRegister ? 'bg-white text-black shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setLocalError('')
                onModeChange?.('register')
              }}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                isRegister ? 'bg-white text-black shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="relative space-y-4 px-6 py-6">
          {isRegister && (
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                <User2 className="h-3.5 w-3.5" />
                Name
              </span>
              <input
                value={form.name}
                onChange={handleChange('name')}
                placeholder="Suvradip Ghosh"
                className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-sm text-white outline-none transition focus:border-indigo-400/60 focus:bg-white/[0.05]"
                required={isRegister}
              />
            </label>
          )}

          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
              <Mail className="h-3.5 w-3.5" />
              Email
            </span>
            <input
              type="email"
              value={form.email}
              onChange={handleChange('email')}
              placeholder="you@example.com"
              autoComplete="email"
              className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-sm text-white outline-none transition focus:border-indigo-400/60 focus:bg-white/[0.05]"
              required
            />
          </label>

          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
              <LockKeyhole className="h-3.5 w-3.5" />
              Password
            </span>
            <input
              type="password"
              value={form.password}
              onChange={handleChange('password')}
              placeholder="Minimum 8 characters"
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-sm text-white outline-none transition focus:border-indigo-400/60 focus:bg-white/[0.05]"
              minLength={8}
              required
            />
          </label>

          {displayError && (
            <div className="rounded-2xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {displayError}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3.5 text-sm font-bold text-black transition hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
          >
            <span>{isSubmitting ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </form>
      </div>
    </div>
  )
}
