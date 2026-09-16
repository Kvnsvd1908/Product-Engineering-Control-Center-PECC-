type Resource = Record<string, any>

/** Resolve only databases directly contained by the supplied page, never search the workspace. */
export async function resolveNotionDatabase(id: string, get: (path: string) => Promise<Resource>): Promise<Resource> {
  try { return await get(`databases/${id}`) }
  catch (error) { if (!(error as Error).message.includes('HTTP 404')) throw error }

  try { await get(`pages/${id}`) }
  catch (error) {
    if ((error as Error).message.includes('HTTP 404')) throw new Error('Notion no permite acceder a ese enlace como base ni como página. Abre Notas → ••• → Conexiones → Añadir conexión y selecciona la integración cuyo token usaste. Si no puedes hacerlo, pide al propietario que la agregue. El acceso en tu navegador no concede acceso a la integración.')
    throw error
  }
  const databases: Resource[] = []
  let cursor: string | undefined
  for (let page = 0; page < 10; page++) {
    const children = await get(`blocks/${id}/children?page_size=100${cursor ? `&start_cursor=${encodeURIComponent(cursor)}` : ''}`)
    databases.push(...children.results.filter((block: Resource) => block.type === 'child_database'))
    cursor = children.has_more ? children.next_cursor : undefined
    if (!cursor) break
    if (page === 9) throw new Error('La página tiene demasiados bloques para detectar su base. Abre la base original y copia su enlace directamente.')
  }
  if (databases.length === 0) throw new Error('La integración puede leer esta página, pero no encontró una base de datos directamente dentro. Si Notas es una vista enlazada, abre su base de origen, agrega la integración allí y copia el enlace de esa base.')
  if (databases.length > 1) throw new Error(`La página contiene varias bases: ${databases.map(db => db.child_database?.title || db.id).join(', ')}. Abre la que quieres conectar y copia su enlace.`)
  try { return await get(`databases/${databases[0].id}`) }
  catch (error) {
    if ((error as Error).message.includes('HTTP 404')) throw new Error('Se encontró una base dentro de la página, pero la integración no puede leerla. Agrega la integración a esa base original desde su menú Conexiones.')
    throw error
  }
}
