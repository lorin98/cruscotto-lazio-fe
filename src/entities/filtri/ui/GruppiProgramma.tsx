// GruppiProgramma — i gruppi del pannello dei filtri sulle dimensioni del programma (UI v2, wireframe panoramica del
// finanziario): interventi con ricerca e caselle (codice e descrizione), OS, OG e OP come chip, azione portante
// disabilitata con la spiegazione finche' manca il legame (OP-002). Prima stavano nel pannello del finanziario; il pannello
// delle superfici del fisico e' "come nel finanziario" (OP-FIS-01), quindi i gruppi sono qui e ogni pannello passa i suoi
// valori (TX-0001 del finanziario, TX-0060 dell'elenco per il fisico) e la sua bozza. Controlli bootstrap-italia nativi
// (details/summary, fieldset/legend, caselle, bottoni con aria-pressed): nessun ARIA complesso; il focus trap e' del
// PannelloLaterale che li contiene. Stesso filtro = valori in alternativa, filtri diversi = insieme.
import { useId, useState } from 'react';
import type { ReactNode } from 'react';
import { filtraRighe } from '../../../shared/lib';
import { ETICHETTE_FILTRO } from '../lib/programma';
import type { ChiaveFiltro, Filtri } from '../lib/programma';

/** Una voce di un filtro: il valore da rimandare e la descrizione, se c'e' (forma di VoceFiltro di TX-0001 e TX-0060). */
interface VoceLike {
  chiave?: string;
  descrizione?: string | null;
}

/** I valori dei gruppi, nella forma comune di FiltriFinanziari (TX-0001) e ValoriFiltriElenco (TX-0060). */
export interface ValoriProgramma {
  interventi?: VoceLike[];
  obiettiviSpecifici?: VoceLike[];
  obiettiviGenerali?: string[];
  obiettiviPolicy?: string[];
  azioniPortanti?: VoceLike[];
  legameAzioniDisponibile?: boolean;
}

interface Opzione {
  valore: string;
  descrizione?: string;
}

const daVoci = (voci: VoceLike[] | undefined): Opzione[] =>
  (voci ?? []).filter((v): v is VoceLike & { chiave: string } => !!v.chiave).map((v) => ({ valore: v.chiave, descrizione: v.descrizione ?? undefined }));
const daTesti = (testi: string[] | undefined): Opzione[] => (testi ?? []).map((t) => ({ valore: t }));

/** Un gruppo del pannello: titolo con il numero di valori scelti, aperto o chiuso. */
export function Gruppo({ titolo, scelti, aperto = false, children }: { titolo: string; scelti: number; aperto?: boolean; children: ReactNode }) {
  return (
    <details className="ui-gruppo-filtro" open={aperto}>
      <summary>
        {titolo}
        {scelti > 0 && <span className="ui-gruppo-filtro__conta">{scelti === 1 ? '1 scelto' : `${scelti} scelti`}</span>}
      </summary>
      <div className="ui-gruppo-filtro__corpo">{children}</div>
    </details>
  );
}

function Caselle({ id, etichetta, opzioni, scelti, disabilitato, onCambia }: { id: string; etichetta: string; opzioni: Opzione[]; scelti: string[]; disabilitato?: boolean; onCambia: (v: string[]) => void }) {
  const [cercato, setCercato] = useState('');
  // stessa ricerca della tabella interattiva: senza distinguere maiuscole e accenti
  const visibili = filtraRighe(opzioni, cercato, (o) => `${o.valore} ${o.descrizione ?? ''}`);
  return (
    <fieldset disabled={disabilitato}>
      <legend className="visually-hidden">{etichetta}</legend>
      {opzioni.length > 8 && (
        <>
          <label className="visually-hidden" htmlFor={`${id}-cerca`}>{`Cerca in ${etichetta}`}</label>
          <input id={`${id}-cerca`} className="ui-campo-cerca" type="search" placeholder="Cerca per codice o descrizione" value={cercato} onChange={(e) => setCercato(e.target.value)} />
        </>
      )}
      <div className="ui-opzioni">
        {visibili.map((o) => (
          <label key={o.valore} className="ui-opzione">
            <input
              type="checkbox"
              checked={scelti.includes(o.valore)}
              onChange={(e) => onCambia(e.target.checked ? [...scelti, o.valore] : scelti.filter((v) => v !== o.valore))}
            />
            <span>
              <span className="ui-opzione__codice">{o.valore}</span> {o.descrizione && <span className="ui-opzione__descr">{o.descrizione}</span>}
            </span>
          </label>
        ))}
        {/* solo dopo una ricerca: una lista vuota senza ricerca la dice chi la compone (senzaVoci), mai come ricerca fallita */}
        {cercato.trim() !== '' && visibili.length === 0 && <p className="small text-muted mb-0">Nessuna voce corrisponde alla ricerca.</p>}
      </div>
    </fieldset>
  );
}

function Chip({ etichetta, opzioni, scelti, onCambia }: { etichetta: string; opzioni: Opzione[]; scelti: string[]; onCambia: (v: string[]) => void }) {
  return (
    <div className="ui-toggle-chips" role="group" aria-label={etichetta}>
      {opzioni.map((o) => {
        const attivo = scelti.includes(o.valore);
        return (
          <button key={o.valore} type="button" className="ui-toggle-chip" aria-pressed={attivo} onClick={() => onCambia(attivo ? scelti.filter((v) => v !== o.valore) : [...scelti, o.valore])}>
            {o.descrizione ? `${o.valore} - ${o.descrizione}` : o.valore}
          </button>
        );
      })}
    </div>
  );
}

/** Il gruppo senza voci (solo se il pannello lo chiede con `senzaVoci`): lo dice in testo, invece di un gruppo vuoto. */
function SenzaVoci({ testo }: { testo: string }) {
  return <p className="ui-nota mb-0">{testo}</p>;
}

/**
 * I cinque gruppi del programma con la nota sulle combinazioni. `senzaVoci`: testo per un gruppo senza voci (es. il fisico
 * senza i valori di TX-0060: obiettivi e azioni non ne hanno); assente, il gruppo resta com'e' nel finanziario.
 */
export function GruppiProgramma({ valori, bozza, imposta, senzaVoci }: { valori: ValoriProgramma; bozza: Filtri; imposta: (k: ChiaveFiltro) => (v: string[]) => void; senzaVoci?: string }) {
  const id = useId();
  const legame = valori.legameAzioniDisponibile === true;
  // senza i valori (fisico senza TX-0060) il legame non si conosce: niente spiegazione sul legame, solo l'assenza delle voci
  const legameIgnoto = senzaVoci !== undefined && valori.legameAzioniDisponibile === undefined;
  const sel = (k: ChiaveFiltro) => bozza[k] ?? [];
  // le etichette estese della lib, le stesse dei chip della barra in forma breve (H-07)
  const nome = (k: ChiaveFiltro) => ETICHETTE_FILTRO[k].estesa;
  const chip = (k: 'og' | 'os' | 'op', opzioni: Opzione[]) =>
    senzaVoci && opzioni.length === 0 ? <SenzaVoci testo={senzaVoci} /> : <Chip etichetta={nome(k)} opzioni={opzioni} scelti={sel(k)} onCambia={imposta(k)} />;
  const azioni = daVoci(valori.azioniPortanti);
  const interventi = daVoci(valori.interventi);
  return (
    <>
      <Gruppo titolo={nome('intervento')} scelti={sel('intervento').length} aperto>
        {/* il fisico senza TX-0060 e senza righe nella risposta: nessun codice da proporre, lo dice (review X4) */}
        {senzaVoci && interventi.length === 0 ? (
          <SenzaVoci testo={senzaVoci} />
        ) : (
          <Caselle id={`${id}-int`} etichetta={nome('intervento')} opzioni={interventi} scelti={sel('intervento')} onCambia={imposta('intervento')} />
        )}
      </Gruppo>
      <Gruppo titolo={nome('og')} scelti={sel('og').length}>
        {chip('og', daTesti(valori.obiettiviGenerali))}
      </Gruppo>
      <Gruppo titolo={nome('os')} scelti={sel('os').length}>
        {chip('os', daVoci(valori.obiettiviSpecifici))}
      </Gruppo>
      <Gruppo titolo={nome('op')} scelti={sel('op').length}>
        {chip('op', daTesti(valori.obiettiviPolicy))}
      </Gruppo>
      <Gruppo titolo={nome('azione')} scelti={sel('azione').length}>
        {!legame && !legameIgnoto && <p className="ui-nota">{"Non disponibile finché nessun intervento è collegato a un'azione portante."}</p>}
        {senzaVoci && azioni.length === 0 && legameIgnoto ? (
          <SenzaVoci testo={senzaVoci} />
        ) : (
          <Caselle id={`${id}-az`} etichetta={nome('azione')} opzioni={azioni} scelti={sel('azione')} disabilitato={!legame} onCambia={imposta('azione')} />
        )}
      </Gruppo>
      <p className="ui-nota">Valori dello stesso filtro in alternativa (O); filtri diversi insieme (E). Nessuna scelta: tutti i valori.</p>
    </>
  );
}
