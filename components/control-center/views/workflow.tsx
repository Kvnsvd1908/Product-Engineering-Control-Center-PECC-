'use client'

import { kanbanColumns, memberById, storyById, tasks, type KanbanStatus } from '@/lib/data'
import { Avatar, CompletionBar, IdChip } from '@/components/control-center/primitives'
import { cn } from '@/lib/utils'

const columnAccent: Record<KanbanStatus, string> = {
  backlog: 'text-muted-foreground',
  todo: 'text-foreground/80',
  in_progress: 'text-info',
  in_review: 'text-warning',
  done: 'text-success',
  blocked: 'text-danger',
}

export function WorkflowView() {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {kanbanColumns.map((col) => {
        const items = tasks.filter((t) => t.status === col.id)
        return (
          <div key={col.id} className="flex w-72 shrink-0 flex-col rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
              <div className="flex items-center gap-2">
                <span className={cn('size-2 rounded-full bg-current', columnAccent[col.id])} />
                <span className="text-sm font-semibold">{col.label}</span>
              </div>
              <span className="rounded bg-muted px-1.5 py-0.5 text-xs tabular-nums text-muted-foreground">
                {items.length}
              </span>
            </div>

            <div className="flex-1 space-y-2 p-2">
              {items.length === 0 ? (
                <p className="px-1 py-4 text-center text-xs text-muted-foreground">Vacío</p>
              ) : (
                items.map((t) => {
                  const story = storyById(t.storyId)
                  return (
                    <div
                      key={t.id}
                      className="rounded-md border border-border bg-background/50 p-3 transition-colors hover:border-primary/40"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <IdChip>{t.id}</IdChip>
                        <Avatar member={memberById(t.assigneeId)} size="sm" />
                      </div>
                      <p className="mt-2 text-sm font-medium leading-snug text-pretty">{t.title}</p>
                      {story ? (
                        <p className="mt-1 truncate text-xs text-muted-foreground">{story.title}</p>
                      ) : null}
                      <div className="mt-2.5 flex items-center gap-2">
                        <CompletionBar value={t.completion} />
                        <span className="w-9 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                          {t.completion}%
                        </span>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                        <span>{t.points} pts</span>
                        <span>{t.updatedAt}</span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
