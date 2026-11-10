import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "@/components/navigation";
import { useWorkspace } from "@/components/workspace-provider";
import { active, type NoteRecord } from "@/lib/workspace-model";
import { Icon } from "./icon";
import { SecondaryScreen } from "./shell";
import { action, secondary, field, label } from "./tasks";

function NoteEditor({
  note,
  projectId,
  onClose,
  onSaved,
}: {
  note?: NoteRecord;
  projectId: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { workspace, saveNote } = useWorkspace();
  const navigate = useNavigate();
  const [title, setTitle] = useState(note?.title ?? "");
  const [content, setContent] = useState(note?.content ?? "");
  const [project, setProject] = useState(note?.projectId ?? projectId ?? "");
  const [error, setError] = useState("");
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) {
      setError("Escribe un título para la nota.");
      return;
    }
    if (
      await saveNote({
        id: note?.id,
        title,
        content,
        projectId: project || null,
      })
    )
      onSaved();
    else setError("No se pudo guardar la nota. Revisa el almacenamiento local.");
  };
  return (
    <form
      aria-label="Editar nota"
      onSubmit={submit}
      className="rounded-[22px] border border-[var(--ui-ink)]/20 bg-[var(--ui-panel)] p-5 sm:p-7"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className={label}>{note ? "Editar nota" : "Nueva nota"}</h2>
        <button type="button" onClick={onClose} className="text-xs underline underline-offset-4">
          Cerrar
        </button>
      </div>
      <label className={`${label} mt-5`}>
        Título
        <input
          required
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Título de la nota"
          className={`${field} font-[family-name:var(--font-display)] text-2xl`}
        />
      </label>
      <label className={`${label} mt-5`}>
        Contenido
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Escribe aquí tus ideas…"
          className={`${field} min-h-52 resize-y leading-6`}
        />
      </label>
      <label className={`${label} mt-5`}>
        Asociar a proyecto
        <select
          value={project}
          onChange={(event) => setProject(event.target.value)}
          className={field}
        >
          <option value="">Sin proyecto · nota independiente</option>
          {active(workspace.projects).map((p) => (
            <option value={p.id} key={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      {error && (
        <p role="alert" className="mt-4 text-sm text-[var(--ui-danger-ink)]">
          {error}
        </p>
      )}
      <div className="mt-5 flex flex-wrap justify-between gap-3">
        <button
          type="button"
          onClick={() => {
            try {
              sessionStorage.setItem(
                "susu.assistant-context",
                JSON.stringify({ title, content, projectId: project || null }),
              );
              navigate(`/asistente${project ? `?proyecto=${encodeURIComponent(project)}` : ""}`);
            } catch {
              setError("No se pudo preparar el contexto. Copia el texto de la nota manualmente.");
            }
          }}
          className={secondary}
        >
          <Icon name="send" size={14} />
          Llevar al asistente
        </button>
        <button type="submit" className={action}>
          Guardar nota
        </button>
      </div>
      <p className="mt-4 text-xs leading-5 text-[var(--ui-muted)]">
        El asistente recibe un borrador local. Guarda antes la nota si quieres conservar tus
        cambios.
      </p>
    </form>
  );
}
export function NotesScreen() {
  const { workspace } = useWorkspace();
  const [search] = useSearchParams();
  const [editing, setEditing] = useState<string | null>(
    search.get("nueva") ? "new" : search.get("nota"),
  );
  const [filter, setFilter] = useState(search.get("proyecto") ?? "all");
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    setEditing(search.get("nueva") ? "new" : search.get("nota"));
    setFilter(search.get("proyecto") ?? "all");
  }, [search]);
  const notes = active(workspace.notes).filter(
    (n) => filter === "all" || (filter === "none" ? n.projectId === null : n.projectId === filter),
  );
  const note = active(workspace.notes).find((n) => n.id === editing);
  const openNew = () => {
    setEditing("new");
    setSaved(false);
  };
  return (
    <SecondaryScreen active="Notas">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-5 border-b border-[var(--ui-ink)]/20 pb-6">
        <div>
          <p className={label}>Archivo de trabajo</p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-5xl leading-none tracking-[-0.055em] sm:text-6xl">
            Notas
          </h1>
        </div>
        <button onClick={openNew} className={action}>
          <Icon name="plus" size={15} />
          Añadir nota
        </button>
      </div>
      <div className="mb-6 max-w-sm">
        <label className={label}>
          Filtrar por proyecto
          <select
            className={field}
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          >
            <option value="all">Todos los proyectos</option>
            <option value="none">Sin proyecto</option>
            {active(workspace.projects).map((p) => (
              <option value={p.id} key={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      {saved && (
        <p role="status" className="mb-5 text-sm">
          Nota guardada en este navegador.
        </p>
      )}
      <div className={editing ? "grid items-start gap-5 lg:grid-cols-[0.9fr_1.1fr]" : ""}>
        <section
          className={
            editing ? "order-2 space-y-3 lg:order-1" : "grid gap-5 md:grid-cols-2 xl:grid-cols-3"
          }
          aria-label="Notas guardadas"
        >
          {notes.map((n) => (
            <button
              key={n.id}
              onClick={() => {
                setEditing(n.id);
                setSaved(false);
              }}
              aria-pressed={editing === n.id}
              className={`note-card-elevated flex min-h-44 w-full flex-col justify-between rounded-2xl border p-6 text-left transition hover:bg-[var(--ui-panel-hover)] ${
                editing === n.id
                  ? "border-[var(--ui-ink)] bg-[var(--ui-panel)]"
                  : "border-[var(--ui-ink)]/20"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="break-words font-[family-name:var(--font-display)] text-2xl tracking-[-0.035em]">
                  {n.title}
                </h2>
                <Icon name="edit" size={17} />
              </div>
              <p className="mt-3 line-clamp-2 whitespace-pre-wrap text-sm leading-6 text-[var(--ui-muted)]">
                {n.content}
              </p>
              <p className="mt-4 font-mono text-[9px] uppercase leading-5 tracking-wide text-[var(--ui-muted)]">
                {active(workspace.projects).find((p) => p.id === n.projectId)?.name ??
                  "Sin proyecto"}{" "}
                · {new Date(n.updatedAt).toLocaleDateString("es-ES")}
              </p>
            </button>
          ))}
          {!notes.length && (
            <p role="status" className="py-6 text-sm text-[var(--ui-muted)]">
              No hay notas en esta vista. Añade una nueva o cambia el filtro.
            </p>
          )}
        </section>
        {editing && (
          <div className="order-1 lg:order-2">
            {editing === "new" || note ? (
              <NoteEditor
                key={editing}
                note={note}
                projectId={filter !== "all" && filter !== "none" ? filter : null}
                onClose={() => setEditing(null)}
                onSaved={() => {
                  setEditing(null);
                  setSaved(true);
                }}
              />
            ) : (
              <p role="status" className="text-sm">
                La nota solicitada no existe en este navegador.
                <button onClick={() => setEditing(null)} className="ml-2 underline">
                  Cerrar
                </button>
              </p>
            )}
          </div>
        )}
      </div>
    </SecondaryScreen>
  );
}
