const memoryCache = new Map();
const STORAGE_PREFIX = "victory-admin-cache:";

const canUseSessionStorage = () => typeof window !== "undefined" && window.sessionStorage;

export function readStaleCache(key, fallback = null) {
  if (!key) return fallback;
  if (memoryCache.has(key)) return memoryCache.get(key);
  if (!canUseSessionStorage()) return fallback;
  try {
    const raw = window.sessionStorage.getItem(`${STORAGE_PREFIX}${key}`);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    memoryCache.set(key, parsed);
    return parsed;
  } catch {
    return fallback;
  }
}

export function writeStaleCache(key, value) {
  if (!key) return;
  memoryCache.set(key, value);
  if (!canUseSessionStorage()) return;
  try {
    window.sessionStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value));
  } catch {
    // Best-effort UI cache only. Never block the dashboard on storage limits.
  }
}
