'use client'

import { GitBranch, GitPullRequest, TriangleAlert } from 'lucide-react'
import {
  memberById,
  pullRequests,
  storyById,
  taskById,
} from '@/lib/data'
import {
  Avatar,
  ChecksBadge,
  IdChip,
  Panel,
  PanelHeader,
  PrStatusBadge,
} from '@/components/control-center/primitives'

export function PullRequestsView() {
  const open = pullRequests.filter((p) => p.status !== 'merged')
  const merged = pullRequests.filter((p) => p.status === 'merged')

  const Row = ({ prId }: { prId: string }) => {
    const pr = pullRequests.find((p) => p.id === prId)!
    const author = memberById(pr.authorId)
    const task = pr.taskId ? taskById(pr.taskId) : null
    const story = task ? storyById(task.storyId) : null
    return (
      <li className="px-4 py-3">
        <div className="flex items-start gap-3">
          <GitPullRequest className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground">#{pr.number}</span>
              <span className="text-sm font-medium">{pr.title}</span>
              <PrStatusBadge status={pr.status} />
              <ChecksBadge checks={pr.checks} />
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1 font-mono">
                <GitBranch className="size-3" />
                {pr.branch}
              </span>
              <span className="font-mono text-success">+{pr.additions}</span>
              <span className="font-mono text-danger">−{pr.deletions}</span>
              <span>{pr.filesChanged} archivos</span>
              <span>{pr.openedAgo}</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              {task ? (
                <>
                  <IdChip>{task.id}</IdChip>
                  <span className="truncate text-xs text-muted-foreground">
                    {story?.title}
                  </span>
                </>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-md bg-warning/15 px-2 py-0.5 text-xs font-medium text-warning">
                  <TriangleAlert className="size-3" />
                  Sin tarea asociada
                </span>
              )}
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <Avatar member={author} size="sm" />
            {pr.reviewers.length > 0 ? (
              <div className="flex -space-x-1.5">
                {pr.reviewers.map((r) => (
                  <Avatar key={r} member={memberById(r)} size="sm" />
                ))}
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">sin revisor</span>
            )}
          </div>
        </div>
      </li>
    )
  }

  return (
    <div className="space-y-4">
      <Panel>
        <PanelHeader
          title="Abiertos / en revisión"
          icon={<GitPullRequest className="size-4" />}
          hint={`${open.length} pull requests`}
        />
        <ul className="divide-y divide-border">
          {open.map((pr) => (
            <Row key={pr.id} prId={pr.id} />
          ))}
        </ul>
      </Panel>

      <Panel>
        <PanelHeader
          title="Fusionados recientemente"
          icon={<GitPullRequest className="size-4" />}
          hint={`${merged.length} pull requests`}
        />
        <ul className="divide-y divide-border">
          {merged.map((pr) => (
            <Row key={pr.id} prId={pr.id} />
          ))}
        </ul>
      </Panel>
    </div>
  )
}
