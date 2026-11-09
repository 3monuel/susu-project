-- Migración 001: cambios acordados por el equipo (9 nov 2026).
-- Se corre UNA sola vez sobre una base que ya existe.
-- Todo va dentro de una transacción: si algo falla, no se aplica nada.

BEGIN;

-- ===== 1. Estado de los reportes de error (REQ-12) =====
ALTER TABLE reporte_error
    ADD COLUMN estado TEXT NOT NULL DEFAULT 'Pendiente'
    CHECK (estado IN ('Pendiente', 'EnRevision', 'Resuelto'));

-- ===== 2. Tareas: dueño propio y proyecto opcional =====
ALTER TABLE tarea ADD COLUMN id_usuario INTEGER REFERENCES usuario(id_usuario) ON DELETE CASCADE;

-- Las tareas que ya existen toman el dueño de su proyecto
UPDATE tarea t
SET id_usuario = p.id_usuario
FROM proyecto p
WHERE p.id_proyecto = t.id_proyecto;

ALTER TABLE tarea ALTER COLUMN id_usuario SET NOT NULL;
ALTER TABLE tarea ALTER COLUMN id_proyecto DROP NOT NULL;

-- Una tarea solo puede pertenecer a un proyecto del mismo usuario
-- (si id_proyecto es NULL, la regla no se revisa)
ALTER TABLE proyecto
    ADD CONSTRAINT proyecto_id_usuario_uk UNIQUE (id_proyecto, id_usuario);

ALTER TABLE tarea
    ADD CONSTRAINT tarea_proyecto_mismo_usuario_fk
    FOREIGN KEY (id_proyecto, id_usuario)
    REFERENCES proyecto (id_proyecto, id_usuario) ON DELETE CASCADE;

CREATE INDEX ix_tarea_usuario ON tarea(id_usuario);

-- ===== 3. Tareas: prioridad y recordatorio (REQ-08) =====
ALTER TABLE tarea
    ADD COLUMN prioridad TEXT NOT NULL DEFAULT 'Media'
    CHECK (prioridad IN ('Baja', 'Media', 'Alta'));

ALTER TABLE tarea ADD COLUMN fecha_recordatorio TIMESTAMPTZ;

-- ===== 4. Fechas de control y borrado lógico =====
ALTER TABLE proyecto
    ADD COLUMN fecha_creacion      TIMESTAMPTZ NOT NULL DEFAULT now(),
    ADD COLUMN fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT now(),
    ADD COLUMN fecha_eliminacion   TIMESTAMPTZ;

ALTER TABLE tarea
    ADD COLUMN fecha_creacion      TIMESTAMPTZ NOT NULL DEFAULT now(),
    ADD COLUMN fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT now(),
    ADD COLUMN fecha_eliminacion   TIMESTAMPTZ;

-- nota ya tenía fecha_creacion
ALTER TABLE nota
    ADD COLUMN fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT now(),
    ADD COLUMN fecha_eliminacion   TIMESTAMPTZ;

-- ===== 5. fecha_actualizacion se llena sola en cada cambio =====
CREATE OR REPLACE FUNCTION actualizar_fecha_actualizacion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_proyecto_fecha_actualizacion
    BEFORE UPDATE ON proyecto
    FOR EACH ROW EXECUTE FUNCTION actualizar_fecha_actualizacion();

CREATE TRIGGER trg_tarea_fecha_actualizacion
    BEFORE UPDATE ON tarea
    FOR EACH ROW EXECUTE FUNCTION actualizar_fecha_actualizacion();

CREATE TRIGGER trg_nota_fecha_actualizacion
    BEFORE UPDATE ON nota
    FOR EACH ROW EXECUTE FUNCTION actualizar_fecha_actualizacion();

COMMIT;