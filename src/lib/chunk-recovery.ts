const GUARD_KEY = "gs-chunk-reload";

const PATTERNS = [
  "failed to fetch dynamically imported module",
  "error loading dynamically imported module",
  "importing a module script failed",
  "chunkloaderror",
  "loading chunk",
  "unable to preload css",
  "dynamically imported module",
];

export function isChunkLoadError(error: unknown): boolean {
  const message = (
    error instanceof Error ? `${error.name} ${error.message}` : String(error ?? "")
  ).toLowerCase();
  return PATTERNS.some((p) => message.includes(p));
}

/**
 * A stale HTML shell can point at chunk URLs that no longer exist after a new
 * deploy — common on phones that keep tabs alive for days. Reload once (guarded
 * so we never loop) to pull a fresh shell.
 */
export function recoverFromChunkError(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (sessionStorage.getItem(GUARD_KEY)) return false;
    sessionStorage.setItem(GUARD_KEY, String(Date.now()));
  } catch {
    return false;
  }
  window.location.reload();
  return true;
}

export function clearChunkRecoveryGuard() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(GUARD_KEY);
  } catch {
    /* ignore */
  }
}
