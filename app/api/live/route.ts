import { cookies } from 'next/headers'
import { readNote, proposeNote, decideNote } from '@/lib/notion-notes'
import { assistant, decide, disconnect, propose, session, synchronize } from '@/lib/live-server'
import { getCurrentUser, getDefaultProject, requireProjectRole, restoreProjectState, saveConnection, saveProposal, saveSnapshot } from '@/lib/project-store'

export const runtime = 'nodejs'
export const maxDuration = 300
export async function POST(request: Request) {
  const origin = request.headers.get('origin')
  if (origin !== new URL(request.url).origin || !request.headers.get('content-type')?.startsWith('application/json')) return Response.json({ error: 'Origen o formato de solicitud inválido.' }, { status: 403 })
  const jar = await cookies()
  let locked: ReturnType<typeof session>['data'] | undefined
  try {
    const { supabase, user } = await getCurrentUser()
    const raw = await request.text()
    if (raw.length > 40000) throw new Error('Solicitud demasiado grande.')
    const body = JSON.parse(raw)
    const current = session(jar.get('pecc-session')?.value)
    const project = await getDefaultProject(user.id, supabase)
    current.data.userId = user.id
    current.data.projectId = project.id
    await restoreProjectState(project.id, current.data, supabase)
    jar.set('pecc-session', current.id, { httpOnly: true, secure: new URL(request.url).protocol === 'https:', sameSite: 'strict', path: '/', maxAge: 14400 })
    const s = current.data
    if (s.busy) return Response.json({ error: 'Hay una operación en curso; espera a que termine.' }, { status: 409 })
    s.busy = true; locked = s
    let data: unknown
    switch (body.action) {
      case 'notion-read': data = await readNote(s, body.pageId); break
      case 'notion-propose': data = proposeNote(s, body.pageId, body.blockId, body.after); break
      case 'notion-approve': case 'notion-reject':
        if (body.action === 'notion-approve' && body.confirmed !== true) return Response.json({ error: 'Se requiere aprobación explícita.' }, { status: 403 })
        data = await decideNote(s, body.id, body.action === 'notion-approve'); break
      case 'state': data = { snapshot: s.snapshot || null, proposals: [...s.proposals.values()] }; break
      case 'disconnect': disconnect(current.id); jar.delete('pecc-session'); data = null; break
      case 'sync':
        await requireProjectRole(project.id, user.id, ['owner', 'admin', 'pm'], supabase)
        data = await synchronize(s, body.settings, body.scope)
        await saveConnection(project.id, s.settings!, supabase)
        await saveSnapshot(project.id, data as Awaited<ReturnType<typeof synchronize>>, supabase)
        break
      case 'assistant': case 'propose':
        if (typeof body.prompt !== 'string' || !body.prompt.trim() || body.prompt.length > 4000) throw new Error('Escribe una solicitud de hasta 4.000 caracteres.')
        if (body.action === 'propose') await requireProjectRole(project.id, user.id, ['owner', 'admin', 'pm'], supabase)
        data = body.action === 'assistant' ? await assistant(s, body.prompt) : await propose(s, body.path, body.prompt)
        if (body.action === 'propose') await saveProposal(project.id, user.id, data as Awaited<ReturnType<typeof propose>>, supabase)
        break
      case 'approve': case 'reject':
        if (body.action === 'approve' && body.confirmed !== true) return Response.json({ error: 'Se requiere aprobación explícita.' }, { status: 403 })
        await requireProjectRole(project.id, user.id, ['owner', 'admin', 'approver'], supabase)
        data = await decide(s, body.id, body.action === 'approve')
        await saveProposal(project.id, user.id, data as Awaited<ReturnType<typeof decide>>, supabase)
        break
      default: throw new Error('Acción desconocida.')
    }
    return Response.json({ data }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : 'No se pudo completar la operación.' }, { status: 400 }) }
  finally { if (locked) locked.busy = false }
}
