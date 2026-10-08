// sentinel-dates.ts — sentinelle di dominio (valori neutri) + predicati PURI.
// 9999-12-31 = "senza scadenza / aperto"; 0001-01-01 = "non definita". Predicati fail-safe.

export const SENTINEL_DATE_MAX = '9999-12-31';
export const SENTINEL_DATE_MIN = '0001-01-01';

export function isOpenEnded(date: string | null | undefined): boolean {
  if (!date) return false;
  return date === SENTINEL_DATE_MAX || date.startsWith('9999');
}

export function isSentinelDate(date: string | null | undefined): boolean {
  if (!date) return false;
  return isOpenEnded(date) || date === SENTINEL_DATE_MIN || date.startsWith('0001');
}
