export type PreparedPhoto = {
  inputBuffer: ArrayBuffer;
  preprocessMs: number;
};

export const activeWork = new Map<string, Promise<void>>();
export const preparedPhotos = new Map<string, PreparedPhoto>();
export const qualityRejectedPhotos = new Set<string>();

export function clearScanAnalysisWork(sessionIdentity: string): void {
  const prefix = `${sessionIdentity}:`;
  for (const key of activeWork.keys()) {
    if (key.startsWith(prefix)) activeWork.delete(key);
  }
  for (const key of preparedPhotos.keys()) {
    if (key.startsWith(prefix)) preparedPhotos.delete(key);
  }
  for (const key of qualityRejectedPhotos) {
    if (key.startsWith(prefix)) qualityRejectedPhotos.delete(key);
  }
}
