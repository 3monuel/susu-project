import type { EntityKind, RemoteId, SyncOperation, Workspace } from "./workspace-model";

/** Transport boundary only: no request is made until an authenticated adapter is supplied. */
export interface WorkspaceSyncAdapter {
  push(batch: {
    schemaVersion: 1;
    operations: SyncOperation[];
    records: Pick<Workspace, EntityKind>;
  }): Promise<{
    acknowledgements: { operationId: string; remoteId: RemoteId }[];
  }>;
}
export function syncBatch(workspace: Workspace) {
  const ids = (kind: EntityKind) =>
    new Set(workspace.outbox.filter((o) => o.entity === kind).map((o) => o.recordId));
  const projects = ids("projects"),
    tasks = ids("tasks"),
    notes = ids("notes");
  return {
    schemaVersion: 1 as const,
    operations: workspace.outbox,
    records: {
      projects: workspace.projects.filter((r) => projects.has(r.id)),
      tasks: workspace.tasks.filter((r) => tasks.has(r.id)),
      notes: workspace.notes.filter((r) => notes.has(r.id)),
    },
  };
}
export function acknowledgeSync(
  workspace: Workspace,
  acknowledgements: { operationId: string; remoteId: RemoteId }[],
): Workspace {
  let next = { ...workspace };
  for (const ack of acknowledgements) {
    const operation = workspace.outbox.find((o) => o.operationId === ack.operationId);
    if (!operation) continue;
    next = {
      ...next,
      [operation.entity]: next[operation.entity].map((r) =>
        r.id === operation.recordId ? { ...r, remoteId: ack.remoteId } : r,
      ),
      // A later local edit has a different operation ID and must remain queued.
      outbox: next.outbox.filter((o) => o.operationId !== ack.operationId),
    };
  }
  return next;
}
