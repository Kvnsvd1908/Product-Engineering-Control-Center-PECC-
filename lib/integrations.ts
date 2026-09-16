import type { Evidence, Settings, Snapshot } from './live-types'
import { notionDatabaseId } from './notion-url'
import { resolveNotionDatabase } from './notion-database'

// Provider responses are validated at their boundary and normalized before reaching the UI.
type Row = Record<string, any>
export async function api(url: string, token = '', init: RequestInit = {}): Promise<any> {
  const response = await fetch(url, { ...init, cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(30000), headers: { Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...init.headers } })
  if (!response.ok) throw new Error(`Servicio externo: HTTP ${response.status}. ${response.status === 401 || response.status === 403 ? 'Revisa credenciales, permisos o límite de consultas.' : response.status === 404 ? 'Recurso inexistente o sin acceso.' : 'Intenta sincronizar nuevamente.'}`)
  return response.json()
}
export function repoName(input: string) {
  const url = new URL(input)
  if (url.protocol !== 'https:' || url.hostname !== 'github.com' || url.username || url.password || url.port) throw new Error('Usa una URL https://github.com/propietario/repositorio.')
  const parts = url.pathname.replace(/\.git\/?$/, '').split('/').filter(Boolean)
  if (parts.length !== 2 || parts.some(p => !/^[\w.-]+$/.test(p) || p === '.' || p === '..')) throw new Error('URL de repositorio inválida.')
  return parts.join('/')
}
export function gh(repo: string, path: string, token: string, body?: unknown) {
  return api(`https://api.github.com/repos/${repo}${path}`, token, { headers: { 'X-GitHub-Api-Version': '2022-11-28', ...(body ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { method: 'POST', body: JSON.stringify(body) } : {}) })
}
async function pages(load: (page: number) => Promise<Row[]>, warnings: string[], label: string) {
  const rows: Row[] = []
  for (let page = 1; page <= 20; page++) {
    const batch = await load(page)
    if (!Array.isArray(batch)) throw new Error(`Respuesta inválida: ${label}`)
    rows.push(...batch)
    if (batch.length < 100) return rows
  }
  warnings.push(`${label}: límite de 2.000 registros; puede haber más datos.`)
  return rows
}
export async function sync(settings: Settings): Promise<Snapshot> {
  const repo = repoName(settings.repoUrl), warnings: string[] = []
  const meta = await gh(repo, '', settings.gitToken)
  const ref = await gh(repo, `/git/ref/heads/${encodeURIComponent(meta.default_branch)}`, settings.gitToken)
  const head = ref.object.sha
  const results = await Promise.allSettled([
    pages(p => gh(repo, `/commits?sha=${head}&per_page=100&page=${p}`, settings.gitToken), warnings, 'Commits de la rama principal'),
    pages(p => gh(repo, `/pulls?state=all&per_page=100&page=${p}`, settings.gitToken), warnings, 'Pull requests'),
    pages(p => gh(repo, `/issues?state=all&per_page=100&page=${p}`, settings.gitToken), warnings, 'Issues'),
    gh(repo, `/git/trees/${head}?recursive=1`, settings.gitToken),
  ])
  const records: Evidence[] = [], files: string[] = []
  results.forEach((r, index) => {
    if (r.status === 'rejected') { warnings.push(`${['Commits', 'PRs', 'Issues', 'Archivos'][index]}: ${r.reason.message}`); return }
    if (index === 3) {
      files.push(...r.value.tree.filter((x: Row) => x.type === 'blob').map((x: Row) => x.path))
      if (r.value.truncated) warnings.push('GitHub entregó un árbol de archivos incompleto.')
      return
    }
    for (const x of r.value) {
      if (index === 2 && x.pull_request) continue
      records.push({ id: `${index}:${x.sha || x.number}`, title: x.commit?.message || x.title, url: x.html_url, actor: index === 0 ? x.author?.login || x.commit?.author?.name || 'Autor desconocido' : x.user?.login || 'Autor desconocido', assignee: x.assignees?.map((a: Row) => a.login).join(', '), date: x.commit?.author?.date || x.updated_at, status: index === 0 ? 'registrado' : x.merged_at ? 'merged' : x.state, kind: ['commit', 'pr', 'issue'][index] })
    }
  })
  if (settings.provider !== 'none') {
    try { records.push(...await board(settings, warnings)) }
    catch (e) { warnings.push(`Tablero no sincronizado: ${(e as Error).message}`) }
  }
  warnings.push('Alcance: commits de la rama principal, PRs, issues, inventario de archivos y estado actual del tablero. No incluye comentarios, revisiones, CI ni historial completo del tablero. Responsable asignado no demuestra quién completó una tarea.')
  return { repo, url: `https://github.com/${repo}`, branch: meta.default_branch, head, syncedAt: new Date().toISOString(), records, files, warnings, board: settings.provider }
}
async function board(s: Settings, warnings: string[]): Promise<Evidence[]> {
  const url = new URL(s.boardUrl)
  if (url.protocol !== 'https:' || url.username || url.password || url.port) throw new Error('El tablero debe usar HTTPS.')
  if (s.provider === 'jira') {
    if (!/^[a-z0-9-]+\.atlassian\.net$/.test(url.hostname)) throw new Error('Usa una URL de Jira Cloud (*.atlassian.net).')
    const headers = { Authorization: `Basic ${Buffer.from(`${s.email}:${s.boardToken}`).toString('base64')}`, 'Content-Type': 'application/json' }
    const key = s.projectKey || url.pathname.match(/\/projects\/([A-Z][A-Z0-9_]*)/i)?.[1]
    const boardId = url.pathname.match(/\/boards\/(\d+)/)?.[1] || url.searchParams.get('rapidView')
    if (!key && !boardId) throw new Error('La URL no identifica el tablero. Indica la clave del proyecto Jira.')
    if (key && !/^[A-Za-z][A-Za-z0-9_]*$/.test(key)) throw new Error('Clave Jira inválida.')
    const rows: Row[] = []; let cursor: string | undefined
    for (let page = 0; page < 20; page++) {
      const data = boardId
        ? await api(`${url.origin}/rest/agile/1.0/board/${encodeURIComponent(boardId)}/issue?startAt=${rows.length}&maxResults=100&fields=summary,status,assignee,creator,updated`, '', { headers })
        : await api(`${url.origin}/rest/api/3/search/jql`, '', { method: 'POST', headers, body: JSON.stringify({ jql: `project = "${key}" ORDER BY updated DESC`, fields: ['summary', 'status', 'assignee', 'creator', 'updated'], maxResults: 100, nextPageToken: cursor }) })
      rows.push(...data.issues); cursor = data.nextPageToken
      if (boardId ? rows.length >= data.total || !data.issues.length : !cursor) break
      if (page === 19) warnings.push('Jira: consulta parcial por límite de paginación.')
    }
    return rows.map(x => ({ id: x.key, title: x.fields.summary, url: `${url.origin}/browse/${x.key}`, actor: x.fields.creator?.displayName || 'Creador desconocido', assignee: x.fields.assignee?.displayName, date: x.fields.updated, status: x.fields.status.name, kind: 'jira' }))
  }
  if (s.provider === 'taiga') {
    if (url.hostname !== 'tree.taiga.io') throw new Error('Usa https://tree.taiga.io/project/slug. Taiga autoalojado requiere configurar un conector propio.')
    const slug = url.pathname.match(/\/project\/([^/]+)/)?.[1]
    if (!slug) throw new Error('La URL debe incluir /project/slug.')
    const base = 'https://api.taiga.io/api/v1'
    const project = await api(`${base}/projects/by_slug?slug=${encodeURIComponent(slug)}`, s.boardToken)
    const rows: Evidence[] = []
    for (const kind of ['userstories', 'tasks', 'issues']) {
      const data = await pages(p => api(`${base}/${kind}?project=${project.id}&page=${p}&page_size=100`, s.boardToken), warnings, `Taiga ${kind}`)
      rows.push(...data.map(x => ({ id: `${kind}:${x.id}`, title: x.subject, url: `${url.origin}/project/${slug}/${kind === 'userstories' ? 'us' : kind === 'tasks' ? 'task' : 'issue'}/${x.ref}`, actor: project.members?.find((m: Row) => m.id === x.owner)?.full_name || `Usuario ${x.owner ?? 'desconocido'}`, assignee: x.assigned_to_extra_info?.full_name, date: x.modified_date, status: x.status_extra_info?.name || String(x.status), kind: 'taiga' })))
    }
    return rows
  }
  const id = notionDatabaseId(s.boardUrl)
  const headers = { 'Notion-Version': '2025-09-03', 'Content-Type': 'application/json' }
  let db: Row
  try { db = await resolveNotionDatabase(id, path => api(`https://api.notion.com/v1/${path}`, s.boardToken, { headers })) }
  catch (error) {
    const message = (error as Error).message
    if (message.includes('HTTP 404')) throw new Error('Notion no encontró una base de datos accesible en ese enlace. Comprueba que sea la base original (no una nota o vista enlazada) y agrégale la integración desde Conexiones.')
    if (message.includes('HTTP 401')) throw new Error('Notion rechazó el token. Copia el token vigente de la integración y vuelve a conectar.')
    if (message.includes('HTTP 403')) throw new Error('Notion denegó la consulta. Revisa los permisos de lectura y el acceso de la integración a esa base de datos.')
    throw error
  }
  const rows: Row[] = []
  for (const source of db.data_sources) {
    let cursor: string | undefined
    for (let page = 0; page < 20; page++) {
      const data = await api(`https://api.notion.com/v1/data_sources/${source.id}/query`, s.boardToken, { method: 'POST', headers, body: JSON.stringify({ page_size: 100, start_cursor: cursor }) })
      rows.push(...data.results); cursor = data.next_cursor
      if (!data.has_more) break
      if (page === 19) warnings.push('Notion: consulta parcial por límite de paginación.')
    }
  }
  return rows.map(x => {
    const props = Object.values(x.properties) as Row[]
    return { id: x.id, title: props.find(p => p.type === 'title')?.title.map((t: Row) => t.plain_text).join('') || 'Sin título', url: x.url, actor: `Editor ${x.last_edited_by?.id || 'desconocido'}`, assignee: props.filter(p => p.type === 'people').flatMap(p => p.people.map((u: Row) => u.name || u.id)).join(', '), date: x.last_edited_time, status: props.find(p => p.type === 'status')?.status?.name || props.find(p => p.type === 'select')?.select?.name || 'Sin estado', kind: 'notion' }
  })
}
