'use client'

import { useState } from 'react'
import type { Note, NoteBlock, NoteChange } from '@/lib/notion-notes'
import { requestLive, useLive } from './live'

const button = 'rounded-md border px-3 py-2 text-sm hover:bg-accent disabled:opacity-40'
export function NotionNotes() {
  const { snapshot } = useLive()
  const [note, setNote] = useState<Note | null>(null)
  const [block, setBlock] = useState<NoteBlock | null>(null)
  const [text, setText] = useState('')
  const [change, setChange] = useState<NoteChange | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  if (snapshot?.board !== 'notion') return null
  async function run(action: string, body: object) {
    setBusy(true); setMessage('')
    try {
      const result = await requestLive(action, body)
      if (action === 'notion-read') { setNote(result); setBlock(null); setChange(null); setConfirmed(false) }
      else if (action === 'notion-propose') { setChange(result); setConfirmed(false) }
      else {
        setChange(result); setBlock(null); setConfirmed(false)
        if (action === 'notion-approve') {
          setNote(null)
          setMessage('Cambio guardado en Notion. Abre la nota nuevamente para consultar su contenido actualizado.')
        } else setMessage('Propuesta rechazada. No se guardó ningún cambio.')
      }
    } catch (error) {
      if (action === 'notion-approve') { setChange(null); setBlock(null); setNote(null) }
      setMessage(`${(error as Error).message}${action === 'notion-approve' ? ' Revisa la nota en Notion antes de volver a editar; no se reintentará el guardado automáticamente.' : ''}`)
    } finally { setBusy(false) }
  }
  return <section className="space-y-4 rounded-lg border p-5">
    <div><h2 className="font-semibold">Documentos y notas de Notion</h2><p className="mt-1 text-sm text-muted-foreground">Abre una nota para leer su contenido. Puedes editar bloques de texto simple y revisar cada cambio antes de guardarlo en Notion.</p></div>
    <div className="flex flex-wrap gap-2">{snapshot.records.filter(r => r.kind === 'notion').map(r => <button className={button} disabled={busy} key={r.id} onClick={() => run('notion-read', { pageId: r.id })}>{r.title}</button>)}</div>
    {note && <article className="space-y-3 border-t pt-4"><h3 className="font-semibold">{note.title}</h3><a className="text-sm text-primary underline" href={/^https:\/\//.test(note.url) ? note.url : undefined} target="_blank" rel="noreferrer">Abrir original en Notion</a>{note.warnings.map((w, i) => <p key={i} className="text-xs text-muted-foreground">{w}</p>)}{!note.blocks.length && <p>La nota no tiene bloques de contenido.</p>}{note.blocks.map(b => <div key={b.id} className="space-y-2 rounded-md border p-3" style={{ marginLeft: b.depth * 12 }}><p className="text-xs text-muted-foreground">{b.type}</p><p className="whitespace-pre-wrap break-words">{b.text || '(Texto vacío)'}</p>{b.editable && <button className={button} disabled={busy} onClick={() => { setBlock(b); setText(b.text); setChange(null); setConfirmed(false) }}>Editar texto</button>}</div>)}</article>}
    {block && note && !change && <form className="space-y-3 border-t pt-4" onSubmit={e => { e.preventDefault(); run('notion-propose', { pageId: note.id, blockId: block.id, after: text }) }}><label className="block space-y-2"><span>Nuevo texto del bloque</span><textarea className="min-h-36 w-full rounded-md border bg-background p-3" maxLength={2000} value={text} onChange={e => setText(e.target.value)} /></label><button className={button} disabled={busy || !text.trim() || text === block.text}>Preparar cambio para revisión</button></form>}
    {change && <div className="space-y-3 rounded-md border p-4"><h3 className="font-semibold">Revisión del cambio: {change.title}</h3><div className="grid gap-3 md:grid-cols-2"><div><h4>Antes</h4><p className="whitespace-pre-wrap break-words bg-muted p-3">{change.before}</p></div><div><h4>Después</h4><p className="whitespace-pre-wrap break-words bg-muted p-3">{change.after}</p></div></div>{change.status === 'pending' ? <><label className="flex gap-2"><input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} /><span>Autorizo guardar este cambio en la nota «{change.title}» de Notion.</span></label><button className={button} disabled={busy || !confirmed} onClick={() => run('notion-approve', { id: change.id, confirmed: true })}>Aprobar y guardar en Notion</button>{' '}<button className={button} disabled={busy} onClick={() => run('notion-reject', { id: change.id })}>Rechazar</button></> : <p>{change.status === 'applied' ? 'Guardado en Notion' : 'Rechazado'}</p>}</div>}
    <p role="status" className="text-sm">{busy ? 'Consultando Notion…' : message}</p>
  </section>
}
