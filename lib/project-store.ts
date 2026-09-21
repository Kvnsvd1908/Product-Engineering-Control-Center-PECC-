import type { Proposal, Settings, Snapshot } from './live-types'
import { createClient } from './supabase/server'
import { decryptSecret, encryptSecret } from './secrets'

type Project = { id: string; name: string; owner_id: string }
export type ProjectRole = 'owner' | 'admin' | 'pm' | 'approver' | 'viewer'

export async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Tu sesión no es válida. Inicia sesión nuevamente.')
  return { supabase, user }
}

export async function getDefaultProject(userId: string, supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: membership } = await supabase
    .from('memberships')
    .select('project_id, projects(id, name, owner_id)')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle()
  const existing = membership?.projects as Project | Project[] | null | undefined
  if (existing && !Array.isArray(existing)) return existing

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .insert({ name: 'Mi espacio PECC', owner_id: userId })
    .select('id, name, owner_id')
    .single()
  if (projectError || !project) throw new Error('No se pudo crear el espacio de trabajo en Supabase.')
  const { error: membershipError } = await supabase.from('memberships').insert({ project_id: project.id, user_id: userId, role: 'owner' })
  if (membershipError) throw new Error('No se pudo configurar el propietario del espacio.')
  return project as Project
}

export async function requireProjectRole(projectId: string, userId: string, roles: ProjectRole[], supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: project } = await supabase.from('projects').select('owner_id').eq('id', projectId).maybeSingle()
  if (project?.owner_id === userId && roles.includes('owner')) return
  const { data: membership } = await supabase.from('memberships').select('role').eq('project_id', projectId).eq('user_id', userId).maybeSingle()
  if (!membership || !roles.includes(membership.role as ProjectRole)) throw new Error('No tienes permisos para esta operación.')
}

export async function restoreProjectState(projectId: string, session: { snapshot?: Snapshot; proposals: Map<string, Proposal> }, supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: connection } = await supabase.from('connections').select('encrypted_data').eq('project_id', projectId).maybeSingle()
  if (connection?.encrypted_data && !('settings' in session)) Object.assign(session, { settings: decryptSecret<Settings>(connection.encrypted_data) })
  if (!session.snapshot) {
    const { data } = await supabase.from('snapshots').select('payload').eq('project_id', projectId).order('created_at', { ascending: false }).limit(1).maybeSingle()
    if (data?.payload) session.snapshot = data.payload as Snapshot
  }
  if (session.proposals.size === 0) {
    const { data } = await supabase.from('proposals').select('*').eq('project_id', projectId).order('created_at', { ascending: false }).limit(20)
    for (const row of data ?? []) session.proposals.set(row.id, { id: row.id, title: row.title, reason: row.reason, path: row.path, before: row.before_content, after: row.after_content, head: row.head, status: row.status, url: row.url ?? undefined })
  }
}

export async function saveSnapshot(projectId: string, snapshot: Snapshot, supabase: Awaited<ReturnType<typeof createClient>>) {
  const { error } = await supabase.from('snapshots').insert({ project_id: projectId, status: 'success', head: snapshot.head, payload: snapshot })
  if (error) throw new Error('No se pudo guardar la sincronización en Supabase.')
}

export async function saveConnection(projectId: string, settings: Settings, supabase: Awaited<ReturnType<typeof createClient>>) {
  const { error } = await supabase.from('connections').upsert({ project_id: projectId, encrypted_data: encryptSecret(settings), updated_at: new Date().toISOString() }, { onConflict: 'project_id' })
  if (error) throw new Error('No se pudo guardar la conexión en Supabase.')
}

export async function saveProposal(projectId: string, userId: string, proposal: Proposal, supabase: Awaited<ReturnType<typeof createClient>>) {
  const { error } = await supabase.from('proposals').upsert({ id: proposal.id, project_id: projectId, created_by: userId, path: proposal.path, title: proposal.title, reason: proposal.reason, before_content: proposal.before, after_content: proposal.after, head: proposal.head, status: proposal.status, url: proposal.url ?? null, updated_at: new Date().toISOString() })
  if (error) throw new Error('No se pudo guardar la propuesta en Supabase.')
}
