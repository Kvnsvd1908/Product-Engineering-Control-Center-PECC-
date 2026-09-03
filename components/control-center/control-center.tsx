'use client'

import { useState } from 'react'
import {
  Activity,
  Boxes,
  GitPullRequest,
  LayoutDashboard,
  Link2,
  MessagesSquare,
  PanelsTopLeft,
  Route,
  TriangleAlert,
} from 'lucide-react'
import { projectStats } from '@/lib/data'
import { Sidebar, type NavItem } from '@/components/control-center/sidebar'
import { Topbar } from '@/components/control-center/topbar'
import { OverviewView } from '@/components/control-center/views/overview'
import { ProductView } from '@/components/control-center/views/product'
import { WorkflowView } from '@/components/control-center/views/workflow'
import { TraceabilityView } from '@/components/control-center/views/traceability'
import { PullRequestsView } from '@/components/control-center/views/pull-requests'
import { AlertsView } from '@/components/control-center/views/alerts'
import { ActivityView } from '@/components/control-center/views/activity'
import { AssistantView } from '@/components/control-center/views/assistant'
import { ConnectionsView } from '@/components/control-center/views/connections'

export type View =
  | 'overview'
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
  product: {
    title: 'Producto',
    subtitle: 'Objetivos, épicas, historias y tareas tal como viven en Notion',
  },
  workflow: {
    title: 'Flujo de trabajo',
    subtitle: 'Tablero Kanban: en qué etapa está cada tarea',
  },
  traceability: {
    title: 'Trazabilidad',
    subtitle: 'La cadena desde un objetivo de negocio hasta el código que lo implementa',
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

export function ControlCenter() {
  const [view, setView] = useState<View>('overview')
  const [mobileOpen, setMobileOpen] = useState(false)
  const s = projectStats()

  const nav: NavItem[] = [
    { id: 'overview', label: 'Resumen', icon: <LayoutDashboard className="size-4" /> },
    { id: 'product', label: 'Producto', icon: <Boxes className="size-4" /> },
    { id: 'workflow', label: 'Flujo de trabajo', icon: <PanelsTopLeft className="size-4" /> },
    { id: 'traceability', label: 'Trazabilidad', icon: <Route className="size-4" /> },
    {
      id: 'pull_requests',
      label: 'Pull requests',
      icon: <GitPullRequest className="size-4" />,
      badge: s.openPrs,
    },
    {
      id: 'alerts',
      label: 'Alertas',
      icon: <TriangleAlert className="size-4" />,
      badge: s.highAlerts + s.mediumAlerts,
      badgeTone: 'danger',
    },
    { id: 'activity', label: 'Actividad', icon: <Activity className="size-4" /> },
    { id: 'assistant', label: 'Asistente', icon: <MessagesSquare className="size-4" /> },
    { id: 'connections', label: 'Conexiones', icon: <Link2 className="size-4" /> },
  ]

  return (
    <div className="flex min-h-screen bg-background text-foreground">
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
        />
        <main className="flex-1 p-4 lg:p-6">
          {view === 'overview' && <OverviewView onNavigate={setView} />}
          {view === 'product' && <ProductView />}
          {view === 'workflow' && <WorkflowView />}
          {view === 'traceability' && <TraceabilityView />}
          {view === 'pull_requests' && <PullRequestsView />}
          {view === 'alerts' && <AlertsView />}
          {view === 'activity' && <ActivityView />}
          {view === 'assistant' && <AssistantView />}
          {view === 'connections' && <ConnectionsView />}
        </main>
      </div>

      {/* Botón Flotante interactivo al Asistente IA */}
      {view !== 'assistant' && (
        <button
          type="button"
          onClick={() => setView('assistant')}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 rounded-full bg-primary px-4 py-3 text-xs font-semibold text-primary-foreground shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background cursor-pointer group"
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
