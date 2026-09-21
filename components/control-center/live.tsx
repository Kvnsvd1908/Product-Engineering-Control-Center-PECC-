'use client'

import { NotionNotes } from './notion-notes'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Evidence, Proposal, Snapshot } from '@/lib/live-types'
import { projectHealth, type HealthLevel, type ProjectRisk } from '@/lib/live-insights'
import { buildTraceability, traceabilityUnlinked } from '@/lib/traceability'
const button = 'pecc-hover rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground shadow-[0_6px_16px_oklch(0.2_0.04_220/18%)] disabled:opacity-40 cursor-pointer'
const field = 'w-full rounded-md border border-input bg-background p-2 text-sm'
const healthStyles: Record<HealthLevel, { label: string; dot: string; panel: string }> = {
  green: { label: 'En buen camino', dot: 'bg-success', panel: 'border-success/30 bg-success/5' },
  yellow: { label: 'Requiere atención', dot: 'bg-warning', panel: 'border-warning/30 bg-warning/5' },
  red: { label: 'En riesgo', dot: 'bg-danger', panel: 'border-danger/30 bg-danger/5' },
}
export async function requestLive<T = any>(action: string, body: object = {}): Promise<T> {
  let response: Response
  try {
    response = await fetch('/api/live', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...body }), signal: AbortSignal.timeout(300000) })
  } catch (error) {
    if ((error as Error).name === 'TimeoutError') throw new Error('La operación tardó demasiado. Revisa la conexión e inténtalo nuevamente.')
    throw new Error('No se pudo contactar con el servidor local. Comprueba que la aplicación siga ejecutándose.')
  }
  let result: { data?: unknown; error?: string }
  try { result = await response.json() } catch { throw new Error('El servidor devolvió una respuesta inválida. Reinicia la aplicación e inténtalo nuevamente.') }
  if (!response.ok) throw new Error(result.error || 'No se pudo completar la solicitud.')
  return result.data as T
}
const Context = createContext<{ snapshot: Snapshot | null; setSnapshot: (s: Snapshot | null) => void; loading: boolean }>({ snapshot: null, setSnapshot: () => {}, loading: true })
export const useLive = () => useContext(Context)
export function LiveProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null), [loading, setLoading] = useState(true)
  useEffect(() => { requestLive('state').then(s => setSnapshot(s.snapshot)).catch(() => {}).finally(() => setLoading(false)) }, [])
  return <Context.Provider value={{ snapshot, setSnapshot, loading }}>{children}</Context.Provider>
}
export function LiveRecords({ view = 'overview' }: { view?: string }) {
  const { snapshot: s, loading } = useLive()
  const [query, setQuery] = useState(''), [kindFilter, setKindFilter] = useState('all'), [statusFilter, setStatusFilter] = useState('all'), [limit, setLimit] = useState(100)
  if (!s) return <p>{loading ? 'Recuperando sesión…' : 'Conecta un repositorio en Conexiones para consultar datos reales.'}</p>
  const normalizeStatus = (status: string) => status.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
  const taigaInProgress = s.records
    .filter(r => r.kind === 'taiga' && !['done', 'closed', 'accepted', 'resolved', 'finished'].includes(normalizeStatus(r.status)))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5)
  const recentCommits = s.records.filter(r => r.kind === 'commit').sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5)
  const recentPrs = s.records.filter(r => r.kind === 'pr').sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5)
  const health = projectHealth(s)
  const kinds = [...new Set(s.records.map(record => record.kind))].sort()
  const statuses = [...new Set(s.records.map(record => record.status || 'Sin estado'))].sort()
  const records = s.records.filter(r => (view !== 'pull_requests' || r.kind === 'pr') && (!['product', 'workflow'].includes(view) || !['commit', 'pr'].includes(r.kind)) && (kindFilter === 'all' || r.kind === kindFilter) && (statusFilter === 'all' || (r.status || 'Sin estado') === statusFilter) && `${r.title} ${r.actor} ${r.assignee} ${r.status}`.toLowerCase().includes(query.toLowerCase())).sort((a, b) => b.date.localeCompare(a.date))
  return <div className="space-y-5">{view === 'product' && <NotionNotes />}<div className="flex flex-wrap justify-between gap-3"><a className="text-primary underline" href={s.url} target="_blank" rel="noreferrer">{s.repo}</a><span className="text-sm text-muted-foreground">{s.branch} · {new Date(s.syncedAt).toLocaleString()}</span></div>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[['Commits consultados', s.records.filter(r => r.kind === 'commit').length], ['PRs fusionados', s.records.filter(r => r.kind === 'pr' && r.status === 'merged').length], ['PRs abiertos', s.records.filter(r => r.kind === 'pr' && r.status === 'open').length], ['Archivos inventariados', s.files.length]].map(([label, value]) => <div className="rounded-lg border p-4" key={label}><p className="text-sm text-muted-foreground">{label}</p><p className="text-2xl font-semibold">{value}</p></div>)}</div>
    {view === 'overview' && (
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <section className={`rounded-lg border p-4 lg:col-span-2 ${healthStyles[health.level].panel}`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Salud del proyecto</p>
              <div className="mt-1 flex items-center gap-2"><span className={`size-3 rounded-full ${healthStyles[health.level].dot}`} /><h2 className="text-xl font-semibold">{health.label}</h2><span className="text-sm text-muted-foreground">{health.score}/100</span></div>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{health.explanation}</p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">{health.signals.map(signal => <span key={signal} className="rounded-full bg-background/70 px-2.5 py-1">{signal}</span>)}</div>
          </div>
          {health.risks.length > 0 && <div className="mt-4 grid gap-2 md:grid-cols-2">{health.risks.slice(0, 2).map(risk => <RiskCard key={risk.id} risk={risk} compact />)}</div>}
        </section>
        <div className="rounded-lg border bg-card p-4">
          <div className="mb-3 flex items-center justify-between gap-3"><h3 className="font-semibold">Tablero Taiga · HU en ejecución</h3><span className="text-xs text-muted-foreground">{taigaInProgress.length} activas</span></div>
          {taigaInProgress.length ? (
            <ul className="space-y-3">
              {taigaInProgress.map(r => (
                <li key={`${r.kind}:${r.id}`} className="rounded-md border bg-background/40 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <a href={/^https:\/\//.test(r.url) ? r.url : undefined} target="_blank" rel="noreferrer" className="text-primary hover:underline">{r.title}</a>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">{r.status}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span>{r.actor}</span>
                    <span>·</span>
                    <span>{r.assignee || 'Sin responsable'}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No hay historias de Taiga en ejecución en este momento.</p>
          )}
        </div>

        <div className="space-y-4 rounded-lg border bg-card p-4">
          <div>
            <h3 className="font-semibold">Commits recientes</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {recentCommits.length ? recentCommits.map(r => (
                <li key={`${r.kind}:${r.id}`} className="rounded-md border bg-background/40 p-2">
                  <a href={/^https:\/\//.test(r.url) ? r.url : undefined} target="_blank" rel="noreferrer" className="text-primary hover:underline">{r.title}</a>
                  <p className="mt-1 text-xs text-muted-foreground">{r.actor} · {new Date(r.date).toLocaleString()}</p>
                </li>
              )) : <li className="text-sm text-muted-foreground">Sin commits recientes.</li>}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold">Pull requests recientes</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {recentPrs.length ? recentPrs.map(r => (
                <li key={`${r.kind}:${r.id}`} className="rounded-md border bg-background/40 p-2">
                  <a href={/^https:\/\//.test(r.url) ? r.url : undefined} target="_blank" rel="noreferrer" className="text-primary hover:underline">{r.title}</a>
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>{r.actor}</span>
                    <span>·</span>
                    <span>{r.status}</span>
                  </p>
                </li>
              )) : <li className="text-sm text-muted-foreground">Sin pull requests recientes.</li>}
            </ul>
          </div>
        </div>
      </div>
    )}
    <details className="rounded-lg border p-4" open><summary>Cobertura de los datos y avisos</summary><ul className="mt-3 list-disc pl-5 text-sm space-y-2">{s.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul></details>
    {view === 'alerts' ? <div className="space-y-3">{health.risks.length ? health.risks.map(risk => <RiskCard key={risk.id} risk={risk} />) : <p className="rounded-lg border border-success/30 bg-success/5 p-4 text-sm">No hay riesgos accionables detectados con la información sincronizada.</p>}</div> : ['product', 'workflow', 'traceability', 'pull_requests', 'activity'].includes(view) ? <LiveSpecialView view={view} records={s.records} /> : <>
      <div className="grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-[minmax(0,1fr)_180px_180px]">
        <label className="block"><span className="text-sm">Buscar por trabajo, persona o estado</span><input className={field} value={query} onChange={e => { setQuery(e.target.value); setLimit(100) }} placeholder="Ej. Kevin, ready, HU-05" /></label>
        <label className="block"><span className="text-sm">Fuente</span><select className={field} value={kindFilter} onChange={e => { setKindFilter(e.target.value); setLimit(100) }}><option value="all">Todas las fuentes</option>{kinds.map(kind => <option key={kind} value={kind}>{kind}</option>)}</select></label>
        <label className="block"><span className="text-sm">Estado</span><select className={field} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setLimit(100) }}><option value="all">Todos los estados</option>{statuses.map(status => <option key={status} value={status}>{status}</option>)}</select></label>
      </div>
      <p className="text-sm">{records.length} registros · autor de commit/PR/issue, creador Jira/Taiga o último editor Notion. La asignación se muestra por separado.</p>
      <div className="overflow-auto rounded-lg border"><table className="w-full text-left text-sm"><thead><tr className="border-b"><th className="p-3">Trabajo / evidencia</th><th className="p-3">Autor / editor</th><th className="p-3">Asignado a</th><th className="p-3">Estado</th><th className="p-3">Fecha</th></tr></thead><tbody>{records.slice(0, limit).map(r => <tr className="border-b" key={`${r.kind}:${r.id}`}><td className="p-3"><span className="text-xs text-muted-foreground">{r.kind} · </span><a href={/^https:\/\//.test(r.url) ? r.url : undefined} target="_blank" rel="noreferrer" className="text-primary hover:underline">{r.title}</a></td><td className="p-3">{r.actor}</td><td className="p-3">{r.assignee || 'Sin asignar'}</td><td className="p-3">{r.status}</td><td className="p-3 whitespace-nowrap">{r.date ? new Date(r.date).toLocaleString() : 'Sin fecha'}</td></tr>)}</tbody></table></div>
      {!records.length && <p className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">No hay registros que coincidan con esos filtros.</p>}
      {records.length > limit && <button className={button} onClick={() => setLimit(n => n + 100)}>Mostrar más</button>}
    </>}
  </div>
}

function RecordLink({ record }: { record: Evidence }) {
  return <a href={/^https:\/\//.test(record.url) ? record.url : undefined} target="_blank" rel="noreferrer" className="font-medium text-primary hover:underline">{record.title}</a>
}

function RecordList({ records, empty }: { records: Evidence[]; empty: string }) {
  if (!records.length) return <p className="text-sm text-muted-foreground">{empty}</p>
  return <ul className="divide-y">{records.map(record => <li key={`${record.kind}:${record.id}`} className="flex flex-wrap items-start gap-3 py-3"><div className="min-w-0 flex-1"><RecordLink record={record} /><p className="mt-1 text-xs text-muted-foreground">{record.kind} · {record.status} · {record.actor}</p></div><span className="text-xs text-muted-foreground">{record.assignee || 'Sin responsable'}</span></li>)}</ul>
}

function LiveSpecialView({ view, records }: { view: string; records: Evidence[] }) {
  const active = records.filter(record => !['done', 'closed', 'accepted', 'resolved', 'finished', 'merged'].includes(record.status.toLowerCase()))
  const board = records.filter(record => ['jira', 'taiga', 'notion', 'issue', 'story', 'task'].includes(record.kind))
  const commits = records.filter(record => record.kind === 'commit').sort((a, b) => b.date.localeCompare(a.date))
  const prs = records.filter(record => record.kind === 'pr').sort((a, b) => b.date.localeCompare(a.date))
  const grouped = [...new Set(records.map(record => record.status || 'Sin estado'))]
  const title = view === 'product' ? 'Trabajo de producto' : view === 'workflow' ? 'Flujo actual' : view === 'traceability' ? 'Trazabilidad tablero → código' : view === 'pull_requests' ? 'Pull requests' : 'Actividad reciente'
  const description = view === 'product' ? 'Historias, tareas y entregables provenientes del tablero conectado.' : view === 'workflow' ? 'Distribución del trabajo por estado para detectar acumulaciones.' : view === 'traceability' ? 'Relación disponible entre elementos del tablero y evidencia técnica.' : view === 'pull_requests' ? 'Cambios abiertos y fusionados con sus autores y responsables.' : 'Línea de tiempo de commits, PRs y trabajo del tablero.'
  return <section className="space-y-4"><div><h2 className="text-xl font-semibold">{title}</h2><p className="mt-1 text-sm text-muted-foreground">{description}</p></div>
    {view === 'product' && <div className="grid gap-4 md:grid-cols-3"><div className="rounded-lg border bg-card p-4"><p className="text-xs text-muted-foreground">Elementos del tablero</p><p className="mt-1 text-2xl font-semibold">{board.length}</p></div><div className="rounded-lg border bg-card p-4"><p className="text-xs text-muted-foreground">Activos</p><p className="mt-1 text-2xl font-semibold">{board.filter(record => !['done', 'closed', 'accepted', 'resolved', 'finished'].includes(record.status.toLowerCase())).length}</p></div><div className="rounded-lg border bg-card p-4"><p className="text-xs text-muted-foreground">Sin responsable</p><p className="mt-1 text-2xl font-semibold">{board.filter(record => !record.assignee && !['done', 'closed', 'accepted', 'resolved', 'finished'].includes(record.status.toLowerCase())).length}</p></div></div>}
    {view === 'workflow' && <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{grouped.map(status => { const items = records.filter(record => (record.status || 'Sin estado') === status); return <div key={status} className="rounded-lg border bg-card p-4"><div className="flex items-center justify-between"><h3 className="font-semibold">{status}</h3><span className="rounded bg-muted px-2 py-0.5 text-xs">{items.length}</span></div><RecordList records={items.slice(0, 6)} empty="Sin elementos" /></div> })}</div>}
    {view === 'traceability' && <TraceabilityView records={records} />}
    {view === 'pull_requests' && <div className="grid gap-4 lg:grid-cols-2"><div className="rounded-lg border bg-card p-4"><h3 className="font-semibold">Abiertos ({prs.filter(record => !['merged', 'closed'].includes(record.status.toLowerCase())).length})</h3><RecordList records={prs.filter(record => !['merged', 'closed'].includes(record.status.toLowerCase()))} empty="No hay pull requests abiertas." /></div><div className="rounded-lg border bg-card p-4"><h3 className="font-semibold">Fusionados o cerrados</h3><RecordList records={prs.filter(record => ['merged', 'closed'].includes(record.status.toLowerCase()))} empty="No hay pull requests cerradas." /></div></div>}
    {view === 'activity' && <div className="rounded-lg border bg-card p-4"><h3 className="font-semibold">Últimos movimientos</h3><RecordList records={[...records].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 20)} empty="No hay actividad disponible." /></div>}
  </section>
}

function TraceabilityView({ records }: { records: Evidence[] }) {
  const links = buildTraceability(records)
  const unlinked = traceabilityUnlinked(records)
  return <section className="space-y-4">
    <div className="rounded-lg border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h3 className="font-semibold">Relaciones verificadas</h3><p className="mt-1 text-sm text-muted-foreground">Solo se muestran vínculos cuando una misma referencia aparece en el trabajo y en un commit o pull request.</p></div>
        <span className="rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">{links.length} explícitas</span>
      </div>
      {links.length ? <div className="mt-4 space-y-3">{links.map(link => <article key={link.reference} className="rounded-md border bg-background/40 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2"><h4 className="font-semibold">{link.reference}</h4><span className="text-xs text-success">Referencia explícita</span></div>
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          <div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Trabajo</p><RecordList records={link.work} empty="Sin elemento de trabajo" /></div>
          <div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Código relacionado</p><RecordList records={link.technical} empty="Sin commit o PR relacionado" /></div>
        </div>
      </article>)}</div> : <p className="mt-4 rounded-md border border-dashed p-4 text-sm text-muted-foreground">No hay relaciones explícitas. Añade la clave de la tarea en el título o descripción del commit o pull request, y vuelve a sincronizar.</p>}
    </div>
    <details className="rounded-lg border bg-card p-4">
      <summary className="cursor-pointer font-semibold">Elementos sin vínculo confirmado ({unlinked.length})</summary>
      <p className="mt-2 text-sm text-muted-foreground">No se consideran errores: solo significa que no se encontró una referencia común.</p>
      <div className="mt-3"><RecordList records={unlinked.slice(0, 30)} empty="Todos los elementos de trabajo tienen al menos un vínculo explícito." /></div>
    </details>
  </section>
}

function RiskCard({ risk, compact = false }: { risk: ProjectRisk; compact?: boolean }) {
  const tone = risk.severity === 'high' ? 'border-danger/30' : risk.severity === 'medium' ? 'border-warning/30' : 'border-border'
  return <article className={`rounded-md border ${tone} bg-background/50 p-3 ${compact ? '' : 'p-4'}`}>
    <div className="flex flex-wrap items-start justify-between gap-2"><h3 className="font-semibold">{risk.title}</h3><span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">{risk.severity === 'high' ? 'Alta' : risk.severity === 'medium' ? 'Media' : 'Baja'}</span></div>
    <p className="mt-2 text-sm text-muted-foreground"><strong className="text-foreground">Impacto:</strong> {risk.impact}</p>
    <p className="mt-1 text-sm text-muted-foreground"><strong className="text-foreground">Siguiente acción:</strong> {risk.action}</p>
    <p className="mt-2 text-xs text-muted-foreground">Evidencia: {risk.evidence} · Responsable: {risk.owner}</p>
    {risk.url && /^https:\/\//.test(risk.url) && <a className="mt-2 inline-block text-xs text-primary underline" href={risk.url} target="_blank" rel="noreferrer">Ver evidencia</a>}
  </article>
}

export function LivePresentation() {
  const { snapshot: s, loading } = useLive()
  if (!s) return <p>{loading ? 'Recuperando sesión…' : 'Conecta un repositorio en Conexiones para preparar la presentación.'}</p>
  const health = projectHealth(s)
  const active = s.records.filter(record => !['commit', 'pr'].includes(record.kind) && !['done', 'closed', 'accepted', 'resolved', 'finished'].includes(record.status.toLowerCase())).slice(0, 5)
  const completed = s.records.filter(record => ['done', 'closed', 'accepted', 'resolved', 'finished', 'merged'].includes(record.status.toLowerCase())).slice(0, 5)
  return <div className="mx-auto max-w-6xl space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm text-muted-foreground">Presentación ejecutiva · {s.repo}</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Estado del proyecto</h1><p className="mt-2 text-sm text-muted-foreground">Información sincronizada el {new Date(s.syncedAt).toLocaleString()}.</p></div><div className={`rounded-full border px-4 py-2 text-sm font-semibold ${healthStyles[health.level].panel}`}><span className={`mr-2 inline-block size-2 rounded-full ${healthStyles[health.level].dot}`} />{health.label}</div></div>
    <section className="grid gap-4 md:grid-cols-3"><div className="rounded-lg border bg-card p-5"><p className="text-sm text-muted-foreground">Lectura ejecutiva</p><p className="mt-2 text-lg font-semibold">{health.explanation}</p></div><div className="rounded-lg border bg-card p-5"><p className="text-sm text-muted-foreground">Actividad técnica</p><p className="mt-2 text-lg font-semibold">{s.records.filter(record => record.kind === 'commit').length} commits · {s.records.filter(record => record.kind === 'pr').length} PRs</p></div><div className="rounded-lg border bg-card p-5"><p className="text-sm text-muted-foreground">Trabajo activo</p><p className="mt-2 text-lg font-semibold">{active.length} elementos visibles</p></div></section>
    <div className="grid gap-4 lg:grid-cols-2"><section className="rounded-lg border bg-card p-5"><h2 className="text-lg font-semibold">Lo más importante ahora</h2>{active.length ? <ul className="mt-4 space-y-3">{active.map(record => <li key={`${record.kind}:${record.id}`} className="border-b pb-3 last:border-0"><p className="font-medium">{record.title}</p><p className="mt-1 text-sm text-muted-foreground">{record.status} · {record.assignee || 'Sin responsable'}</p></li>)}</ul> : <p className="mt-4 text-sm text-muted-foreground">No hay trabajo activo visible.</p>}</section><section className="rounded-lg border bg-card p-5"><h2 className="text-lg font-semibold">Riesgos y decisiones</h2>{health.risks.length ? <div className="mt-4 space-y-3">{health.risks.slice(0, 3).map(risk => <RiskCard key={risk.id} risk={risk} compact />)}</div> : <p className="mt-4 text-sm text-success">No hay riesgos accionables detectados.</p>}</section></div>
    <section className="rounded-lg border bg-card p-5"><h2 className="text-lg font-semibold">Avances recientes</h2>{completed.length ? <ul className="mt-4 grid gap-3 md:grid-cols-2">{completed.map(record => <li key={`${record.kind}:${record.id}`} className="rounded-md bg-muted/40 p-3"><p className="font-medium">{record.title}</p><p className="mt-1 text-xs text-muted-foreground">{record.actor} · {record.status}</p></li>)}</ul> : <p className="mt-4 text-sm text-muted-foreground">No hay entregas completadas visibles.</p>}</section>
  </div>
}

function InlineMarkdown({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return <>{parts.map((part, index) => part.startsWith('**') && part.endsWith('**') ? <strong key={index}>{part.slice(2, -2)}</strong> : part)}</>
}

function MarkdownContent({ content }: { content: string }) {
  const lines = content.replace(/\r/g, '').split('\n')
  const blocks: Array<{ type: 'heading' | 'list' | 'code' | 'paragraph'; lines: string[] }> = []
  let index = 0

  while (index < lines.length) {
    const line = lines[index].trim()
    if (!line) {
      index += 1
      continue
    }
    if (line.startsWith('```')) {
      const code: string[] = []
      index += 1
      while (index < lines.length && !lines[index].trim().startsWith('```')) code.push(lines[index++])
      index += 1
      blocks.push({ type: 'code', lines: code })
      continue
    }
    if (/^(?:#{1,3}\s|\*\*[^*]+\*\*$)/.test(line)) {
      blocks.push({ type: 'heading', lines: [line.replace(/^#{1,3}\s/, '')] })
      index += 1
      continue
    }
    if (/^(?:[-*•]\s)/.test(line)) {
      const list: string[] = []
      while (index < lines.length && /^(?:\s*[-*•]\s)/.test(lines[index])) list.push(lines[index++].replace(/^\s*[-*•]\s/, ''))
      blocks.push({ type: 'list', lines: list })
      continue
    }
    const paragraph: string[] = [line]
    index += 1
    while (index < lines.length && lines[index].trim() && !/^(?:#{1,3}\s|\*\*[^*]+\*\*$|```|\s*[-*•]\s)/.test(lines[index])) paragraph.push(lines[index++].trim())
    blocks.push({ type: 'paragraph', lines: paragraph })
  }

  return <div className="space-y-4 text-sm leading-7">
    {blocks.map((block, blockIndex) => {
      if (block.type === 'heading') return <h3 className="border-l-2 border-primary pl-3 text-base font-semibold text-foreground" key={blockIndex}><InlineMarkdown text={block.lines[0]} /></h3>
      if (block.type === 'code') return <pre className="overflow-x-auto rounded-lg border border-border/70 bg-background/80 p-4 font-mono text-xs leading-6 text-primary-foreground" key={blockIndex}><code>{block.lines.join('\n')}</code></pre>
      if (block.type === 'list') return <ul className="space-y-2 rounded-lg border border-border/60 bg-background/30 p-4" key={blockIndex}>{block.lines.map((item, itemIndex) => <li className="flex gap-3" key={itemIndex}><span className="mt-3 size-1.5 shrink-0 rounded-full bg-primary" /><span><InlineMarkdown text={item} /></span></li>)}</ul>
      return <p className="text-pretty text-muted-foreground" key={blockIndex}><InlineMarkdown text={block.lines.join(' ')} /></p>
    })}
  </div>
}

export function LiveAssistant() {
  const { snapshot } = useLive()
  const [prompt, setPrompt] = useState('Genera un resumen ejecutivo de los avances, autores, pendientes y riesgos.'), [path, setPath] = useState(''), [answer, setAnswer] = useState<{ answer: string; commitMessage?: string | null; pullRequest?: { title: string; description: string } | null; codeSuggestions?: Array<{ path: string; issue: string; recommendation: string }>; codeReview?: Array<{ severity: string; file: string; issue: string; recommendation: string; tests: string }> } | null>(null), [proposals, setProposals] = useState<Proposal[]>([]), [busy, setBusy] = useState(false), [error, setError] = useState(''), [approved, setApproved] = useState<Record<string, boolean>>({})
  useEffect(() => { requestLive('state').then(s => setProposals(s.proposals)).catch(e => setError(e.message)) }, [])
  async function act(action: string, extra: object = {}) {
    setBusy(true); setError('')
    try { const result = await requestLive(action, { prompt, path, ...extra }); if (action === 'assistant') setAnswer(result); else setProposals(p => [result, ...p.filter(x => x.id !== result.id)]) }
    catch (e) { setError((e as Error).message); if (action === 'approve') requestLive('state').then(s => setProposals(s.proposals)).catch(() => {}) }
    finally { setBusy(false) }
  }
  return <div className="max-w-5xl space-y-5"><p>El asistente genera resúmenes usando datos sincronizados. Al pedir una propuesta, envía a OpenAI el archivo seleccionado para sugerir mejoras. También puede redactar mensajes de commit, preparar PR y revisar el código con severidad, riesgo y pruebas sugeridas.</p><p className="text-sm text-muted-foreground">Los resúmenes envían hasta 300 registros recientes. Las propuestas analizan un archivo de hasta 24 KB. Las pruebas sugeridas deben ejecutarse antes de integrar la rama.</p>
    <label className="block space-y-2"><span>Solicitud</span><textarea maxLength={4000} rows={4} className={field} value={prompt} onChange={e => setPrompt(e.target.value)} /></label><button className={button} disabled={busy || !snapshot || !prompt.trim()} onClick={() => act('assistant')}>Generar respuesta ejecutiva</button>
    <div className="rounded-lg border p-4 space-y-3"><label className="block space-y-2"><span>Archivo que quieres revisar</span><input className={field} list="repo-files" placeholder="Selecciona o escribe la ruta exacta" value={path} onChange={e => setPath(e.target.value)} /><datalist id="repo-files">{snapshot?.files.map(f => <option key={f} value={f} />)}</datalist></label><button className={button} disabled={busy || !snapshot || !path || !prompt.trim()} onClick={() => act('propose')}>Proponer cambio para revisión</button></div>
    <p role="status">{busy ? 'Procesando…' : error}</p>{answer && <article className="space-y-5 rounded-lg border border-primary/20 bg-card p-5 shadow-lg shadow-black/10"><MarkdownContent content={answer.answer} />{answer.commitMessage && <div className="rounded-md border bg-muted/30 p-3"><h3 className="font-semibold">Mensaje de commit sugerido</h3><p className="mt-2 whitespace-pre-wrap">{answer.commitMessage}</p></div>}{answer.pullRequest && <div className="rounded-md border bg-muted/30 p-3"><h3 className="font-semibold">Pull request sugerido</h3><p className="mt-2 font-medium">{answer.pullRequest.title}</p><div className="mt-2 whitespace-pre-wrap text-sm">{answer.pullRequest.description}</div></div>}{answer.codeSuggestions && answer.codeSuggestions.length > 0 && <div className="rounded-md border bg-muted/30 p-3"><h3 className="font-semibold">Sugerencias de código</h3><ul className="mt-3 space-y-3">{answer.codeSuggestions.map((s, index) => <li key={`${s.path}-${index}`} className="rounded border bg-background/40 p-3"><p className="font-medium">{s.path}</p><p className="mt-1 text-sm"><span className="font-medium">Problema:</span> {s.issue}</p><p className="mt-1 text-sm"><span className="font-medium">Recomendación:</span> {s.recommendation}</p></li>)}</ul></div>}{answer.codeReview && answer.codeReview.length > 0 && <div className="rounded-md border bg-muted/30 p-3"><h3 className="font-semibold">Revisión de código</h3><ul className="mt-3 space-y-3">{answer.codeReview.map((item, index) => <li key={`${item.file}-${index}`} className="rounded border bg-background/40 p-3"><div className="flex items-center justify-between gap-3"><p className="font-medium">{item.file}</p><span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs uppercase tracking-wide text-primary">{item.severity}</span></div><p className="mt-1 text-sm"><span className="font-medium">Problema:</span> {item.issue}</p><p className="mt-1 text-sm"><span className="font-medium">Recomendación:</span> {item.recommendation}</p><p className="mt-1 text-sm"><span className="font-medium">Pruebas:</span> {item.tests}</p></li>)}</ul></div>}</article>}
    {proposals.map(p => <article className="space-y-4 rounded-lg border p-5" key={p.id}><h2 className="font-semibold">{p.title}</h2><p className="whitespace-pre-wrap">{p.reason}</p><p className="text-sm">{p.path} · Base: {p.head.slice(0, 12)} · Estado: {p.status}</p><div className="grid gap-3 lg:grid-cols-2"><div><h3>Antes</h3><pre className="max-h-96 overflow-auto bg-muted p-3 text-xs">{p.before}</pre></div><div><h3>Después (contenido exacto a guardar)</h3><pre className="max-h-96 overflow-auto bg-muted p-3 text-xs">{p.after}</pre></div></div>{p.status === 'pending' && <><label className="flex items-start gap-2"><input type="checkbox" checked={!!approved[p.id]} onChange={e => setApproved(a => ({ ...a, [p.id]: e.target.checked }))} /><span>Revisé esta propuesta y autorizo crear la rama pecc/proposal-{p.id} con este cambio en {snapshot?.repo}.</span></label><button className={button} disabled={busy || !approved[p.id]} onClick={() => act('approve', { id: p.id, confirmed: true })}>Aprobar y crear rama</button>{' '}<button className={button} disabled={busy} onClick={() => act('reject', { id: p.id })}>Rechazar</button></>}{p.url && <a href={p.url} target="_blank" rel="noreferrer" className="text-primary underline">Ver rama creada en GitHub</a>}</article>)}
  </div>
}
