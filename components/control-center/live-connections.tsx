'use client'

import { useEffect, useState } from 'react'
import { GitBranch, PanelsTopLeft, Link2, Loader2 } from 'lucide-react'
import type { Settings, Snapshot } from '@/lib/live-types'
import { requestLive, useLive } from './live'

const button = 'inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-40 cursor-pointer'
const field = 'w-full rounded-md border border-input bg-background p-2 text-sm'
const providers = {
  notion: { name: 'Notion', placeholder: 'https://www.notion.so/ID-de-la-base-de-datos', hint: 'Pega la URL de la base de datos original y compártela con tu integración de Notion.', token: 'Token de la integración Notion' },
  taiga: { name: 'Taiga', placeholder: 'https://tree.taiga.io/project/mi-proyecto/kanban', hint: 'Pega la URL del proyecto o tablero en Taiga Cloud.', token: 'Token de autenticación Taiga' },
  jira: { name: 'Jira', placeholder: 'https://mi-empresa.atlassian.net/jira/software/projects/APP/boards/1', hint: 'Pega la URL del tablero o proyecto de Jira Cloud.', token: 'API token de Jira' },
}

export function LiveConnections() {
  const { snapshot, setSnapshot, loading } = useLive()
  const [repoUrl, setRepoUrl] = useState(snapshot?.url || '')
  const [gitToken, setGitToken] = useState('')
  const [provider, setProvider] = useState<keyof typeof providers>(snapshot?.board && snapshot.board in providers ? snapshot.board as keyof typeof providers : 'notion')
  const [boardUrl, setBoardUrl] = useState('')
  const [boardToken, setBoardToken] = useState('')
  const [taigaUsername, setTaigaUsername] = useState('')
  const [taigaPassword, setTaigaPassword] = useState('')
  const [email, setEmail] = useState('')
  const [projectKey, setProjectKey] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [messages, setMessages] = useState<Record<string, string>>({})
  const selected = providers[provider]
  const boardError = snapshot?.warnings.find(w => w.startsWith('Tablero no sincronizado:'))
  const boardConnected = snapshot && snapshot.board !== 'none' && !boardError
  const disabled = !!busy || loading

  useEffect(() => {
    if (snapshot && !repoUrl) setRepoUrl(snapshot.url)
  }, [repoUrl, snapshot])

  async function run(scope: 'repo' | 'board' | 'all' | 'disconnect' | 'remove-board') {
    setBusy(scope)
    const target = scope === 'remove-board' ? 'board' : scope
    setMessages(m => ({ ...m, [target]: '' }))
    const settings: Settings = { repoUrl, gitToken, provider: scope === 'remove-board' ? 'none' : provider, boardUrl, boardToken, email, projectKey, taigaUsername, taigaPassword }
    try {
      const result: Snapshot | null = await requestLive(scope === 'disconnect' ? 'disconnect' : 'sync', ['repo', 'board', 'remove-board'].includes(scope) ? { scope: scope === 'remove-board' ? 'board' : scope, settings } : {})
      setSnapshot(result)
      const warning = result?.warnings.find(w => w.startsWith('Tablero no sincronizado:'))
      setMessages(m => ({ ...m, [target]: scope === 'disconnect' ? 'Conexiones cerradas y credenciales eliminadas.' : scope === 'remove-board' ? 'Tablero desconectado.' : scope === 'board' ? warning || `${selected.name} conectado. Sus datos ya están en el resumen.` : scope === 'repo' ? 'Repositorio conectado. Revisa los datos y avisos en Resumen.' : 'Sincronización terminada. Revisa los avisos en Resumen.' }))
      if (scope === 'repo' || scope === 'disconnect') setGitToken('')
      if (scope === 'board' || scope === 'remove-board' || scope === 'disconnect') { setBoardToken(''); setTaigaPassword('') }
    } catch (error) {
      setMessages(m => ({ ...m, [target]: (error as Error).message }))
    } finally { setBusy(null) }
  }

  return <div className="max-w-6xl space-y-5">
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-5">
      <h2 className="flex items-center gap-2 font-semibold"><Link2 className="size-5 text-primary" />Conecta tus fuentes de trabajo</h2>
      <p className="mt-2 text-sm text-muted-foreground">Primero vincula el repositorio. Después agrega tu tablero de Notion, Taiga o Jira para reunir código y gestión de producto en el resumen.</p>
    </div>
    <div className="grid items-start gap-5 lg:grid-cols-2">
      <section aria-labelledby="repo-heading" className="overflow-hidden rounded-lg border bg-card">
        <div className="flex items-start justify-between gap-3 border-b p-5">
          <div><h2 id="repo-heading" className="flex items-center gap-2 font-semibold"><GitBranch className="size-4 text-primary" />1. Repositorio de código</h2><p className="mt-1 text-xs text-muted-foreground">Commits, pull requests y archivos de GitHub</p></div>
          <span className="rounded-full bg-muted px-2 py-1 text-xs">{snapshot ? 'Conectado' : 'Sin conectar'}</span>
        </div>
        <form className="space-y-4 p-5" onSubmit={e => { e.preventDefault(); run('repo') }}>
          {snapshot && <p className="break-all text-sm text-primary">{snapshot.repo} · {snapshot.branch}</p>}
          <label className="block space-y-1"><span className="text-sm">URL del repositorio GitHub</span><input required type="url" className={field} value={repoUrl} onChange={e => setRepoUrl(e.target.value)} placeholder="https://github.com/organizacion/repositorio" /></label>
          <label className="block space-y-1"><span className="text-sm">Token de acceso GitHub</span><input type="password" autoComplete="off" className={field} value={gitToken} onChange={e => setGitToken(e.target.value)} placeholder="Token personal de acceso" /></label>
          <p className="text-xs text-muted-foreground">Opcional para repositorios públicos. Para cambiar la conexión de un repositorio privado, introduce su token nuevamente.</p>
          <button className={button} disabled={disabled}>{busy === 'repo' && <Loader2 className="size-4 animate-spin" />}{busy === 'repo' ? 'Conectando…' : snapshot ? 'Actualizar repositorio' : 'Conectar repositorio'}</button>
          <p role="status" className="text-sm">{messages.repo}</p>
        </form>
      </section>

      <section aria-labelledby="board-heading" className="overflow-hidden rounded-lg border bg-card">
        <div className="flex items-start justify-between gap-3 border-b p-5">
          <div><h2 id="board-heading" className="flex items-center gap-2 font-semibold"><PanelsTopLeft className="size-4 text-primary" />2. Tablero de producto</h2><p className="mt-1 text-xs text-muted-foreground">Historias, tareas y responsables · opcional</p></div>
          <span className="rounded-full bg-muted px-2 py-1 text-xs">{boardError ? 'Revisar conexión' : boardConnected ? `Conectado: ${snapshot.board}` : 'Sin conectar'}</span>
        </div>
        <form className="space-y-4 p-5" onSubmit={e => { e.preventDefault(); run('board') }}>
          <fieldset disabled={disabled} className="space-y-2"><legend className="mb-2 text-sm">Plataforma del tablero</legend><div className="grid grid-cols-3 gap-2">{(Object.keys(providers) as (keyof typeof providers)[]).map(key => <button key={key} type="button" aria-pressed={provider === key} onClick={() => { setProvider(key); setBoardUrl(''); setBoardToken(''); setTaigaUsername(''); setTaigaPassword(''); setEmail(''); setProjectKey(''); setMessages(m => ({ ...m, board: '' })) }} className={`rounded-md border px-3 py-2 text-sm transition-colors ${provider === key ? 'border-primary bg-primary/10 text-primary' : 'border-input text-muted-foreground hover:bg-accent'}`}>{providers[key].name}</button>)}</div></fieldset>
          <label className="block space-y-1"><span className="text-sm">URL {provider === 'notion' ? 'de la base de datos Notion' : `del tablero ${selected.name}`}</span><input required type="url" className={field} value={boardUrl} onChange={e => setBoardUrl(e.target.value)} placeholder={selected.placeholder} /></label>
          <p className="text-xs text-muted-foreground">{selected.hint}</p>
          {provider === 'taiga' ? <><label className="block space-y-1"><span className="text-sm">Nombre de usuario de Taiga</span><input required type="text" autoComplete="username" className={field} value={taigaUsername} onChange={e => setTaigaUsername(e.target.value)} placeholder="Tu nombre de usuario, no el nombre del proyecto" /></label><label className="block space-y-1"><span className="text-sm">Contraseña de Taiga</span><input required type="password" autoComplete="current-password" className={field} value={taigaPassword} onChange={e => setTaigaPassword(e.target.value)} placeholder="Tu contraseña de Taiga" /></label><p className="text-xs text-muted-foreground">La aplicación iniciará sesión en Taiga y guardará el token solo durante esta sesión.</p></> : <label className="block space-y-1"><span className="text-sm">{selected.token}</span><input required type="password" autoComplete="off" className={field} value={boardToken} onChange={e => setBoardToken(e.target.value)} placeholder="Token con acceso al tablero" /></label>}
          {provider === 'jira' && <><label className="block space-y-1"><span className="text-sm">Email de la cuenta Jira</span><input required type="email" className={field} value={email} onChange={e => setEmail(e.target.value)} placeholder="nombre@empresa.com" /></label><label className="block space-y-1"><span className="text-sm">Clave del proyecto (si no está en la URL)</span><input className={field} value={projectKey} onChange={e => setProjectKey(e.target.value)} placeholder="APP" /></label></>}
          {!snapshot && <p className="text-xs text-muted-foreground">Conecta primero el repositorio en el apartado de la izquierda.</p>}
          <div className="flex flex-wrap gap-2"><button className={button} disabled={disabled || !snapshot}>{busy === 'board' && <Loader2 className="size-4 animate-spin" />}{busy === 'board' ? 'Conectando…' : `Conectar ${selected.name}`}</button>{snapshot && snapshot.board !== 'none' && <button type="button" className="rounded-md border px-3 py-2 text-sm disabled:opacity-40" disabled={disabled} onClick={() => run('remove-board')}>Desconectar tablero</button>}</div>
          <p role="status" className="text-sm">{messages.board || boardError}</p>
        </form>
      </section>
    </div>
    {snapshot && <section className="flex flex-wrap items-center justify-between gap-4 rounded-lg border p-5"><div><h2 className="text-sm font-semibold">Sincronización de las fuentes conectadas</h2><p className="mt-1 text-xs text-muted-foreground">Última consulta: {new Date(snapshot.syncedAt).toLocaleString()}</p></div><div className="flex flex-wrap gap-2"><button className={button} disabled={disabled} onClick={() => run('all')}>{busy === 'all' ? 'Sincronizando…' : 'Sincronizar todo'}</button><button className="rounded-md border px-3 py-2 text-sm disabled:opacity-40" disabled={disabled} onClick={() => run('disconnect')}>Desconectar todo</button></div></section>}
    <p role="status" className="text-sm">{messages.all || messages.disconnect}</p>
    <p className="text-xs text-muted-foreground">Las credenciales se mantienen en la sesión del servidor durante cuatro horas. Puedes conectar el tablero sin volver a ingresar el token del repositorio.</p>
  </div>
}
