-- SuSu: datos de prueba para desarrollo y demostración.
-- Requiere que exista el usuario erick@prueba.com (registrado desde la API).
-- Las fechas son relativas a hoy, así el calendario siempre tiene pendientes.
-- Se puede correr varias veces: si ya hay datos, no duplica nada.

DO $$
DECLARE
    u_erick INT;
    u_demo  INT;
    p_susu  INT;
    p_mate  INT;
    p_redes INT;
    p_so    INT;
    p_demo  INT;
    t_jwt   INT;
BEGIN
    SELECT id_usuario INTO u_erick FROM usuario WHERE correo = 'erick@prueba.com';
    IF u_erick IS NULL THEN
        RAISE EXCEPTION 'Primero registra erick@prueba.com desde la API.';
    END IF;

    IF EXISTS (SELECT 1 FROM proyecto WHERE id_usuario = u_erick AND nombre = 'Proyecto Integrador SuSu') THEN
        RAISE NOTICE 'Los datos de prueba ya existen. No se insertó nada.';
        RETURN;
    END IF;

    -- Usuario de demostración (no puede iniciar sesión: el hash es falso a propósito)
    INSERT INTO usuario (nombre, correo, contrasena_hash, curso)
    VALUES ('Usuario Demo', 'demo@prueba.com', 'SEED-SIN-LOGIN', 'DSM')
    ON CONFLICT (correo) DO NOTHING;
    SELECT id_usuario INTO u_demo FROM usuario WHERE correo = 'demo@prueba.com';

    INSERT INTO ajustes (id_usuario, tema) VALUES (u_erick, 'oscuro')
    ON CONFLICT (id_usuario) DO NOTHING;

    -- ===== Proyectos de Erick =====
    INSERT INTO proyecto (id_usuario, nombre, descripcion, fecha_inicio, fecha_limite, prioridad, dificultad_estimada, duracion_estimada)
    VALUES (u_erick, 'Proyecto Integrador SuSu', 'Gestor de proyectos con asistente de IA',
            CURRENT_DATE - 30, CURRENT_DATE + 20, 'Alta', 'Alta', 60)
    RETURNING id_proyecto INTO p_susu;

    INSERT INTO proyecto (id_usuario, nombre, descripcion, fecha_inicio, fecha_limite, prioridad, dificultad_estimada, duracion_estimada)
    VALUES (u_erick, 'Examen de Matemáticas', 'Segundo parcial',
            CURRENT_DATE - 7, CURRENT_DATE + 5, 'Media', 'Media', 10)
    RETURNING id_proyecto INTO p_mate;

    INSERT INTO proyecto (id_usuario, nombre, descripcion, fecha_inicio, fecha_limite, prioridad, dificultad_estimada, duracion_estimada)
    VALUES (u_erick, 'Reporte de Redes', 'Práctica de configuración de switches',
            CURRENT_DATE, CURRENT_DATE + 12, 'Baja', 'Media', 6)
    RETURNING id_proyecto INTO p_redes;

    INSERT INTO proyecto (id_usuario, nombre, descripcion, fecha_inicio, fecha_limite, prioridad, dificultad_estimada, duracion_estimada)
    VALUES (u_erick, 'Exposición de Sistemas Operativos', 'Tema: planificación de procesos',
            CURRENT_DATE - 20, CURRENT_DATE - 3, 'Media', 'Baja', 5)
    RETURNING id_proyecto INTO p_so;

    -- ===== Tareas del integrador (con subtareas) =====
    INSERT INTO tarea (id_usuario, id_proyecto, nombre, dificultad, prioridad, estado, orden, fecha_limite) VALUES
        (u_erick, p_susu, 'Diseñar la base de datos',     'Media', 'Alta',  'Terminada', 1, CURRENT_DATE - 20),
        (u_erick, p_susu, 'Conectar backend con la base', 'Media', 'Alta',  'Terminada', 2, CURRENT_DATE - 5),
        (u_erick, p_susu, 'Registro e inicio de sesión',  'Media', 'Alta',  'Terminada', 3, CURRENT_DATE - 2);

    INSERT INTO tarea (id_usuario, id_proyecto, nombre, dificultad, prioridad, estado, orden, fecha_limite, fecha_recordatorio)
    VALUES (u_erick, p_susu, 'Sesiones con JWT', 'Alta', 'Alta', 'EnProgreso', 4, CURRENT_DATE + 3, now() + INTERVAL '1 day')
    RETURNING id_tarea INTO t_jwt;

    INSERT INTO tarea (id_usuario, id_proyecto, id_tarea_padre, nombre, dificultad, prioridad, estado, orden, fecha_limite) VALUES
        (u_erick, p_susu, t_jwt, 'Generar clave secreta', 'Baja',  'Media', 'Terminada', 1, CURRENT_DATE + 1),
        (u_erick, p_susu, t_jwt, 'Proteger endpoint /yo', 'Media', 'Media', 'PorHacer',  2, CURRENT_DATE + 3);

    INSERT INTO tarea (id_usuario, id_proyecto, nombre, dificultad, prioridad, estado, orden, fecha_limite) VALUES
        (u_erick, p_susu, 'Endpoints de proyectos y tareas', 'Alta',  'Alta',  'PorHacer', 5, CURRENT_DATE + 7),
        (u_erick, p_susu, 'Conectar el frontend a la API',   'Media', 'Media', 'PorHacer', 6, CURRENT_DATE + 14);

    -- ===== Otras tareas =====
    INSERT INTO tarea (id_usuario, id_proyecto, nombre, dificultad, prioridad, estado, orden, fecha_limite) VALUES
        (u_erick, p_mate,  'Repasar integración por sustitución',    'Media', 'Media', 'Terminada',  1, CURRENT_DATE - 2),
        (u_erick, p_mate,  'Resolver guía de ejercicios',            'Alta',  'Alta',  'EnProgreso', 2, CURRENT_DATE + 2),
        (u_erick, p_mate,  'Simulacro de examen',                    'Media', 'Media', 'PorHacer',   3, CURRENT_DATE + 4),
        (u_erick, p_redes, 'Armar topología en Packet Tracer',       'Media', 'Baja',  'PorHacer',   1, CURRENT_DATE + 6),
        (u_erick, p_redes, 'Redactar el reporte',                    'Baja',  'Baja',  'PorHacer',   2, CURRENT_DATE + 11),
        (u_erick, p_so,    'Investigar algoritmos de planificación', 'Baja',  'Media', 'Terminada',  1, CURRENT_DATE - 10),
        (u_erick, p_so,    'Hacer las diapositivas',                 'Baja',  'Media', 'Terminada',  2, CURRENT_DATE - 5);

    -- ===== Tarea suelta (sin proyecto) con recordatorio =====
    INSERT INTO tarea (id_usuario, id_proyecto, nombre, prioridad, estado, fecha_limite, fecha_recordatorio)
    VALUES (u_erick, NULL, 'Renovar credencial de la escuela', 'Alta', 'PorHacer', CURRENT_DATE + 2, now() + INTERVAL '1 day');

    -- ===== Notas de Erick =====
    INSERT INTO nota (id_usuario, id_proyecto, titulo, descripcion) VALUES
        (u_erick, p_susu,  'Ideas para el asistente IA', 'Que pueda dividir un proyecto en pasos y sugerir fechas.'),
        (u_erick, p_mate,  'Fórmulas a memorizar',       'Integral de 1/x, de e^x y cambio de variable.'),
        (u_erick, p_redes, 'Dudas para la maestra',      'Preguntar si el reporte se entrega impreso.'),
        (u_erick, NULL,    'Pendientes generales',       'Comprar memoria USB.');

    -- ===== Datos del usuario demo (cada usuario ve solo lo suyo) =====
    INSERT INTO proyecto (id_usuario, nombre, fecha_inicio, fecha_limite, prioridad)
    VALUES (u_demo, 'Diseño de pantallas en Figma', CURRENT_DATE - 10, CURRENT_DATE + 8, 'Alta')
    RETURNING id_proyecto INTO p_demo;

    INSERT INTO tarea (id_usuario, id_proyecto, nombre, estado, orden, fecha_limite) VALUES
        (u_demo, p_demo, 'Pantalla de calendario', 'Terminada', 1, CURRENT_DATE - 1),
        (u_demo, p_demo, 'Pantalla de notas',      'PorHacer',  2, CURRENT_DATE + 6);

    RAISE NOTICE 'Datos de prueba insertados correctamente.';
END $$;