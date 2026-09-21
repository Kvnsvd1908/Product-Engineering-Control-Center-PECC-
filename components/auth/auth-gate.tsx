'use client'

import { useEffect, useState } from 'react'
import { ArrowRight, Check, Eye, EyeOff, Focus, Sparkles, Target } from 'lucide-react'
import { ControlCenter } from '@/components/control-center/control-center'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

type Mode = 'login' | 'register'

export function AuthGate() {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data, error: authError }) => {
      if (authError) setError(authError.message)
      setUser(data.user)
      setReady(true)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null))
    return () => listener.subscription.unsubscribe()
  }, [])

  async function logout() {
    await createClient().auth.signOut()
    setUser(null)
  }

  if (!ready) return <main className="grid min-h-screen place-items-center bg-[#071216] text-sm text-white">Comprobando tu sesión…</main>
  if (user) return <ControlCenter userName={user.user_metadata?.name || user.email?.split('@')[0]} onLogout={logout} />
  return <AuthScreen onAuthenticated={setUser} error={error} />
}

function AuthScreen({ onAuthenticated, error: authError }: { onAuthenticated: (user: User) => void; error?: string }) {
  const [mode, setMode] = useState<Mode>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  function switchMode(nextMode: Mode) {
    setMode(nextMode)
    setError('')
    setPassword('')
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail || !password) return setError('Completa tu correo y contraseña.')
    if (password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres.')
    if (mode === 'register' && !name.trim()) return setError('Escribe tu nombre para personalizar el espacio de trabajo.')
    const supabase = createClient()
    const result = mode === 'register'
      ? await supabase.auth.signUp({ email: cleanEmail, password, options: { data: { name: name.trim() } } })
      : await supabase.auth.signInWithPassword({ email: cleanEmail, password })
    if (result.error) return setError(result.error.message)
    if (!result.data.user) return setError('Supabase requiere confirmar tu correo antes de entrar.')
    if (mode === 'register' && !result.data.session) return setError('Revisa tu correo para confirmar la cuenta antes de iniciar sesión.')
    onAuthenticated(result.data.user)
  }

  return (
    <main className="auth-stage min-h-screen overflow-hidden bg-[#071216] text-white">
      <div className="auth-grid" aria-hidden="true" />
      <div className="auth-sweep auth-sweep-one" aria-hidden="true" />
      <div className="auth-sweep auth-sweep-two" aria-hidden="true" />
      <div className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-12 px-6 py-10 lg:grid-cols-[1fr_430px] lg:px-12">
        <section className="max-w-2xl py-6 lg:py-12">
          <div className="mb-10 flex items-center">
            <img src="/logo-pecc.svg" alt="PECC Control Center" className="h-auto w-[min(100%,370px)]" />
          </div>
          <div className="max-w-xl">
            <p className="mb-5 flex items-center gap-2 text-sm font-medium text-orange-200"><Sparkles className="size-4" /> Tu próximo avance empieza con claridad.</p>
            <h1 className="text-5xl font-semibold leading-[0.98] tracking-[-0.04em] text-balance sm:text-6xl lg:text-7xl">Convierte el ruido del proyecto en <span className="text-cyan-200">decisiones que avanzan.</span></h1>
            <p className="mt-7 max-w-lg text-base leading-7 text-slate-300 sm:text-lg">Un espacio para que el PM vea lo importante, conecte evidencia y mantenga al equipo enfocado en lo que sigue.</p>
          </div>
          <div className="mt-12 grid max-w-xl gap-3 sm:grid-cols-3">
            <FocusCard icon={<Target className="size-4" />} title="Enfoca" text="Prioriza lo que mueve el producto." />
            <FocusCard icon={<Check className="size-4" />} title="Conecta" text="Cruza trabajo y evidencia real." />
            <FocusCard icon={<ArrowRight className="size-4" />} title="Avanza" text="Convierte señales en acción." />
          </div>
          <p className="mt-12 text-sm italic text-slate-400">“La claridad no es tener todas las respuestas; es saber cuál es la siguiente pregunta correcta.”</p>
        </section>

        <section className="auth-card rounded-[1.75rem] border border-white/15 bg-white/[0.08] p-2 shadow-2xl shadow-black/30 backdrop-blur-xl">
          <div className="rounded-[1.35rem] border border-white/10 bg-[#0d1b20]/90 p-6 sm:p-8">
            <div className="mb-8 flex items-start justify-between gap-4">
              <div><p className="text-sm text-cyan-200">Tu espacio de control</p><h2 className="mt-2 text-2xl font-semibold">{mode === 'login' ? 'Bienvenido de vuelta' : 'Crea tu espacio PM'}</h2></div>
              <span className="rounded-full border border-orange-200/20 bg-orange-200/10 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-orange-100 uppercase">Local beta</span>
            </div>
            <div className="mb-7 grid grid-cols-2 rounded-lg border border-white/10 bg-black/15 p-1 text-sm">
              <button type="button" onClick={() => switchMode('login')} className={`auth-tab ${mode === 'login' ? 'auth-tab-active' : ''}`}>Iniciar sesión</button>
              <button type="button" onClick={() => switchMode('register')} className={`auth-tab ${mode === 'register' ? 'auth-tab-active' : ''}`}>Registrarme</button>
            </div>
            <form className="space-y-4" onSubmit={submit}>
              {mode === 'register' && <label className="block space-y-2"><span className="text-sm text-slate-200">Nombre</span><input required value={name} onChange={event => setName(event.target.value)} className="auth-input" placeholder="Tu nombre" /></label>}
              <label className="block space-y-2"><span className="text-sm text-slate-200">Correo electrónico</span><input required type="email" value={email} onChange={event => setEmail(event.target.value)} className="auth-input" placeholder="pm@tuempresa.com" /></label>
              <label className="block space-y-2"><span className="text-sm text-slate-200">Contraseña</span><span className="relative block"><input required type={showPassword ? 'text' : 'password'} value={password} onChange={event => setPassword(event.target.value)} className="auth-input pr-11" placeholder="Mínimo 6 caracteres" /><button type="button" onClick={() => setShowPassword(value => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white" aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button></span></label>
              {error && <p role="alert" className="rounded-lg border border-red-300/20 bg-red-400/10 px-3 py-2 text-sm text-red-100">{error}</p>}
              <button type="submit" className="auth-primary-button group flex w-full items-center justify-center gap-2">{mode === 'login' ? 'Entrar al centro de control' : 'Crear mi espacio'}<ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></button>
            </form>
            {authError && <p role="alert" className="mt-5 rounded-lg border border-red-300/20 bg-red-400/10 px-3 py-2 text-sm text-red-100">{authError}</p>}
            <p className="mt-6 text-center text-xs leading-5 text-slate-500">Autenticación gestionada de forma segura por Supabase.</p>
          </div>
        </section>
      </div>
    </main>
  )
}

function FocusCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <div className="rounded-xl border border-white/10 bg-white/[0.045] p-4"><span className="text-cyan-200">{icon}</span><p className="mt-3 text-sm font-semibold">{title}</p><p className="mt-1 text-xs leading-5 text-slate-400">{text}</p></div>
}
