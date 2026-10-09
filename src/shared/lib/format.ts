// format.ts — formattatori PURI (input nullable -> string, nessun side-effect, zero React).
// Locale it-IT. Un input non parsabile ritorna il grezzo, non lancia (fail-soft di visualizzazione).

export function formatNumber(value: number | null | undefined): string {
  if (value == null) return '-';
  return value.toLocaleString('it-IT');
}

// Euro al centesimo, come gli importi del backend (Importo.valore: "due decimali").
export function formatEuro(value: number | null | undefined): string {
  if (value == null) return '-';
  return value.toLocaleString('it-IT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Percentuale gia' espressa in centesimi (es. 12.5 -> "12,5 %"), al piu' due decimali.
export function formatPercentuale(value: number | null | undefined): string {
  if (value == null) return '-';
  return `${value.toLocaleString('it-IT', { maximumFractionDigits: 2 })} %`;
}

const DATA_ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

export function formatDate(value: string | null | undefined): string {
  if (!value) return '';
  // una data senza ora (AAAA-MM-GG) si rende cosi' com'e', senza passare dal fuso orario
  const iso = DATA_ISO.exec(value);
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value; // data non parsabile -> grezzo, non un throw
  // anno a quattro cifre, coerente con i testi dei report (es. 30/06/2026)
  return new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
}

const DATA_ORA_ROMA = new Intl.DateTimeFormat('it-IT', {
  timeZone: 'Europe/Rome',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

// Istante del backend (es. "2026-03-03T08:30:00Z") in ora italiana, "03/03/2026 09:30": come l'intestazione degli export.
// Il backend manda i microsecondi (Instant di Java): lo standard di Date garantisce solo i millisecondi, quindi si tagliano.
export function formatDataOra(value: string | null | undefined): string {
  if (!value) return '';
  const d = new Date(value.replace(/(\.\d{3})\d+/, '$1'));
  if (Number.isNaN(d.getTime())) return value;
  const p = Object.fromEntries(DATA_ORA_ROMA.formatToParts(d).map((x) => [x.type, x.value]));
  return `${p.day}/${p.month}/${p.year} ${p.hour}:${p.minute}`;
}
