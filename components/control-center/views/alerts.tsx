'use client'

import { useState } from 'react'
import {
  CircleAlert,
  FileDiff,
  GitPullRequest,
  ListChecks,
  ShieldQuestion,
  Timer,
  TriangleAlert,
} from 'lucide-react'
import { alerts, type AlertType, type Severity } from '@/lib/data'
import {
  IdChip,
  Panel,
  PanelHeader,
  SeverityLabel,
} from '@/components/control-center/primitives'
import { cn } from '@/lib/utils'

const typeMeta: Record<AlertType, { label: string; icon: React.ReactNode }> = {
  pr_without_task: { label: 'PR sin tarea', icon: <GitPullRequest className="size-4" /> },
  done_no_evidence: { label: 'Terminado sin evidencia', icon: <ShieldQuestion className="size-4" /> },
  criteria_uncovered: { label: 'Criterios sin cubrir', icon: <ListChecks className="size-4" /> },
  blocked_too_long: { label: 'Bloqueo prolongado', icon: <CircleAlert className="size-4" /> },
  no_tests: { label: 'Sin pruebas', icon: <FileDiff className="size-4" /> },
  stale_pr: { label: 'PR estancado', icon: <Timer className="size-4" /> },
}

const filters: { id: Severity | 'all'; label: string }[] = [
  { id: 'all', label: 'Todas' },
  { id: 'high', label: 'Alta' },
  { id: 'medium', label: 'Media' },
  { id: 'low', label: 'Baja' },
]

export function AlertsView() {
  const [filter, setFilter] = useState<Severity | 'all'>('all')
  const visible = alerts.filter((a) => filter === 'all' || a.severity === filter)
  const rank = { high: 0, medium: 1, low: 2 }
  const sorted = [...visible].sort((a, b) => rank[a.severity] - rank[b.severity])

  const borderBySeverity: Record<Severity, string> = {
    high: 'border-l-danger',
    medium: 'border-l-warning',
    low: 'border-l-muted-foreground',
  }

  return (
    <div className="space-y-4">
      <Panel>
        <PanelHeader
          title="Alertas del agente"
          icon={<TriangleAlert className="size-4" />}
          hint="situaciones que requieren decisión del PM"
          right={
            <div className="flex gap-1">
              {filters.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={cn(
                    'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                    filter === f.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent',
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          }
        />
        <ul className="divide-y divide-border">
          {sorted.map((a) => {
            const meta = typeMeta[a.type]
            return (
              <li
                key={a.id}
                className={cn(
                  'flex items-start gap-3 border-l-2 px-4 py-3.5',
                  borderBySeverity[a.severity],
                )}
              >
                <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  {meta.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold">{a.title}</p>
                    <SeverityLabel severity={a.severity} />
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
                      {meta.label}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{a.detail}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <IdChip>{a.relatedLabel}</IdChip>
                    <span className="text-xs text-muted-foreground">detectada {a.age}</span>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </Panel>
    </div>
  )
}
