# Compatibilidad entre el frontend y el backend

Estado al 6 de noviembre de 2026, comparando `frontend/` (rama `feature/frontend-local-first`)
con `backend/` y `database/init.sql` de `main`, y con la rama `feature/conexion-bd`, que tiene el
login y el registro todavía sin fusionar.

**Resumen:** el frontend funciona completo en **modo local**, con los datos guardados en el
navegador. El **modo API** todavía no puede conectarse a este backend: faltan endpoints, y los
nombres de los campos y los formatos no coinciden. Abajo están las diferencias y las decisiones que
el equipo tiene que tomar.

El frontend espera lo que describe [`frontend/API_CONTRACT.md`](../frontend/API_CONTRACT.md).

## 1. Autenticación

| Tema | Frontend espera | Backend hoy (`feature/conexion-bd`) |
| --- | --- | --- |
| Rutas | `POST /api/auth/login`, `/api/auth/register`, `/api/auth/logout` | `POST /api/auth/login`, `/api/auth/registro` (no hay logout) |
| Cuerpo | `{ email, password }` y `{ name, email, password }` | `{ correo, contrasena }` y `{ nombre, correo, contrasena, curso }` |
| Respuesta | `{ token, user: { id, name, email } }` | Datos del usuario, **sin token** (todavía no hay JWT) |
| Mensaje de error | Lee `message` o `error` del cuerpo | Responde `{ mensaje }`. Las validaciones de `[Required]` responden `ProblemDetails` (`title`, `errors`) |

Pendiente en el backend: generar el JWT en login y registro (paquete
`Microsoft.AspNetCore.Authentication.JwtBearer`), proteger los demás endpoints con `[Authorize]` y
obtener el `id_usuario` **del token**, nunca del cuerpo de la petición.

## 2. Endpoints que todavía no existen

- CRUD de proyectos, tareas y notas (`/api/projects`, `/api/tasks`, `/api/projects/{id}/tasks`, `/api/notes`).
- Asistente: `AsistenteIAService` ya existe y está registrado en `Program.cs`, pero
  `Controllers/AsistenteController.cs` está vacío en `main`, así que no hay ruta.

## 3. Diferencias de datos

| Tema | Frontend | Base de datos |
| --- | --- | --- |
| IDs | `string` (UUID que genera el cliente) | `INTEGER` identity que genera PostgreSQL |
| Nombres de campos | Inglés: `name`, `dueDate`, `priority`… | Español: `nombre`, `fecha_limite`, `prioridad`… |
| Prioridad / dificultad | `baja`, `media`, `alta` | `Baja`, `Media`, `Alta` |
| Estado de tarea | `pending`, `completed` (2 estados) | `PorHacer`, `EnProgreso`, `Terminada` (3 estados) |
| Tareas sin proyecto | Permitidas (`projectId: null`) | `tarea.id_proyecto` es `NOT NULL` |
| Contenido de nota | `content` | `descripcion` |
| Proyecto | Tiene `slug` (se usa en la URL `/proyectos/:slug`) y `tone` (estilo visual) | No tiene esas columnas |
| Tarea | Tiene `priority` y `reminderAt` (recordatorio) | No tiene esas columnas; tiene `dificultad` |
| Fechas de control | `createdAt`, `updatedAt`, `deletedAt` en todo (borrado lógico) | Solo `fecha_creacion` en nota; el borrado es físico |
| Usuario | `{ id, name, email }` | Además tiene `curso` y `estado_cuenta` |

Equivalencia de campos de proyecto: `name`→`nombre`, `description`→`descripcion`,
`startDate`→`fecha_inicio`, `dueDate`→`fecha_limite`, `priority`→`prioridad`,
`difficulty`→`dificultad_estimada`, `estimatedDurationMinutes`→`duracion_estimada`.

### Asistente

| | Frontend | `AsistenteIAService` |
| --- | --- | --- |
| Entrada | `{ projectId, request }` | `{ Nombre, Descripcion, FechaLimite }` |
| Salida | `[{ name, description, dueDate, priority }]` | `{ tareas: [{ nombre, descripcion, fecha }] }` |

## 4. Configuración

- **CORS:** `Program.cs` no lo configura. Hay que permitir el origen `http://localhost:5173`, que
  es el puerto del frontend con Vite.
- **Puerto:** el perfil `http` del backend usa `http://localhost:5196`. Ese es el valor de
  `VITE_API_URL` en `frontend/.env`.
- **HTTPS:** `UseHttpsRedirection()` redirige las peticiones HTTP. En desarrollo conviene usar el
  perfil `http`, o poner la URL `https://localhost:7103` en el frontend. Si no, las peticiones
  fallan por CORS.

## 5. Decisiones del equipo

1. **Dónde se traducen los nombres.** Hay dos opciones:
   - El backend expone DTOs con los nombres de `API_CONTRACT.md` y la base de datos se queda en
     español. Es lo habitual, porque la API no queda amarrada al esquema de la base.
   - Se cambian los tipos del frontend a los nombres en español del backend.
2. **Tareas sin proyecto.** Se permite `NULL` en `tarea.id_proyecto`, o el frontend deja de
   permitirlas.
3. **Estados de tarea.** Se usan 2 estados (como el frontend) o 3 (como la base de datos), y se
   ajusta el otro lado.
4. **Columnas faltantes.** Hay que decidir si se agregan a la base `prioridad` y `recordatorio` en
   tarea, `fecha_creacion`/`fecha_actualizacion` y borrado lógico, o si se quitan del frontend.
5. **IDs y URL de proyecto.** Con IDs enteros, la URL del proyecto puede usar el ID (`/proyectos/12`)
   en vez del `slug`, o se agrega una columna `slug` a la base.
