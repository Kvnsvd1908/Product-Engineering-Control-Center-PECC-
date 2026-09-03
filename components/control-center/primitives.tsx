import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import {
  type CheckStatus,
  type Confidence,
  type CriterionStatus,
  type KanbanStatus,
  type Member,
  type PrStatus,
  type Severity,
  statusLabels,
} from '@/lib/data'

// --- Panel ---------------------------------------------------------------

export function Panel({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-card',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function PanelHeader({
  title,
  icon,
  right,
  hint,
}: {
  title: string
  icon?: ReactNode
  right?: ReactNode
  hint?: string
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
      <div className="flex items-center gap-2 min-w-0">
        {icon ? <span className="text-muted-foreground">{icon}</span> : null}
        <h3 className="truncate text-sm font-semibold tracking-tight">{title}</h3>
        {hint ? (
          <span className="hidden text-xs text-muted-foreground sm:inline">· {hint}</span>
        ) : null}
      </div>
      {right}
    </div>
  )
}

// --- Avatar --------------------------------------------------------------

const tint: Record<string, string> = {
  info: 'bg-info/15 text-info',
  primary: 'bg-primary/15 text-primary',
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/15 text-warning',
  danger: 'bg-danger/15 text-danger',
}

export function Avatar({
  member,
  size = 'md',
}: {
  member: Member | null
  size?: 'sm' | 'md'
}) {
  const dim = size === 'sm' ? 'size-6 text-[10px]' : 'size-7 text-xs'
  if (!member) {
    return (
      <span
        className={cn(
          'inline-flex items-center justify-center rounded-full border border-dashed border-border font-medium text-muted-foreground',
          dim,
        )}
        title="Sin asignar"
        aria-label="Sin asignar"
      >
        ?
      </span>
    )
  }
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full font-semibold',
        dim,
        tint[member.color] ?? tint.primary,
      )}
      title={`${member.name} · ${member.role}`}
      aria-label={member.name}
    >
      {member.initials}
    </span>
  )
}

// --- Completion bar ------------------------------------------------------

export function CompletionBar({
  value,
  className,
}: {
  value: number
  className?: string
}) {
  const color =
    value >= 100
      ? 'bg-success'
      : value >= 60
        ? 'bg-primary'
        : value >= 30
          ? 'bg-warning'
          : value > 0
            ? 'bg-danger'
            : 'bg-muted-foreground/40'
  return (
    <div
      className={cn('h-1.5 w-full overflow-hidden rounded-full bg-muted', className)}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${value}%` }} />
    </div>
  )
}

// --- Kanban status badge -------------------------------------------------

const kanbanStyles: Record<KanbanStatus, string> = {
  backlog: 'bg-muted text-muted-foreground',
  todo: 'bg-muted text-foreground/80',
  in_progress: 'bg-info/15 text-info',
  in_review: 'bg-warning/15 text-warning',
  done: 'bg-success/15 text-success',
  blocked: 'bg-danger/15 text-danger',
}

export function StatusBadge({ status }: { status: KanbanStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium',
        kanbanStyles[status],
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {statusLabels[status]}
    </span>
  )
}

// --- Confidence tag ------------------------------------------------------

export function ConfidenceTag({ level }: { level: Confidence }) {
  const styles: Record<Confidence, string> = {
    alta: 'text-success',
    media: 'text-warning',
    baja: 'text-danger',
  }
  return (
    <span className={cn('text-xs font-medium', styles[level])} title="Confianza del agente en la evaluación">
      confianza {level}
    </span>
  )
}

// --- Criterion status pill ----------------------------------------------

export function CriterionPill({ status }: { status: CriterionStatus }) {
  const map: Record<CriterionStatus, { label: string; cls: string }> = {
    covered: { label: 'Cubierto', cls: 'bg-success/15 text-success' },
    partial: { label: 'Parcial', cls: 'bg-warning/15 text-warning' },
    uncovered: { label: 'Sin cubrir', cls: 'bg-danger/15 text-danger' },
  }
  const { label, cls } = map[status]
  return (
    <span className={cn('inline-flex shrink-0 items-center rounded px-1.5 py-0.5 text-[11px] font-medium', cls)}>
      {label}
    </span>
  )
}

// --- PR status + checks --------------------------------------------------

export function PrStatusBadge({ status }: { status: PrStatus }) {
  const map: Record<PrStatus, { label: string; cls: string }> = {
    draft: { label: 'Borrador', cls: 'bg-muted text-muted-foreground' },
    open: { label: 'Abierto', cls: 'bg-success/15 text-success' },
    in_review: { label: 'En revisión', cls: 'bg-warning/15 text-warning' },
    merged: { label: 'Fusionado', cls: 'bg-info/15 text-info' },
  }
  const { label, cls } = map[status]
  return <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium', cls)}>{label}</span>
}

export function ChecksBadge({ checks }: { checks: CheckStatus }) {
  const map: Record<CheckStatus, { label: string; cls: string }> = {
    passing: { label: 'checks ✓', cls: 'text-success' },
    failing: { label: 'checks ✕', cls: 'text-danger' },
    pending: { label: 'checks …', cls: 'text-warning' },
    none: { label: 'sin checks', cls: 'text-muted-foreground' },
  }
  const { label, cls } = map[checks]
  return <span className={cn('font-mono text-xs', cls)}>{label}</span>
}

// --- Severity dot --------------------------------------------------------

export function SeverityDot({ severity }: { severity: Severity }) {
  const map: Record<Severity, string> = {
    high: 'bg-danger',
    medium: 'bg-warning',
    low: 'bg-muted-foreground',
  }
  return <span className={cn('size-2 shrink-0 rounded-full', map[severity])} />
}

export function SeverityLabel({ severity }: { severity: Severity }) {
  const map: Record<Severity, { label: string; cls: string }> = {
    high: { label: 'Alta', cls: 'text-danger' },
    medium: { label: 'Media', cls: 'text-warning' },
    low: { label: 'Baja', cls: 'text-muted-foreground' },
  }
  const { label, cls } = map[severity]
  return <span className={cn('text-xs font-semibold uppercase tracking-wide', cls)}>{label}</span>
}

// --- Mono id chip --------------------------------------------------------

export function IdChip({ children }: { children: ReactNode }) {
  return (
    <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
      {children}
    </span>
  )
}
