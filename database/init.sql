-- SuSu Project: esquema inicial de la base de datos (PostgreSQL)
-- Sale del documento "modelo de datos y contrato de API".
-- Los nombres van en snake_case: idUsuario del documento es id_usuario aqui.

CREATE TABLE IF NOT EXISTS usuario (
    id_usuario      INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre          TEXT NOT NULL,
    correo          TEXT NOT NULL UNIQUE,
    contrasena_hash TEXT NOT NULL,
    estado_cuenta   TEXT NOT NULL DEFAULT 'activa',
    curso           TEXT,
    fecha_registro  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS codigo_verificacion (
    id_codigo        INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_usuario       INTEGER NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    codigo_hash      TEXT NOT NULL,
    fecha_creacion   TIMESTAMPTZ NOT NULL DEFAULT now(),
    fecha_expiracion TIMESTAMPTZ NOT NULL,
    usado            BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS proyecto (
    id_proyecto         INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_usuario          INTEGER NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    nombre              TEXT NOT NULL,
    descripcion         TEXT,
    fecha_inicio        DATE,
    fecha_limite        DATE,
    prioridad           TEXT NOT NULL DEFAULT 'Media' CHECK (prioridad IN ('Baja', 'Media', 'Alta')),
    dificultad_estimada TEXT CHECK (dificultad_estimada IN ('Baja', 'Media', 'Alta')),
    duracion_estimada   INTEGER CHECK (duracion_estimada >= 0)
);

CREATE TABLE IF NOT EXISTS tarea (
    id_tarea       INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_proyecto    INTEGER NOT NULL REFERENCES proyecto(id_proyecto) ON DELETE CASCADE,
    id_tarea_padre INTEGER REFERENCES tarea(id_tarea) ON DELETE CASCADE,
    nombre         TEXT NOT NULL,
    descripcion    TEXT,
    dificultad     TEXT CHECK (dificultad IN ('Baja', 'Media', 'Alta')),
    estado         TEXT NOT NULL DEFAULT 'PorHacer'
                   CHECK (estado IN ('PorHacer', 'EnProgreso', 'Terminada')),
    orden          INTEGER NOT NULL DEFAULT 0,
    fecha_limite   DATE
);

CREATE TABLE IF NOT EXISTS nota (
    id_nota        INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_usuario     INTEGER NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    id_proyecto    INTEGER REFERENCES proyecto(id_proyecto) ON DELETE SET NULL,
    titulo         TEXT NOT NULL,
    descripcion    TEXT,
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS solicitud_ia (
    id_solicitud   INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_usuario     INTEGER NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    id_proyecto    INTEGER REFERENCES proyecto(id_proyecto) ON DELETE SET NULL,
    descripcion    TEXT NOT NULL,
    fecha          TIMESTAMPTZ NOT NULL DEFAULT now(),
    tipo_solicitud TEXT,
    estado         TEXT,
    respuesta      TEXT
);

CREATE TABLE IF NOT EXISTS ajustes (
    id_usuario         INTEGER PRIMARY KEY REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    tamano_interfaz    TEXT NOT NULL DEFAULT 'mediano',
    tema               TEXT NOT NULL DEFAULT 'claro' CHECK (tema IN ('claro', 'oscuro')),
    orden_proyectos    TEXT NOT NULL DEFAULT 'automatico' CHECK (orden_proyectos IN ('automatico', 'fecha')),
    mostrar_completadas BOOLEAN NOT NULL DEFAULT TRUE,
    sin_animaciones    BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS reporte_error (
    id_reporte        INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_usuario        INTEGER NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    tipo_problema     TEXT NOT NULL,
    apartado_afectado TEXT,
    descripcion       TEXT NOT NULL,
    fecha             TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_proyecto_usuario ON proyecto(id_usuario);
CREATE INDEX IF NOT EXISTS ix_tarea_proyecto   ON tarea(id_proyecto);
CREATE INDEX IF NOT EXISTS ix_tarea_fecha      ON tarea(fecha_limite);
CREATE INDEX IF NOT EXISTS ix_nota_usuario     ON nota(id_usuario);