'use client'

import {
  Activity as ActivityIcon,
  GitCommitHorizontal,
  GitMerge,
  GitPullRequest,
  ListChecks,
  MessageSquare,
  PanelsTopLeft,
  TriangleAlert,
} from 'lucide-react'
import { activity, memberById, type ActivityType } from '@/lib/data'
import { Avatar, IdChip, Panel, PanelHeader } from '@/components/control-center/primitives'

const typeIcon: Record<ActivityType, { icon: React.ReactNode; cls: string }> = {
  commit: { icon: <GitCommitHorizontal className="size-3.5" />, cls: 'bg-muted text-muted-foreground' },
  pr_opened: { icon: <GitPullRequest className="size-3.5" />, cls: 'bg-success/15 text-success' },
  pr_merged: { icon: <GitMerge className="size-3.5" />, cls: 'bg-info/15 text-info' },
  task_moved: { icon: <PanelsTopLeft className="size-3.5" />, cls: 'bg-muted text-foreground/70' },
  criterion: { icon: <ListChecks className="size-3.5" />, cls: 'bg-warning/15 text-warning' },
  alert: { icon: <TriangleAlert className="size-3.5" />, cls: 'bg-danger/15 text-danger' },
  comment: { icon: <MessageSquare className="size-3.5" />, cls: 'bg-muted text-muted-foreground' },
}

export function ActivityView() {
  return (
    <Panel>
      <PanelHeader
        title="Historial de actividad"
        icon={<ActivityIcon className="size-4" />}
        hint="commits, PRs, movimientos de tablero y lecturas del agente"
      />
      <ol className="relative p-4">
        <span className="absolute bottom-6 left-[2.35rem] top-6 w-px bg-border" aria-hidden />
        {activity.map((e) => {
          const isAgent = e.actorId === 'agent'
          const actor = isAgent ? null : memberById(e.actorId)
          const meta = typeIcon[e.type]
          return (
            <li key={e.id} className="relative flex items-start gap-3 py-2.5">
              <span
                className={`z-10 inline-flex size-7 shrink-0 items-center justify-center rounded-full ring-4 ring-card ${meta.cls}`}
              >
                {meta.icon}
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-sm">
                  <span className="font-medium">{isAgent ? 'Agente' : actor?.name}</span>{' '}
                  <span className="text-muted-foreground">{e.text}</span>
                </p>
                {e.targetId ? (
                  <span className="mt-1 inline-block">
                    <IdChip>{e.targetId}</IdChip>
                  </span>
                ) : null}
              </div>
              <span className="shrink-0 pt-0.5 text-xs text-muted-foreground">{e.when}</span>
            </li>
          )
        })}
      </ol>
    </Panel>
  )
}
