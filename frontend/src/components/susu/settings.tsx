import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useWorkspace } from "@/components/workspace-provider";
import {
  active,
  decodeWorkspace,
  emptyWorkspace,
  putRecord,
  STORAGE_KEY,
} from "@/lib/workspace-model";
import { Icon } from "./icon";
import { action, secondary, TaskSortControl } from "./tasks";
import { API_ENABLED } from "@/lib/config";
import { authService } from "@/lib/auth-service";
import { useNavigate } from "@/components/navigation";

export function SettingsPanel({ onClose, isClosing }: { onClose: () => void; isClosing: boolean }) {
  const { workspace, commit, setPreferences, restoreWorkspace, error } = useWorkspace();
  const navigate = useNavigate();
  const drawer = useRef<HTMLElement>(null);
  const [theme, setTheme] = useState(document.documentElement.dataset.theme ?? "light");
  const [size, setSize] = useState(document.documentElement.dataset.interfaceSize ?? "normal");
  const [motion, setMotion] = useState(document.documentElement.dataset.reduceMotion === "true");
  const [message, setMessage] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<"notes" | "projects" | "all" | null>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const panel = drawer.current!;
    panel.querySelector<HTMLElement>("button")?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab") return;
      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>("button:not([disabled]), select, input, a[href]"),
      );
      const first = focusable[0],
        last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("keydown", handleKey);
      previous?.focus();
    };
  }, [onClose]);
  const preference = (key: string, value: string) => {
    try {
      localStorage.setItem(`uniplan-${key}`, value);
      if (key === "theme") {
        document.documentElement.dataset.theme = value;
        setTheme(value);
      }
      if (key === "interface-size") {
        document.documentElement.dataset.interfaceSize = value.toLowerCase();
        setSize(value.toLowerCase());
      }
      if (key === "reduce-motion") {
        document.documentElement.dataset.reduceMotion = value;
        setMotion(value === "true");
      }
    } catch {
      setMessage("No se pudo guardar la preferencia en este navegador.");
    }
  };
  const exportData = () => {
    try {
      const original = error ? localStorage.getItem(STORAGE_KEY) : null;
      const url = URL.createObjectURL(
        new Blob([original ?? JSON.stringify(workspace, null, 2)], {
          type: "application/json",
        }),
      );
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = original ? "susu-original-sin-validar.json" : "susu-espacio-local.json";
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage(
        original
          ? "Archivo original exportado sin modificar. Consérvalo antes de restaurar una copia válida."
          : "Copia exportada. Guárdala en un lugar privado: contiene tus proyectos y notas.",
      );
    } catch {
      setMessage("No se pudo leer el almacenamiento para exportar la copia.");
    }
  };
  const deleteData = () => {
    if (!deleteTarget) return;
    const ok = commit((w) => {
      const now = new Date().toISOString();
      let next = w;
      if (deleteTarget === "all" || deleteTarget === "notes")
        for (const note of active(w.notes))
          next = putRecord(next, "notes", {
            ...note,
            deletedAt: now,
            updatedAt: now,
          });
      if (deleteTarget === "all" || deleteTarget === "projects") {
        const ids = new Set(active(w.projects).map((p) => p.id));
        for (const task of active(w.tasks).filter(
          (t) => deleteTarget === "all" || (t.projectId && ids.has(t.projectId)),
        ))
          next = putRecord(next, "tasks", {
            ...task,
            deletedAt: now,
            updatedAt: now,
          });
        for (const note of active(next.notes).filter((n) => n.projectId && ids.has(n.projectId)))
          next = putRecord(next, "notes", {
            ...note,
            projectId: null,
            updatedAt: now,
          });
        for (const project of active(w.projects))
          next = putRecord(next, "projects", {
            ...project,
            deletedAt: now,
            updatedAt: now,
          });
      }
      if (deleteTarget === "all") next = { ...next, preferences: emptyWorkspace().preferences };
      return next;
    });
    if (ok) {
      setMessage("Datos retirados de tu espacio local. No se ha modificado el CMS.");
      setDeleteTarget(null);
    }
  };
  return createPortal(
    <div
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className={`settings-overlay fixed inset-0 z-50 bg-[var(--ui-action)]/25 text-[var(--ui-ink)] backdrop-blur-sm ${
        isClosing ? "is-closing" : ""
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <aside
        ref={drawer}
        className={`settings-drawer mobile-scroll ml-auto flex h-full w-full max-w-[620px] flex-col border-l border-[var(--ui-ink)]/20 bg-[var(--ui-surface)] shadow-[-16px_0_45px_var(--ui-elevation)] ${
          isClosing ? "is-closing" : ""
        }`}
      >
        <header className="flex items-center justify-between border-b border-[var(--ui-ink)]/20 bg-[var(--ui-panel)] px-6 py-5 sm:px-8">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-[var(--ui-muted)]">
              Preferencias
            </p>
            <h2
              id="settings-title"
              className="mt-1 font-[family-name:var(--font-display)] text-3xl tracking-tight"
            >
              Ajustes
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-[var(--ui-ink)]/25 p-3"
            aria-label="Cerrar ajustes"
          >
            <Icon name="close" size={18} />
          </button>
        </header>
        <div className="flex-1 divide-y divide-[var(--ui-ink)]/15 px-6 pb-10 sm:px-8">
          <section className="py-6">
            <h3 className="mb-4 font-mono text-xs uppercase tracking-widest text-[var(--ui-muted)]">
              Cuenta
            </h3>
            {API_ENABLED ? (
              <button
                className={`${secondary} w-full`}
                onClick={async () => {
                  try {
                    await authService.logout();
                    navigate("/iniciar-sesion");
                  } catch (cause) {
                    setMessage(
                      cause instanceof Error ? cause.message : "No se pudo cerrar la sesión.",
                    );
                  }
                }}
              >
                Cerrar sesión
              </button>
            ) : (
              <p className="text-sm text-[var(--ui-muted)]">
                Modo local activo. No hay una sesión ni contraseñas guardadas.
              </p>
            )}
          </section>
          <section className="py-6">
            <h3 className="mb-4 font-mono text-xs uppercase tracking-widest text-[var(--ui-muted)]">
              Accesibilidad
            </h3>
            <p className="text-sm">Tamaño de la interfaz</p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {["Pequeño", "Normal", "Grande"].map((item) => (
                <button
                  key={item}
                  aria-pressed={size === item.toLowerCase()}
                  onClick={() => preference("interface-size", item)}
                  className={`${size === item.toLowerCase() ? action : secondary} px-2`}
                >
                  {item}
                </button>
              ))}
            </div>
            <button
              role="switch"
              aria-checked={motion}
              onClick={() => preference("reduce-motion", String(!motion))}
              className="mt-5 flex w-full justify-between py-2 text-left text-sm"
            >
              <span>Reducir animaciones</span>
              <span>{motion ? "Activado" : "Desactivado"}</span>
            </button>
          </section>
          <section className="py-6">
            <h3 className="mb-4 font-mono text-xs uppercase tracking-widest text-[var(--ui-muted)]">
              Apariencia
            </h3>
            <button
              onClick={() => preference("theme", theme === "dark" ? "light" : "dark")}
              aria-pressed={theme === "dark"}
              className="flex w-full justify-between rounded-2xl border border-[var(--ui-ink)]/20 bg-[var(--ui-panel)] p-4 text-sm"
            >
              <span>Tema oscuro</span>
              <span>{theme === "dark" ? "Activado" : "Desactivado"}</span>
            </button>
          </section>
          <section className="py-6">
            <h3 className="mb-4 font-mono text-xs uppercase tracking-widest text-[var(--ui-muted)]">
              Organización
            </h3>
            <TaskSortControl />
            <button
              role="switch"
              aria-checked={workspace.preferences.showCompleted}
              onClick={() =>
                setPreferences({
                  showCompleted: !workspace.preferences.showCompleted,
                })
              }
              className="mt-4 flex w-full justify-between gap-3 py-3 text-left text-sm"
            >
              <span>Mostrar tareas completadas</span>
              <span>{workspace.preferences.showCompleted ? "Sí" : "No"}</span>
            </button>
          </section>
          <section className="py-6">
            <h3 className="mb-4 font-mono text-xs uppercase tracking-widest text-[var(--ui-muted)]">
              Datos y privacidad
            </h3>
            <div className="rounded-2xl border border-[var(--ui-ink)]/20 bg-[var(--ui-panel)] p-4 text-sm leading-6">
              <b>{API_ENABLED ? "Datos conectados a la API" : "Espacio local · sin cuenta"}</b>
              <p className="mt-2">
                {API_ENABLED
                  ? "Los cambios se envían al backend configurado. Los errores de red no borran la copia local existente."
                  : "Tus cambios se guardan solo en este navegador. No se sincronizan entre dispositivos. El asistente prepara solicitudes; no envía tus datos a una IA."}
              </p>
              <p className="mt-2">
                {workspace.outbox.length} cambios locales preparados para un futuro adaptador.
                Sincronización desactivada.
              </p>
            </div>
            {!API_ENABLED && (
              <button onClick={exportData} className={`${secondary} mt-4 w-full`}>
                Exportar copia de seguridad
              </button>
            )}
            {!API_ENABLED && (
              <label className={`${secondary} mt-3 w-full cursor-pointer`}>
                Restaurar copia JSON
                <input
                  type="file"
                  accept=".json,application/json"
                  className="sr-only"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    if (!file) return;
                    try {
                      const restored = decodeWorkspace(await file.text());
                      if (
                        !window.confirm(
                          "Se sustituirá el espacio local actual por esta copia. Exporta antes una copia si quieres conservarlo. ¿Continuar?",
                        )
                      )
                        return;
                      if (restoreWorkspace(restored)) setMessage("Copia restaurada y validada.");
                    } catch {
                      setMessage(
                        "La copia no es válida. Tu espacio actual se conserva sin cambios.",
                      );
                    }
                  }}
                />
              </label>
            )}
            {!API_ENABLED && (
              <div className="mt-5 flex flex-wrap gap-3">
                {(["notes", "projects", "all"] as const).map((target) => (
                  <button
                    key={target}
                    onClick={() => setDeleteTarget(target)}
                    className="py-2 text-xs text-[var(--ui-danger-ink)] underline underline-offset-4"
                  >
                    Eliminar{" "}
                    {target === "notes" ? "notas" : target === "projects" ? "proyectos" : "todo"}
                  </button>
                ))}
              </div>
            )}
            {deleteTarget && (
              <div
                role="alert"
                className="mt-4 rounded-2xl border border-[var(--ui-danger)] bg-[var(--ui-danger-soft)] p-4 text-sm text-[var(--ui-danger-ink)]"
              >
                <p>
                  ¿Eliminar{" "}
                  {deleteTarget === "notes"
                    ? "todas las notas"
                    : deleteTarget === "projects"
                      ? "todos los proyectos y sus tareas (las notas quedarán sin proyecto)"
                      : "todos los registros y preferencias de organización"}{" "}
                  de este navegador? Exporta una copia antes de continuar. Esta acción no tiene
                  deshacer.
                </p>
                <div className="mt-4 flex gap-3">
                  <button onClick={() => setDeleteTarget(null)} className={secondary}>
                    Cancelar
                  </button>
                  <button onClick={deleteData} className={secondary}>
                    Confirmar eliminación
                  </button>
                </div>
              </div>
            )}
            {message && (
              <p role="status" className="mt-4 text-sm leading-6">
                {message}
              </p>
            )}
          </section>
          <section className="py-6">
            <h3 className="font-mono text-xs uppercase tracking-widest text-[var(--ui-muted)]">
              Susu · 1.0
            </h3>
            <p className="mt-3 text-xs leading-6 text-[var(--ui-muted)]">
              Las cuentas, el envío de correos, los recordatorios del sistema y la IA externa no
              están conectados en el modo local. No se solicitan contraseñas ni se simulan envíos.
            </p>
          </section>
        </div>
      </aside>
    </div>,
    document.body,
  );
}
