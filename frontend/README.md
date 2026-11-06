# SuSu — Frontend

Gestor de proyectos para estudiantes (usable por cualquier persona): proyectos, tareas, notas,
calendario y asistente de IA. Proyecto Integrador de Desarrollo de Software Multiplataforma, UTCJ.

**Stack:** React 19 + TypeScript + Vite + Tailwind CSS 4 + React Router.
El backend (C# + ASP.NET Core) está en `../backend` y la base de datos (PostgreSQL con Docker) en `../database`.

## Requisitos

- [Node.js](https://nodejs.org/) 22.12 o superior

## Correr en localhost

```bash
# 1. Clonar el repositorio
git clone https://github.com/3monuel/susu-project.git
cd susu-project/frontend

# 2. Instalar dependencias
npm install

# 3. Crear el archivo de configuración
cp .env.example .env        # macOS / Linux
copy .env.example .env      # Windows (cmd)

# 4. Levantar el servidor de desarrollo
npm run dev
```

Abre <http://localhost:5173> en el navegador.

## Modo local y modo API

La app funciona de dos formas según la variable `VITE_API_URL` del archivo `.env`:

| `VITE_API_URL` | Modo | Dónde se guardan los datos |
| --- | --- | --- |
| vacía | Local | En el `localStorage` del navegador. Arranca con datos de ejemplo (`src/lib/seed.json`). |
| con URL, p. ej. `http://localhost:5196` | API | En el backend de ASP.NET Core, con sesión JWT. |

Después de cambiar `.env` hay que detener y volver a ejecutar `npm run dev`.

Los datos de ejemplo solo se cargan en un navegador que todavía no tiene datos de SuSu.
Para volver a verlos: Ajustes → eliminar todos los datos, y recargar.

## Scripts

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo en el puerto 5173 |
| `npm run build` | Compila la versión de producción en `dist/` |
| `npm run preview` | Sirve la carpeta `dist/` para probarla |
| `npm run typecheck` | Revisa tipos con TypeScript |
| `npm test` | Ejecuta las pruebas unitarias |

## Estructura

```
src/
  App.tsx                  Rutas de la aplicación
  components/susu/         Pantallas: proyectos, detalle, calendario, notas, asistente, ajustes, acceso
  components/workspace-provider.tsx   Estado global y operaciones de datos
  lib/types.ts             Tipos de las entidades (Project, Task, Note, User, Reminder, ErrorReport)
  lib/repository.ts        Interfaz de acceso a datos
  lib/local-repository.ts  Implementación con localStorage
  lib/api-repository.ts    Implementación con la API REST
  lib/http.ts              Cliente HTTP con JWT y manejo de errores
  lib/auth-*.ts            Inicio de sesión, registro y token
  lib/assistant-service.ts Asistente de IA
tests/                     Pruebas unitarias (node --test)
API_CONTRACT.md            Endpoints que el backend debe implementar
```

## Para el backend

- Antes de conectar, revisa [`../docs/compatibilidad-frontend-backend.md`](../docs/compatibilidad-frontend-backend.md).

- Los endpoints, cuerpos y respuestas están en [`API_CONTRACT.md`](./API_CONTRACT.md).
- El backend debe permitir por **CORS** el origen `http://localhost:5173`.
- Los errores deben responder con un cuerpo `{ "message": "..." }` para que el frontend muestre el
  mensaje al usuario.
