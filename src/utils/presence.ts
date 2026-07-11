/** Presence / heartbeat sabitleri ve stale kontrolu */

export const PRESENCE_STALE_MS = 90_000;
export const HEARTBEAT_INTERVAL_MS = 45_000;

export function toMillis(value: unknown): number {
  if (!value) return 0;
  if (typeof (value as { toMillis?: () => number }).toMillis === 'function') {
    return (value as { toMillis: () => number }).toMillis();
  }
  if (typeof value === 'number') return value;
  if (typeof value === 'object' && value !== null && 'seconds' in value) {
    return Number((value as { seconds: number }).seconds) * 1000;
  }
  return 0;
}

/**
 * online=true olsa bile lastActive cok eskiyse (force-kill) cevrimdisi say.
 * lastActive yoksa (eski kayitlar) online bayragina guven.
 */
export function resolveFreshOnline(online: boolean, lastActive: unknown): boolean {
  if (!online) return false;
  const ms = toMillis(lastActive);
  if (!ms) return true;
  return Date.now() - ms < PRESENCE_STALE_MS;
}
