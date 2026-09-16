/** Only extract an ID. Never fetch the pasted URL or send credentials to its host. */
export function notionDatabaseId(input: string): string {
  let url: URL
  try { url = new URL(input.trim()) } catch { throw new Error('URL de Notion inválida. Copia el enlace completo de la base de datos desde Compartir → Copiar enlace.') }
  if (url.protocol !== 'https:' || url.username || url.password || url.port) throw new Error('Usa un enlace HTTPS de Notion sin credenciales ni puerto.')
  const domains = ['notion.so', 'notion.site', 'notion.com']
  if (!domains.some(domain => url.hostname === domain || url.hostname.endsWith(`.${domain}`))) {
    throw new Error('Dominio de Notion no reconocido. Se admiten notion.so, notion.site y notion.com. Si usas un dominio personalizado, copia el enlace original desde Notion → Compartir → Copiar enlace.')
  }
  const tail = url.pathname.split('/').filter(Boolean).at(-1) || ''
  const id = tail.match(/(?:^|-)([a-f0-9]{32}|[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/i)?.[1]
  if (!id) throw new Error('El enlace no contiene el identificador de la base de datos. Abre la base original en Notion y usa Compartir → Copiar enlace; un enlace público abreviado o de inicio no basta.')
  // Query parameters such as v (view) and p (opened page) are not the database ID.
  return id.replace(/-/g, '')
}
