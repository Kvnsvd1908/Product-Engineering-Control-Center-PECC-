'use client'

import { useEffect, useRef, useState } from 'react'
import { Bot, CornerDownLeft, Sparkles, TriangleAlert } from 'lucide-react'
import {
  alerts,
  objectives,
  projectStats,
  stories,
  storyCoverage,
  tasks,
} from '@/lib/data'
import { Panel } from '@/components/control-center/primitives'
import { cn } from '@/lib/utils'

interface Message {
  id: number
  role: 'user' | 'agent'
  content: string
  meta?: string
}

const suggestions = [
  'Dame un resumen del avance de la semana',
  '¿Hay algún error en el código del PR #143?',
  'Corrige la redacción de la historia ST-102 en Notion',
  '¿Cómo va el objetivo de SSO?',
  '¿Qué está bloqueado ahora mismo?',
]

function buildReply(input: string): { content: string; meta?: string } {
  const q = input.toLowerCase()
  const s = projectStats()

  if (q.includes('resumen') || q.includes('semana') || q.includes('avance')) {
    return {
      content:
        `Esta semana: ${s.done} de ${s.total} tareas terminadas y un cumplimiento medio del ${s.avgCompletion}%. ` +
        `Se fusionaron los PRs de métodos de pago (#142) y SSO SAML (#151). ` +
        `Hay ${s.criteria.covered} criterios cubiertos, ${s.criteria.partial} parciales y ${s.criteria.uncovered} sin cubrir. ` +
        `Atención: ${s.highAlerts} alertas de prioridad alta, incluida una tarea bloqueada 6 días (T-2004).`,
      meta: 'Basado en Notion + GitHub · sin datos inventados',
    }
  }
  if (q.includes('sso') || q.includes('saml') || q.includes('obj-2') || q.includes('empresarial')) {
    const obj = objectives.find((o) => o.id === 'OBJ-2')!
    return {
      content:
        `El objetivo "${obj.title}" está al ${obj.progress}% (meta: ${obj.metric}). ` +
        `El flujo SAML con Okta ya está fusionado (T-2001, 100%). El aprovisionamiento JIT va al 55%: crea usuarios pero no sincroniza grupos. ` +
        `El fallback a contraseña (T-2003) y toda la gestión de roles (ST-202) siguen sin evidencia en el código, y T-2004 está bloqueada.`,
      meta: 'Trazabilidad OBJ-2 → EP-2',
    }
  }
  if (q.includes('bloque')) {
    const blocked = tasks.filter((t) => t.status === 'blocked')
    if (blocked.length === 0) return { content: 'No hay tareas bloqueadas ahora mismo.' }
    return {
      content:
        `Hay ${blocked.length} tarea(s) bloqueada(s): ` +
        blocked.map((t) => `${t.id} "${t.title}" (${t.daysInStatus} días) — ${t.agentNote}`).join(' '),
      meta: 'Fuente: tablero Kanban',
    }
  }
  if (q.includes('correg') || q.includes('redacc') || q.includes('st-102') || q.includes('mejorar')) {
    return {
      content:
        `📝 Auditoría de Requerimiento: ST-102 "Soporte para pagos con tarjeta" (Notion / Jira).\n\n` +
        `❌ Problema detectado en la redacción actual:\n` +
        `La historia es ambigua: no especifica qué hacer ante tarjetas rechazadas por fondos insuficientes, ni define el comportamiento ante caídas de la pasarela (timeout).\n\n` +
        `✨ Propuesta de corrección estructurada (Estándar INVEST / BDD):\n` +
        `• Título: ST-102 - Procesamiento seguro y resiliente de pagos con tarjeta\n` +
        `• Criterio 1: DADO un intento de cobro con fondos insuficientes, CUANDO la pasarela responda 402, ENTONCES mostrar alerta amigable y mantener el carrito activo sin duplicar la orden.\n` +
        `• Criterio 2: DADO un timeout >5s con Stripe, CUANDO no haya respuesta, ENTONCES reintentar con clave de idempotencia única para evitar cobros dobles.\n\n` +
        `¿Deseas que aplique esta corrección directamente en tu tablero de Notion/Jira?`,
      meta: 'Sugerencia de IA · Revisa antes de confirmar la sincronización',
    }
  }
  if (q.includes('error') || q.includes('código') || q.includes('codigo') || q.includes('pr #143') || q.includes('revisa') || q.includes('bug')) {
    return {
      content:
        `⚠️ Auditoría de Código: Pull Request #143 (Pasarela de pagos en producción).\n\n` +
        `🔍 Vulnerabilidad detectada en lib/stripe-checkout.ts:\n` +
        `El endpoint realiza la llamada a Stripe sin bloque try/catch ni timeout configurado. Si la API externa se cae o tarda demasiado, la promesa queda colgada y bloquea el hilo de ejecución, provocando un error 504 en el checkout de los clientes.\n\n` +
        `💡 Solución técnica recomendada:\n` +
        `try {\n` +
        `  const charge = await stripe.charges.create({\n` +
        `    amount: order.total,\n` +
        `    currency: 'clp',\n` +
        `    source: paymentToken,\n` +
        `  }, { timeout: 7000 });\n` +
        `} catch (err) {\n` +
        `  logger.error('Fallo en pasarela Stripe', { orderId, err });\n` +
        `  throw new PaymentGatewayException('Error de comunicación con el banco');\n` +
        `}\n\n` +
        `⚠️ Aviso de IA: Esta sugerencia fue generada por IA y puede contener imprecisiones. Debe ser validada por un programador antes de integrarse.`,
      meta: 'Análisis de Código y Seguridad · GitHub ↔ IA',
    }
  }
  if (q.includes('crea') || q.includes('crear') || q.includes('nueva tarea')) {
    return {
      content:
        'Listo, registré una nueva tarea en Notion: T-1007 "Manejar pago rechazado en el checkout", ' +
        'vinculada a la historia ST-102 y al criterio AC-102c (sin cubrir). Estado inicial: Por hacer, sin asignar. ' +
        '¿Quieres que se la asigne a alguien del equipo?',
      meta: 'Acción simulada · escribiría en Notion vía el agente',
    }
  }
  if (q.includes('asigna') || q.includes('asignar')) {
    return {
      content:
        'Puedo asignar una tarea a un miembro del equipo. Dime la tarea (por ejemplo T-1005) y la persona ' +
        '(Ana, Diego, Camila, Luis o Sofía) y actualizo el tablero.',
      meta: 'Acción simulada',
    }
  }
  if (q.includes('criterio') || q.includes('cobertura') || q.includes('cumpl')) {
    const worst = [...stories].sort((a, b) => storyCoverage(a) - storyCoverage(b))[0]
    return {
      content:
        `El cumplimiento medio de tareas es ${s.avgCompletion}%. La historia con menor cobertura es ${worst.id} "${worst.title}" (${storyCoverage(worst)}%). ` +
        `En total ${s.criteria.uncovered} criterios siguen sin evidencia en el código.`,
      meta: 'Cálculo sobre criterios de aceptación',
    }
  }
  if (q.includes('alerta')) {
    return {
      content:
        `Hay ${alerts.length} alertas activas (${s.highAlerts} altas, ${s.mediumAlerts} medias). ` +
        `Las más urgentes: ${alerts.filter((a) => a.severity === 'high').map((a) => a.title).join('; ')}.`,
      meta: 'Panel de alertas',
    }
  }
  return {
    content:
      'Todavía no tengo una respuesta verificable para eso. Puedo ayudarte con: resumen del avance, estado de un objetivo o iniciativa, tareas bloqueadas, cobertura de criterios, o crear/asignar tareas. No inventaré datos que no pueda cruzar entre Notion y GitHub.',
    meta: 'Honestidad sobre el estado real',
  }
}

export function AssistantView() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      role: 'agent',
      content:
        'Hola, soy el copiloto del Control Center. Cruzo lo definido en Notion con lo que ocurre en GitHub. Pregúntame por el avance, un objetivo o pídeme crear una tarea. Si algo no se puede verificar, te lo diré en lugar de inventarlo.',
    },
  ])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  function send(text: string) {
    const trimmed = text.trim()
    if (!trimmed || typing) return
    const userMsg: Message = { id: Date.now(), role: 'user', content: trimmed }
    setMessages((m) => [...m, userMsg])
    setInput('')
    setTyping(true)
    setTimeout(() => {
      const reply = buildReply(trimmed)
      setMessages((m) => [
        ...m,
        { id: Date.now() + 1, role: 'agent', content: reply.content, meta: reply.meta },
      ])
      setTyping(false)
    }, 650)
  }

  return (
    <Panel className="flex h-[calc(100vh-8.5rem)] flex-col">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <span className="inline-flex size-7 items-center justify-center rounded-md bg-primary/15 text-primary">
          <Bot className="size-4" />
        </span>
        <div>
          <h3 className="text-sm font-semibold">Copiloto de producto</h3>
          <p className="text-xs text-muted-foreground">Agente · Notion ↔ GitHub</p>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn('flex gap-3', m.role === 'user' ? 'justify-end' : 'justify-start')}
          >
            {m.role === 'agent' ? (
              <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary">
                <Bot className="size-4" />
              </span>
            ) : null}
            <div
              className={cn(
                'max-w-[80%] rounded-lg px-3.5 py-2.5 text-sm leading-relaxed',
                m.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border bg-background/50',
              )}
            >
              <div className="text-pretty whitespace-pre-wrap">{m.content}</div>
              {m.meta ? (
                <p
                  className={cn(
                    'mt-1.5 flex items-center gap-1 text-xs',
                    m.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground',
                  )}
                >
                  <Sparkles className="size-3" />
                  {m.meta}
                </p>
              ) : null}
            </div>
          </div>
        ))}
        {typing ? (
          <div className="flex items-center gap-3">
            <span className="inline-flex size-7 items-center justify-center rounded-md bg-primary/15 text-primary">
              <Bot className="size-4" />
            </span>
            <div className="flex gap-1 rounded-lg border border-border bg-background/50 px-3 py-3">
              <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
              <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
              <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground" />
            </div>
          </div>
        ) : null}
        <div ref={endRef} />
      </div>

      <div className="border-t border-border p-3">
        <div className="mb-2 flex flex-wrap gap-1.5">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              {s}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            send(input)
          }}
          className="flex items-end gap-2"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (
                e.key === 'Enter' &&
                !e.shiftKey &&
                !e.nativeEvent.isComposing &&
                e.keyCode !== 229
              ) {
                e.preventDefault()
                send(input)
              }
            }}
            rows={1}
            placeholder="Pregúntale al agente, pide corregir una historia o auditar un PR…"
            className="max-h-32 min-h-[2.5rem] flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/50"
          />
          <button
            type="submit"
            disabled={!input.trim() || typing}
            className="inline-flex h-10 items-center gap-1.5 rounded-md bg-primary px-3.5 text-sm font-medium text-primary-foreground transition-opacity disabled:opacity-40 cursor-pointer"
          >
            Enviar
            <CornerDownLeft className="size-3.5" />
          </button>
        </form>

        <div className="mt-2.5 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground border-t border-border/40 pt-2 text-center">
          <TriangleAlert className="size-3 text-warning shrink-0" />
          <span>El asistente utiliza Inteligencia Artificial. Los análisis de requerimientos y sugerencias de código deben ser validados por el equipo humano.</span>
        </div>
      </div>
    </Panel>
  )
}
