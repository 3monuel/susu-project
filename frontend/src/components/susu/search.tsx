import { useState } from "react";
import { useNavigate } from "@/components/navigation";
import { useWorkspace } from "@/components/workspace-provider";
import { active } from "@/lib/workspace-model";
import { Icon } from "./icon";

export function WorkspaceSearch({ onClose }: { onClose: () => void }) {
  const { workspace } = useWorkspace();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const normalized = query.trim().toLocaleLowerCase("es");
  const results = [
    ...active(workspace.projects).map((p) => ({
      id: p.id,
      title: p.name,
      context: p.description,
      date: p.dueDate,
      kind: "Proyecto",
      path: `/proyectos/${p.slug}`,
    })),
    ...active(workspace.tasks).map((t) => ({
      id: t.id,
      title: t.name,
      context: t.description,
      date: t.dueDate,
      kind: "Tarea",
      path: t.projectId
        ? `/proyectos/${workspace.projects.find((p) => p.id === t.projectId)?.slug}`
        : "/",
    })),
    ...active(workspace.notes).map((n) => ({
      id: n.id,
      title: n.title,
      context: n.content,
      date: null,
      kind: "Nota",
      path: `/notas?nota=${encodeURIComponent(n.id)}`,
    })),
  ].filter(
    (r) =>
      normalized &&
      `${r.title} ${r.context} ${r.date ?? ""}`.toLocaleLowerCase("es").includes(normalized),
  );
  return (
    <section
      className="pointer-events-auto absolute inset-x-6 top-full mt-2 sm:inset-x-10 lg:inset-x-14"
      aria-label="Búsqueda del espacio"
    >
      <div className="ml-auto max-w-[520px] overflow-hidden rounded-2xl border border-[var(--ui-ink)]/25 bg-[var(--ui-surface)] shadow-[0_8px_24px_var(--ui-elevation)]">
        <div className="flex items-center gap-2 p-3">
          <Icon name="search" size={16} />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="min-w-0 flex-1 bg-transparent px-2 py-1 text-sm outline-none"
            placeholder="Nombre, descripción o fecha"
            aria-label="Buscar por nombre, descripción o fecha"
            onKeyDown={(event) => {
              if (event.key === "Escape") onClose();
            }}
          />
          <button onClick={onClose} className="rounded-full p-2" aria-label="Cerrar búsqueda">
            <Icon name="close" size={14} />
          </button>
        </div>
        {normalized && (
          <div className="max-h-80 overflow-y-auto border-t border-[var(--ui-ink)]/15 p-2">
            {results.length ? (
              results.slice(0, 20).map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
                    navigate(r.path);
                    onClose();
                  }}
                  className="block w-full rounded-xl px-3 py-3 text-left hover:bg-[var(--ui-panel)]"
                >
                  <span className="block font-mono text-[9px] uppercase text-[var(--ui-muted)]">
                    {r.kind}
                  </span>
                  <span className="text-sm">{r.title}</span>
                </button>
              ))
            ) : (
              <p role="status" className="p-3 text-sm text-[var(--ui-muted)]">
                No hay coincidencias.
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
