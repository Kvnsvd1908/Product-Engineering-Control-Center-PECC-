'use client'

import { useState } from 'react'
import {
  Check,
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  GitBranch,
  Globe,
  Layers,
  Link2,
  Loader2,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react'
import { Panel, PanelHeader } from '@/components/control-center/primitives'
import { cn } from '@/lib/utils'

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  )
}

type GitPlatform = 'github' | 'gitlab' | 'bitbucket'
type BoardProvider = 'github_issues' | 'notion' | 'jira' | 'taiga' | 'none'
type ConnectionStatus = 'idle' | 'testing' | 'success' | 'error'

export function ConnectionsView() {
  // Estado de Git
  const [gitPlatform, setGitPlatform] = useState<GitPlatform>('github')
  const [repoUrl, setRepoUrl] = useState('https://github.com/acme/checkout-platform')
  const [gitToken, setGitToken] = useState('')
  const [showGitToken, setShowGitToken] = useState(false)
  const [gitStatus, setGitStatus] = useState<ConnectionStatus>('success')
  const [gitStatusMsg, setGitStatusMsg] = useState('Conectado al repositorio acme/checkout-platform')

  // Estado del Tablero
  const [boardProvider, setBoardProvider] = useState<BoardProvider>('notion')
  const [boardStatus, setBoardStatus] = useState<ConnectionStatus>('success')
  const [boardStatusMsg, setBoardStatusMsg] = useState('Conectado a la base de datos de Producto en Notion')

  // Campos específicos de tableros
  // Notion
  const [notionDbUrl, setNotionDbUrl] = useState('https://notion.so/acme/Product-Roadmap-8fa41137')
  const [notionToken, setNotionToken] = useState('')
  const [showNotionToken, setShowNotionToken] = useState(false)

  // Jira
  const [jiraDomain, setJiraDomain] = useState('https://mi-empresa.atlassian.net')
  const [jiraEmail, setJiraEmail] = useState('')
  const [jiraToken, setJiraToken] = useState('')
  const [jiraProjectKey, setJiraProjectKey] = useState('')
  const [showJiraToken, setShowJiraToken] = useState(false)

  // Taiga
  const [taigaUrl, setTaigaUrl] = useState('https://tree.taiga.io')
  const [taigaProjectSlug, setTaigaProjectSlug] = useState('')
  const [taigaToken, setTaigaToken] = useState('')
  const [showTaigaToken, setShowTaigaToken] = useState(false)

  // Estado de Sincronización general
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncSuccess, setSyncSuccess] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState('Hace 3 minutos')

  // Handlers para probar conexión de Git
  const handleTestGit = () => {
    setGitStatus('testing')
    setGitStatusMsg('Probando autenticación y acceso al repositorio...')
    setTimeout(() => {
      if (!repoUrl.trim()) {
        setGitStatus('error')
        setGitStatusMsg('Debes ingresar la URL o nombre del repositorio.')
      } else {
        setGitStatus('success')
        setGitStatusMsg('¡Conexión exitosa! Acceso verificado a ramas, commits y pull requests.')
      }
    }, 1200)
  }

  // Handlers para probar conexión de Tablero
  const handleTestBoard = () => {
    if (boardProvider === 'none') {
      setBoardStatus('idle')
      return
    }
    setBoardStatus('testing')
    setBoardStatusMsg(`Verificando credenciales y permisos en ${boardProvider.toUpperCase()}...`)
    setTimeout(() => {
      setBoardStatus('success')
      if (boardProvider === 'github_issues') {
        setBoardStatusMsg('Se usarán los Issues del repositorio Git como Historias de Usuario.')
      } else if (boardProvider === 'notion') {
        setBoardStatusMsg('Base de datos de Notion encontrada y accesible.')
      } else if (boardProvider === 'jira') {
        setBoardStatusMsg('Proyecto Jira validado. Se extrajeron las épicas y tareas activas.')
      } else if (boardProvider === 'taiga') {
        setBoardStatusMsg('Proyecto de Taiga verificado correctamente.')
      }
    }, 1300)
  }

  // Sincronización completa
  const handleSyncAll = () => {
    setIsSyncing(true)
    setSyncSuccess(false)
    setTimeout(() => {
      setIsSyncing(false)
      setSyncSuccess(true)
      setLastSyncTime('Justo ahora')
      setTimeout(() => setSyncSuccess(false), 4000)
    }, 1600)
  }

  // Restaurar datos demo
  const handleResetDemo = () => {
    setRepoUrl('https://github.com/acme/checkout-platform')
    setGitToken('')
    setGitStatus('success')
    setGitStatusMsg('Conectado al repositorio de demostración (acme/checkout-platform)')
    setBoardProvider('notion')
    setNotionDbUrl('https://notion.so/acme/Product-Roadmap-8fa41137')
    setNotionToken('')
    setBoardStatus('success')
    setBoardStatusMsg('Conectado a la base de datos de demostración en Notion')
    setLastSyncTime('Datos de demo restaurados')
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Banner explicativo */}
      <div className="relative overflow-hidden rounded-lg border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-background p-4 sm:p-5">
        <div className="flex items-start gap-3.5">
          <div className="rounded-md bg-primary/15 p-2 text-primary">
            <Link2 className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-foreground">
              Conexión de Fuentes: Código y Gestión de Producto
            </h2>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
              Configura tu repositorio Git para extraer commits y Pull Requests en tiempo real. Opcionalmente, 
              vincula el tablero donde documentas tus Historias de Usuario (Notion, Jira, Taiga o GitHub Issues). 
              El motor de trazabilidad cruzará ambas fuentes automáticamente para detectar desvíos y validar el avance real.
            </p>
          </div>
        </div>
      </div>

      {/* Grid de Configuración: Git + Tablero */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 1. SECCIÓN REPOSITORIO GIT */}
        <Panel className="flex flex-col justify-between">
          <div>
            <PanelHeader
              title="1. Repositorio de Código (Git)"
              icon={<GithubIcon className="size-4" />}
              hint="obligatorio"
              right={
                <span className={cn(
                  'inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full',
                  gitStatus === 'success' && 'bg-success/15 text-success',
                  gitStatus === 'error' && 'bg-danger/15 text-danger',
                  gitStatus === 'testing' && 'bg-warning/15 text-warning',
                  gitStatus === 'idle' && 'bg-muted text-muted-foreground',
                )}>
                  <span className={cn(
                    'size-1.5 rounded-full',
                    gitStatus === 'success' && 'bg-success',
                    gitStatus === 'error' && 'bg-danger',
                    gitStatus === 'testing' && 'bg-warning animate-pulse',
                    gitStatus === 'idle' && 'bg-muted-foreground',
                  )} />
                  {gitStatus === 'success' && 'Conectado'}
                  {gitStatus === 'error' && 'Error'}
                  {gitStatus === 'testing' && 'Verificando...'}
                  {gitStatus === 'idle' && 'No verificado'}
                </span>
              }
            />

            <div className="space-y-4 p-4">
              {/* Selector de Proveedor Git */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Plataforma Git
                </label>
                <div className="mt-1.5 grid grid-cols-3 gap-2">
                  {(['github', 'gitlab', 'bitbucket'] as const).map((platform) => (
                    <button
                      key={platform}
                      type="button"
                      onClick={() => setGitPlatform(platform)}
                      className={cn(
                        'flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-xs font-medium capitalize transition-colors',
                        gitPlatform === platform
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-background/50 text-muted-foreground hover:bg-accent hover:text-foreground',
                      )}
                    >
                      {platform === 'github' && <GithubIcon className="size-3.5" />}
                      {platform === 'gitlab' && <GitBranch className="size-3.5" />}
                      {platform === 'bitbucket' && <Globe className="size-3.5" />}
                      {platform}
                    </button>
                  ))}
                </div>
              </div>

              {/* URL del Repositorio */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    URL o Nombre del Repositorio
                  </label>
                  <span className="text-xs text-muted-foreground">owner/repo</span>
                </div>
                <div className="relative mt-1.5">
                  <input
                    type="text"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    placeholder="https://github.com/usuario/nombre-repositorio"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none font-mono"
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Ejemplo: <code className="font-mono text-foreground/80">https://github.com/KevinSoto/mi-proyecto</code>
                </p>
              </div>

              {/* Token de Acceso Personal (PAT) */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Token de Acceso Personal (PAT)
                  </label>
                  <a
                    href="https://github.com/settings/tokens"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    Crear token en GitHub
                    <ExternalLink className="size-3" />
                  </a>
                </div>
                <div className="relative mt-1.5">
                  <input
                    type={showGitToken ? 'text' : 'password'}
                    value={gitToken}
                    onChange={(e) => setGitToken(e.target.value)}
                    placeholder={gitToken ? '••••••••••••••••••••••••' : 'ghp_xxxxxxxxxxxxxxxxxxxxxx'}
                    className="w-full rounded-md border border-input bg-background pr-10 pl-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowGitToken((prev) => !prev)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    title={showGitToken ? 'Ocultar token' : 'Mostrar token'}
                  >
                    {showGitToken ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                <div className="mt-1.5 flex items-start gap-1.5 text-xs text-muted-foreground">
                  <ShieldCheck className="size-3.5 shrink-0 text-success mt-0.5" />
                  <span>Permisos mínimos requeridos: <code className="font-mono text-foreground/80">repo</code> (lectura de commits, branches, PRs y checks).</span>
                </div>
              </div>
            </div>
          </div>

          {/* Feedback y Botón de Git */}
          <div className="border-t border-border p-4 bg-card/50">
            {gitStatusMsg && (
              <p className={cn(
                'mb-3 text-xs leading-relaxed',
                gitStatus === 'success' && 'text-success',
                gitStatus === 'error' && 'text-danger',
                gitStatus === 'testing' && 'text-warning',
                gitStatus === 'idle' && 'text-muted-foreground',
              )}>
                {gitStatusMsg}
              </p>
            )}
            <button
              type="button"
              onClick={handleTestGit}
              disabled={gitStatus === 'testing'}
              className="inline-flex items-center justify-center gap-2 w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-accent disabled:opacity-50"
            >
              {gitStatus === 'testing' ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Verificando repositorio...
                </>
              ) : (
                <>
                  <Check className="size-3.5" />
                  Probar Conexión con Git
                </>
              )}
            </button>
          </div>
        </Panel>

        {/* 2. SECCIÓN TABLERO DE GESTIÓN */}
        <Panel className="flex flex-col justify-between">
          <div>
            <PanelHeader
              title="2. Tablero de Requerimientos (HU)"
              icon={<Layers className="size-4" />}
              hint="opcional"
              right={
                <span className={cn(
                  'inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full',
                  boardProvider === 'none' && 'bg-muted text-muted-foreground',
                  boardProvider !== 'none' && boardStatus === 'success' && 'bg-success/15 text-success',
                  boardProvider !== 'none' && boardStatus === 'error' && 'bg-danger/15 text-danger',
                  boardProvider !== 'none' && boardStatus === 'testing' && 'bg-warning/15 text-warning',
                  boardProvider !== 'none' && boardStatus === 'idle' && 'bg-muted text-muted-foreground',
                )}>
                  <span className={cn(
                    'size-1.5 rounded-full',
                    boardProvider === 'none' && 'bg-muted-foreground',
                    boardProvider !== 'none' && boardStatus === 'success' && 'bg-success',
                    boardProvider !== 'none' && boardStatus === 'error' && 'bg-danger',
                    boardProvider !== 'none' && boardStatus === 'testing' && 'bg-warning animate-pulse',
                    boardProvider !== 'none' && boardStatus === 'idle' && 'bg-muted-foreground',
                  )} />
                  {boardProvider === 'none' ? 'Desactivado' : (
                    boardStatus === 'success' ? 'Conectado' : (
                      boardStatus === 'error' ? 'Error' : (
                        boardStatus === 'testing' ? 'Verificando...' : 'No verificado'
                      )
                    )
                  )}
                </span>
              }
            />

            <div className="space-y-4 p-4">
              {/* Selector de Proveedor de Tablero */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Proveedor de Historias de Usuario
                </label>
                <div className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[
                    { id: 'notion', label: 'Notion' },
                    { id: 'jira', label: 'Jira' },
                    { id: 'taiga', label: 'Taiga' },
                    { id: 'github_issues', label: 'Issues' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setBoardProvider(p.id as BoardProvider)
                        setBoardStatus('idle')
                        setBoardStatusMsg('')
                      }}
                      className={cn(
                        'flex items-center justify-center gap-1.5 rounded-md border px-2.5 py-2 text-xs font-medium transition-colors',
                        boardProvider === p.id
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-background/50 text-muted-foreground hover:bg-accent hover:text-foreground',
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Formulario Dinámico según proveedor */}
              {boardProvider === 'notion' && (
                <div className="space-y-3 rounded-md border border-border/60 bg-accent/20 p-3">
                  <div>
                    <label className="text-xs font-medium text-foreground">
                      URL o ID de la Base de Datos de Notion
                    </label>
                    <input
                      type="text"
                      value={notionDbUrl}
                      onChange={(e) => setNotionDbUrl(e.target.value)}
                      placeholder="https://notion.so/mi-equipo/Product-Backlog-xxxx"
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-foreground">
                        Internal Integration Secret (Token)
                      </label>
                      <a
                        href="https://www.notion.so/my-integrations"
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                      >
                        Crear integración
                        <ExternalLink className="size-2.5" />
                      </a>
                    </div>
                    <div className="relative mt-1">
                      <input
                        type={showNotionToken ? 'text' : 'password'}
                        value={notionToken}
                        onChange={(e) => setNotionToken(e.target.value)}
                        placeholder="secret_xxxxxxxxxxxxxxxxxxxxxxxxxx"
                        className="w-full rounded-md border border-input bg-background pr-8 pl-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNotionToken((prev) => !prev)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showNotionToken ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    💡 Recuerda conectar la integración en tu página de Notion: <span className="text-foreground">••• &gt; Conexiones &gt; Añadir conexión</span>.
                  </p>
                </div>
              )}

              {boardProvider === 'jira' && (
                <div className="space-y-3 rounded-md border border-border/60 bg-accent/20 p-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-medium text-foreground">Dominio Atlassian</label>
                      <input
                        type="text"
                        value={jiraDomain}
                        onChange={(e) => setJiraDomain(e.target.value)}
                        placeholder="https://empresa.atlassian.net"
                        className="mt-1 w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground font-mono focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-foreground">Clave del Proyecto (Key)</label>
                      <input
                        type="text"
                        value={jiraProjectKey}
                        onChange={(e) => setJiraProjectKey(e.target.value)}
                        placeholder="PROJ o SPRINT1"
                        className="mt-1 w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground font-mono focus:border-primary focus:outline-none uppercase"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-medium text-foreground">Email de Atlassian</label>
                      <input
                        type="email"
                        value={jiraEmail}
                        onChange={(e) => setJiraEmail(e.target.value)}
                        placeholder="tu-email@empresa.com"
                        className="mt-1 w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-foreground">Jira API Token</label>
                        <a
                          href="https://id.atlassian.com/manage-profile/security/api-tokens"
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                        >
                          Crear Token
                          <ExternalLink className="size-2.5" />
                        </a>
                      </div>
                      <div className="relative mt-1">
                        <input
                          type={showJiraToken ? 'text' : 'password'}
                          value={jiraToken}
                          onChange={(e) => setJiraToken(e.target.value)}
                          placeholder="Token de Jira"
                          className="w-full rounded-md border border-input bg-background pr-8 pl-3 py-1.5 text-xs text-foreground font-mono focus:border-primary focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowJiraToken((prev) => !prev)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showJiraToken ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {boardProvider === 'taiga' && (
                <div className="space-y-3 rounded-md border border-border/60 bg-accent/20 p-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-medium text-foreground">URL de la Instancia Taiga</label>
                      <input
                        type="text"
                        value={taigaUrl}
                        onChange={(e) => setTaigaUrl(e.target.value)}
                        placeholder="https://tree.taiga.io"
                        className="mt-1 w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground font-mono focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-foreground">Slug o ID del Proyecto</label>
                      <input
                        type="text"
                        value={taigaProjectSlug}
                        onChange={(e) => setTaigaProjectSlug(e.target.value)}
                        placeholder="miusuario-proyecto"
                        className="mt-1 w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground font-mono focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-foreground">Taiga Auth Token (API)</label>
                      <span className="text-xs text-muted-foreground">Bearer Token</span>
                    </div>
                    <div className="relative mt-1">
                      <input
                        type={showTaigaToken ? 'text' : 'password'}
                        value={taigaToken}
                        onChange={(e) => setTaigaToken(e.target.value)}
                        placeholder="Auth token de Taiga"
                        className="w-full rounded-md border border-input bg-background pr-8 pl-3 py-1.5 text-xs text-foreground font-mono focus:border-primary focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowTaigaToken((prev) => !prev)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showTaigaToken ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {boardProvider === 'github_issues' && (
                <div className="rounded-md border border-border/60 bg-accent/20 p-3.5">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="size-4 text-success shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-foreground">
                        Integración Nativa con GitHub Issues
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                        No necesitas configurar nada extra. El sistema leerá automáticamente los Issues del repositorio 
                        configurado en el Paso 1 y los convertirá en Historias de Usuario, transformando los checkboxes de su descripción en Criterios de Aceptación.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setBoardProvider(boardProvider === 'none' ? 'notion' : 'none')}
                  className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
                >
                  {boardProvider === 'none' ? 'Activar tablero de requerimientos' : 'No usar tablero (solo Git)'}
                </button>
              </div>
            </div>
          </div>

          {/* Feedback y Botón de Tablero */}
          <div className="border-t border-border p-4 bg-card/50">
            {boardStatusMsg && boardProvider !== 'none' && (
              <p className={cn(
                'mb-3 text-xs leading-relaxed',
                boardStatus === 'success' && 'text-success',
                boardStatus === 'error' && 'text-danger',
                boardStatus === 'testing' && 'text-warning',
                boardStatus === 'idle' && 'text-muted-foreground',
              )}>
                {boardStatusMsg}
              </p>
            )}
            <button
              type="button"
              onClick={handleTestBoard}
              disabled={boardStatus === 'testing' || boardProvider === 'none'}
              className="inline-flex items-center justify-center gap-2 w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-accent disabled:opacity-50"
            >
              {boardStatus === 'testing' ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Verificando tablero...
                </>
              ) : (
                <>
                  <Check className="size-3.5" />
                  Probar Conexión del Tablero
                </>
              )}
            </button>
          </div>
        </Panel>
      </div>

      {/* 3. RESUMEN DE SINCRONIZACIÓN Y ACCIONES GLOBALES */}
      <Panel className="p-5 border-primary/30">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="relative flex size-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                <span className="relative inline-flex rounded-full size-2.5 bg-success"></span>
              </span>
              <h3 className="text-sm font-semibold text-foreground">
                Estado del Motor de Trazabilidad
              </h3>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Última sincronización: <span className="text-foreground font-medium">{lastSyncTime}</span> · Repositorio: <code className="font-mono text-primary font-semibold">{repoUrl.split('/').slice(-2).join('/') || repoUrl}</code>
            </p>
            {syncSuccess && (
              <p className="mt-1.5 text-xs text-success font-medium flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5" />
                ¡Sincronización completada con éxito! Todas las vistas se han actualizado con los datos del repositorio.
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleResetDemo}
              className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              title="Vuelve a cargar los datos de ejemplo predeterminados"
            >
              <RotateCcw className="size-3.5" />
              Restaurar Demo
            </button>

            <button
              type="button"
              onClick={handleSyncAll}
              disabled={isSyncing}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              <RefreshCw className={cn('size-3.5', isSyncing && 'animate-spin')} />
              {isSyncing ? 'Sincronizando fuentes...' : 'Guardar y Sincronizar'}
            </button>
          </div>
        </div>
      </Panel>
    </div>
  )
}
