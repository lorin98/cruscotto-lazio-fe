// CardGrafico — card di un grafico (ADR 0027): titolo, interruttore Grafico / Tabella (la tabella equivalente e' il
// canale accessibile, WCAG 1.1.1 e 1.4.1), download SVG, valori omessi dichiarati, nota sulla fonte. Se il grafico non e'
// disegnabile (opzioni null) dice perche' e mostra subito la tabella con cio' che c'e'.
import { useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { EChartsOption } from 'echarts';
import { Icona } from '../icona';
import { Grafico } from './Grafico';
import type { AltezzaGrafico, ClicGrafico } from './Grafico';
import type { IstanzaGrafico } from './echarts';

export interface TabellaEquivalente {
  caption: string;
  colonne: string[];
  righe: string[][];
}

/** Forma restituita dai builder puri delle feature (lib/): opzioni, tabella equivalente, voci omesse. */
export interface DatiGrafico {
  opzioni: EChartsOption | null;
  motivoAssenza?: string;
  tabella: TabellaEquivalente;
  omessi: string[];
}

// cifre, separatori, unita' e segni: allineate a destra senza a capo; il resto (assenze, motivi) va a capo
const NUMERICO = /^[\d\s.,%€+\-−MLnd/]*\d[\d\s.,%€+\-−MLnd/]*$/;

/** Il motivo segue "Grafico non disponibile: ": iniziale minuscola, salvo sigle e codici (seconda lettera maiuscola o cifra). */
function motivoInFrase(motivo: string): string {
  return /^[A-ZÀ-Ý](?![A-Z0-9])/.test(motivo) ? motivo.charAt(0).toLowerCase() + motivo.slice(1) : motivo;
}

export function TabellaDati({ tabella }: { tabella: TabellaEquivalente }) {
  return (
    <div className="ui-tabella-contenitore">
      <table className="ui-tabella">
        <caption>{tabella.caption}</caption>
        <thead>
          <tr>
            {tabella.colonne.map((c, i) => (
              <th key={c} scope="col" className={i ? 'ui-num' : undefined}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tabella.righe.map((r, n) => (
            <tr key={`${r[0]}-${n}`}>
              {r.map((v, i) =>
                i === 0 ? (
                  <th key={i} scope="row">
                    {v}
                  </th>
                ) : (
                  <td key={i} className={NUMERICO.test(v) ? 'ui-num' : 'ui-testo'}>
                    {v}
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CardGrafico({
  titolo,
  sottotitolo,
  dati,
  fonte,
  altezza = 'normale',
  onClic,
  strumenti,
  livello = 2,
}: {
  titolo: string;
  sottotitolo?: string;
  dati: DatiGrafico;
  fonte: string;
  altezza?: AltezzaGrafico;
  onClic?: (p: ClicGrafico) => void;
  strumenti?: ReactNode;
  livello?: 2 | 3;
}) {
  const id = useId();
  const disegnabile = dati.opzioni !== null;
  const [vista, setVista] = useState<'grafico' | 'tabella'>('grafico');
  const istanza = useRef<IstanzaGrafico | null>(null);
  const Titolo = livello === 2 ? 'h2' : 'h3';
  const mostraTabella = !disegnabile || vista === 'tabella';

  const scarica = () => {
    const c = istanza.current;
    if (!c) return;
    const a = document.createElement('a');
    a.href = c.getDataURL({ backgroundColor: '#fff' });
    a.download = `${titolo.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}.svg`;
    a.click();
  };

  return (
    <section className="ui-card ui-dissolvenza" aria-labelledby={id}>
      <div className="ui-card__testa">
        <div>
          <Titolo id={id}>{titolo}</Titolo>
          {sottotitolo && <p>{sottotitolo}</p>}
        </div>
        <div className="ui-card__strumenti">
          {strumenti}
          {disegnabile && (
            <>
              <div className="ui-seg" role="group" aria-label={`Vista di ${titolo}`}>
                <button type="button" aria-pressed={vista === 'grafico'} onClick={() => setVista('grafico')}>
                  Grafico
                </button>
                <button type="button" aria-pressed={vista === 'tabella'} onClick={() => setVista('tabella')}>
                  Tabella
                </button>
              </div>
              <button type="button" className="ui-icona-btn" onClick={scarica} aria-label={`Scarica il grafico ${titolo} come immagine`} title="Scarica come immagine">
                <Icona nome="it-download" />
              </button>
            </>
          )}
        </div>
      </div>
      {!disegnabile && (
        <p className="ui-grafico-assente">
          <Icona nome="it-info-circle" />
          <span>{`Grafico non disponibile: ${motivoInFrase(dati.motivoAssenza ?? 'dati insufficienti')}.`}</span>
        </p>
      )}
      {disegnabile && dati.opzioni && (
        <div hidden={vista !== 'grafico'}>
          <Grafico
            opzioni={dati.opzioni}
            altezza={altezza}
            onClic={onClic}
            onIstanza={(c) => {
              istanza.current = c;
            }}
          />
        </div>
      )}
      {mostraTabella && <TabellaDati tabella={dati.tabella} />}
      {dati.omessi.length > 0 && (
        <details className="ui-omessi">
          <summary>{dati.omessi.length === 1 ? '1 voce non nel grafico' : `${dati.omessi.length} voci non nel grafico`}</summary>
          <ul>
            {dati.omessi.map((o, n) => (
              <li key={`${n}-${o}`}>{o}</li>
            ))}
          </ul>
        </details>
      )}
      <p className="ui-fonte">
        <Icona nome="it-info-circle" />
        {fonte}
      </p>
    </section>
  );
}
