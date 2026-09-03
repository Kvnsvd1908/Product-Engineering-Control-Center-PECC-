'use client'

import { useState } from 'react'
import {
  ArrowDown,
  GitCommitHorizontal,
  GitPullRequest,
  Layers,
  ListChecks,
  Target,
} from 'lucide-react'
import {
  commitsByTask,
  epicById,
  memberById,
  objectiveById,
  prByTask,
  storyById,
  tasks,
} from '@/lib/data'
import {
  Avatar,
  ChecksBadge,
  CompletionBar,
  CriterionPill,
  IdChip,
  Panel,
  PanelHeader,
  PrStatusBadge,
  StatusBadge,
} from '@/components/control-center/primitives'
import { cn } from '@/lib/utils'

function ChainArrow({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 py-1 pl-3 text-xs text-muted-foreground">
      <ArrowDown className="size-3.5" />
      <span>{label}</span>
    </div>
  )
}

function Node({
  icon,
  tint,
  children,
}: {
  icon: React.ReactNode
  tint: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3 rounded-md border border-border bg-background/40 p-3">
      <span className={cn('mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-md', tint)}>
        {icon}
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}

export function TraceabilityView() {
  const [selectedId, setSelectedId] = useState('T-1004')
  const task = tasks.find((t) => t.id === selectedId)!
  const story = storyById(task.storyId)!
  const epic = epicById(story.epicId)!
  const objective = objectiveById(epic.objectiveId)!
  const taskCommits = commitsByTask(task.id)
  const taskPrs = prByTask(task.id)
  const hasEvidence = taskCommits.length > 0 || taskPrs.length > 0

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
      {/* Selector de tareas */}
      <Panel className="lg:sticky lg:top-4 lg:self-start">
        <PanelHeader title="Elegir tarea" hint="para trazar" />
        <ul className="max-h-[70vh] divide-y divide-border overflow-y-auto">
          {tasks.map((t) => (
            <li key={t.id}>
              <button
                onClick={() => setSelectedId(t.id)}
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-accent',
                  t.id === selectedId && 'bg-accent',
                )}
              >
                <span
                  className={cn(
                    'h-8 w-0.5 shrink-0 rounded-full',
                    t.id === selectedId ? 'bg-primary' : 'bg-transparent',
                  )}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <IdChip>{t.id}</IdChip>
                    <span className="text-xs tabular-nums text-muted-foreground">{t.completion}%</span>
                  </div>
                  <p className="mt-0.5 truncate text-sm">{t.title}</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </Panel>

      {/* Cadena de trazabilidad */}
      <div className="space-y-4">
        <Panel>
          <PanelHeader
            title="Trazabilidad negocio → código"
            icon={<ListChecks className="size-4" />}
            hint="por qué existe este código"
          />
          <div className="p-4">
            {/* Objetivo */}
            <Node icon={<Target className="size-4 text-primary" />} tint="bg-primary/15">
              <div className="flex items-center gap-2">
                <IdChip>{objective.id}</IdChip>
                <span className="text-xs uppercase tracking-wide text-muted-foreground">Objetivo</span>
              </div>
              <p className="mt-1 text-sm font-semibold">{objective.title}</p>
              <p className="text-xs text-muted-foreground">{objective.metric}</p>
            </Node>

            <ChainArrow label="se descompone en la épica" />

            {/* Épica */}
            <Node icon={<Layers className="size-4 text-info" />} tint="bg-info/15">
              <div className="flex items-center gap-2">
                <IdChip>{epic.id}</IdChip>
                <span className="text-xs uppercase tracking-wide text-muted-foreground">Épica</span>
              </div>
              <p className="mt-1 text-sm font-semibold">{epic.title}</p>
              <p className="text-xs text-muted-foreground">{epic.description}</p>
            </Node>

            <ChainArrow label="que contiene la historia de usuario" />

            {/* Historia + criterios */}
            <Node icon={<ListChecks className="size-4 text-warning" />} tint="bg-warning/15">
              <div className="flex items-center gap-2">
                <IdChip>{story.id}</IdChip>
                <span className="text-xs uppercase tracking-wide text-muted-foreground">Historia</span>
              </div>
              <p className="mt-1 text-sm font-semibold">{story.title}</p>
              <ul className="mt-2 space-y-1">
                {story.criteria.map((cr) => (
                  <li key={cr.id} className="flex items-start gap-2">
                    <CriterionPill status={cr.status} />
                    <span className="text-xs text-muted-foreground">{cr.text}</span>
                  </li>
                ))}
              </ul>
            </Node>

            <ChainArrow label="realizada por la tarea" />

            {/* Tarea */}
            <Node icon={<Avatar member={memberById(task.assigneeId)} size="sm" />} tint="bg-transparent">
              <div className="flex items-center gap-2">
                <IdChip>{task.id}</IdChip>
                <StatusBadge status={task.status} />
              </div>
              <p className="mt-1 text-sm font-semibold">{task.title}</p>
              <div className="mt-2 flex items-center gap-2">
                <CompletionBar value={task.completion} className="max-w-[160px]" />
                <span className="text-xs tabular-nums text-muted-foreground">{task.completion}%</span>
              </div>
            </Node>

            <ChainArrow label="con evidencia en el código" />

            {/* Evidencia en código */}
            {hasEvidence ? (
              <div className="space-y-2 rounded-md border border-border bg-background/40 p-3">
                {taskPrs.map((pr) => (
                  <div key={pr.id} className="flex items-center gap-2 rounded border border-border bg-card px-3 py-2">
                    <GitPullRequest className="size-4 shrink-0 text-primary" />
                    <span className="font-mono text-xs text-muted-foreground">#{pr.number}</span>
                    <span className="min-w-0 flex-1 truncate text-sm">{pr.title}</span>
                    <ChecksBadge checks={pr.checks} />
                    <PrStatusBadge status={pr.status} />
                  </div>
                ))}
                {taskCommits.map((c) => (
                  <div key={c.id} className="flex items-center gap-2 px-3 py-1.5">
                    <GitCommitHorizontal className="size-4 shrink-0 text-muted-foreground" />
                    <span className="font-mono text-xs text-primary">{c.sha}</span>
                    <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">{c.message}</span>
                    <span className="shrink-0 font-mono text-xs text-success">+{c.additions}</span>
                    <span className="shrink-0 font-mono text-xs text-danger">−{c.deletions}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-danger/40 bg-danger/5 p-4 text-center">
                <p className="text-sm font-medium text-danger">Sin evidencia en el código</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  El agente no encontró commits ni pull requests asociados a esta tarea. No se puede
                  verificar avance real todavía.
                </p>
              </div>
            )}
          </div>
        </Panel>

        {/* Lectura del agente */}
        <Panel>
          <PanelHeader title="Lectura del agente" hint="cómo sabemos que funciona" />
          <div className="p-4">
            <p className="text-sm text-muted-foreground">{task.agentNote}</p>
          </div>
        </Panel>
      </div>
    </div>
  )
}
