'use client'

import { LiveConnections } from './live-connections'

import { useEffect, useState } from 'react'
import {
  Activity,
  Boxes,
  GitPullRequest,
  LayoutDashboard,
  Link2,
  MessagesSquare,
  PanelsTopLeft,
  Presentation,
  Route,
  TriangleAlert,
} from 'lucide-react'
import { LiveProvider, LiveRecords, LiveAssistant, LivePresentation, useLive } from './live'
import { Sidebar, type NavItem } from '@/components/control-center/sidebar'
import { Topbar } from '@/components/control-center/topbar'

export type View =
  | 'overview'
  | 'presentation'
  | 'product'
  | 'workflow'
  | 'traceability'
  | 'pull_requests'
  | 'alerts'
  | 'activity'
  | 'assistant'
  | 'connections'

const meta: Record<View, { title: string; subtitle: string }> = {
  overview: {
    title: 'Resumen del proyecto',
    subtitle: 'Estado general, salud del flujo y alertas prioritarias',
  },
  presentation: {
    title: 'Presentación para cliente',
    subtitle: 'Lectura ejecutiva del estado, avances y riesgos del proyecto',
  },
  product: {
    title: 'Producto',
    subtitle: 'Registros del tablero conectado',
  },
  workflow: {
    title: 'Flujo de trabajo',
    subtitle: 'Estado actual de las tareas consultadas',
  },
  traceability: {
    title: 'Trazabilidad',
    subtitle: 'Evidencia disponible para revisar tareas y c?digo',
  },
  pull_requests: {
    title: 'Pull requests',
    subtitle: 'Cambios en revisión y fusionados, y a qué tarea corresponden',
  },
  alerts: {
    title: 'Alertas',
    subtitle: 'Situaciones que requieren una decisión del PM',
  },
  activity: {
    title: 'Actividad',
    subtitle: 'Qué ha estado pasando en el proyecto recientemente',
  },
  assistant: {
    title: 'Asistente',
    subtitle: 'Pídele al agente resúmenes o acciones en lenguaje natural',
  },
  connections: {
    title: 'Conexiones e Integraciones',
    subtitle: 'Vincula tu repositorio Git y tu tablero de producto (Jira, Notion, Taiga o Issues)',
  },
}

export function ControlCenter({ userName, onLogout }: { userName?: string; onLogout?: () => void }) { return <LiveProvider><LiveControlCenter userName={userName} onLogout={onLogout} /></LiveProvider> }

function LiveControlCenter({ userName, onLogout }: { userName?: string; onLogout?: () => void }) {
  const [view, setView] = useState<View>('overview')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const { snapshot } = useLive()

  useEffect(() => {
    const stored = window.localStorage.getItem('pecc-theme')
    const nextTheme = stored === 'light' ? 'light' : 'dark'
    setTheme(nextTheme)
    document.documentElement.classList.toggle('dark', nextTheme === 'dark')
    document.documentElement.classList.toggle('light', nextTheme === 'light')
  }, [])

  function toggleTheme() {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    window.localStorage.setItem('pecc-theme', nextTheme)
    const root = document.documentElement
    root.classList.add('pecc-theme-transition')
    root.classList.toggle('dark', nextTheme === 'dark')
    root.classList.toggle('light', nextTheme === 'light')
    window.setTimeout(() => root.classList.remove('pecc-theme-transition'), 360)
  }

  const nav: NavItem[] = [
    { id: 'overview', label: 'Resumen', icon: <LayoutDashboard className="size-4" /> },
    { id: 'presentation', label: 'Presentación', icon: <Presentation className="size-4" /> },
    { id: 'product', label: 'Producto', icon: <Boxes className="size-4" /> },
    { id: 'workflow', label: 'Flujo de trabajo', icon: <PanelsTopLeft className="size-4" /> },
    { id: 'traceability', label: 'Trazabilidad', icon: <Route className="size-4" /> },
    {
      id: 'pull_requests',
      label: 'Pull requests',
      icon: <GitPullRequest className="size-4" />,
      badge: snapshot?.records.filter(r => r.kind === 'pr' && r.status === 'open').length,
    },
    {
      id: 'alerts',
      label: 'Alertas',
      icon: <TriangleAlert className="size-4" />,
      badge: snapshot?.warnings.length,
      badgeTone: 'danger',
    },
    { id: 'activity', label: 'Actividad', icon: <Activity className="size-4" /> },
    { id: 'assistant', label: 'Asistente', icon: <MessagesSquare className="size-4" /> },
    { id: 'connections', label: 'Conexiones', icon: <Link2 className="size-4" /> },
  ]

  return (
    <div className="pecc-shell flex min-h-screen bg-background text-foreground">
      <Sidebar
        nav={nav}
        active={view}
        onSelect={(v) => {
          setView(v)
          setMobileOpen(false)
        }}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col lg:pl-60">
        <Topbar
          title={meta[view].title}
          subtitle={meta[view].subtitle}
          onOpenMobile={() => setMobileOpen(true)}
          onOpenConnections={() => setView('connections')}
          theme={theme}
          onToggleTheme={toggleTheme}
          onLogout={onLogout}
          userName={userName}
        />
        <main key={view} className="pecc-reveal flex-1 p-4 lg:p-6">
          {view === 'connections' ? <LiveConnections /> : view === 'assistant' ? <LiveAssistant /> : view === 'presentation' ? <LivePresentation /> : <LiveRecords key={view} view={view} />}
        </main>
      </div>

      {/* Botón Flotante interactivo al Asistente IA */}
      {view !== 'assistant' && (
        <button
          type="button"
          onClick={() => setView('assistant')}
          className="pecc-hover fixed bottom-6 right-6 z-40 flex items-center gap-2.5 rounded-full bg-primary px-4 py-3 text-xs font-semibold text-primary-foreground shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background cursor-pointer group"
          title="Abrir Asistente IA del Proyecto"
        >
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-foreground opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-primary-foreground" />
          </span>
          <MessagesSquare className="size-4" />
          <span className="hidden sm:inline font-medium">Asistente IA</span>
        </button>
      )}
    </div>
  )
}
