const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const ts = require('typescript')
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, filename)
const { repoName, sync } = require('../lib/integrations.ts')
const { notionDatabaseId } = require('../lib/notion-url.ts')
const { resolveNotionDatabase } = require('../lib/notion-database.ts')
const { buildTraceability, traceabilityUnlinked } = require('../lib/traceability.ts')
test('trazabilidad: solo relaciona referencias compartidas y conserva elementos sin vínculo', () => {
  const records = [
    { id: 'jira-1', kind: 'jira', title: 'PROJ-123 Integración de pagos', url: '', actor: 'Ana', date: '', status: 'In progress', refs: ['PROJ-123'] },
    { id: 'pr-1', kind: 'pr', title: 'feat: implementa PROJ-123', url: '', actor: 'Ana', date: '', status: 'open' },
    { id: 'jira-2', kind: 'jira', title: 'PROJ-999 Sin cambios relacionados', url: '', actor: 'Luis', date: '', status: 'Todo', refs: ['PROJ-999'] },
  ]
  const links = buildTraceability(records)
  assert.equal(links.length, 1)
  assert.equal(links[0].reference, 'PROJ-123')
  assert.deepEqual(links[0].work.map(record => record.id), ['jira-1'])
  assert.deepEqual(links[0].technical.map(record => record.id), ['pr-1'])
  assert.deepEqual(traceabilityUnlinked(records).map(record => record.id), ['jira-2'])
})
test('Notion detecta bases dentro de páginas y diferencia permisos de vistas enlazadas', async () => {
  const id = notionDatabaseId('https://app.notion.com/p/3ba8a72b6043804d8e99e800a2d3c75e?v=3ba8a72b604380e588a0000cd78ab71d')
  assert.equal(id, '3ba8a72b6043804d8e99e800a2d3c75e')
  const missing = () => { throw new Error('Servicio externo: HTTP 404.') }
  await assert.rejects(() => resolveNotionDatabase(id, async () => missing()), /Conexiones → Añadir conexión/)
  const get = async path => {
    if (path === `databases/${id}`) return missing()
    if (path === `pages/${id}`) return { id }
    if (path.startsWith(`blocks/${id}/children`)) return { results: [{ id: 'child', type: 'child_database' }], has_more: false }
    if (path === 'databases/child') return { id: 'child', data_sources: [] }
    throw new Error('Unexpected path')
  }
  assert.equal((await resolveNotionDatabase(id, get)).id, 'child')
  await assert.rejects(() => resolveNotionDatabase(id, path => path.startsWith('blocks/') ? Promise.resolve({ results: [], has_more: false }) : get(path)), /vista enlazada/)
  await assert.rejects(() => resolveNotionDatabase(id, path => path.startsWith('blocks/') ? Promise.resolve({ results: [{ id: 'a', type: 'child_database' }, { id: 'b', type: 'child_database' }], has_more: false }) : get(path)), /varias bases/)
  let requests = 0
  await assert.rejects(() => resolveNotionDatabase(id, async () => { requests++; throw new Error('HTTP 401') }), /401/)
  assert.equal(requests, 1)
})
test('URLs Notion: dominios, identificadores y parámetros de vistas', () => {
  const id = '0123456789abcdef0123456789abcdef'
  for (const host of ['notion.so', 'www.notion.so', 'team.notion.site', 'notion.com', 'www.notion.com', 'app.notion.com']) {
    assert.equal(notionDatabaseId(`https://${host}/Notas-${id}?v=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa&p=bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb`), id)
  }
  assert.equal(notionDatabaseId('https://www.notion.so/01234567-89ab-cdef-0123-456789abcdef/'), id)
  assert.throws(() => notionDatabaseId(`https://notion.com.evil.test/${id}`), /Dominio/)
  assert.throws(() => notionDatabaseId('https://team.notion.site/notas?v=' + id), /identificador/)
  assert.throws(() => notionDatabaseId('https://custom.example/notas'), /personalizado/)
  assert.throws(() => notionDatabaseId(`https://user:secret@notion.com/${id}`), /credenciales/)
})
const { session, propose, decide, synchronize } = require('../lib/live-server.ts')
const { projectHealth } = require('../lib/live-insights.ts')
const { readNote, proposeNote, decideNote } = require('../lib/notion-notes.ts')
test('insights: semáforo explicable y riesgos con siguiente acción', () => {
  const health = projectHealth({
    repo: 'acme/app', url: 'https://github.com/acme/app', branch: 'main', head: 'base', syncedAt: '', board: 'jira', files: [], warnings: [],
    records: [
      { id: 'task-1', kind: 'jira', title: 'Integración de pagos', url: 'https://example.com/task-1', actor: 'Ana', assignee: '', date: new Date().toISOString(), status: 'Bloqueada' },
      { id: 'task-2', kind: 'taiga', title: 'Preparar demo', url: 'https://example.com/task-2', actor: 'PM', date: new Date().toISOString(), status: 'En progreso' },
      { id: 'commit-1', kind: 'commit', title: 'Avance', url: 'https://example.com/commit-1', actor: 'Ana', date: new Date().toISOString(), status: 'main' },
    ],
  })
  assert.equal(health.level, 'red')
  assert.match(health.risks[0].title, /bloqueado/i)
  assert.match(health.risks[0].action, /responsable/i)
  assert.match(health.risks[1].title, /sin responsable/i)
})
test('notas Notion: lectura, revisión sin escritura, rechazo, aprobación y conflictos', async () => {
  const originalFetch = global.fetch
  let version = 'v1', writes = 0
  const block = () => ({ id: 'block', type: 'paragraph', last_edited_time: version, paragraph: { rich_text: [{ type: 'text', text: { content: 'Original' }, plain_text: 'Original' }] } })
  global.fetch = async (url, options = {}) => {
    if (options.method === 'PATCH') { writes++; assert.equal(JSON.parse(options.body).paragraph.rich_text[0].text.content, 'Nuevo'); return Response.json(block()) }
    if (url.includes('/children')) return Response.json({ results: [block(), { id: 'rich', type: 'paragraph', paragraph: { rich_text: [{ type: 'text', text: { content: 'Enlace', link: { url: 'https://example.com' } } }] } }], has_more: false })
    return Response.json(block())
  }
  const s = { settings: { provider: 'notion', boardToken: 'token' }, snapshot: { records: [{ id: 'page', kind: 'notion', title: 'Resumen ejecutivo', url: 'https://notion.so/page' }] } }
  try {
    await assert.rejects(() => readNote(s, 'other'), /no pertenece/)
    const note = await readNote(s, 'page')
    assert.equal(note.blocks[0].text, 'Original')
    assert.equal(note.blocks[1].editable, false)
    assert.throws(() => proposeNote(s, 'page', 'rich', 'Nuevo'), /editable/)
    let change = proposeNote(s, 'page', 'block', 'Nuevo')
    assert.equal(writes, 0)
    await decideNote(s, change.id, false)
    await assert.rejects(() => decideNote(s, change.id, true), /procesada/)
    change = proposeNote(s, 'page', 'block', 'Nuevo')
    await assert.rejects(() => decideNote({ ...s, snapshot: { ...s.snapshot } }, change.id, true), /inexistente/)
    await decideNote(s, change.id, true)
    assert.equal(writes, 1)
    await assert.rejects(() => decideNote(s, change.id, true), /procesada/)
    await readNote(s, 'page')
    change = proposeNote(s, 'page', 'block', 'Nuevo')
    version = 'v2'
    await assert.rejects(() => decideNote(s, change.id, true), /cambió/)
    assert.equal(writes, 1)
  } finally { global.fetch = originalFetch }
})
test('rechaza URLs que podrían enviar credenciales a otros hosts', () => {
  assert.equal(repoName('https://github.com/acme/app.git'), 'acme/app')
  for (const url of ['http://github.com/acme/app', 'https://github.com.evil.test/a/b', 'https://user:pass@github.com/a/b', 'https://localhost/a/b', 'https://github.com/a/b/tree/main']) assert.throws(() => repoName(url))
})
test('conectar un tablero conserva el token del repositorio y permite desconectar solo el tablero', async () => {
  const originalFetch = global.fetch
  const githubTokens = []
  global.fetch = async (url, options = {}) => {
    if (url.includes('api.github.com')) githubTokens.push(options.headers.Authorization)
    if (url.endsWith('/acme/app')) return Response.json({ default_branch: 'main' })
    if (url.includes('/git/ref/')) return Response.json({ object: { sha: 'base' } })
    if (url.includes('/git/trees/')) return Response.json({ tree: [] })
    if (url.includes('api.github.com')) return Response.json([])
    if (url.includes('/databases/')) return Response.json({ data_sources: [] })
    throw new Error('Unexpected URL')
  }
  try {
    const { data: s } = session()
    const input = { repoUrl: 'https://github.com/acme/app', gitToken: 'repo-secret', provider: 'none', boardUrl: '', boardToken: '', email: '', projectKey: '' }
    await assert.rejects(() => synchronize(s, input, 'board'), /repositorio primero/)
    await synchronize(s, input, 'repo')
    await synchronize(s, { ...input, repoUrl: '', gitToken: '', provider: 'notion', boardUrl: 'https://notion.so/0123456789abcdef0123456789abcdef', boardToken: 'board-secret' }, 'board')
    assert.equal(s.settings.gitToken, 'repo-secret')
    assert.equal(s.settings.boardToken, 'board-secret')
    assert.equal(s.snapshot.board, 'notion')
    await synchronize(s, { ...input, gitToken: 'updated-secret' }, 'repo')
    assert.equal(s.settings.boardToken, 'board-secret')
    await synchronize(s, { ...input, gitToken: '', boardToken: 'board-secret' }, 'board')
    assert.equal(s.settings.gitToken, 'updated-secret')
    assert.equal(s.settings.boardToken, '')
    assert.equal(s.snapshot.board, 'none')
    assert.ok(githubTokens.every(token => ['Bearer repo-secret', 'Bearer updated-secret'].includes(token)))
  } finally { global.fetch = originalFetch }
})
test('asistente IA: genera resumen, mensaje de commit, PR y propuestas de código', async () => {
  const originalFetch = global.fetch
  const originalKey = process.env.GROQ_API_KEY, originalModel = process.env.GROQ_MODEL
  process.env.GROQ_API_KEY = 'test'; process.env.GROQ_MODEL = 'test'
  global.fetch = async (url, options = {}) => {
    if (url.includes('api.groq.com')) return Response.json({ choices: [{ message: { content: JSON.stringify({ answer: 'Resumen ejecutivo', commitMessage: 'fix: corrige validación de pull request', pullRequest: { title: 'fix: mejora validación de datos', description: '### Qué cambia\n- valida entradas\n### Verificación\n- pruebas unitarias' }, codeSuggestions: [{ path: 'app.ts', issue: 'validación insuficiente', recommendation: 'usar guard clauses y mensajes claros' }], codeReview: [{ severity: 'high', file: 'app.ts', issue: 'falla de validación de entrada', recommendation: 'aplicar validación temprana antes de procesar datos', tests: 'pruebas de casos límite y errores de flujo' }] }) } }] })
    throw new Error('Unexpected URL')
  }
  try {
    const { data: s } = session()
    s.settings = { gitToken: 'secret', repoUrl: 'https://github.com/acme/app', provider: 'none', boardUrl: '', boardToken: '', email: '', projectKey: '' }
    s.snapshot = { repo: 'acme/app', url: s.settings.repoUrl, branch: 'main', head: 'base', files: ['app.ts'], records: [], warnings: [], syncedAt: '', board: 'none' }
    const result = await require('../lib/live-server.ts').assistant(s, 'Necesito un PR, una revisión de riesgo y correcciones de código.')
    assert.equal(result.answer, 'Resumen ejecutivo')
    assert.match(result.commitMessage, /fix:/)
    assert.match(result.pullRequest.title, /fix:/)
    assert.equal(result.codeSuggestions[0].path, 'app.ts')
    assert.match(result.codeSuggestions[0].recommendation, /guard clauses|claro/i)
    assert.equal(result.codeReview[0].file, 'app.ts')
    assert.equal(result.codeReview[0].severity, 'high')
  } finally {
    global.fetch = originalFetch
    if (originalKey === undefined) delete process.env.GROQ_API_KEY; else process.env.GROQ_API_KEY = originalKey
    if (originalModel === undefined) delete process.env.GROQ_MODEL; else process.env.GROQ_MODEL = originalModel
  }
})
test('asistente IA: responde directo a preguntas del PM sin complicar con PR ni commit', async () => {
  const originalFetch = global.fetch
  const originalKey = process.env.GROQ_API_KEY, originalModel = process.env.GROQ_MODEL
  process.env.GROQ_API_KEY = 'test'; process.env.GROQ_MODEL = 'test'
  global.fetch = async (url, options = {}) => {
    if (url.includes('api.groq.com')) return Response.json({ choices: [{ message: { content: JSON.stringify({ answer: 'Hay 3 entregas pendientes y 2 riesgos visibles.', commitMessage: 'fix: corrige validación de pull request', pullRequest: { title: 'fix: mejora validación de datos', description: '### Qué cambia\n- valida entradas' }, codeSuggestions: [{ path: 'app.ts', issue: 'validación insuficiente', recommendation: 'usar guard clauses y mensajes claros' }], codeReview: [{ severity: 'high', file: 'app.ts', issue: 'falla de validación de entrada', recommendation: 'aplicar validación temprana antes de procesar datos', tests: 'pruebas de casos límite' }] }) } }] })
    throw new Error('Unexpected URL')
  }
  try {
    const { data: s } = session()
    s.settings = { gitToken: 'secret', repoUrl: 'https://github.com/acme/app', provider: 'none', boardUrl: '', boardToken: '', email: '', projectKey: '' }
    s.snapshot = { repo: 'acme/app', url: s.settings.repoUrl, branch: 'main', head: 'base', files: ['app.ts'], records: [], warnings: [], syncedAt: '', board: 'none' }
    const result = await require('../lib/live-server.ts').assistant(s, '¿Qué está pasando con la entrega? dime el estado y qué falta.')
    assert.equal(result.answer, 'Hay 3 entregas pendientes y 2 riesgos visibles.')
    assert.equal(result.commitMessage, null)
    assert.equal(result.pullRequest, null)
    assert.deepEqual(result.codeSuggestions, [])
    assert.deepEqual(result.codeReview, [])
  } finally {
    global.fetch = originalFetch
    if (originalKey === undefined) delete process.env.GROQ_API_KEY; else process.env.GROQ_API_KEY = originalKey
    if (originalModel === undefined) delete process.env.GROQ_MODEL; else process.env.GROQ_MODEL = originalModel
  }
})
test('asistente IA: acepta formato ejecutivo equivalente de Groq', async () => {
  const originalFetch = global.fetch
  const originalKey = process.env.GROQ_API_KEY, originalModel = process.env.GROQ_MODEL
  process.env.GROQ_API_KEY = 'test'; process.env.GROQ_MODEL = 'test'
  global.fetch = async url => {
    if (url.includes('api.groq.com')) return Response.json({ choices: [{ message: { content: JSON.stringify({ status: 'Avance estable.', risks: 'Sin bloqueos críticos.', nextStep: 'Continuar con la validación.' }) } }] })
    throw new Error('Unexpected URL')
  }
  try {
    const { data: s } = session()
    s.settings = { gitToken: 'secret', repoUrl: 'https://github.com/acme/app', provider: 'none', boardUrl: '', boardToken: '', email: '', projectKey: '' }
    s.snapshot = { repo: 'acme/app', url: s.settings.repoUrl, branch: 'main', head: 'base', files: [], records: [], warnings: [], syncedAt: '', board: 'none' }
    const result = await require('../lib/live-server.ts').assistant(s, '¿Cuál es el estado?')
    assert.equal(result.answer, 'Avance estable.\n\nSin bloqueos críticos.\n\nContinuar con la validación.')
  } finally {
    global.fetch = originalFetch
    if (originalKey === undefined) delete process.env.GROQ_API_KEY; else process.env.GROQ_API_KEY = originalKey
    if (originalModel === undefined) delete process.env.GROQ_MODEL; else process.env.GROQ_MODEL = originalModel
  }
})
test('propuestas: lectura sin escritura, rechazo, aprobación única y rama base obsoleta', async () => {
  const originalFetch = global.fetch
  const originalKey = process.env.GROQ_API_KEY, originalModel = process.env.GROQ_MODEL
  process.env.GROQ_API_KEY = 'test'; process.env.GROQ_MODEL = 'test'
  const writes = []; let head = 'base'
  global.fetch = async (url, options = {}) => {
    if (url.includes('api.groq.com')) return Response.json({ choices: [{ message: { content: JSON.stringify({ title: 'Mejora', reason: 'Validación', after: 'export const value = 2' }) } }] })
    if (options.method === 'POST') writes.push({ url, body: JSON.parse(options.body) })
    if (url.includes('/contents/')) return Response.json({ type: 'file', size: 22, encoding: 'base64', content: Buffer.from('export const value = 1').toString('base64') })
    if (url.includes('/git/ref/')) return Response.json({ object: { sha: head } })
    if (url.includes('/git/commits/base')) return Response.json({ tree: { sha: 'parent-tree' } })
    if (url.includes('/git/trees/base')) return Response.json({ tree: [{ path: 'app.ts', mode: '100644' }] })
    return Response.json({ sha: 'new-object' })
  }
  try {
    const { data: s } = session()
    s.settings = { gitToken: 'secret', repoUrl: 'https://github.com/acme/app', provider: 'none', boardUrl: '', boardToken: '', email: '', projectKey: '' }
    s.snapshot = { repo: 'acme/app', url: s.settings.repoUrl, branch: 'main', head: 'base', files: ['app.ts'], records: [], warnings: [], syncedAt: '', board: 'none' }
    const p = await propose(s, 'app.ts', 'Mejora')
    assert.equal(writes.length, 0)
    await decide(s, p.id, false)
    await assert.rejects(() => decide(s, p.id, true), /procesada/)
    assert.equal(writes.length, 0)
    const approved = await propose(s, 'app.ts', 'Mejora')
    await decide(s, approved.id, true)
    assert.equal(writes.length, 3)
    assert.equal(writes[0].body.base_tree, 'parent-tree')
    assert.equal(writes[0].body.tree[0].content, approved.after)
    assert.match(writes[2].body.ref, /^refs\/heads\/pecc\/proposal-/)
    await assert.rejects(() => decide(s, approved.id, true), /procesada/)
    const stale = await propose(s, 'app.ts', 'Mejora')
    head = 'updated'
    await assert.rejects(() => decide(s, stale.id, true), /rama cambió/)
    assert.equal(writes.length, 3)
    assert.equal(session().data.proposals.size, 0)
  } finally {
    global.fetch = originalFetch
    if (originalKey === undefined) delete process.env.GROQ_API_KEY; else process.env.GROQ_API_KEY = originalKey
    if (originalModel === undefined) delete process.env.GROQ_MODEL; else process.env.GROQ_MODEL = originalModel
  }
})
test('sincronización pagina y declara fallos parciales sin inventar éxito del tablero', async () => {
  const originalFetch = global.fetch; let commitPages = 0
  global.fetch = async url => {
    if (url.endsWith('/acme/app')) return Response.json({ default_branch: 'main' })
    if (url.includes('/git/ref/')) return Response.json({ object: { sha: 'base' } })
    if (url.includes('/commits?')) { commitPages++; return Response.json(url.endsWith('page=1') ? Array.from({ length: 100 }, (_, i) => ({ sha: String(i), commit: { message: 'Trabajo', author: { name: 'Ana', date: '2026-01-01' } }, html_url: 'https://github.com/acme/app/commit/a' })) : []) }
    if (url.includes('/pulls?')) return Response.json({}, { status: 403 })
    if (url.includes('/issues?')) return Response.json([])
    if (url.includes('/git/trees/')) return Response.json({ tree: [], truncated: true })
    throw new Error('Unexpected URL')
  }
  try {
    const result = await sync({ repoUrl: 'https://github.com/acme/app', gitToken: '', provider: 'taiga', boardUrl: 'https://localhost/project/a', boardToken: '', projectKey: '', email: '' })
    assert.equal(commitPages, 2); assert.equal(result.records.length, 100)
    assert.equal(result.records[0].actor, 'Ana')
    assert.ok(result.warnings.some(w => w.includes('403')))
    assert.ok(result.warnings.some(w => w.includes('Tablero no sincronizado')))
    assert.ok(result.warnings.some(w => w.includes('incompleto')))
  } finally { global.fetch = originalFetch }
})
test('normaliza Jira, Taiga y Notion con autoría y responsables separados', async () => {
  const originalFetch = global.fetch
  const visited = []
  global.fetch = async (url, options = {}) => {
    visited.push(url)
    if (url.endsWith('/acme/app')) return Response.json({ default_branch: 'main' })
    if (url.includes('/git/ref/')) return Response.json({ object: { sha: 'base' } })
    if (url.includes('/git/trees/')) return Response.json({ tree: [] })
    if (url.includes('api.github.com')) return Response.json([])
    if (url.includes('atlassian.net')) return Response.json({ issues: [{ key: 'APP-1', fields: { summary: 'Entrega', creator: { displayName: 'Creadora' }, assignee: { displayName: 'Responsable' }, status: { name: 'Done' }, updated: '2026-01-01' } }], total: 1 })
    if (url.includes('/projects/by_slug')) return Response.json({ id: 1, members: [{ id: 5, full_name: 'Creadora' }] })
    if (url.includes('api.taiga.io')) return Response.json([{ id: 1, ref: 1, subject: 'Entrega', owner: 5, assigned_to_extra_info: { full_name: 'Responsable' }, status_extra_info: { name: 'Done' }, modified_date: '2026-01-01' }])
    if (url.includes('/databases/')) return Response.json({ data_sources: [{ id: 'source-a' }, { id: 'source-b' }] })
    if (url.includes('/data_sources/')) {
      assert.equal(options.method, 'POST')
      return Response.json({ results: [{ id: url.includes('source-a') ? 'a' : 'b', url: 'https://notion.so/page', last_edited_by: { id: 'editor' }, last_edited_time: '2026-01-01', properties: { Title: { type: 'title', title: [{ plain_text: 'Entrega' }] }, Status: { type: 'status', status: { name: 'Done' } }, Person: { type: 'people', people: [{ name: 'Responsable' }] } } }], has_more: false })
    }
    throw new Error('Unexpected URL')
  }
  try {
    for (const [provider, boardUrl, count] of [['jira', 'https://company.atlassian.net/jira/software/projects/APP/boards/2', 1], ['taiga', 'https://tree.taiga.io/project/example/kanban', 3], ['notion', 'https://notion.so/0123456789abcdef0123456789abcdef', 2]]) {
      const result = await sync({ repoUrl: 'https://github.com/acme/app', gitToken: '', provider, boardUrl, boardToken: 'token', projectKey: '', email: 'user@example.com' })
      assert.equal(result.records.length, count)
      assert.equal(result.records[0].assignee, 'Responsable')
      assert.notEqual(result.records[0].actor, result.records[0].assignee)
      assert.equal(result.warnings.some(w => w.includes('no sincronizado')), false)
    }
    assert.ok(visited.some(url => url.includes('/rest/agile/1.0/board/2/issue')))
    assert.ok(visited.some(url => url.includes('/data_sources/source-b/query')))
  } finally { global.fetch = originalFetch }
})
