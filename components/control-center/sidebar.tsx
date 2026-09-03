'use client'

import type { ReactNode } from 'react'
import { GitBranch, Gauge, X } from 'lucide-react'
import type { View } from '@/components/control-center/control-center'
import { cn } from '@/lib/utils'

export interface NavItem {
  id: View
  label: string
  icon: ReactNode
  badge?: number
  badgeTone?: 'default' | 'danger'
}

export function Sidebar({
  nav,
  active,
  onSelect,
  mobileOpen,
  onCloseMobile,
}: {
  nav: NavItem[]
  active: View
  onSelect: (v: View) => void
  mobileOpen: boolean
  onCloseMobile: () => void
}) {
  const content = (
    <div className="flex h-full flex-col bg-sidebar">
      {/* Brand */}
      <div className="flex items-center gap-2.5 border-b border-sidebar-border px-4 py-4">
        <span className="inline-flex size-9 items-center justify-center rounded-md bg-primary/15 text-primary">
          <Gauge className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold leading-tight">Control Center</p>
          <p className="truncate text-xs text-muted-foreground">Product Engineering</p>
        </div>
        <button
          onClick={onCloseMobile}
          className="ml-auto rounded-md p-1 text-muted-foreground hover:bg-sidebar-accent lg:hidden"
          aria-label="Cerrar menú"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
        {nav.map((item) => {
          const isActive = item.id === active
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={cn(
                'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-foreground'
                  : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground',
              )}
            >
              <span
                className={cn(
                  '-ml-1 h-5 w-0.5 rounded-full',
                  isActive ? 'bg-primary' : 'bg-transparent',
                )}
              />
              <span className={cn(isActive && 'text-primary')}>{item.icon}</span>
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge ? (
                <span
                  className={cn(
                    'rounded px-1.5 py-0.5 text-xs font-semibold tabular-nums',
                    item.badgeTone === 'danger'
                      ? 'bg-danger/15 text-danger'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  {item.badge}
                </span>
              ) : null}
            </button>
          )
        })}
      </nav>

      {/* Repo footer */}
      <div className="border-t border-sidebar-border p-3">
        <button
          type="button"
          onClick={() => onSelect('connections')}
          className="flex w-full items-center gap-2 rounded-md bg-sidebar-accent/50 px-3 py-2 text-xs text-left transition-colors hover:bg-sidebar-accent cursor-pointer group"
          title="Configurar repositorio Git y conexiones"
        >
          <GitBranch className="size-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-mono text-foreground/80 group-hover:text-foreground">acme/checkout-platform</p>
            <p className="text-muted-foreground">sincronizado hace 3 min</p>
          </div>
          <span className="ml-auto size-2 shrink-0 rounded-full bg-success" title="Conectado" />
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-sidebar-border lg:block">
        {content}
      </aside>

      {/* Mobile */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-black/60"
            onClick={onCloseMobile}
            aria-label="Cerrar menú"
          />
          <aside className="absolute inset-y-0 left-0 w-64 border-r border-sidebar-border shadow-xl">
            {content}
          </aside>
        </div>
      ) : null}
    </>
  )
}
