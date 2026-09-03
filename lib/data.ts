// ---------------------------------------------------------------------------
// Product Engineering Control Center — datos de ejemplo (simulados)
// Modelo coherente para trazabilidad: Objetivo → Épica → Historia → Tarea →
// Commit / Pull Request. Nada aquí es un dato "real"; es una demostración
// realista del cruce Notion ↔ GitHub que haría el agente.
// ---------------------------------------------------------------------------

export type KanbanStatus =
  | 'backlog'
  | 'todo'
  | 'in_progress'
  | 'in_review'
  | 'done'
  | 'blocked'

export type CriterionStatus = 'covered' | 'partial' | 'uncovered'
export type PrStatus = 'draft' | 'open' | 'in_review' | 'merged'
export type CheckStatus = 'passing' | 'failing' | 'pending' | 'none'
export type Severity = 'high' | 'medium' | 'low'
export type Confidence = 'alta' | 'media' | 'baja'

export interface Member {
  id: string
  name: string
  initials: string
  role: string
  color: string // css var token name for the avatar tint
}

export interface Objective {
  id: string
  title: string
  description: string
  metric: string
  progress: number // 0-100 hacia la meta de negocio
}

export interface Epic {
  id: string
  objectiveId: string
  title: string
  description: string
}

export interface AcceptanceCriterion {
  id: string
  text: string
  status: CriterionStatus
  evidence?: string // qué commit/PR lo cubre, o por qué no se puede verificar
}

export interface Story {
  id: string
  epicId: string
  title: string
  description: string
  criteria: AcceptanceCriterion[]
}

export interface Task {
  id: string
  storyId: string
  title: string
  assigneeId: string | null
  status: KanbanStatus
  // Cumplimiento estimado por el agente cruzando criterios ↔ evidencia en código
  completion: number // 0-100
  confidence: Confidence
  points: number
  updatedAt: string
  // Nota honesta del agente: por qué el % es ese, o qué no pudo verificar
  agentNote: string
  daysInStatus: number
}

export interface Commit {
  id: string
  taskId: string | null
  authorId: string
  sha: string
  message: string
  additions: number
  deletions: number
  when: string
}

export interface PullRequest {
  id: string
  number: number
  taskId: string | null
  authorId: string
  title: string
  branch: string
  status: PrStatus
  checks: CheckStatus
  additions: number
  deletions: number
  filesChanged: number
  reviewers: string[]
  openedAgo: string
}

export type AlertType =
  | 'pr_without_task'
  | 'done_no_evidence'
  | 'criteria_uncovered'
  | 'blocked_too_long'
  | 'no_tests'
  | 'stale_pr'

export interface Alert {
  id: string
  severity: Severity
  type: AlertType
  title: string
  detail: string
  relatedLabel: string
  relatedId: string
  age: string
}

export type ActivityType =
  | 'commit'
  | 'pr_opened'
  | 'pr_merged'
  | 'task_moved'
  | 'criterion'
  | 'alert'
  | 'comment'

export interface ActivityEvent {
  id: string
  type: ActivityType
  actorId: string
  text: string
  targetId?: string
  when: string
}

// --- Equipo --------------------------------------------------------------

export const members: Member[] = [
  { id: 'u1', name: 'Ana Torres', initials: 'AT', role: 'Frontend', color: 'info' },
  { id: 'u2', name: 'Diego Ramírez', initials: 'DR', role: 'Backend', color: 'primary' },
  { id: 'u3', name: 'Camila Ruiz', initials: 'CR', role: 'Fullstack', color: 'success' },
  { id: 'u4', name: 'Luis Fernández', initials: 'LF', role: 'QA + Backend', color: 'warning' },
  { id: 'u5', name: 'Sofía Méndez', initials: 'SM', role: 'Frontend', color: 'danger' },
]

// --- Objetivos de negocio ------------------------------------------------

export const objectives: Objective[] = [
  {
    id: 'OBJ-1',
    title: 'Reducir el abandono en el checkout',
    description:
      'Bajar la tasa de abandono del flujo de pago para aumentar la conversión de compra.',
    metric: 'Abandono de checkout −20%',
    progress: 62,
  },
  {
    id: 'OBJ-2',
    title: 'Habilitar acceso empresarial (SSO)',
    description:
      'Permitir que clientes empresariales usen su propio proveedor de identidad para iniciar sesión.',
    metric: '3 clientes enterprise activados',
    progress: 40,
  },
  {
    id: 'OBJ-3',
    title: 'Mejorar la observabilidad de la plataforma',
    description:
      'Dar al equipo visibilidad en tiempo real del estado del sistema para reaccionar antes.',
    metric: 'MTTR < 15 min',
    progress: 28,
  },
]

// --- Épicas --------------------------------------------------------------

export const epics: Epic[] = [
  {
    id: 'EP-1',
    objectiveId: 'OBJ-1',
    title: 'Checkout sin fricción',
    description: 'Simplificar el pago a un solo paso y recordar métodos de pago.',
  },
  {
    id: 'EP-2',
    objectiveId: 'OBJ-2',
    title: 'Identidad y accesos',
    description: 'SSO empresarial y control de roles por organización.',
  },
  {
    id: 'EP-3',
    objectiveId: 'OBJ-3',
    title: 'Telemetría y salud',
    description: 'Métricas en vivo, alertas y tableros de salud del servicio.',
  },
]

// --- Historias de usuario + criterios de aceptación ----------------------

export const stories: Story[] = [
  {
    id: 'ST-101',
    epicId: 'EP-1',
    title: 'Guardar métodos de pago del usuario',
    description:
      'Como usuario recurrente quiero que mi tarjeta quede guardada para no reescribirla en cada compra.',
    criteria: [
      { id: 'AC-101a', text: 'La tarjeta se tokeniza y guarda de forma segura', status: 'covered', evidence: 'PR #142 · commit a1f3c9d' },
      { id: 'AC-101b', text: 'El usuario puede eliminar un método guardado', status: 'covered', evidence: 'PR #142 · commit 7b22e01' },
      { id: 'AC-101c', text: 'Se valida CVV en cada uso del método guardado', status: 'partial', evidence: 'Implementado en UI, falta validación en el servicio de pago' },
    ],
  },
  {
    id: 'ST-102',
    epicId: 'EP-1',
    title: 'Checkout en un solo paso',
    description:
      'Como usuario quiero completar la compra en una sola pantalla con mis datos precargados.',
    criteria: [
      { id: 'AC-102a', text: 'Dirección y pago se precargan del perfil', status: 'covered', evidence: 'PR #148 · commit 3d90aa' },
      { id: 'AC-102b', text: 'Resumen de pedido visible sin recargar', status: 'partial', evidence: 'Falta el cálculo de impuestos en vivo' },
      { id: 'AC-102c', text: 'Manejo de error cuando el pago es rechazado', status: 'uncovered', evidence: 'Sin evidencia en el código todavía' },
      { id: 'AC-102d', text: 'Accesible por teclado (WCAG AA)', status: 'uncovered', evidence: 'No verificable: no hay pruebas de accesibilidad' },
    ],
  },
  {
    id: 'ST-201',
    epicId: 'EP-2',
    title: 'Inicio de sesión con SSO (SAML)',
    description:
      'Como administrador de una empresa quiero que mi equipo entre con nuestro proveedor SAML.',
    criteria: [
      { id: 'AC-201a', text: 'Flujo SAML de ida y vuelta funciona con Okta', status: 'covered', evidence: 'PR #151 · commit c0ffee1' },
      { id: 'AC-201b', text: 'Aprovisionamiento automático de usuarios (JIT)', status: 'partial', evidence: 'Crea usuarios pero no sincroniza grupos' },
      { id: 'AC-201c', text: 'Fallback a login por contraseña si SSO falla', status: 'uncovered', evidence: 'Sin evidencia en el código todavía' },
    ],
  },
  {
    id: 'ST-202',
    epicId: 'EP-2',
    title: 'Gestión de roles por organización',
    description:
      'Como administrador quiero asignar roles (admin, editor, lector) a los miembros de mi organización.',
    criteria: [
      { id: 'AC-202a', text: 'CRUD de roles a nivel de organización', status: 'uncovered', evidence: 'Sin evidencia en el código todavía' },
      { id: 'AC-202b', text: 'Los permisos se aplican en el backend', status: 'uncovered', evidence: 'Sin evidencia en el código todavía' },
    ],
  },
  {
    id: 'ST-301',
    epicId: 'EP-3',
    title: 'Dashboard de métricas en vivo',
    description:
      'Como equipo de plataforma queremos ver latencia, errores y throughput en tiempo real.',
    criteria: [
      { id: 'AC-301a', text: 'Gráficas de latencia p95 en vivo', status: 'partial', evidence: 'Datos llegan, falta la ventana de tiempo configurable' },
      { id: 'AC-301b', text: 'Alertas cuando la tasa de error supera 2%', status: 'uncovered', evidence: 'Sin evidencia en el código todavía' },
    ],
  },
]

// --- Tareas --------------------------------------------------------------

export const tasks: Task[] = [
  {
    id: 'T-1001', storyId: 'ST-101', title: 'Tokenizar y persistir métodos de pago',
    assigneeId: 'u2', status: 'done', completion: 100, confidence: 'alta', points: 5,
    updatedAt: 'hace 2 días', daysInStatus: 2,
    agentNote: 'Los 2 criterios asignados están cubiertos por el PR #142 (fusionado, checks en verde).',
  },
  {
    id: 'T-1002', storyId: 'ST-101', title: 'Validar CVV en el servicio de pago',
    assigneeId: 'u4', status: 'in_progress', completion: 45, confidence: 'media', points: 3,
    updatedAt: 'hace 6 horas', daysInStatus: 3,
    agentNote: 'La UI valida CVV pero el servicio de pago aún no. Criterio AC-101c parcial.',
  },
  {
    id: 'T-1003', storyId: 'ST-102', title: 'Precargar dirección y método de pago',
    assigneeId: 'u1', status: 'done', completion: 100, confidence: 'alta', points: 3,
    updatedAt: 'hace 1 día', daysInStatus: 1,
    agentNote: 'Cubierto por PR #148. Evidencia clara en commit 3d90aa.',
  },
  {
    id: 'T-1004', storyId: 'ST-102', title: 'Resumen de pedido en vivo (impuestos)',
    assigneeId: 'u1', status: 'in_review', completion: 70, confidence: 'media', points: 5,
    updatedAt: 'hace 4 horas', daysInStatus: 2,
    agentNote: 'PR #148 en revisión. Falta cálculo de impuestos en vivo (AC-102b parcial).',
  },
  {
    id: 'T-1005', storyId: 'ST-102', title: 'Manejo de pago rechazado',
    assigneeId: null, status: 'todo', completion: 0, confidence: 'alta', points: 3,
    updatedAt: 'hace 3 días', daysInStatus: 3,
    agentNote: 'Sin asignar y sin evidencia en código. AC-102c sin cubrir.',
  },
  {
    id: 'T-1006', storyId: 'ST-102', title: 'Auditoría de accesibilidad del checkout',
    assigneeId: 'u5', status: 'backlog', completion: 0, confidence: 'baja', points: 2,
    updatedAt: 'hace 5 días', daysInStatus: 5,
    agentNote: 'No verificable: no existen pruebas de accesibilidad en el repo.',
  },
  {
    id: 'T-2001', storyId: 'ST-201', title: 'Flujo SAML de ida y vuelta',
    assigneeId: 'u2', status: 'done', completion: 100, confidence: 'alta', points: 8,
    updatedAt: 'hace 3 días', daysInStatus: 3,
    agentNote: 'Cubierto por PR #151 (fusionado). Probado contra Okta sandbox.',
  },
  {
    id: 'T-2002', storyId: 'ST-201', title: 'Aprovisionamiento JIT de usuarios',
    assigneeId: 'u3', status: 'in_progress', completion: 55, confidence: 'media', points: 5,
    updatedAt: 'hace 1 día', daysInStatus: 4,
    agentNote: 'Crea usuarios al vuelo pero no sincroniza grupos/roles. AC-201b parcial.',
  },
  {
    id: 'T-2003', storyId: 'ST-201', title: 'Fallback a login por contraseña',
    assigneeId: null, status: 'todo', completion: 0, confidence: 'alta', points: 3,
    updatedAt: 'hace 2 días', daysInStatus: 2,
    agentNote: 'Sin asignar. AC-201c sin cubrir.',
  },
  {
    id: 'T-2004', storyId: 'ST-202', title: 'Diseño del modelo de roles',
    assigneeId: 'u3', status: 'blocked', completion: 15, confidence: 'baja', points: 5,
    updatedAt: 'hace 6 días', daysInStatus: 6,
    agentNote: 'Bloqueada 6 días esperando definición de permisos de producto. Riesgo para OBJ-2.',
  },
  {
    id: 'T-2005', storyId: 'ST-202', title: 'Aplicar permisos en el backend',
    assigneeId: null, status: 'backlog', completion: 0, confidence: 'alta', points: 8,
    updatedAt: 'hace 7 días', daysInStatus: 7,
    agentNote: 'Depende de T-2004 (bloqueada). Sin evidencia en código.',
  },
  {
    id: 'T-3001', storyId: 'ST-301', title: 'Ingesta de métricas de latencia',
    assigneeId: 'u4', status: 'in_progress', completion: 60, confidence: 'media', points: 5,
    updatedAt: 'hace 8 horas', daysInStatus: 2,
    agentNote: 'Los datos p95 ya llegan; falta ventana de tiempo configurable (AC-301a parcial).',
  },
  {
    id: 'T-3002', storyId: 'ST-301', title: 'Alertas por tasa de error',
    assigneeId: 'u2', status: 'todo', completion: 0, confidence: 'alta', points: 5,
    updatedAt: 'hace 1 día', daysInStatus: 1,
    agentNote: 'Aún no iniciada. AC-301b sin cubrir.',
  },
  {
    id: 'T-3003', storyId: 'ST-301', title: 'Panel de gráficas en vivo',
    assigneeId: 'u5', status: 'in_review', completion: 80, confidence: 'media', points: 5,
    updatedAt: 'hace 5 horas', daysInStatus: 1,
    agentNote: 'PR #156 en revisión. Falta cablear la ventana de tiempo al backend.',
  },
]

// --- Commits -------------------------------------------------------------

export const commits: Commit[] = [
  { id: 'c1', taskId: 'T-1001', authorId: 'u2', sha: 'a1f3c9d', message: 'feat(pay): tokenizar tarjeta con proveedor', additions: 214, deletions: 12, when: 'hace 3 días' },
  { id: 'c2', taskId: 'T-1001', authorId: 'u2', sha: '7b22e01', message: 'feat(pay): eliminar método de pago guardado', additions: 96, deletions: 4, when: 'hace 3 días' },
  { id: 'c3', taskId: 'T-1003', authorId: 'u1', sha: '3d90aa', message: 'feat(checkout): precargar perfil del usuario', additions: 158, deletions: 22, when: 'hace 1 día' },
  { id: 'c4', taskId: 'T-1004', authorId: 'u1', sha: 'e5b7712', message: 'feat(checkout): resumen de pedido reactivo', additions: 132, deletions: 8, when: 'hace 5 horas' },
  { id: 'c5', taskId: 'T-1002', authorId: 'u4', sha: 'f10dd22', message: 'wip(pay): validación de CVV en formulario', additions: 44, deletions: 2, when: 'hace 6 horas' },
  { id: 'c6', taskId: 'T-2001', authorId: 'u2', sha: 'c0ffee1', message: 'feat(auth): handshake SAML con Okta', additions: 320, deletions: 18, when: 'hace 3 días' },
  { id: 'c7', taskId: 'T-2002', authorId: 'u3', sha: 'b4d0011', message: 'feat(auth): aprovisionamiento JIT de usuarios', additions: 176, deletions: 6, when: 'hace 1 día' },
  { id: 'c8', taskId: 'T-3001', authorId: 'u4', sha: 'd33ff01', message: 'feat(telemetry): pipeline de latencia p95', additions: 240, deletions: 14, when: 'hace 8 horas' },
  { id: 'c9', taskId: 'T-3003', authorId: 'u5', sha: 'aa77c30', message: 'feat(dash): gráficas en vivo con websocket', additions: 288, deletions: 20, when: 'hace 5 horas' },
  // Commit sin tarea asociada — genera alerta
  { id: 'c10', taskId: null, authorId: 'u3', sha: '9911abc', message: 'refactor: mover utilidades de fecha a shared', additions: 61, deletions: 47, when: 'hace 7 horas' },
]

// --- Pull Requests -------------------------------------------------------

export const pullRequests: PullRequest[] = [
  { id: 'pr142', number: 142, taskId: 'T-1001', authorId: 'u2', title: 'Métodos de pago guardados', branch: 'feat/saved-payment-methods', status: 'merged', checks: 'passing', additions: 310, deletions: 16, filesChanged: 9, reviewers: ['u3', 'u4'], openedAgo: 'fusionado hace 2 días' },
  { id: 'pr148', number: 148, taskId: 'T-1004', authorId: 'u1', title: 'Checkout en un paso + resumen en vivo', branch: 'feat/one-step-checkout', status: 'in_review', checks: 'pending', additions: 290, deletions: 30, filesChanged: 12, reviewers: ['u3'], openedAgo: 'abierto hace 4 horas' },
  { id: 'pr151', number: 151, taskId: 'T-2001', authorId: 'u2', title: 'SSO SAML con Okta', branch: 'feat/saml-sso', status: 'merged', checks: 'passing', additions: 338, deletions: 18, filesChanged: 15, reviewers: ['u3', 'u4'], openedAgo: 'fusionado hace 3 días' },
  { id: 'pr153', number: 153, taskId: 'T-2002', authorId: 'u3', title: 'Aprovisionamiento JIT (WIP)', branch: 'feat/jit-provisioning', status: 'draft', checks: 'failing', additions: 182, deletions: 9, filesChanged: 7, reviewers: [], openedAgo: 'abierto hace 1 día' },
  { id: 'pr156', number: 156, taskId: 'T-3003', authorId: 'u5', title: 'Panel de métricas en vivo', branch: 'feat/live-metrics-dash', status: 'in_review', checks: 'passing', additions: 300, deletions: 22, filesChanged: 10, reviewers: ['u4'], openedAgo: 'abierto hace 5 horas' },
  // PR sin tarea asociada — genera alerta
  { id: 'pr155', number: 155, taskId: null, authorId: 'u3', title: 'Refactor utilidades de fecha', branch: 'chore/date-utils', status: 'open', checks: 'passing', additions: 61, deletions: 47, filesChanged: 4, reviewers: [], openedAgo: 'abierto hace 7 horas' },
  // PR abierto hace mucho — genera alerta de PR estancado
  { id: 'pr139', number: 139, taskId: 'T-2004', authorId: 'u3', title: 'Bosquejo del modelo de roles', branch: 'spike/roles-model', status: 'open', checks: 'none', additions: 120, deletions: 4, filesChanged: 6, reviewers: [], openedAgo: 'abierto hace 9 días' },
]

// --- Alertas -------------------------------------------------------------

export const alerts: Alert[] = [
  { id: 'a1', severity: 'high', type: 'blocked_too_long', title: 'Tarea bloqueada hace 6 días', detail: 'T-2004 "Diseño del modelo de roles" lleva 6 días bloqueada esperando definición de permisos. Pone en riesgo el objetivo OBJ-2.', relatedLabel: 'T-2004', relatedId: 'T-2004', age: 'hace 6 días' },
  { id: 'a2', severity: 'high', type: 'criteria_uncovered', title: 'Historia con criterios sin cubrir', detail: 'ST-102 "Checkout en un paso" tiene 2 de 4 criterios sin evidencia en el código (manejo de error de pago y accesibilidad).', relatedLabel: 'ST-102', relatedId: 'ST-102', age: 'hace 1 día' },
  { id: 'a3', severity: 'medium', type: 'pr_without_task', title: 'Pull request sin tarea asociada', detail: 'PR #155 "Refactor utilidades de fecha" no está vinculado a ninguna tarea de Notion. No se puede trazar a un objetivo.', relatedLabel: 'PR #155', relatedId: 'pr155', age: 'hace 7 horas' },
  { id: 'a4', severity: 'medium', type: 'stale_pr', title: 'Pull request estancado', detail: 'PR #139 lleva 9 días abierto sin revisión y sin checks configurados.', relatedLabel: 'PR #139', relatedId: 'pr139', age: 'hace 9 días' },
  { id: 'a5', severity: 'medium', type: 'no_tests', title: 'Cambio en pago sin pruebas', detail: 'La validación de CVV (T-1002) toca el flujo de pago pero el PR no incluye pruebas automáticas.', relatedLabel: 'T-1002', relatedId: 'T-1002', age: 'hace 6 horas' },
  { id: 'a6', severity: 'low', type: 'done_no_evidence', title: 'Revisar cobertura de criterio', detail: 'AC-101c (validar CVV) figura parcial: la UI valida pero el servicio de pago aún no. Confirmar antes de dar por cerrada ST-101.', relatedLabel: 'AC-101c', relatedId: 'ST-101', age: 'hace 6 horas' },
]

// --- Actividad -----------------------------------------------------------

export const activity: ActivityEvent[] = [
  { id: 'e1', type: 'pr_merged', actorId: 'u2', text: 'fusionó el PR #142 “Métodos de pago guardados”', targetId: 'pr142', when: 'hace 2 días' },
  { id: 'e2', type: 'commit', actorId: 'u1', text: 'subió commit 3d90aa en “Checkout en un paso”', targetId: 'T-1003', when: 'hace 1 día' },
  { id: 'e3', type: 'task_moved', actorId: 'u1', text: 'movió T-1004 a En revisión', targetId: 'T-1004', when: 'hace 4 horas' },
  { id: 'e4', type: 'alert', actorId: 'agent', text: 'detectó que el PR #155 no tiene tarea asociada', targetId: 'pr155', when: 'hace 7 horas' },
  { id: 'e5', type: 'commit', actorId: 'u5', text: 'subió commit aa77c30 en “Panel de métricas en vivo”', targetId: 'T-3003', when: 'hace 5 horas' },
  { id: 'e6', type: 'criterion', actorId: 'agent', text: 'marcó AC-101c como parcial tras revisar el servicio de pago', targetId: 'ST-101', when: 'hace 6 horas' },
  { id: 'e7', type: 'pr_opened', actorId: 'u5', text: 'abrió el PR #156 “Panel de métricas en vivo”', targetId: 'pr156', when: 'hace 5 horas' },
  { id: 'e8', type: 'comment', actorId: 'u3', text: 'comentó en T-2004 pidiendo la definición de permisos', targetId: 'T-2004', when: 'hace 1 día' },
  { id: 'e9', type: 'task_moved', actorId: 'u2', text: 'movió T-2001 a Terminado', targetId: 'T-2001', when: 'hace 3 días' },
  { id: 'e10', type: 'alert', actorId: 'agent', text: 'elevó a alta la alerta de bloqueo en T-2004 (6 días)', targetId: 'T-2004', when: 'hace 3 horas' },
]

// --- Metadatos de estados ------------------------------------------------

export const kanbanColumns: { id: KanbanStatus; label: string }[] = [
  { id: 'backlog', label: 'Backlog' },
  { id: 'todo', label: 'Por hacer' },
  { id: 'in_progress', label: 'En progreso' },
  { id: 'in_review', label: 'En revisión' },
  { id: 'done', label: 'Terminado' },
  { id: 'blocked', label: 'Bloqueado' },
]

export const statusLabels: Record<KanbanStatus, string> = {
  backlog: 'Backlog',
  todo: 'Por hacer',
  in_progress: 'En progreso',
  in_review: 'En revisión',
  done: 'Terminado',
  blocked: 'Bloqueado',
}

// --- Helpers -------------------------------------------------------------

export const memberById = (id: string | null) =>
  id ? members.find((m) => m.id === id) ?? null : null
export const objectiveById = (id: string) => objectives.find((o) => o.id === id)
export const epicById = (id: string) => epics.find((e) => e.id === id)
export const storyById = (id: string) => stories.find((s) => s.id === id)
export const taskById = (id: string) => tasks.find((t) => t.id === id)
export const tasksByStory = (storyId: string) => tasks.filter((t) => t.storyId === storyId)
export const storiesByEpic = (epicId: string) => stories.filter((s) => s.epicId === epicId)
export const epicsByObjective = (objId: string) => epics.filter((e) => e.objectiveId === objId)
export const commitsByTask = (taskId: string) => commits.filter((c) => c.taskId === taskId)
export const prByTask = (taskId: string) => pullRequests.filter((p) => p.taskId === taskId)

// Cumplimiento agregado de una historia = promedio de cobertura de criterios
export function storyCoverage(story: Story): number {
  if (story.criteria.length === 0) return 0
  const score = story.criteria.reduce((acc, c) => {
    if (c.status === 'covered') return acc + 1
    if (c.status === 'partial') return acc + 0.5
    return acc
  }, 0)
  return Math.round((score / story.criteria.length) * 100)
}

export function projectStats() {
  const total = tasks.length
  const done = tasks.filter((t) => t.status === 'done').length
  const inProgress = tasks.filter((t) => t.status === 'in_progress').length
  const inReview = tasks.filter((t) => t.status === 'in_review').length
  const blocked = tasks.filter((t) => t.status === 'blocked').length
  const avgCompletion = Math.round(
    tasks.reduce((a, t) => a + t.completion, 0) / total,
  )
  const allCriteria = stories.flatMap((s) => s.criteria)
  const covered = allCriteria.filter((c) => c.status === 'covered').length
  const partial = allCriteria.filter((c) => c.status === 'partial').length
  const uncovered = allCriteria.filter((c) => c.status === 'uncovered').length
  const openPrs = pullRequests.filter((p) => p.status !== 'merged').length
  const untracedPrs = pullRequests.filter((p) => p.taskId === null).length
  return {
    total, done, inProgress, inReview, blocked, avgCompletion,
    criteria: { total: allCriteria.length, covered, partial, uncovered },
    openPrs, untracedPrs,
    highAlerts: alerts.filter((a) => a.severity === 'high').length,
    mediumAlerts: alerts.filter((a) => a.severity === 'medium').length,
  }
}
