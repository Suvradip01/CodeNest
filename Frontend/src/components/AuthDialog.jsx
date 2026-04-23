import React, { useState, useEffect, useRef } from 'react'
import { ArrowRight, LockKeyhole, Mail, User2, X, Sparkles, Zap, ShieldCheck } from 'lucide-react'

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
  const isRegister = mode === 'register'
  
  const loginFormRef = useRef(null)
  const registerFormRef = useRef(null)
  const [containerHeight, setContainerHeight] = useState(0)

  useEffect(() => {
    if (open) {
      setTimeout(() => setIsVisible(true), 10)
    } else {
      setIsVisible(false)
    }
  }, [open])

  useEffect(() => {
    const activeRef = isRegister ? registerFormRef : loginFormRef
    if (activeRef.current) {
      setContainerHeight(activeRef.current.scrollHeight)
    }
  }, [isRegister, open, localError, error])

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
    <div className={`fixed inset-0 z-[200] flex items-center justify-center p-4 transition-all duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <style>{`
        @keyframes cyber-scan {
          0% { transform: translateY(-100%); opacity: 0; }
          50% { opacity: 0.5; }
          100% { transform: translateY(100%); opacity: 0; }
        }
        @keyframes border-flow {
          0% { border-color: rgba(99, 102, 241, 0.2); }
          50% { border-color: rgba(99, 102, 241, 0.6); }
          100% { border-color: rgba(99, 102, 241, 0.2); }
        }
        .cyber-card {
          animation: border-flow 4s infinite ease-in-out;
        }
        .scan-line {
          animation: cyber-scan 3s infinite linear;
        }
      `}</style>

      {/* Deep Backdrop */}
      <div 
        className="absolute inset-0 bg-[#020203]/90 backdrop-blur-3xl" 
        onClick={!authRequired ? onClose : undefined} 
      />

      <div className="relative w-full max-w-[440px]">
        {/* Decorative Accents */}
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-indigo-600/20 blur-[60px] rounded-full animate-pulse" />
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-emerald-600/10 blur-[60px] rounded-full animate-pulse" />

        <div className="cyber-card relative overflow-hidden rounded-[40px] border border-white/10 bg-zinc-950 shadow-[0_0_100px_rgba(0,0,0,1),inset_0_0_20px_rgba(255,255,255,0.02)]">
          {/* Scanning Line Effect */}
          <div className="scan-line absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-transparent via-indigo-500/5 to-transparent pointer-events-none z-20" />

          <div className="relative p-10">
            {/* Unique Header Section */}
            <div className="flex items-start justify-between mb-10">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div className="h-px flex-1 bg-gradient-to-r from-indigo-500/30 to-transparent" />
                </div>
                
                <h2 className="text-4xl font-black tracking-tighter leading-tight mb-3">
                  {isRegister ? 'Join the Core.' : 'Resume Session.'}
                </h2>
                <div className="flex items-center gap-2 text-zinc-500 text-[11px] font-bold uppercase tracking-[0.2em]">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Node: {isRegister ? 'Creation' : 'Auth'} v2.4
                </div>
              </div>

              {!authRequired && (
                <button
                  onClick={onClose}
                  className="p-3 rounded-2xl bg-white/5 border border-white/10 text-zinc-500 hover:text-white hover:bg-white/10 transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Futuristic Switcher */}
            <div className="relative grid grid-cols-2 gap-2 mb-10 p-1.5 bg-zinc-900/80 rounded-[24px] border border-white/5">
              <div 
                className="absolute h-[calc(100%-12px)] transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] bg-gradient-to-br from-white to-zinc-200 rounded-[18px] shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
                style={{
                  width: 'calc(50% - 6px)',
                  left: isRegister ? 'calc(50% + 3px)' : '3px'
                }}
              />
              <button
                type="button"
                onClick={() => { setLocalError(''); onModeChange?.('login') }}
                className={`relative z-10 py-3 text-xs font-black uppercase tracking-[0.1em] transition-colors duration-500 ${!isRegister ? 'text-black' : 'text-zinc-600'}`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setLocalError(''); onModeChange?.('register') }}
                className={`relative z-10 py-3 text-xs font-black uppercase tracking-[0.1em] transition-colors duration-500 ${isRegister ? 'text-black' : 'text-zinc-600'}`}
              >
                Sign Up
              </button>
            </div>

            {/* Content with Dynamic Height and Slide */}
            <div 
              className="relative transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] overflow-hidden"
              style={{ height: containerHeight ? `${containerHeight}px` : 'auto' }}
            >
              <div 
                className="flex transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]"
                style={{ 
                  width: '200%', 
                  transform: `translateX(${isRegister ? '-50%' : '0%'})` 
                }}
              >
                {/* Sign In Form */}
                <div ref={loginFormRef} className="w-1/2 pr-5">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center px-1">
                        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-600">Identification</span>
                        <Mail className="w-3 h-3 text-zinc-700" />
                      </div>
                      <input
                        id="auth-email-login"
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange('email')}
                        placeholder="you@domain.com"
                        className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl px-5 py-4 text-sm text-white focus:border-indigo-500/50 focus:bg-zinc-900 transition-all outline-none"
                        required={!isRegister}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center px-1">
                        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-600">Access Key</span>
                        <LockKeyhole className="w-3 h-3 text-zinc-700" />
                      </div>
                      <input
                        id="auth-password-login"
                        name="password"
                        type="password"
                        value={form.password}
                        onChange={handleChange('password')}
                        placeholder="••••••••"
                        className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl px-5 py-4 text-sm text-white focus:border-indigo-500/50 focus:bg-zinc-900 transition-all outline-none"
                        required={!isRegister}
                      />
                    </div>

                    {displayError && !isRegister && (
                      <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold">
                        {displayError}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="group relative w-full overflow-hidden rounded-2xl bg-indigo-600 py-5 text-sm font-black uppercase tracking-[0.15em] text-white transition-all hover:bg-indigo-500 active:scale-[0.98] shadow-[0_10px_40px_-10px_rgba(79,70,229,0.5)] disabled:opacity-50"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                      <span className="relative z-10 flex items-center justify-center gap-3">
                        {isSubmitting ? 'Verifying...' : 'Initialize Session'}
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    </button>
                  </form>
                </div>

                {/* Sign Up Form */}
                <div ref={registerFormRef} className="w-1/2 pl-5">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center px-1">
                        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-600">Display Name</span>
                        <User2 className="w-3 h-3 text-zinc-700" />
                      </div>
                      <input
                        id="auth-name-reg"
                        name="name"
                        value={form.name}
                        onChange={handleChange('name')}
                        placeholder="Developer Name"
                        className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl px-5 py-4 text-sm text-white focus:border-indigo-500/50 focus:bg-zinc-900 transition-all outline-none"
                        required={isRegister}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center px-1">
                        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-600">Email Hub</span>
                        <Mail className="w-3 h-3 text-zinc-700" />
                      </div>
                      <input
                        id="auth-email-reg"
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange('email')}
                        placeholder="dev@hub.com"
                        className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl px-5 py-4 text-sm text-white focus:border-indigo-500/50 focus:bg-zinc-900 transition-all outline-none"
                        required={isRegister}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center px-1">
                        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-600">Secure Key</span>
                        <LockKeyhole className="w-3 h-3 text-zinc-700" />
                      </div>
                      <input
                        id="auth-password-reg"
                        name="password"
                        type="password"
                        value={form.password}
                        onChange={handleChange('password')}
                        placeholder="Min. 8 chars"
                        className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl px-5 py-4 text-sm text-white focus:border-indigo-500/50 focus:bg-zinc-900 transition-all outline-none"
                        required={isRegister}
                      />
                    </div>

                    {displayError && isRegister && (
                      <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold">
                        {displayError}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="group relative w-full overflow-hidden rounded-2xl bg-white py-5 text-sm font-black uppercase tracking-[0.15em] text-black transition-all hover:bg-zinc-100 active:scale-[0.98] shadow-[0_10px_40px_-10px_rgba(255,255,255,0.3)] disabled:opacity-50"
                    >
                      <span className="relative z-10 flex items-center justify-center gap-3">
                        {isSubmitting ? 'Provisioning...' : 'Create Identity'}
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* Bottom Info */}
            <div className="mt-12 flex items-center justify-between pt-8 border-t border-white/5">
               <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.3em] text-zinc-600">
                  <ShieldCheck className="w-3 h-3" />
                  End-to-End Secure
               </div>
               <div className="flex gap-4 text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">
                  <span className="hover:text-white cursor-pointer transition-colors">Privacy</span>
                  <span className="hover:text-white cursor-pointer transition-colors">Terms</span>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
