\# SuSu Project
ggggg



> Convierte tus ideas en proyectos.



Gestor de proyectos y tareas con asistente de IA, calendario y notas,

diseñado con accesibilidad cognitiva para estudiantes, con cierto enfoque en personas neurodivergentes.



El nombre viene del kanji japonés \*Susumu\* (進む), que significa avanzar/progresar.



\## Integrantes

\- Elvira Azamar Emmanuel

\- Fierro Mendoza Erick Rodolfo

\- Fuentes Martínez Valentina



\## Tecnologías

\- Frontend: React + TypeScript

\- Backend: C# + ASP.NET Core

\- Base de datos: PostgreSQL

\- Infraestructura: Docker

\- Diseño: Figma

\- Control de versiones: Git + GitHub



\## Estructura del repositorio

\- `frontend/`: interfaz de usuario

\- `backend/`: API y lógica del sistema

\- `database/`: scripts y configuración de la base de datos

\- `docs/`: documentación y diagramas



\## Cómo correr el proyecto

\_(Pendiente: se completará conforme avance el desarrollo.)\_


## Cómo correr la base de datos

1. Instala Docker Desktop y ábrelo.
2. Copia `.env.example` como `.env` y cambia la contraseña.
3. Desde la raíz del repo: `docker compose up -d`.
4. Comprueba con `docker compose ps` que `susu-postgres` esté `healthy`.

La primera vez, Docker crea las tablas con `database/init.sql`. Para empezar de cero (borra los datos): `docker compose down -v` y luego `docker compose up -d`.

## Cómo correr el frontend

1. Instala Node.js 22.12 o superior.
2. Desde la carpeta `frontend`: `npm install`.
3. Copia `.env.example` como `.env`. Déjalo vacío para usar el modo local, o pon `VITE_API_URL=http://localhost:5196` para conectar con el backend.
4. `npm run dev` y abre <http://localhost:5173>.

Más detalles en [`frontend/README.md`](frontend/README.md). Lo que falta para conectar el frontend con el backend está en [`docs/compatibilidad-frontend-backend.md`](docs/compatibilidad-frontend-backend.md).
