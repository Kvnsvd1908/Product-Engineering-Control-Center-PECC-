import { randomUUID } from 'node:crypto'
import { api } from './integrations'
import type { Settings, Snapshot } from './live-types'

export type NoteBlock = { id: string; type: string; text: string; depth: number; editable: boolean; version: string }
export type Note = { id: string; title: string; url: string; blocks: NoteBlock[]; warnings: string[] }
export type NoteChange = { id: string; pageId: string; blockId: string; title: string; before: string; after: string; version: string; status: 'pending' | 'rejected' | 'applied' | 'failed' }
type Scope = { settings?: Settings; snapshot?: Snapshot }
const states = new WeakMap<Snapshot, { notes: Map<string, Note>; changes: Map<string, NoteChange> }>()
function context(s: Scope) {
  if (!s.snapshot || s.settings?.provider !== 'notion') throw new Error('Conecta una base de datos Notion primero.')
  let state = states.get(s.snapshot)
  if (!state) { state = { notes: new Map(), changes: new Map() }; states.set(s.snapshot, state) }
  return { snapshot: s.snapshot, token: s.settings.boardToken, ...state }
}
function notion(path: string, token: string, body?: object) {
  return api(`https://api.notion.com/v1/blocks/${path}`, token, { headers: { 'Notion-Version': '2025-09-03', 'Content-Type': 'application/json' }, ...(body ? { method: 'PATCH', body: JSON.stringify(body) } : {}) })
}
const editableTypes = ['paragraph', 'heading_1', 'heading_2', 'heading_3', 'bulleted_list_item', 'numbered_list_item', 'quote', 'to_do', 'toggle']
function normalize(b: any, depth: number): NoteBlock {
  const value = b[b.type], rich = value?.rich_text
  // Preserve rich text: only plain text blocks can be replaced with this editor.
  const plain = Array.isArray(rich) && rich.every((r: any) => r.type === 'text' && !r.text?.link && !r.href && (!r.annotations || Object.entries(r.annotations).every(([k, v]) => k === 'color' ? v === 'default' : v === false)))
  const text = rich?.map((r: any) => r.plain_text ?? r.text?.content ?? '').join('') ?? value?.title ?? value?.cells?.map((cell: any[]) => cell.map(r => r.plain_text ?? r.text?.content ?? '').join('')).join(' | ') ?? `[${b.type}: abrir en Notion]`
  return { id: b.id, type: b.type, text, depth, editable: editableTypes.includes(b.type) && plain && text.length <= 2000 && !b.archived && !b.in_trash, version: JSON.stringify([b.last_edited_time, b.type, value, b.archived, b.in_trash]) }
}
export async function readNote(s: Scope, pageId: string) {
  const c = context(s)
  const record = c.snapshot.records.find(r => r.kind === 'notion' && r.id === pageId)
  if (!record) throw new Error('La nota no pertenece a la base sincronizada.')
  const note: Note = { id: pageId, title: record.title, url: record.url, blocks: [], warnings: [] }
  let requests = 0
  async function children(id: string, depth: number): Promise<void> {
    if (depth > 5 || requests >= 20 || note.blocks.length >= 500) { note.warnings.push('Contenido parcial: límite de 500 bloques, 20 consultas o 5 niveles.'); return }
    let cursor: string | undefined
    do {
      if (requests++ >= 20 || note.blocks.length >= 500) { note.warnings.push('Contenido parcial: límite de consultas o bloques.'); return }
      const data = await notion(`${id}/children?page_size=100${cursor ? `&start_cursor=${encodeURIComponent(cursor)}` : ''}`, c.token)
      for (const block of data.results) {
        if (note.blocks.length >= 500) { note.warnings.push('Contenido parcial: límite de bloques.'); return }
        note.blocks.push(normalize(block, depth))
        if (block.has_children && !['child_page', 'child_database', 'synced_block'].includes(block.type)) await children(block.id, depth + 1)
      }
      cursor = data.has_more ? data.next_cursor : undefined
    } while (cursor)
  }
  await children(pageId, 0)
  note.warnings.push('Vista de texto: adjuntos, subpáginas y bloques sincronizados se consultan en Notion. Los bloques con formato o enlaces son de solo lectura.')
  if (c.notes.size >= 20) c.notes.delete(c.notes.keys().next().value!)
  c.notes.set(pageId, note)
  return note
}
export function proposeNote(s: Scope, pageId: string, blockId: string, after: string) {
  const c = context(s), note = c.notes.get(pageId), block = note?.blocks.find(b => b.id === blockId)
  if (!note || !block?.editable) throw new Error('Abre la nota y selecciona un bloque de texto editable.')
  if (typeof after !== 'string' || !after.trim() || after.length > 2000 || after === block.text) throw new Error('Escribe un cambio de entre 1 y 2.000 caracteres.')
  if (c.changes.size >= 30) throw new Error('Límite de propuestas: vuelve a sincronizar.')
  const change: NoteChange = { id: randomUUID(), pageId, blockId, title: note.title, before: block.text, after, version: block.version, status: 'pending' }
  c.changes.set(change.id, change)
  return change
}
export async function decideNote(s: Scope, id: string, approved: boolean) {
  const c = context(s), change = c.changes.get(id)
  if (!change || change.status !== 'pending') throw new Error('Propuesta inexistente, caducada o ya procesada.')
  if (!approved) { change.status = 'rejected'; return change }
  change.status = 'failed' // Never automatically retry an ambiguous external write.
  const live = normalize(await notion(change.blockId, c.token), 0)
  if (!live.editable || live.version !== change.version) throw new Error('La nota cambió en Notion. Vuelve a abrirla y prepara otra propuesta.')
  await notion(change.blockId, c.token, { [live.type]: { rich_text: [{ type: 'text', text: { content: change.after } }] } })
  change.status = 'applied'
  c.notes.delete(change.pageId)
  return change
}
