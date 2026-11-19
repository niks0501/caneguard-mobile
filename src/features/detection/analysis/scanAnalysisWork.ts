export type PreparedPhoto = {
  inputBuffer: ArrayBuffer;
  preprocessMs: number;
};

export const activeWork = new Map<string, Promise<void>>();
export const preparedPhotos = new Map<string, PreparedPhoto>();

export function clearScanAnalysisWork(sessionIdentity: string): void {
  const prefix = `${sessionIdentity}:`;
  for (const key of activeWork.keys()) {
    if (key.startsWith(prefix)) activeWork.delete(key);
  }
  for (const key of preparedPhotos.keys()) {
    if (key.startsWith(prefix)) preparedPhotos.delete(key);
  }
}
