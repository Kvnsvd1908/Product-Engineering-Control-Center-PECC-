import type { Evidence } from './live-types'

export type TraceLink = { reference: string; work: Evidence[]; technical: Evidence[]; confidence: 'explicit' }

const referencePattern = /\b[A-Z][A-Z0-9_]{1,19}-\d+\b|\b(?:GH|TAIGA)#\d+\b/gi

function references(record: Evidence) {
  return [...new Set([...(record.refs || []), ...(record.title.match(referencePattern) || [])].map(value => value.toUpperCase()))]
}

export function buildTraceability(records: Evidence[]): TraceLink[] {
  const groups = new Map<string, { work: Evidence[]; technical: Evidence[] }>()
  for (const record of records) {
    const technical = ['commit', 'pr'].includes(record.kind)
    for (const reference of references(record)) {
      const group = groups.get(reference) || { work: [], technical: [] }
      const list = technical ? group.technical : group.work
      if (!list.some(item => item.id === record.id)) list.push(record)
      groups.set(reference, group)
    }
  }
  return [...groups.entries()]
    .filter(([, group]) => group.work.length > 0 && group.technical.length > 0)
    .map(([reference, group]) => ({ reference, ...group, confidence: 'explicit' as const }))
    .sort((a, b) => a.reference.localeCompare(b.reference))
}

export function traceabilityUnlinked(records: Evidence[]) {
  const linked = new Set(buildTraceability(records).flatMap(link => [...link.work, ...link.technical].map(record => record.id)))
  return records.filter(record => !linked.has(record.id) && !['commit', 'pr'].includes(record.kind))
}