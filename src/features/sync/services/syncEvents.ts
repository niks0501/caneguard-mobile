type Listener = () => void;

let revision = 0;
const listeners = new Set<Listener>();

export function emitSyncRecordsChanged(): void {
  revision += 1;
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeSyncRecords(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSyncRecordsRevision(): number {
  return revision;
}
