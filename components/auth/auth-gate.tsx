'use client'

import { useEffect, useState } from 'react'
import { ArrowRight, BarChart3, Check, Eye, EyeOff, Focus, Sparkles, Target } from 'lucide-react'
import { ControlCenter } from '@/components/control-center/control-center'

type Account = { name: string; email: string; password: string }
type Mode = 'login' | 'register'

const accountKey = 'pecc-demo-account'
const sessionKey = 'pecc-demo-session'
const demoAccount: Account = { name: 'PM Demo', email: 'pm@pecc.local', password: 'pecc-demo' }

function readAccount(value: string | null): Account {
  if (!value) return demoAccount
  try {
    const parsed = JSON.parse(value) as Partial<Account>
    if (typeof parsed.name === 'string' && typeof parsed.email === 'string' && typeof parsed.password === 'string') return { name: parsed.name, email: parsed.email.toLowerCase(), password: parsed.password }
  } catch { /* Restore the demo account below when local storage is malformed. */ }
  return demoAccount
}

export function AuthGate() {
  const [account, setAccount] = useState<Account | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const storedAccount = window.localStorage.getItem(accountKey)
    const currentAccount = readAccount(storedAccount)
    if (!storedAccount || currentAccount === demoAccount) window.localStorage.setItem(accountKey, JSON.stringify(currentAccount))
    const storedSession = window.localStorage.getItem(sessionKey)
    setAccount(currentAccount)
    setReady(storedSession === 'active')
  }, [])

  if (account && ready) return <ControlCenter userName={account.name} onLogout={() => setReady(false)} />
  return <AuthScreen account={account} onAuthenticated={() => setReady(true)} />
}

function AuthScreen({ account, onAuthenticated }: { account: Account | null; onAuthenticated: () => void }) {
  const [mode, setMode] = useState<Mode>(account ? 'login' : 'register')
  const [name, setName] = useState('')
  const [email, setEmail] = useState(account?.email ?? '')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (account) setMode('login')
  }, [account])

  function switchMode(nextMode: Mode) {
    setMode(nextMode)
    setError('')
    setPassword('')
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail || !password) return setError('Completa tu correo y contraseña.')
    if (password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres.')

    if (mode === 'register') {
      if (!name.trim()) return setError('Escribe tu nombre para personalizar el espacio de trabajo.')
      const nextAccount = { name: name.trim(), email: cleanEmail, password }
      window.localStorage.setItem(accountKey, JSON.stringify(nextAccount))
      window.localStorage.setItem(sessionKey, 'active')
      onAuthenticated()
      return
    }

    if (cleanEmail === demoAccount.email && password === demoAccount.password) {
      window.localStorage.setItem(accountKey, JSON.stringify(demoAccount))
      window.localStorage.setItem(sessionKey, 'active')
      onAuthenticated()
      return
    }

    if (!account || account.email !== cleanEmail || account.password !== password) {
      setError('El correo o la contraseña no coinciden con la cuenta local.')
      return
    }
    window.localStorage.setItem(sessionKey, 'active')
    onAuthenticated()
  }

  return (
    <main className="auth-stage min-h-screen overflow-hidden bg-[#071216] text-white">
      <div className="auth-grid" aria-hidden="true" />
      <div className="auth-sweep auth-sweep-one" aria-hidden="true" />
      <div className="auth-sweep auth-sweep-two" aria-hidden="true" />
      <div className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-12 px-6 py-10 lg:grid-cols-[1fr_430px] lg:px-12">
        <section className="max-w-2xl py-6 lg:py-12">
          <div className="mb-10 flex items-center gap-3 text-sm font-semibold tracking-[0.18em] text-cyan-200/80 uppercase">
            <span className="flex size-9 items-center justify-center rounded-xl border border-cyan-200/25 bg-cyan-200/10 text-cyan-100"><BarChart3 className="size-4" /></span>
            PECC / Product Engineering Control Center
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
            {mode === 'login' && account?.email === demoAccount.email && <div className="mt-5 rounded-lg border border-cyan-200/15 bg-cyan-200/[0.06] p-3 text-xs text-slate-300"><div className="flex items-center justify-between gap-3"><span>Cuenta demo lista para probar</span><button type="button" onClick={() => { setEmail(demoAccount.email); setPassword(demoAccount.password); setError('') }} className="auth-link-button">Cargar acceso</button></div><p className="mt-1 text-slate-500">{demoAccount.email} · contraseña: {demoAccount.password}</p></div>}
            <p className="mt-6 text-center text-xs leading-5 text-slate-500">Modo local de demostración. Tus datos de acceso se guardan únicamente en este navegador.</p>
          </div>
        </section>
      </div>
    </main>
  )
}

function FocusCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <div className="rounded-xl border border-white/10 bg-white/[0.045] p-4"><span className="text-cyan-200">{icon}</span><p className="mt-3 text-sm font-semibold">{title}</p><p className="mt-1 text-xs leading-5 text-slate-400">{text}</p></div>
}
