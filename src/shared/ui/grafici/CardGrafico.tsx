// CardGrafico — card di un grafico (ADR 0027): titolo, interruttore Grafico / Tabella (la tabella equivalente e' il
// canale accessibile, WCAG 1.1.1 e 1.4.1), download, valori omessi dichiarati, nota sulla fonte. Se il grafico non e'
// disegnabile (opzioni null) dice perche' e mostra subito la tabella con cio' che c'e'. Download (09/10/2026): PNG del
// grafico come si vede, nella vista Grafico (usePngDelGrafico), poi i file dei dati che passa il chiamante (CSV e XLSX dal
// backend); il PNG prende il nome dei file dei dati, con l'estensione png (review v3 H-06).
import { useId, useState } from 'react';
import type { ReactNode } from 'react';
import { nomeFile } from '../../lib/nome-file';
import type { DatiGrafico } from '../../lib/grafici';
import { TestaCard } from '../card/Sezione';
import { Icona } from '../icona';
import { PulsantiScarica } from '../scarica/PulsantiScarica';
import type { Scaricamento } from '../scarica/PulsantiScarica';
import { TabellaDati } from '../tabella/TabelleSemplici';
import { Grafico } from './Grafico';
import type { AltezzaGrafico, ClicGrafico } from './Grafico';
import type { IstanzaGrafico } from './echarts';
import { usePngDelGrafico } from './usePngDelGrafico';

type Vista = 'grafico' | 'tabella';

function InterruttoreVista({ titolo, vista, onVista }: { titolo: string; vista: Vista; onVista: (v: Vista) => void }) {
  return (
    <div className="ui-seg" role="group" aria-label={`Vista di ${titolo}`}>
      <button type="button" aria-pressed={vista === 'grafico'} onClick={() => onVista('grafico')}>
        Grafico
      </button>
      <button type="button" aria-pressed={vista === 'tabella'} onClick={() => onVista('tabella')}>
        Tabella
      </button>
    </div>
  );
}

function VociOmesse({ omessi }: { omessi: readonly string[] }) {
  if (omessi.length === 0) return null;
  return (
    <details className="ui-omessi">
      <summary>{omessi.length === 1 ? '1 voce non nel grafico' : `${omessi.length} voci non nel grafico`}</summary>
      <ul>
        {omessi.map((o, n) => (
          <li key={`${n}-${o}`}>{o}</li>
        ))}
      </ul>
    </details>
  );
}

/** Il nome del PNG: quello del primo file dei dati con l'estensione png, altrimenti dal titolo. */
function nomePng(titolo: string, scaricamenti: readonly Scaricamento[]): string {
  const dati = scaricamenti.find((s) => s.file)?.file;
  return dati ? dati.replace(/\.[^.]+$/, '.png') : nomeFile(titolo, 'png');
}

/** Il grafico (vista Grafico) o il motivo dell'assenza, e la tabella equivalente quando serve. */
function CorpoCard({
  dati,
  vista,
  altezza,
  onClic,
  onIstanza,
  tabella,
}: {
  dati: DatiGrafico;
  vista: Vista;
  altezza: AltezzaGrafico;
  onClic?: (p: ClicGrafico) => void;
  onIstanza: (c: IstanzaGrafico | null) => void;
  tabella?: ReactNode;
}) {
  const opzioni = dati.opzioni;
  return (
    <>
      {opzioni ? (
        <div hidden={vista !== 'grafico'}>
          <Grafico opzioni={opzioni} altezza={altezza} onClic={onClic} onIstanza={onIstanza} />
        </div>
      ) : (
        <p className="ui-grafico-assente">
          <Icona nome="it-info-circle" />
          <span>{`Grafico non disponibile: ${dati.motivoAssenza ?? 'dati insufficienti'}.`}</span>
        </p>
      )}
      {(!opzioni || vista === 'tabella') && (tabella ?? <TabellaDati tabella={dati.tabella} />)}
    </>
  );
}

interface PropsCardGrafico {
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
  /**
   * Tabella equivalente al posto di quella generata da `dati.tabella`, con gli stessi valori: serve quando le celle portano
   * le azioni del clic sul grafico (es. i link all'elenco operativo), cosi' la vista Tabella e' anche il percorso da tastiera.
   */
  tabella?: ReactNode;
}

export function CardGrafico({ titolo, sottotitolo, dati, fonte, altezza = 'normale', onClic, strumenti, scaricamenti = [], livello = 2, tabella }: PropsCardGrafico) {
  const id = useId();
  const [vista, setVista] = useState<Vista>('grafico');
  const disegnabile = dati.opzioni !== null;
  // il PNG solo nella vista Grafico: nella vista Tabella il grafico e' nascosto e non ha dimensioni
  const { onIstanza, png } = usePngDelGrafico({ titolo, fonte, file: nomePng(titolo, scaricamenti), attivo: disegnabile && vista === 'grafico' });
  const strumentiCard = (
    <>
      {strumenti}
      {disegnabile && <InterruttoreVista titolo={titolo} vista={vista} onVista={setVista} />}
      <PulsantiScarica oggetto={`il grafico ${titolo}`} scaricamenti={[...png, ...scaricamenti]} />
    </>
  );
  return (
    // data-card-grafico: la card con grafico o con il motivo dell'assenza (i test la distinguono da una Sezione omonima)
    <section className="ui-card ui-dissolvenza" aria-labelledby={id} data-card-grafico={disegnabile ? 'grafico' : 'assente'}>
      <TestaCard id={id} titolo={titolo} sottotitolo={sottotitolo} livello={livello} strumenti={strumentiCard} />
      <CorpoCard dati={dati} vista={vista} altezza={altezza} onClic={onClic} onIstanza={onIstanza} tabella={tabella} />
      <VociOmesse omessi={dati.omessi} />
      <p className="ui-fonte">
        <Icona nome="it-info-circle" />
        {fonte}
      </p>
    </section>
  );
}
