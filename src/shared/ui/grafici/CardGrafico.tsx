// CardGrafico — card di un grafico (ADR 0027): titolo, interruttore Grafico / Tabella (la tabella equivalente e' il
// canale accessibile, WCAG 1.1.1 e 1.4.1), download, valori omessi dichiarati, nota sulla fonte. Se il grafico non e'
// disegnabile (opzioni null) dice perche' e mostra subito la tabella con cio' che c'e'. Download (09/10/2026): PNG del
// grafico come si vede, nella vista Grafico; poi i file dei dati che passa il chiamante (CSV e XLSX dal backend).
import { useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { COLORI } from '../../lib/grafici';
import { nomeFile } from '../../lib/nome-file';
import type { DatiGrafico } from '../../lib/grafici';
import { TestaCard } from '../card/Sezione';
import { blobDaDataUrl, salvaFile } from '../salva-file';
import { Icona } from '../icona';
import { PulsantiScarica } from '../scarica/PulsantiScarica';
import type { Scaricamento } from '../scarica/PulsantiScarica';
import { TabellaDati } from '../tabella/TabelleSemplici';
import { Grafico } from './Grafico';
import type { AltezzaGrafico, ClicGrafico } from './Grafico';
import { pngDelGrafico } from './echarts';
import type { IstanzaGrafico } from './echarts';

export function CardGrafico({
  titolo,
  sottotitolo,
  dati,
  fonte,
  altezza = 'normale',
  onClic,
  strumenti,
  scaricamenti = [],
  livello = 2,
}: {
  titolo: string;
  sottotitolo?: string;
  dati: DatiGrafico;
  fonte: string;
  altezza?: AltezzaGrafico;
  onClic?: (p: ClicGrafico) => void;
  strumenti?: ReactNode;
  /** File dei dati del grafico (CSV, XLSX), dopo il PNG. */
  scaricamenti?: readonly Scaricamento[];
  livello?: 2 | 3;
}) {
  const id = useId();
  const disegnabile = dati.opzioni !== null;
  const [vista, setVista] = useState<'grafico' | 'tabella'>('grafico');
  const istanza = useRef<IstanzaGrafico | null>(null);
  const mostraTabella = !disegnabile || vista === 'tabella';

  // il PNG solo nella vista Grafico: nella vista Tabella il grafico e' nascosto e non ha dimensioni
  const png: Scaricamento[] =
    disegnabile && vista === 'grafico'
      ? [
          {
            formato: 'PNG',
            scarica: () => {
              const c = istanza.current;
              if (!c) throw new Error('grafico non ancora disegnato');
              salvaFile(blobDaDataUrl(pngDelGrafico(c, COLORI.superficie)), nomeFile(titolo, 'png'));
            },
          },
        ]
      : [];

  return (
    // data-card-grafico: la card con grafico o con il motivo dell'assenza (i test la distinguono da una Sezione omonima)
    <section className="ui-card ui-dissolvenza" aria-labelledby={id} data-card-grafico={disegnabile ? 'grafico' : 'assente'}>
      <TestaCard
        id={id}
        titolo={titolo}
        sottotitolo={sottotitolo}
        livello={livello}
        strumenti={
          <>
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
              </>
            )}
            <PulsantiScarica oggetto={`il grafico ${titolo}`} scaricamenti={[...png, ...scaricamenti]} />
          </>
        }
      />
      {!disegnabile && (
        <p className="ui-grafico-assente">
          <Icona nome="it-info-circle" />
          <span>{`Grafico non disponibile: ${dati.motivoAssenza ?? 'dati insufficienti'}.`}</span>
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
