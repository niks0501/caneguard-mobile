/**
 * The durable memory of one interrupted paginated download. The feed owns the
 * serialized payload; the store only keeps it under the owner and feed it
 * belongs to, so a download survives the process that started it.
 */
export interface SyncDownloadProgressStore {
  read(): Promise<string | null>;
  save(payload: string): Promise<void>;
  clear(): Promise<void>;
}
