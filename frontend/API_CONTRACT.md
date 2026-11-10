# Contrato de la API de SuSu

La URL base se configura con `VITE_API_URL`. El frontend solo activa la API cuando la variable tiene
un valor. Todas las rutas siguientes se resuelven desde esa URL base.

## Autenticación

Salvo inicio de sesión y registro, las solicitudes incluyen la cabecera:

```http
Authorization: Bearer <token>
```

El token JWT se obtiene al iniciar sesión o registrarse. Si una ruta protegida devuelve `401`, el
frontend borra el token y redirige a `/iniciar-sesion`. En `login` y `register`, un `401` representa
credenciales inválidas y no borra ni redirige la sesión.

| Método | Ruta                 | Cuerpo                      | Respuesta correcta | Errores esperados                                                   |
| ------ | -------------------- | --------------------------- | ------------------ | ------------------------------------------------------------------- |
| POST   | `/api/auth/login`    | `{ email, password }`       | `{ token, user }`  | `401` con mensaje del servidor o «Correo o contraseña incorrectos.» |
| POST   | `/api/auth/register` | `{ name, email, password }` | `{ token, user }`  | `401` con mensaje del servidor o «Correo o contraseña incorrectos.» |
| POST   | `/api/auth/logout`   | Sin cuerpo                  | Sin cuerpo (`204`) | Puede fallar: el cliente elimina el token igualmente.               |

`user` contiene `{ id, name, email }`.

## Proyectos

Un proyecto contiene `id`, `slug`, `name`, `description`, `startDate`, `dueDate`, `priority`,
`difficulty`, `estimatedDurationMinutes`, `createdAt`, `updatedAt` y `deletedAt`. Las fechas de
metadatos son ISO UTC; `startDate` y `dueDate` pueden ser `null`.

| Método | Ruta                 | Cuerpo     | Respuesta correcta | Errores esperados                                                    |
| ------ | -------------------- | ---------- | ------------------ | -------------------------------------------------------------------- |
| GET    | `/api/projects`      | Sin cuerpo | `Project[]`        | `401`, error de red o error del servidor                             |
| GET    | `/api/projects/{id}` | Sin cuerpo | `Project`          | `401`, `404`, error de red o error del servidor                      |
| POST   | `/api/projects`      | `Project`  | `Project`          | `401`, error de validación, error de red o error del servidor        |
| PUT    | `/api/projects/{id}` | `Project`  | `Project`          | `401`, `404`, error de validación, error de red o error del servidor |
| DELETE | `/api/projects/{id}` | Sin cuerpo | Sin cuerpo (`204`) | `401`, `404`, error de red o error del servidor                      |

## Tareas

Una tarea contiene `id`, `projectId`, `parentTaskId`, `name`, `description`, `dueDate`, `priority`,
`state`, `order`, `reminderAt`, `createdAt`, `updatedAt` y `deletedAt`. `projectId`,
`parentTaskId`, `dueDate` y `reminderAt` pueden ser `null`; `reminderAt` se guarda como ISO UTC.

| Método | Ruta                       | Cuerpo                                  | Respuesta correcta    | Errores esperados                                                    |
| ------ | -------------------------- | --------------------------------------- | --------------------- | -------------------------------------------------------------------- |
| GET    | `/api/tasks`               | Sin cuerpo                              | `Task[]` del usuario  | `401`, error de red o error del servidor                             |
| GET    | `/api/projects/{id}/tasks` | Sin cuerpo                              | `Task[]` del proyecto | `401`, `404`, error de red o error del servidor                      |
| POST   | `/api/tasks`               | `Task` sin proyecto (`projectId: null`) | `Task`                | `401`, error de validación, error de red o error del servidor        |
| POST   | `/api/projects/{id}/tasks` | `Task` asociado al proyecto             | `Task`                | `401`, `404`, error de validación, error de red o error del servidor |
| PUT    | `/api/tasks/{id}`          | `Task`                                  | `Task`                | `401`, `404`, error de validación, error de red o error del servidor |
| DELETE | `/api/tasks/{id}`          | Sin cuerpo                              | Sin cuerpo (`204`)    | `401`, `404`, error de red o error del servidor                      |

## Notas

Una nota contiene `id`, `projectId`, `title`, `content`, `createdAt`, `updatedAt` y `deletedAt`.
`projectId` puede ser `null`.

| Método | Ruta              | Cuerpo     | Respuesta correcta | Errores esperados                                                    |
| ------ | ----------------- | ---------- | ------------------ | -------------------------------------------------------------------- |
| GET    | `/api/notes`      | Sin cuerpo | `Note[]`           | `401`, error de red o error del servidor                             |
| GET    | `/api/notes/{id}` | Sin cuerpo | `Note`             | `401`, `404`, error de red o error del servidor                      |
| POST   | `/api/notes`      | `Note`     | `Note`             | `401`, error de validación, error de red o error del servidor        |
| PUT    | `/api/notes/{id}` | `Note`     | `Note`             | `401`, `404`, error de validación, error de red o error del servidor |
| DELETE | `/api/notes/{id}` | Sin cuerpo | Sin cuerpo (`204`) | `401`, `404`, error de red o error del servidor                      |

## Asistente

| Método | Ruta                  | Cuerpo                   | Respuesta correcta | Errores esperados                                             |
| ------ | --------------------- | ------------------------ | ------------------ | ------------------------------------------------------------- |
| POST   | `/api/assistant/plan` | `{ projectId, request }` | `SuggestedTask[]`  | `401`, error de validación, error de red o error del servidor |

Cada elemento de `SuggestedTask[]` contiene `name`, `description`, `dueDate` y `priority`. El
frontend solo crea tareas después de una confirmación explícita de la persona usuaria.

> TODO: el proveedor y el modelo de IA se definen en el backend; este contrato no los presupone.
