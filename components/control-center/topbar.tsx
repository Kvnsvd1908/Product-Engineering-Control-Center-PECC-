'use client'

import { PanelLeft, RefreshCw } from 'lucide-react'

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
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-background/78 px-4 py-3 shadow-[0_8px_30px_oklch(0_0_0/12%)] backdrop-blur lg:px-6">
      <button
        onClick={onOpenMobile}
        className="pecc-hover rounded-md p-1.5 text-muted-foreground hover:bg-accent lg:hidden"
        aria-label="Abrir menú"
      >
        <PanelLeft className="size-5" />
      </button>

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-lg font-semibold tracking-tight">{title}</h1>
        <p className="hidden truncate text-sm text-muted-foreground sm:block">{subtitle}</p>
      </div>


      <button
        onClick={onOpenConnections}
        className="pecc-hover hidden items-center gap-1.5 rounded-md border border-primary/25 bg-primary/5 px-2.5 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10 sm:flex cursor-pointer"
        title="Configurar y sincronizar fuentes de datos (Git, Notion, Jira, Taiga)"
      >
        <RefreshCw className="size-3.5" />
        Sincronizar
      </button>


    </header>
  )
}
