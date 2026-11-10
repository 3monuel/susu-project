-- SuSu: consultas que usará cada pantalla de la app (demo).

\echo '===== 1. INICIO: proyectos con su porcentaje de avance ====='
SELECT p.nombre,
       p.prioridad,
       p.fecha_limite,
       COUNT(t.id_tarea) AS tareas,
       COUNT(t.id_tarea) FILTER (WHERE t.estado = 'Terminada') AS terminadas,
       COALESCE(ROUND(100.0 * COUNT(t.id_tarea) FILTER (WHERE t.estado = 'Terminada')
                      / NULLIF(COUNT(t.id_tarea), 0)), 0) AS avance_pct
FROM proyecto p
LEFT JOIN tarea t ON t.id_proyecto = p.id_proyecto AND t.fecha_eliminacion IS NULL
WHERE p.id_usuario = (SELECT id_usuario FROM usuario WHERE correo = 'erick@prueba.com')
  AND p.fecha_eliminacion IS NULL
GROUP BY p.id_proyecto
ORDER BY p.fecha_limite;

\echo '===== 2. CALENDARIO: lo que vence en los próximos 7 días ====='
SELECT p.fecha_limite AS fecha, 'Proyecto' AS tipo, p.nombre, NULL AS proyecto, p.prioridad
FROM proyecto p
WHERE p.id_usuario = (SELECT id_usuario FROM usuario WHERE correo = 'erick@prueba.com')
  AND p.fecha_eliminacion IS NULL
  AND p.fecha_limite BETWEEN CURRENT_DATE AND CURRENT_DATE + 7
UNION ALL
SELECT t.fecha_limite, 'Tarea', t.nombre, COALESCE(p.nombre, '(sin proyecto)'), t.prioridad
FROM tarea t
LEFT JOIN proyecto p ON p.id_proyecto = t.id_proyecto
WHERE t.id_usuario = (SELECT id_usuario FROM usuario WHERE correo = 'erick@prueba.com')
  AND t.fecha_eliminacion IS NULL
  AND t.estado <> 'Terminada'
  AND t.fecha_limite BETWEEN CURRENT_DATE AND CURRENT_DATE + 7
ORDER BY fecha;

\echo '===== 3. TAREAS Y SUBTAREAS (relación de una tabla consigo misma) ====='
SELECT p.nombre AS proyecto, padre.nombre AS tarea, hija.nombre AS subtarea, hija.estado
FROM tarea hija
JOIN tarea padre ON padre.id_tarea = hija.id_tarea_padre
LEFT JOIN proyecto p ON p.id_proyecto = padre.id_proyecto;

\echo '===== 4. RECORDATORIOS pendientes ====='
SELECT t.nombre, COALESCE(p.nombre, '(sin proyecto)') AS proyecto,
       to_char(t.fecha_recordatorio, 'YYYY-MM-DD HH24:MI') AS recordar_el
FROM tarea t
LEFT JOIN proyecto p ON p.id_proyecto = t.id_proyecto
WHERE t.id_usuario = (SELECT id_usuario FROM usuario WHERE correo = 'erick@prueba.com')
  AND t.fecha_recordatorio IS NOT NULL
  AND t.estado <> 'Terminada'
ORDER BY t.fecha_recordatorio;

\echo '===== 5. NOTAS agrupadas por proyecto ====='
SELECT COALESCE(p.nombre, '(sin proyecto)') AS proyecto, n.titulo, n.fecha_creacion::date AS creada
FROM nota n
LEFT JOIN proyecto p ON p.id_proyecto = n.id_proyecto
WHERE n.id_usuario = (SELECT id_usuario FROM usuario WHERE correo = 'erick@prueba.com')
  AND n.fecha_eliminacion IS NULL
ORDER BY proyecto;

\echo '===== 6. CADA USUARIO TIENE SUS PROPIOS DATOS ====='
SELECT u.nombre, u.correo, COUNT(p.id_proyecto) AS proyectos
FROM usuario u
LEFT JOIN proyecto p ON p.id_usuario = u.id_usuario
GROUP BY u.id_usuario
ORDER BY u.nombre;

\echo '===== 7. REGLAS QUE PROTEGE LA BASE (se deshacen al final) ====='
BEGIN;

\echo '--- 7a. El trigger actualiza fecha_actualizacion solo ---'
SELECT nombre, estado, to_char(fecha_actualizacion, 'HH24:MI:SS.MS') AS actualizada
FROM tarea WHERE nombre = 'Simulacro de examen';
SELECT pg_sleep(1);
UPDATE tarea SET estado = 'EnProgreso' WHERE nombre = 'Simulacro de examen';
SELECT nombre, estado, to_char(fecha_actualizacion, 'HH24:MI:SS.MS') AS actualizada
FROM tarea WHERE nombre = 'Simulacro de examen';

\echo '--- 7b. Borrado en cascada: al borrar un proyecto se van sus tareas y la nota queda sin proyecto ---'
SELECT COUNT(*) AS tareas_antes FROM tarea;
SELECT titulo, id_proyecto AS proyecto_antes FROM nota WHERE titulo = 'Dudas para la maestra';
DELETE FROM proyecto WHERE nombre = 'Reporte de Redes';
SELECT COUNT(*) AS tareas_despues FROM tarea;
SELECT titulo, id_proyecto AS proyecto_despues FROM nota WHERE titulo = 'Dudas para la maestra';

ROLLBACK;
\echo 'ROLLBACK: todo regresó a como estaba. No se perdió nada.'