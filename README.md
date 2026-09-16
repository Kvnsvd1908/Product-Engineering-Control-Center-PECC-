# Product Engineering Control Center (PECC)

Aplicaci?n Next.js para consultar un repositorio GitHub real y un tablero Jira Cloud, Taiga Cloud o Notion, revisar actividad con autor?a y generar res?menes ejecutivos con IA.

## Iniciar

Desde la carpeta que contiene package.json:

```bash
npm install
npm run dev
```

Tambi?n puedes usar pnpm install y pnpm dev. En PowerShell con scripts deshabilitados usa npm.cmd. Abre http://localhost:3000.

Para habilitar IA con Groq, copia .env.example a .env.local, configura GROQ_API_KEY con tu clave de Groq y GROQ_MODEL con un modelo compatible con Chat Completions y JSON mode (por ejemplo, llama-3.3-70b-versatile), y reinicia el servidor. La clave es exclusivamente del servidor. El asistente anterior era una simulaci?n; no hab?a una conexi?n a un agente externo configurado.

## Conectar fuentes reales

1. En Conexiones, apartado **Repositorio de c?digo**, introduce https://github.com/propietario/repositorio. Para repositorios privados agrega un token fine-grained con acceso al repositorio y permisos de lectura Contents, Issues y Pull requests. Para aplicar propuestas necesita Contents: Read and write.
2. Pulsa **Conectar repositorio**. En el apartado independiente **Tablero de producto**, selecciona Notion, Taiga o Jira e introduce su URL y credenciales:
   - Jira Cloud: URL del tablero con /boards/ID o rapidView=ID, o URL de proyecto con /projects/CLAVE. Para URLs sin identificador introduce la clave del proyecto. Usa email y API token de la cuenta con acceso. Un tablero consulta sus issues; una clave consulta el proyecto.
   - Taiga Cloud: https://tree.taiga.io/project/slug/kanban y token de autenticaci?n Taiga.
   - Notion: URL de la base de datos original con su UUID y token de una integraci?n a la que hayas compartido esa base. Consulta todas sus fuentes de datos. Una p?gina cualquiera o una vista enlazada no sustituye la base original.
3. Pulsa **Conectar Notion**, **Conectar Taiga** o **Conectar Jira**. No necesitas volver a ingresar el token GitHub. Revisa los avisos del Resumen. **Sincronizar todo** reutiliza las credenciales del servidor. **Desconectar tablero** conserva el repositorio; **Desconectar todo** cierra ambas conexiones. Al actualizar una conexi?n, introduce nuevamente solo el token correspondiente.

Se muestran commits, PRs e issues con autor, tareas con creador o ?ltimo editor y responsables por separado, estados y enlaces originales. En **Presentaci?n** se presenta una lectura ejecutiva para clientes, separada del detalle t?cnico. El **Resumen** calcula un sem?foro explicable y **Alertas** convierte bloqueos, PRs estancados, trabajo sin responsable y fallos de cobertura en riesgos con impacto, evidencia y siguiente acci?n. Las pantallas activas usan datos reales; lib/data.ts y las vistas antiguas quedan como referencia del prototipo y no alimentan el panel.

## IA y aprobaci?n de c?digo

En Asistente escribe la solicitud y pulsa Generar respuesta ejecutiva. Para revisar c?digo selecciona una ruta del inventario y pulsa Proponer cambio para revisi?n. Estas operaciones env?an contexto a OpenAI y pueden consumir saldo de API.

La propuesta presenta motivo, riesgos/pruebas sugeridas, archivo, commit base y contenido completo antes/despu?s. Marca la autorizaci?n espec?fica y pulsa Aprobar y crear rama para guardar ese contenido exacto en una rama pecc/proposal-ID. No se modifica la rama principal, no se fusiona ni se crea un PR autom?ticamente. Puedes abrir el PR desde GitHub despu?s de revisar y ejecutar pruebas.

El servidor guarda la propuesta; no acepta contenido modificado desde el bot?n de aprobaci?n. Rechaza propuestas ya procesadas, de otra sesi?n o cuya rama base haya cambiado. Los errores de escritura no se reintentan autom?ticamente: revisa si la rama existe antes de generar otra propuesta. Rechazar no escribe en GitHub. El agente no dispone de herramientas de ejecuci?n libre ni puede aprobar sus propias propuestas.

## Cobertura y l?mites actuales

- Sincronizaci?n manual: commits accesibles desde la rama principal, PRs de todos los estados, issues e inventario de archivos. Cada colecci?n pagina hasta 2.000 registros y advierte si alcanza el l?mite.
- No es una auditor?a exhaustiva de todos los datos: no descarga todas las ramas, comentarios, revisiones, CI, releases, historial de cambios del tablero ni contenido de todas las p?ginas Notion. No calcula autom?ticamente cumplimiento de criterios o relaciones tarea-c?digo.
- Taiga consulta historias, tareas e issues. Notion muestra el ID del ?ltimo editor cuando la respuesta no incluye nombre. Responsable asignado no equivale a autor del trabajo finalizado.
- La IA recibe como m?ximo 300 registros recientes y 300 rutas para los res?menes. Las propuestas reciben un archivo UTF-8 de hasta 24 KB; el resultado se limita a 48 KB. No ejecuta pruebas del repositorio conectado.
- GitLab, Bitbucket, Jira Server y Taiga autoalojado todav?a no tienen conector. Se restringen los destinos de red a los proveedores admitidos. La IA usa Groq mediante su API compatible con OpenAI.
- Sesiones aisladas por cookie HttpOnly/SameSite, en memoria del proceso durante cuatro horas. Reiniciar el servidor pierde credenciales, datos y propuestas. No se almacenan tokens en localStorage ni se devuelven al cliente.
- Esta versi?n es para uso local en una sola instancia. Antes de exponerla como servicio compartido necesita autenticaci?n de usuarios, roles de aprobaci?n, almacenamiento cifrado persistente, auditor?a duradera, cuotas y sesiones compartidas entre instancias. La sesi?n local representa a la persona que aprueba, no una identidad empresarial verificada.

## Verificar

```bash
npx tsc --noEmit
node --test tests/live.test.cjs
npm run build
```

Las pruebas usan respuestas API controladas y verifican paginaci?n, fallos parciales, validaci?n de URLs, aislamiento de propuestas, rechazo sin escritura, aprobaci?n ?nica y cambios de rama base. La prueba integral con cuentas reales requiere tus credenciales.

## Documentaci?n de proveedores

- [GitHub Git trees](https://docs.github.com/en/rest/git/trees)
- [Jira issue search](https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issue-search/)
- [Notion data sources](https://developers.notion.com/reference/query-a-data-source)
- [Taiga REST API](https://docs.taiga.io/api.html)
- [Groq Chat Completions](https://console.groq.com/docs/api-reference#chat-create)

## Leer y editar notas de Notion

Despu?s de conectar la base de datos (por ejemplo, Notas), entra en **Producto ? Documentos y notas de Notion** y abre una entrada como Resumen ejecutivo. La app consulta el contenido de sus bloques al abrirla.

Para modificar un bloque de texto simple: **Editar texto ? Preparar cambio para revisi?n ? marcar autorizaci?n ? Aprobar y guardar en Notion**. La propuesta se guarda en la sesi?n; la aprobaci?n aplica ese contenido exacto. Rechazar no modifica Notion. Si el bloque cambi? desde su lectura, se rechaza el guardado y debes volver a abrir la nota. Notion no ofrece aqu? una escritura condicional at?mica: evita editar simult?neamente el mismo bloque durante el guardado.

La integraci?n debe tener **Leer contenido** para abrir notas y **Actualizar contenido** para guardarlas, adem?s de acceso expl?cito a la base. Un enlace p?blico o una captura no concede permisos de escritura. Esta versi?n conserva el m?todo de token manual; no incluye OAuth.

La vista carga hasta 500 bloques, 20 consultas y 5 niveles de profundidad por nota. Indica la cobertura parcial. Admite editar p?rrafos, encabezados, listas, citas, tareas y desplegables con texto simple de hasta 2.000 caracteres. Conserva los dem?s atributos del bloque. Los bloques con enlaces, menciones o formato son de solo lectura; adjuntos, subp?ginas y bloques sincronizados se consultan en Notion. No crea ni elimina notas y no modifica t?tulos o propiedades de la base. El contenido abierto no se incorpora autom?ticamente al contexto del asistente ejecutivo.

Se guardan hasta 20 notas le?das y 30 propuestas por sincronizaci?n en la sesi?n. Una nueva sincronizaci?n invalida las propuestas anteriores. Si falla una escritura, revisa el original antes de intentar otra: no hay reintentos autom?ticos.

Referencias: [contenido de p?ginas](https://developers.notion.com/guides/data-apis/working-with-page-content) y [actualizaci?n de bloques](https://developers.notion.com/reference/update-a-block).
