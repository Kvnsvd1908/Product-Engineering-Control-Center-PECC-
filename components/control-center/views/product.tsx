'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, Layers, Target } from 'lucide-react'
import {
  epicsByObjective,
  memberById,
  objectives,
  storiesByEpic,
  storyCoverage,
  tasksByStory,
  type Story,
} from '@/lib/data'
import {
  Avatar,
  CompletionBar,
  CriterionPill,
  IdChip,
  Panel,
  StatusBadge,
} from '@/components/control-center/primitives'

function StoryBlock({ story }: { story: Story }) {
  const [open, setOpen] = useState(false)
  const coverage = storyCoverage(story)
  const tasks = tasksByStory(story.id)
  return (
    <div className="rounded-md border border-border bg-background/40">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 px-3 py-2.5 text-left"
      >
        {open ? (
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        )}
        <IdChip>{story.id}</IdChip>
        <span className="min-w-0 flex-1 truncate text-sm font-medium">{story.title}</span>
        <span className="hidden text-xs text-muted-foreground sm:inline">
          {story.criteria.length} criterios · {tasks.length} tareas
        </span>
        <div className="flex w-28 items-center gap-2">
          <CompletionBar value={coverage} />
          <span className="w-9 shrink-0 text-right text-xs tabular-nums text-muted-foreground">{coverage}%</span>
        </div>
      </button>

      {open ? (
        <div className="space-y-4 border-t border-border px-4 py-3">
          <p className="text-sm text-muted-foreground">{story.description}</p>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Criterios de aceptación
            </p>
            <ul className="space-y-1.5">
              {story.criteria.map((cr) => (
                <li key={cr.id} className="flex items-start gap-2">
                  <CriterionPill status={cr.status} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">{cr.text}</p>
                    {cr.evidence ? (
                      <p className="text-xs text-muted-foreground">{cr.evidence}</p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Tareas
            </p>
            <ul className="space-y-1.5">
              {tasks.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center gap-3 rounded-md border border-border bg-card px-3 py-2"
                >
                  <IdChip>{t.id}</IdChip>
                  <span className="min-w-0 flex-1 truncate text-sm">{t.title}</span>
                  <span className="text-xs tabular-nums text-muted-foreground">{t.completion}%</span>
                  <StatusBadge status={t.status} />
                  <Avatar member={memberById(t.assigneeId)} size="sm" />
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export function ProductView() {
  return (
    <div className="space-y-4">
      {objectives.map((obj) => (
        <Panel key={obj.id} className="overflow-hidden">
          <div className="flex items-start gap-3 border-b border-border bg-background/40 px-4 py-3">
            <span className="mt-0.5 inline-flex size-8 items-center justify-center rounded-md bg-primary/15 text-primary">
              <Target className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <IdChip>{obj.id}</IdChip>
                <h2 className="truncate text-sm font-semibold">{obj.title}</h2>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">{obj.description}</p>
            </div>
            <div className="hidden w-32 shrink-0 sm:block">
              <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                <span>meta</span>
                <span className="tabular-nums">{obj.progress}%</span>
              </div>
              <CompletionBar value={obj.progress} />
            </div>
          </div>

          <div className="space-y-4 p-4">
            {epicsByObjective(obj.id).map((epic) => (
              <div key={epic.id}>
                <div className="mb-2 flex items-center gap-2">
                  <Layers className="size-4 text-muted-foreground" />
                  <IdChip>{epic.id}</IdChip>
                  <span className="text-sm font-semibold">{epic.title}</span>
                  <span className="text-xs text-muted-foreground">— {epic.description}</span>
                </div>
                <div className="space-y-2 pl-6">
                  {storiesByEpic(epic.id).map((story) => (
                    <StoryBlock key={story.id} story={story} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      ))}
    </div>
  )
}
