'use client'

import { PanelLeft, RefreshCw, Search } from 'lucide-react'
import { members } from '@/lib/data'
import { Avatar } from '@/components/control-center/primitives'

export function Topbar({
  title,
  subtitle,
  onOpenMobile,
  onOpenConnections,
}: {
  title: string
  subtitle: string
  onOpenMobile: () => void
  onOpenConnections?: () => void
}) {
  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-background/80 px-4 py-3 backdrop-blur lg:px-6">
      <button
        onClick={onOpenMobile}
        className="rounded-md p-1.5 text-muted-foreground hover:bg-accent lg:hidden"
        aria-label="Abrir menú"
      >
        <PanelLeft className="size-5" />
      </button>

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-lg font-semibold tracking-tight">{title}</h1>
        <p className="hidden truncate text-sm text-muted-foreground sm:block">{subtitle}</p>
      </div>

      <div className="hidden items-center gap-2 rounded-md border border-input bg-card px-2.5 py-1.5 text-sm text-muted-foreground md:flex">
        <Search className="size-4" />
        <input
          type="text"
          placeholder="Buscar tarea, PR, historia…"
          className="w-44 bg-transparent outline-none placeholder:text-muted-foreground"
        />
      </div>

      <button
        onClick={onOpenConnections}
        className="hidden items-center gap-1.5 rounded-md border border-input px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground sm:flex cursor-pointer"
        title="Configurar y sincronizar fuentes de datos (Git, Notion, Jira, Taiga)"
      >
        <RefreshCw className="size-3.5" />
        Sincronizar
      </button>

      <div className="flex -space-x-1.5">
        {members.slice(0, 4).map((m) => (
          <Avatar key={m.id} member={m} size="sm" />
        ))}
      </div>
    </header>
  )
}
