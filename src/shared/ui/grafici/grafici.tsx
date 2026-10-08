// grafici.tsx — grafici SVG accessibili, senza libreria (docs/decisioni/grafici.md, OP-FE-01). Pattern: <figure> con
// <svg role="img"> nominato da <title> e <desc>, legenda testuale nella <figcaption>. La tabella con gli stessi valori
// sta sempre sotto il grafico (canale primario): niente interazione, niente tooltip, nessun valore inventato.
// - Un valore null (dato non disponibile) non si disegna mai come zero: le barre e la linea lo omettono e la
//   descrizione lo dichiara; la ciambella, che mostra parti di un totale, non si disegna affatto (proporzione ignota).
// - Un valore negativo non e' rappresentabile come lunghezza o fetta: omesso e dichiarato (barre), grafico non
//   disponibile (ciambella).
// Colori: palette bootstrap-italia, mai unico indicatore (legenda e tabella portano il testo).
import { useId } from 'react';
import type { ReactNode } from 'react';

const PALETTE = ['#0066cc', '#008055', '#cc7a00', '#5c6f82', '#d9364f', '#4d3a8c'];
const colore = (i: number) => PALETTE[i % PALETTE.length];

export interface Serie {
  nome: string;
  valori: (number | null)[];
}

type Formattatore = (n: number) => string;

function Legenda({ voci }: { voci: { nome: string; testo?: string }[] }) {
  return (
    <ul className="list-inline mb-0 small">
      {voci.map((v, i) => (
        <li key={v.nome} className="list-inline-item me-3">
          <svg width="12" height="12" aria-hidden="true" focusable="false">
            <rect width="12" height="12" fill={colore(i)} />
          </svg>{' '}
          {v.nome}
          {v.testo ? `: ${v.testo}` : ''}
        </li>
      ))}
    </ul>
  );
}

function NonDisponibile({ titolo, motivo }: { titolo: string; motivo: string }) {
  return <p className="small text-muted">{`${titolo}: grafico non disponibile, ${motivo}.`}</p>;
}

/** Nota della descrizione sui valori non disegnati (assenti o negativi). */
function notaOmessi(valori: (number | null)[]): string {
  const mancanti = valori.filter((v) => v == null).length;
  const negativi = valori.filter((v) => v != null && v < 0).length;
  const parti = [];
  if (mancanti > 0) parti.push(`${mancanti} valori non disponibili`);
  if (negativi > 0) parti.push(`${negativi} valori negativi`);
  return parti.length > 0 ? ` Non disegnati: ${parti.join(', ')}.` : '';
}

const disegnabile = (v: number | null): v is number => v != null && v > 0;

function Figura({ titolo, descrizione, viewBox, legenda, children }: {
  titolo: string;
  descrizione: string;
  viewBox: string;
  legenda?: { nome: string; testo?: string }[];
  children: ReactNode;
}) {
  const id = useId();
  return (
    <figure className="my-3">
      <svg role="img" aria-labelledby={`${id}-t ${id}-d`} viewBox={viewBox} width="100%" preserveAspectRatio="xMinYMin meet">
        <title id={`${id}-t`}>{titolo}</title>
        <desc id={`${id}-d`}>{descrizione}</desc>
        {children}
      </svg>
      {legenda && (
        <figcaption>
          <Legenda voci={legenda} />
        </figcaption>
      )}
    </figure>
  );
}

const LARGHEZZA = 640;
const ETICHETTA = 70;
const AREA = LARGHEZZA - ETICHETTA - 140;
const BARRA = 12;

/** Barre orizzontali: una riga per categoria; per serie affiancate, oppure impilate (parti di un totale per riga). */
export function GraficoBarre({ titolo, categorie, serie, formatta, impilato = false }: {
  titolo: string;
  categorie: string[];
  serie: Serie[];
  formatta: Formattatore;
  impilato?: boolean;
}) {
  const tutti = serie.flatMap((s) => s.valori);
  if (categorie.length === 0 || !tutti.some(disegnabile)) {
    return <NonDisponibile titolo={titolo} motivo="nessun valore da rappresentare" />;
  }
  const totaleRiga = (i: number) => serie.reduce((t, s) => t + (disegnabile(s.valori[i]) ? (s.valori[i] as number) : 0), 0);
  const max = impilato ? Math.max(...categorie.map((_, i) => totaleRiga(i)), 1) : Math.max(...tutti.filter(disegnabile), 1);
  const riga = impilato ? BARRA + 10 : serie.length * (BARRA + 2) + 8;
  const modo = impilato ? 'Barre impilate' : 'Barre';
  const descrizione = `${modo} per ${categorie.length} voci, serie: ${serie.map((s) => s.nome).join(', ')}. I valori sono nella tabella che segue.${notaOmessi(tutti)}`;
  return (
    <Figura titolo={titolo} descrizione={descrizione} viewBox={`0 0 ${LARGHEZZA} ${categorie.length * riga}`} legenda={serie.map((s) => ({ nome: s.nome }))}>
      {categorie.map((c, i) => (
        <g key={c} transform={`translate(0 ${i * riga})`}>
          <text x={0} y={riga / 2 + 4} fontSize="11">
            {c}
          </text>
          {impilato ? <Impilata serie={serie} i={i} max={max} formatta={formatta} /> : <Affiancate serie={serie} i={i} max={max} formatta={formatta} />}
        </g>
      ))}
    </Figura>
  );
}

function Affiancate({ serie, i, max, formatta }: { serie: Serie[]; i: number; max: number; formatta: Formattatore }) {
  return (
    <>
      {serie.map((s, j) => {
        const v = s.valori[i];
        if (!disegnabile(v)) return null;
        const y = 4 + j * (BARRA + 2);
        const w = Math.max((v / max) * AREA, 1);
        return (
          <g key={s.nome}>
            <rect x={ETICHETTA} y={y} width={w} height={BARRA} fill={colore(j)} />
            <text x={ETICHETTA + w + 4} y={y + BARRA - 2} fontSize="10">
              {formatta(v)}
            </text>
          </g>
        );
      })}
    </>
  );
}

function Impilata({ serie, i, max, formatta }: { serie: Serie[]; i: number; max: number; formatta: Formattatore }) {
  let x = ETICHETTA;
  let totale = 0;
  const pezzi = serie.map((s, j) => {
    const v = s.valori[i];
    if (!disegnabile(v)) return null;
    const w = (v / max) * AREA;
    const rect = <rect key={s.nome} x={x} y={4} width={Math.max(w, 1)} height={BARRA} fill={colore(j)} />;
    x += w;
    totale += v;
    return rect;
  });
  return (
    <>
      {pezzi}
      {totale > 0 && (
        <text x={x + 4} y={4 + BARRA - 2} fontSize="10">
          {formatta(totale)}
        </text>
      )}
    </>
  );
}

/** Ciambella: parti di un totale. Si disegna solo se tutte le parti sono note e non negative. */
export function GraficoCiambella({ titolo, voci, formatta }: {
  titolo: string;
  voci: { etichetta: string; valore: number | null }[];
  formatta: Formattatore;
}) {
  const assenti = voci.filter((v) => v.valore == null).map((v) => v.etichetta);
  if (assenti.length > 0) return <NonDisponibile titolo={titolo} motivo={`${assenti.join(' e ')}: dato non disponibile`} />;
  const negative = voci.filter((v) => (v.valore as number) < 0).map((v) => v.etichetta);
  if (negative.length > 0) return <NonDisponibile titolo={titolo} motivo={`${negative.join(' e ')}: valore negativo`} />;
  const totale = voci.reduce((t, v) => t + (v.valore as number), 0);
  if (totale <= 0) return <NonDisponibile titolo={titolo} motivo="nessun valore da rappresentare" />;
  const r = 60;
  const circ = 2 * Math.PI * r;
  const percento = (v: number) => `${((v / totale) * 100).toLocaleString('it-IT', { maximumFractionDigits: 1 })}%`;
  let offset = 0;
  return (
    <Figura
      titolo={titolo}
      descrizione={`${voci.map((v) => `${v.etichetta} ${percento(v.valore as number)}`).join(', ')}.`}
      viewBox="0 0 160 160"
      legenda={voci.map((v) => ({ nome: v.etichetta, testo: `${formatta(v.valore as number)} (${percento(v.valore as number)})` }))}
    >
      <g transform="rotate(-90 80 80)">
        {voci.map((v, i) => {
          const quota = ((v.valore as number) / totale) * circ;
          const arco = <circle key={v.etichetta} cx="80" cy="80" r={r} fill="none" stroke={colore(i)} strokeWidth="28" strokeDasharray={`${quota} ${circ - quota}`} strokeDashoffset={-offset} />;
          offset += quota;
          return arco;
        })}
      </g>
    </Figura>
  );
}

/** Linea nel tempo (es. utilizzo progressivo cumulato della riserva). I punti senza valore sono omessi. */
export function GraficoLinea({ titolo, punti, formatta }: {
  titolo: string;
  punti: { etichetta: string; valore: number | null }[];
  formatta: Formattatore;
}) {
  const validi = punti.filter((p): p is { etichetta: string; valore: number } => p.valore != null);
  if (validi.length === 0) return <NonDisponibile titolo={titolo} motivo="nessun valore da rappresentare" />;
  const altezza = 200;
  const margine = 30;
  const max = Math.max(...validi.map((p) => p.valore), 1);
  const x = (i: number) => margine + (validi.length === 1 ? 0 : (i / (validi.length - 1)) * (LARGHEZZA - 2 * margine));
  const y = (v: number) => altezza - margine - (v / max) * (altezza - 2 * margine);
  const ultimo = validi[validi.length - 1];
  const omessi = punti.length - validi.length;
  const descrizione = `${validi.length} punti dal ${validi[0].etichetta} al ${ultimo.etichetta}, ultimo valore ${formatta(ultimo.valore)}. I valori sono nella tabella che segue.${omessi > 0 ? ` Non disegnati: ${omessi} valori non disponibili.` : ''}`;
  return (
    <Figura titolo={titolo} descrizione={descrizione} viewBox={`0 0 ${LARGHEZZA} ${altezza}`}>
      <polyline fill="none" stroke={colore(0)} strokeWidth="2" points={validi.map((p, i) => `${x(i)},${y(p.valore)}`).join(' ')} />
      {validi.map((p, i) => (
        <circle key={`${p.etichetta}-${i}`} cx={x(i)} cy={y(p.valore)} r="3" fill={colore(0)} />
      ))}
    </Figura>
  );
}
