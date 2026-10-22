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
import type { ChiaveFiltro, Filtri, ValoriProgramma, VoceLike } from '../lib/programma';

const daVoci = (voci: VoceLike[] | undefined): OpzioneFiltro[] =>
  (voci ?? []).filter((v): v is VoceLike & { chiave: string } => !!v.chiave).map((v) => ({ valore: v.chiave, descrizione: v.descrizione ?? undefined }));
const daTesti = (testi: string[] | undefined): OpzioneFiltro[] => (testi ?? []).map((t) => ({ valore: t }));

const SEGNAPOSTO = 'Cerca per codice o descrizione';

/** Il gruppo senza voci (solo se il pannello lo chiede con `senzaVoci`): lo dice in testo, invece di un gruppo vuoto. */
function SenzaVoci({ testo }: { testo: string }) {
  return <p className="ui-nota mb-0">{testo}</p>;
}

/** Cosa serve a ogni gruppo: la bozza, il suo cambio e il testo di un gruppo senza voci (se il pannello lo chiede). */
interface PropsGruppo {
  id: string;
  scelti: string[];
  onCambia: (v: string[]) => void;
  senzaVoci?: string;
}

// le etichette estese della lib, le stesse dei chip della barra in forma breve (H-07)
const nome = (k: ChiaveFiltro) => ETICHETTE_FILTRO[k].estesa;

/** Intervento a caselle; il fisico senza TX-0060 e senza righe nella risposta non ha codici da proporre e lo dice (X4). */
function GruppoIntervento({ id, scelti, onCambia, senzaVoci, opzioni }: PropsGruppo & { opzioni: OpzioneFiltro[] }) {
  return (
    <Gruppo titolo={nome('intervento')} scelti={scelti.length} aperto>
      {senzaVoci && opzioni.length === 0 ? (
        <SenzaVoci testo={senzaVoci} />
      ) : (
        <Caselle id={`${id}-int`} etichetta={nome('intervento')} opzioni={opzioni} scelti={scelti} segnaposto={SEGNAPOSTO} onCambia={onCambia} />
      )}
    </Gruppo>
  );
}

/** Un obiettivo (OG, OS, OP) a chip; senza voci, col testo di senzaVoci se c'e'. */
function GruppoObiettivo({ chiave, scelti, onCambia, senzaVoci, opzioni }: Omit<PropsGruppo, 'id'> & { chiave: 'og' | 'os' | 'op'; opzioni: OpzioneFiltro[] }) {
  return (
    <Gruppo titolo={nome(chiave)} scelti={scelti.length}>
      {senzaVoci && opzioni.length === 0 ? <SenzaVoci testo={senzaVoci} /> : <Scelte etichetta={nome(chiave)} opzioni={opzioni} scelti={scelti} onCambia={onCambia} />}
    </Gruppo>
  );
}

/**
 * Azione portante: disabilitata con la spiegazione finche' manca il legame (OP-002); senza i valori (fisico senza TX-0060)
 * il legame non si conosce: niente spiegazione sul legame, solo l'assenza delle voci.
 */
function GruppoAzione({ id, scelti, onCambia, senzaVoci, valori }: PropsGruppo & { valori: ValoriProgramma }) {
  const legame = valori.legameAzioniDisponibile === true;
  const legameIgnoto = senzaVoci !== undefined && valori.legameAzioniDisponibile === undefined;
  const opzioni = daVoci(valori.azioniPortanti);
  return (
    <Gruppo titolo={nome('azione')} scelti={scelti.length}>
      {!legame && !legameIgnoto && <p className="ui-nota">{"Non disponibile finché nessun intervento è collegato a un'azione portante."}</p>}
      {senzaVoci && opzioni.length === 0 && legameIgnoto ? (
        <SenzaVoci testo={senzaVoci} />
      ) : (
        <Caselle id={`${id}-az`} etichetta={nome('azione')} opzioni={opzioni} scelti={scelti} disabilitato={!legame} segnaposto={SEGNAPOSTO} onCambia={onCambia} />
      )}
    </Gruppo>
  );
}

/**
 * I cinque gruppi del programma con la nota sulle combinazioni. `senzaVoci`: testo per un gruppo senza voci (es. il fisico
 * senza i valori di TX-0060: obiettivi e azioni non ne hanno); assente, il gruppo resta com'e' nel finanziario.
 */
export function GruppiProgramma({ valori, bozza, imposta, senzaVoci }: { valori: ValoriProgramma; bozza: Filtri; imposta: (k: ChiaveFiltro) => (v: string[]) => void; senzaVoci?: string }) {
  const id = useId();
  const di = (k: ChiaveFiltro) => ({ scelti: bozza[k] ?? [], onCambia: imposta(k), senzaVoci });
  return (
    <>
      <GruppoIntervento id={id} {...di('intervento')} opzioni={daVoci(valori.interventi)} />
      <GruppoObiettivo chiave="og" {...di('og')} opzioni={daTesti(valori.obiettiviGenerali)} />
      <GruppoObiettivo chiave="os" {...di('os')} opzioni={daVoci(valori.obiettiviSpecifici)} />
      <GruppoObiettivo chiave="op" {...di('op')} opzioni={daTesti(valori.obiettiviPolicy)} />
      <GruppoAzione id={id} {...di('azione')} valori={valori} />
      <p className="ui-nota">Valori dello stesso filtro in alternativa (O); filtri diversi insieme (E). Nessuna scelta: tutti i valori.</p>
    </>
  );
}
