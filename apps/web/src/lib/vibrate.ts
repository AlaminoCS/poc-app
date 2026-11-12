/** Feedback háptico no mobile; no-op no desktop / browsers sem suporte. */
export function vibrate(pattern: number | number[] = 16) {
  if (typeof navigator === "undefined") return;
  if (!("vibrate" in navigator)) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    /* ignore */
  }
}
