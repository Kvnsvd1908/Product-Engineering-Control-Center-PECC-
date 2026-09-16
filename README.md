# Product Engineering Control Center (PECC)

PECC es un centro de control para Product Managers. Reune la actividad de un repositorio GitHub con el trabajo de un tablero de producto y ayuda a convertir datos tecnicos en decisiones ejecutivas.

## Que incluye

- Panel de resumen con salud del proyecto, metricas, actividad y riesgos.
- Presentacion ejecutiva para comunicar avances, pendientes y decisiones.
- Integraciones con GitHub, Taiga Cloud, Jira Cloud y Notion.
- Trazabilidad entre trabajo de producto y evidencia tecnica.
- Busqueda por trabajo, persona, estado o autor, con filtros independientes por fuente y estado.
- Estados vacios y estados de carga para evitar acciones ambiguas durante una sincronizacion.
- Asistente con IA para resumenes, riesgos y solicitudes tecnicas.
- Propuestas de cambios de codigo con revision y aprobacion explicita.
- Perfil del PM visible en la barra superior y cierre de sesion local y de servidor.
- Mensajes diferenciados para timeouts, servidor detenido y respuestas invalidas.
- Temas claro y oscuro con transicion animada.
- Login y registro local de demostracion.

> Estado actual: el login y registro son un prototipo local. Las cuentas se guardan en `localStorage` y no sustituyen un sistema de autenticacion para produccion.

## Requisitos

- Node.js 20 o superior.
- npm, pnpm o un gestor compatible.
- Una cuenta de GitHub si vas a conectar un repositorio privado.
- Una cuenta de Taiga, Jira o Notion si vas a conectar un tablero.

## Instalacion

Clona el repositorio y entra en su carpeta:

```bash
git clone <URL_DEL_REPOSITORIO>
cd Product-Engineering-Control-Center-PECC--main
```

Instala las dependencias:

```bash
npm install
```

Inicia el servidor de desarrollo:

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

En PowerShell puedes usar `npm.cmd` si las politicas de ejecucion bloquean los scripts:

```powershell
npm.cmd install
npm.cmd run dev
```

## Primer acceso

Al abrir la aplicacion se muestra la pantalla de acceso.

### Cuenta demo

La aplicacion crea una cuenta local de prueba automaticamente:

| Campo | Valor |
| --- | --- |
| Correo | `pm@pecc.local` |
| Contrasena | `pecc-demo` |

Tambien puedes pulsar **Cargar acceso** en el formulario. Luego pulsa **Entrar al centro de control**.

### Registrar otra cuenta local

1. Selecciona **Registrarme**.
2. Introduce nombre, correo y una contrasena de al menos seis caracteres.
3. Pulsa **Crear mi espacio**.

La cuenta se guarda solo en el navegador actual. Para cerrar sesion usa el icono de salida en la barra superior. Para borrar la cuenta local, elimina los datos del sitio desde las herramientas del navegador.

## Conectar GitHub

1. Entra en **Conexiones**.
2. En **Repositorio de codigo**, introduce una URL como `https://github.com/organizacion/repositorio`.
3. Para repositorios publicos el token es opcional.
4. Para repositorios privados, usa un token fine-grained con acceso al repositorio y permisos de lectura de:
   - Contents
   - Issues
   - Pull requests
5. Pulsa **Conectar repositorio**.

Las propuestas aprobadas necesitan permiso adicional de escritura en **Contents**. PECC consulta commits de la rama principal, pull requests, issues e inventario de archivos.

## Conectar un tablero

Primero conecta GitHub. Despues abre el apartado **Tablero de producto**, selecciona una plataforma e introduce sus credenciales.

### Taiga Cloud

Usa una URL como:

```text
https://tree.taiga.io/project/slug-del-proyecto/kanban
```

PECC solicita el nombre de usuario y la contrasena de Taiga y obtiene el token de API automaticamente. No introduzcas el nombre del proyecto como usuario.

La integracion consulta historias de usuario, tareas e issues. Si tu cuenta usa Google, GitHub u otro proveedor de inicio de sesion, necesitas tener una contrasena local de Taiga para este flujo.

### Jira Cloud

Usa una URL de tablero o proyecto, por ejemplo:

```text
https://mi-empresa.atlassian.net/jira/software/projects/APP/boards/1
```

Introduce:

- Email de la cuenta Jira.
- API token creado desde la cuenta Atlassian.
- Clave del proyecto si no puede extraerse de la URL.

### Notion

Usa la URL de la base de datos original, no la URL de una nota ni de una vista enlazada. La base debe estar compartida explicitamente con la integracion de Notion.

Introduce el token de la integracion con permisos de:

- Leer contenido.
- Actualizar contenido, si vas a editar notas.

PECC consulta las fuentes de datos de la base y puede leer o preparar cambios para notas autorizadas.

### Sincronizacion

- **Conectar tablero** sincroniza la plataforma seleccionada.
- **Sincronizar todo** actualiza GitHub y el tablero guardado en la sesion.
- **Desconectar tablero** conserva la conexion de GitHub.
- **Desconectar todo** elimina la sesion y sus credenciales.

Las credenciales externas se guardan en la sesion del servidor durante cuatro horas desde la ultima actividad de sincronizacion. No se almacenan en `localStorage` ni se envian de vuelta al navegador. Al cerrar sesion se invalida tambien la sesion del servidor.

## Asistente de IA

La IA usa la API compatible con OpenAI de Groq. Para activarla, copia el archivo de ejemplo:

```bash
copy .env.example .env.local
```

En macOS o Linux:

```bash
cp .env.example .env.local
```

Configura `.env.local`:

```env
GROQ_API_KEY=tu_clave_de_groq
GROQ_MODEL=openai/gpt-oss-120b
```

Reinicia el servidor despues de modificar las variables. La clave solo se usa en el servidor y nunca debe llevar el prefijo `NEXT_PUBLIC_`.

En **Asistente** puedes pedir:

- Resumen ejecutivo del proyecto.
- Riesgos y siguiente accion.
- Analisis de un pull request o problema de codigo.
- Mensaje de commit o descripcion de pull request.
- Propuesta de mejora para un archivo del repositorio.

La IA recibe como maximo 300 registros recientes y 300 rutas de archivos. El resultado debe revisarse antes de tomar decisiones.

## Propuestas de codigo

1. Abre **Asistente**.
2. Escribe una solicitud concreta.
3. Selecciona una ruta del inventario.
4. Pulsa **Proponer cambio para revision**.
5. Revisa motivo, riesgos, pruebas sugeridas y contenido antes/despues.
6. Marca la autorizacion y pulsa **Aprobar y crear rama**.

La aplicacion crea una rama `pecc/proposal-ID`. No modifica la rama principal, no hace merge y no crea un pull request automaticamente. Ejecuta las pruebas por tu cuenta antes de abrir un pull request.

No se aceptan archivos de secretos, claves privadas, certificados, `.env` ni archivos de mas de 24 KB para propuestas.

## Tema visual

El icono de sol/luna de la barra superior cambia entre tema claro y oscuro. La preferencia se guarda localmente en el navegador y el cambio tiene una transicion suave.

## Limites actuales

- La sincronizacion es manual.
- Se consultan hasta 2.000 registros por coleccion y se muestra un aviso si se alcanza ese limite.
- No se descargan todas las ramas, comentarios, revisiones, CI, releases ni el historial completo de los tableros.
- La asignacion de una tarea no demuestra quien completo el trabajo.
- GitLab, Bitbucket, Jira Server y Taiga autoalojado no tienen conector.
- Las sesiones viven en memoria del proceso y se pierden al reiniciar el servidor.
- Una sincronizacion valida renueva la sesion por cuatro horas; cerrar sesion elimina las credenciales del servidor.
- La contrasena de Taiga se descarta despues de obtener el token de autenticacion de la API.
- El login local es solo para demostracion y no ofrece seguridad multiusuario.

## Verificacion

Ejecuta el chequeo de TypeScript:

```bash
npx tsc --noEmit
```

Ejecuta las pruebas:

```bash
node --test tests/live.test.cjs
```

Genera la compilacion de produccion:

```bash
npm run build
```

Para probar la compilacion localmente:

```bash
npm run start
```

## Variables de entorno

El archivo `.env.example` contiene las variables opcionales para Groq. El archivo `.env.local` es local y no debe subirse al repositorio.

```env
GROQ_API_KEY=
GROQ_MODEL=openai/gpt-oss-120b
```

## Estructura principal

```text
app/
  api/live/route.ts       API de sincronizacion y asistente
  globals.css             Tema y estilos globales
  page.tsx                Entrada con login local
components/
  auth/auth-gate.tsx      Login, registro y cuenta demo
  control-center/         Panel, conexiones y vistas
lib/
  integrations.ts         Adaptadores GitHub, Taiga, Jira y Notion
  live-server.ts          Sesiones, sincronizacion y propuestas
  live-types.ts           Tipos compartidos
tests/
  live.test.cjs           Pruebas de integraciones y propuestas
```

## Seguridad antes de produccion

Antes de publicar PECC como servicio compartido se necesita:

- Autenticacion real con un proveedor como Supabase Auth, Auth.js u otro.
- Contraseñas con hash y nunca almacenadas en `localStorage`.
- Base de datos persistente para usuarios, proyectos y conexiones.
- Cifrado de tokens externos y gestion de secretos.
- Row-level security o permisos equivalentes por usuario.
- Roles de PM, colaborador y aprobador.
- Auditoria persistente de sincronizaciones y aprobaciones.
- Limites de uso y proteccion contra abuso.

## Documentacion de proveedores

- [GitHub Git trees](https://docs.github.com/en/rest/git/trees)
- [Jira Cloud REST API](https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issue-search/)
- [Notion data sources](https://developers.notion.com/reference/query-a-data-source)
- [Taiga REST API](https://docs.taiga.io/api.html)
- [Groq Chat Completions](https://console.groq.com/docs/api-reference#chat-create)

## Licencia

No se ha definido una licencia para este repositorio. Agrega una licencia antes de distribuirlo publicamente.
