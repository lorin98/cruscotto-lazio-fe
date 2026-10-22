// GruppiProgramma — i gruppi del pannello dei filtri sulle dimensioni del programma (UI v2, wireframe panoramica del
// finanziario): interventi con ricerca e caselle (codice e descrizione), OS, OG e OP come chip, azione portante
// disabilitata con la spiegazione finche' manca il legame (OP-002). Prima stavano nel pannello del finanziario; il pannello
// delle superfici del fisico e' "come nel finanziario" (OP-FIS-01), quindi i gruppi sono qui e ogni pannello passa i suoi
// valori (TX-0001 del finanziario, TX-0060 dell'elenco per il fisico) e la sua bozza. I controlli (gruppo, caselle, chip)
// sono quelli del kit (shared/ui, review del fisico H1); il focus trap e' del PannelloLaterale che li contiene. Stesso
// filtro = valori in alternativa, filtri diversi = insieme.
import { useId } from 'react';
import { Caselle, Gruppo, Scelte } from '../../../shared/ui';
import type { OpzioneFiltro } from '../../../shared/ui';
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

const daVoci = (voci: VoceLike[] | undefined): OpzioneFiltro[] =>
  (voci ?? []).filter((v): v is VoceLike & { chiave: string } => !!v.chiave).map((v) => ({ valore: v.chiave, descrizione: v.descrizione ?? undefined }));
const daTesti = (testi: string[] | undefined): OpzioneFiltro[] => (testi ?? []).map((t) => ({ valore: t }));

const SEGNAPOSTO = 'Cerca per codice o descrizione';

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
  const chip = (k: 'og' | 'os' | 'op', opzioni: OpzioneFiltro[]) =>
    senzaVoci && opzioni.length === 0 ? <SenzaVoci testo={senzaVoci} /> : <Scelte etichetta={nome(k)} opzioni={opzioni} scelti={sel(k)} onCambia={imposta(k)} />;
  const azioni = daVoci(valori.azioniPortanti);
  const interventi = daVoci(valori.interventi);
  return (
    <>
      <Gruppo titolo={nome('intervento')} scelti={sel('intervento').length} aperto>
        {/* il fisico senza TX-0060 e senza righe nella risposta: nessun codice da proporre, lo dice (review X4) */}
        {senzaVoci && interventi.length === 0 ? (
          <SenzaVoci testo={senzaVoci} />
        ) : (
          <Caselle id={`${id}-int`} etichetta={nome('intervento')} opzioni={interventi} scelti={sel('intervento')} segnaposto={SEGNAPOSTO} onCambia={imposta('intervento')} />
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
          <Caselle id={`${id}-az`} etichetta={nome('azione')} opzioni={azioni} scelti={sel('azione')} disabilitato={!legame} segnaposto={SEGNAPOSTO} onCambia={imposta('azione')} />
        )}
      </Gruppo>
      <p className="ui-nota">Valori dello stesso filtro in alternativa (O); filtri diversi insieme (E). Nessuna scelta: tutti i valori.</p>
    </>
  );
}
