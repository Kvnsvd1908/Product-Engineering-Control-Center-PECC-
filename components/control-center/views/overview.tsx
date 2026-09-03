'use client'

import {
  Activity,
  ArrowRight,
  CircleAlert,
  GitPullRequest,
  ListChecks,
  TriangleAlert,
} from 'lucide-react'
import {
  activity,
  alerts,
  memberById,
  objectives,
  projectStats,
  tasks,
} from '@/lib/data'
import {
  Avatar,
  CompletionBar,
  IdChip,
  Panel,
  PanelHeader,
  SeverityDot,
} from '@/components/control-center/primitives'
import type { View } from '@/components/control-center/control-center'

function Kpi({
  label,
  value,
  sub,
  accent,
}: {
  label: string
  value: string
  sub: string
  accent?: string
}) {
  return (
    <Panel className="p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-2 text-3xl font-semibold tabular-nums ${accent ?? ''}`}>{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
    </Panel>
  )
}

export function OverviewView({ onNavigate }: { onNavigate: (v: View) => void }) {
  const s = projectStats()
  const blocked = tasks.filter((t) => t.status === 'blocked')
  const topAlerts = [...alerts]
    .sort((a, b) => {
      const rank = { high: 0, medium: 1, low: 2 }
      return rank[a.severity] - rank[b.severity]
    })
    .slice(0, 4)
  const c = s.criteria
  const coveredPct = Math.round((c.covered / c.total) * 100)
  const partialPct = Math.round((c.partial / c.total) * 100)

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi
          label="Cumplimiento medio"
          value={`${s.avgCompletion}%`}
          sub={`${s.done}/${s.total} tareas terminadas`}
          accent="text-primary"
        />
        <Kpi
          label="Criterios cubiertos"
          value={`${c.covered}/${c.total}`}
          sub={`${c.partial} parciales · ${c.uncovered} sin cubrir`}
        />
        <Kpi
          label="PRs abiertos"
          value={`${s.openPrs}`}
          sub={`${s.untracedPrs} sin tarea asociada`}
          accent={s.untracedPrs > 0 ? 'text-warning' : undefined}
        />
        <Kpi
          label="Alertas activas"
          value={`${s.highAlerts + s.mediumAlerts}`}
          sub={`${s.highAlerts} de prioridad alta`}
          accent={s.highAlerts > 0 ? 'text-danger' : undefined}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Salud del flujo + criterios */}
        <Panel className="lg:col-span-2">
          <PanelHeader
            title="Salud del flujo de trabajo"
            icon={<Activity className="size-4" />}
            hint="cruce Notion ↔ GitHub"
          />
          <div className="space-y-5 p-4">
            <div>
              <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>Cobertura de criterios de aceptación</span>
                <span className="tabular-nums">{coveredPct}% cubierto</span>
              </div>
              <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-success" style={{ width: `${coveredPct}%` }} />
                <div className="h-full bg-warning" style={{ width: `${partialPct}%` }} />
              </div>
              <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-success" />Cubierto {c.covered}</span>
                <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-warning" />Parcial {c.partial}</span>
                <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-muted-foreground/40" />Sin cubrir {c.uncovered}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { k: 'En progreso', v: s.inProgress, cls: 'text-info' },
                { k: 'En revisión', v: s.inReview, cls: 'text-warning' },
                { k: 'Terminadas', v: s.done, cls: 'text-success' },
                { k: 'Bloqueadas', v: s.blocked, cls: 'text-danger' },
              ].map((x) => (
                <div key={x.k} className="rounded-md border border-border bg-background/40 p-3">
                  <p className={`text-2xl font-semibold tabular-nums ${x.cls}`}>{x.v}</p>
                  <p className="text-xs text-muted-foreground">{x.k}</p>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        {/* Progreso por objetivo */}
        <Panel>
          <PanelHeader title="Objetivos de negocio" icon={<ListChecks className="size-4" />} />
          <div className="space-y-4 p-4">
            {objectives.map((o) => (
              <div key={o.id}>
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium">{o.title}</p>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{o.progress}%</span>
                </div>
                <p className="mb-1.5 text-xs text-muted-foreground">{o.metric}</p>
                <CompletionBar value={o.progress} />
              </div>
            ))}
            <button
              onClick={() => onNavigate('traceability')}
              className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              Ver trazabilidad completa <ArrowRight className="size-3.5" />
            </button>
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Alertas prioritarias */}
        <Panel className="lg:col-span-2">
          <PanelHeader
            title="Alertas que requieren atención"
            icon={<TriangleAlert className="size-4" />}
            right={
              <button
                onClick={() => onNavigate('alerts')}
                className="text-xs font-medium text-primary hover:underline"
              >
                Ver todas
              </button>
            }
          />
          <ul className="divide-y divide-border">
            {topAlerts.map((a) => (
              <li key={a.id} className="flex items-start gap-3 px-4 py-3">
                <SeverityDot severity={a.severity} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{a.title}</p>
                    <IdChip>{a.relatedLabel}</IdChip>
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{a.detail}</p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{a.age}</span>
              </li>
            ))}
          </ul>
        </Panel>

        {/* Tareas bloqueadas */}
        <Panel>
          <PanelHeader title="Bloqueos" icon={<CircleAlert className="size-4 text-danger" />} />
          <div className="p-4">
            {blocked.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin bloqueos activos.</p>
            ) : (
              <ul className="space-y-3">
                {blocked.map((t) => (
                  <li key={t.id} className="rounded-md border border-danger/30 bg-danger/5 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <IdChip>{t.id}</IdChip>
                      <span className="text-xs text-danger">{t.daysInStatus} días</span>
                    </div>
                    <p className="mt-1.5 text-sm font-medium">{t.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{t.agentNote}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Panel>
      </div>

      {/* Actividad reciente */}
      <Panel>
        <PanelHeader
          title="Actividad reciente"
          icon={<GitPullRequest className="size-4" />}
          right={
            <button
              onClick={() => onNavigate('activity')}
              className="text-xs font-medium text-primary hover:underline"
            >
              Ver historial
            </button>
          }
        />
        <ul className="divide-y divide-border">
          {activity.slice(0, 5).map((e) => {
            const actor = e.actorId === 'agent' ? null : memberById(e.actorId)
            const isAgent = e.actorId === 'agent'
            return (
              <li key={e.id} className="flex items-center gap-3 px-4 py-2.5">
                {isAgent ? (
                  <span className="inline-flex size-7 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <Activity className="size-3.5" />
                  </span>
                ) : (
                  <Avatar member={actor} size="sm" />
                )}
                <p className="min-w-0 flex-1 truncate text-sm">
                  <span className="font-medium">{isAgent ? 'Agente' : actor?.name}</span>{' '}
                  <span className="text-muted-foreground">{e.text}</span>
                </p>
                <span className="shrink-0 text-xs text-muted-foreground">{e.when}</span>
              </li>
            )
          })}
        </ul>
      </Panel>
    </div>
  )
}
