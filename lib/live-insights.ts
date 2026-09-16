import type { Evidence, Snapshot } from './live-types'

export type HealthLevel = 'green' | 'yellow' | 'red'
export type RiskSeverity = 'high' | 'medium' | 'low'

export type ProjectRisk = {
  id: string
  severity: RiskSeverity
  title: string
  impact: string
  action: string
  evidence: string
  owner: string
  url?: string
}

export type ProjectHealth = {
  level: HealthLevel
  label: string
  explanation: string
  score: number
  signals: string[]
  risks: ProjectRisk[]
}

const doneStatuses = new Set(['done', 'closed', 'accepted', 'resolved', 'finished', 'merged', 'complete', 'completed'])
const boardKinds = new Set(['jira', 'taiga', 'notion', 'issue', 'story', 'task'])

function normalize(value: string) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim()
}

function isDone(record: Evidence) {
  return doneStatuses.has(normalize(record.status))
}

function ageInDays(record: Evidence) {
  const time = Date.parse(record.date)
  return Number.isFinite(time) ? Math.max(0, Math.floor((Date.now() - time) / 86400000)) : 0
}

function riskForWarnings(snapshot: Snapshot): ProjectRisk | null {
  if (!snapshot.warnings.length) return null
  return {
    id: 'coverage',
    severity: 'medium',
    title: 'La información del proyecto tiene cobertura parcial',
    impact: 'La presentación puede no reflejar todos los cambios del tablero o del repositorio.',
    action: 'Revisar los avisos y confirmar con el equipo cualquier dato que falte antes de presentar.',
    evidence: snapshot.warnings[0],
    owner: 'PM',
  }
}

export function projectHealth(snapshot: Snapshot): ProjectHealth {
  const risks: ProjectRisk[] = []
  const boardRecords = snapshot.records.filter(record => boardKinds.has(normalize(record.kind)))
  const blocked = snapshot.records.filter(record => /\b(blocked|bloquead|blocked)/i.test(record.status))
  const unassigned = boardRecords.filter(record => !isDone(record) && !record.assignee)
  const openPullRequests = snapshot.records.filter(record => record.kind === 'pr' && !isDone(record))
  const stalePullRequests = openPullRequests.filter(record => ageInDays(record) >= 14)

  if (blocked.length) {
    const item = blocked[0]
    risks.push({
      id: 'blocked-work',
      severity: 'high',
      title: `${blocked.length} elemento${blocked.length === 1 ? '' : 's'} bloqueado${blocked.length === 1 ? '' : 's'}`,
      impact: 'Puede retrasar el siguiente entregable si permanece sin resolución.',
      action: 'Confirmar el impedimento, asignar un responsable y definir una fecha de desbloqueo.',
      evidence: item.title,
      owner: item.assignee || 'Sin responsable',
      url: item.url,
    })
  }

  if (stalePullRequests.length) {
    const item = stalePullRequests[0]
    risks.push({
      id: 'stale-pr',
      severity: 'high',
      title: `${stalePullRequests.length} pull request${stalePullRequests.length === 1 ? '' : 's'} lleva${stalePullRequests.length === 1 ? '' : 'n'} 14 días o más abierta${stalePullRequests.length === 1 ? '' : 's'}`,
      impact: 'El trabajo puede quedar detenido y la integración puede acumular riesgo.',
      action: 'Solicitar revisión o acordar si debe dividirse, actualizarse o cerrarse.',
      evidence: item.title,
      owner: item.assignee || item.actor || 'Equipo de desarrollo',
      url: item.url,
    })
  }

  if (unassigned.length) {
    const item = unassigned[0]
    risks.push({
      id: 'unassigned-work',
      severity: 'medium',
      title: `${unassigned.length} tarea${unassigned.length === 1 ? '' : 's'} activa${unassigned.length === 1 ? '' : 's'} sin responsable`,
      impact: 'No hay una persona claramente responsable de llevar este trabajo al siguiente estado.',
      action: 'Asignar responsable y confirmar la fecha prevista en el tablero.',
      evidence: item.title,
      owner: 'PM',
      url: item.url,
    })
  }

  const warningRisk = riskForWarnings(snapshot)
  if (warningRisk) risks.push(warningRisk)

  const highRisks = risks.filter(risk => risk.severity === 'high').length
  const score = Math.max(0, 100 - highRisks * 30 - risks.filter(risk => risk.severity === 'medium').length * 12)
  const level: HealthLevel = highRisks > 0 ? 'red' : risks.length > 0 ? 'yellow' : 'green'
  const label = level === 'green' ? 'En buen camino' : level === 'yellow' ? 'Requiere atención' : 'En riesgo'
  const explanation = level === 'green'
    ? 'No se detectaron bloqueos, actividad estancada ni problemas de cobertura.'
    : level === 'yellow'
      ? 'Hay situaciones que conviene resolver o confirmar antes de la presentación.'
      : 'Hay impedimentos o trabajo estancado que puede afectar una entrega.'
  const signals = [
    `${snapshot.records.filter(record => record.kind === 'commit').length} commits consultados`,
    `${openPullRequests.length} pull requests abiertas`,
    `${boardRecords.filter(record => !isDone(record)).length} elementos activos del tablero`,
  ]

  return { level, label, explanation, score, signals, risks }
}
