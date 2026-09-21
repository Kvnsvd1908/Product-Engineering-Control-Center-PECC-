'use client'

import { LogOut, Moon, PanelLeft, RefreshCw, Sun, UserRound } from 'lucide-react'

export function Topbar({
  title,
  subtitle,
  onOpenMobile,
  onOpenConnections,
  theme,
  onToggleTheme,
  onLogout,
  userName,
}: {
  title: string
  subtitle: string
  onOpenMobile: () => void
  onOpenConnections?: () => void
  theme: 'dark' | 'light'
  onToggleTheme: () => void
  onLogout?: () => void
  userName?: string
}) {
  function logout() {
    void fetch('/api/live', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'disconnect' }) }).finally(() => {
      window.localStorage.removeItem('pecc-demo-session')
      onLogout?.()
    })
  }

  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-background/82 px-4 py-4 shadow-[0_12px_36px_oklch(0_0_0/16%)] backdrop-blur-xl lg:px-8">
      <button
        onClick={onOpenMobile}
        className="pecc-hover rounded-md p-1.5 text-muted-foreground hover:bg-accent lg:hidden"
        aria-label="Abrir menú"
      >
        <PanelLeft className="size-5" />
      </button>

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary"><span className="size-1.5 rounded-full bg-primary shadow-[0_0_10px_currentColor]" /> Live workspace</div>
        <h1 className="truncate text-xl font-semibold tracking-[-0.02em]">{title}</h1>
        <p className="hidden truncate text-xs text-muted-foreground sm:block">{subtitle}</p>
      </div>


      <button
        onClick={onToggleTheme}
        className="pecc-hover rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
        aria-label={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
        title={theme === 'dark' ? 'Tema claro' : 'Tema oscuro'}
      >
        {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
      </button>

      <button
        onClick={onOpenConnections}
        className="pecc-hover hidden items-center gap-1.5 rounded-md border border-primary/25 bg-primary/5 px-2.5 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10 sm:flex cursor-pointer"
        title="Configurar y sincronizar fuentes de datos (Git, Notion, Jira, Taiga)"
      >
        <RefreshCw className="size-3.5" />
        Sincronizar
      </button>

      {userName && <div className="hidden items-center gap-2 border-l border-border pl-3 sm:flex"><span className="flex size-7 items-center justify-center rounded-full bg-primary/15 text-primary"><UserRound className="size-3.5" /></span><span className="max-w-28 truncate text-xs font-medium text-muted-foreground" title={userName}>{userName}</span></div>}

      {onLogout && <button onClick={logout} className="pecc-hover rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="Cerrar sesión" title="Cerrar sesión"><LogOut className="size-4" /></button>}

    </header>
  )
}
