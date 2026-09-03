# Product Engineering Control Center (PECC)

> **Torre de control y trazabilidad de ingeniería de software.**
> Conecta la gestión de producto (Notion, Jira, Taiga) con la realidad técnica en Git (GitHub, GitLab), auditando el cumplimiento real de requerimientos y detectando anomalías en tiempo real.

---

## 📌 Descripción del Proyecto

En el desarrollo de software moderno, suele existir una desconexión entre lo que está registrado en las herramientas de gestión (historias de usuario, tareas marcadas como *Done*) y lo que realmente ocurre en el repositorio de código (commits, pull requests, pruebas).

**PECC** resuelve este problema actuando como un **auditor inteligente continuo** que modela la cadena completa de valor:

$$\text{Objetivo de Negocio} \longrightarrow \text{Épica} \longrightarrow \text{Historia de Usuario} \longrightarrow \text{Tarea Kanban} \longrightarrow \text{Commits y PRs en GitHub}$$

---

## 🚀 Características Principales

1. **Resumen Ejecutivo (Overview):**
   - KPIs en tiempo real (cumplimiento medio, cobertura de criterios, PRs abiertos, alertas críticas).
   - Diagnóstico visual de la salud del flujo de trabajo y bloqueos activos.

2. **Gestión de Producto (Product):**
   - Jerarquía completa estilo Notion: Objetivos $\rightarrow$ Épicas $\rightarrow$ Historias de Usuario.
   - Desglose de **Criterios de Aceptación** con estados (*Cubierto*, *Parcial*, *Sin cubrir*) y evidencia técnica vinculada.

3. **Tablero Kanban Unificado (Workflow):**
   - Visualización de tareas en columnas: *Backlog*, *Por hacer*, *En progreso*, *En revisión*, *Terminado* y *Bloqueado*.
   - Tarjetas con porcentaje de avance real, puntos de historia y días en estado.

4. **Trazabilidad de Extremo a Extremo (Traceability):**
   - Selecciona cualquier tarea y visualiza su grafo descendente hasta los commits exactos (SHA, autor, diff de líneas) y Pull Requests con checks de CI.
   - **Nota del Agente:** Explicación técnica del nivel de confianza (*Alta, Media, Baja*) sobre el cumplimiento del código.

5. **Auditoría de Pull Requests:**
   - Detección automática de *Shadow Work* (Pull Requests sin tarea asociada).
   - Balance de líneas (+/-), rama de origen y estado de integración continua.

6. **Centro de Alertas:**
   - Filtro por severidad (*Alta*, *Media*, *Baja*).
   - Reglas automáticas: Tareas terminadas sin evidencia en código, PRs estancados, bloqueos prolongados y falta de pruebas.

7. **Asistente IA Copiloto:**
   - Resúmenes semanales automáticos y diagnóstico de objetivos comerciales.
   - Capacidad de auditar y proponer mejoras a la redacción de requerimientos.
   - Detección de vulnerabilidades o malas prácticas en código con propuestas de solución.
   - Transparencia ética con avisos de validación humana.

8. **Panel de Conexiones:**
   - Conexión flexible a repositorios: **GitHub**, **GitLab** o **Bitbucket**.
   - Integración con tableros externos: **Notion**, **Jira**, **Taiga** o **GitHub Issues**.

---

## 🛠️ Stack Tecnológico

- **Framework:** Next.js 16 (App Router con Turbopack)
- **Librería UI:** React 19
- **Lenguaje:** TypeScript 5.7
- **Estilos:** Tailwind CSS v4 con diseño oscuro moderno
- **Iconos:** Lucide React
- **Gestor de paquetes:** pnpm

---

## 💻 Instalación y Uso Local

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/Kvnsvd1908/Product-Engineering-Control-Center-PECC-.git
   cd Product-Engineering-Control-Center-PECC-
   ```

2. **Instalar dependencias:**
   ```bash
   pnpm install
   # o bien: npm install
   ```

3. **Iniciar el servidor de desarrollo:**
   ```bash
   pnpm dev
   ```

4. **Abrir en el navegador:**
   Ingresa a [http://localhost:3000](http://localhost:3000)

---

## 👤 Autor

- **Kevin Soto** - [@Kvnsvd1908](https://github.com/Kvnsvd1908)
