// AnteprimaIstituzionale — i numeri chiave dell'istituzionale nella card dell'area della Home (flusso verifica-smp-non-sigc
// approvato, home.html, OP-IS-11; decisione dell'utente del 26/10/2026, rework 1 della card del 30/10/2026 e rework 2 del
// 31/10/2026). Una tabella a confronto (kit ConfrontoArea): righe domande ricevute, finanziate, pagate e spesa pubblica
// erogata, una colonna per verifica, ognuna col grant della sua transazione, che legge e fallisce in modo indipendente
// (scheletro nelle sue celle, "non disponibile" e frase d'errore sotto la tabella):
// - non SIGC (csr.tx-0016.read): domande ricevute, domande finanziate e spesa pubblica erogata, totali della verifica SMP
//   non SIGC (lib/anteprima), valori cumulativi (D3), dalla lettura di TX-0016 coi criteri della pagina aperta senza
//   filtri ne' anno (stessa cache, a lettura finita, D2); niente domande pagate (un trattino). Sotto la tabella la quota
//   della spesa sul valore delle domande finanziate (barra);
// - SIGC (csr.tx-0015.read): domande ricevute e finanziate (domande dell'anno n-1), domande pagate e spesa pubblica
//   erogata nell'esercizio (campagna precedente + campagne anteriori), da TX-0015 senza filtri con l'ultimo esercizio
//   chiuso (dal 16/10 di un anno quello dell'anno, prima quello precedente, nel calendario italiano qualunque sia il fuso
//   del browser: decisione D3; la stessa lettura della pagina Verifica SMP SIGC aperta con quell'esercizio); nessuna quota.
// In fondo la nota dei riferimenti (anno dell'ultimo file, periodo dell'esercizio). Nessuna lettura di TX-0017 (output
// regionale, del fisico dal 29/10/2026). Senza nessuno dei due grant, `altrimenti` (cosa c'e' nell'area). Un errore non
// ferma la Home: la card resta l'ingresso all'area e dice che il dato non e' disponibile. Pezzi del kit (AnteprimaArea)
// come la card del finanziario.
import type { ReactNode } from 'react';
import { useAuthStatus } from '../../../shared/api/auth/use-auth-status';
import { AnteprimaArea, AvanzamentoArea, ConfrontoArea, NotaArea } from '../../../shared/ui';
import type { CellaConfronto, ColonnaConfronto, StatoColonnaConfronto } from '../../../shared/ui';
import { useVerificaSmpNonSigc, useVerificaSmpSigc } from '../api';
import { QUOTA_NON_SIGC, SENZA_DATO_NON_SIGC, anteprimaVerifica, anteprimaVerificaSigc, celleNonSigc, celleSigc, intestazioneNonSigc, intestazioneSigc, notaRiferimenti, righeCard, titoloTabella } from '../lib/anteprima';
import type { AnteprimaVerifica, AnteprimaVerificaSigc } from '../lib/anteprima';
import { criteriVerificaSenzaFiltri, esercizioUltimoChiuso, filtriVerificaSigcSenzaFiltri } from '../lib/criteri';
import { puoLeggere } from '../lib/grant';
import { periodoDellaRisposta } from '../lib/verificaSigc';
import type { PeriodoSigc } from '../lib/verificaSigc';

/** La quota della spesa non SIGC sul valore finanziato: barra, oppure il motivo per cui manca. */
function Quota({ a }: { a: AnteprimaVerifica }) {
  return a.quotaSpesa.valore !== null ? <AvanzamentoArea etichetta={QUOTA_NON_SIGC} percentuale={a.quotaSpesa.valore} /> : <NotaArea>{`${QUOTA_NON_SIGC}: ${a.quotaSpesa.motivo}`}</NotaArea>;
}

/** Lo stato di una lettura che serve a una colonna: la risposta, se c'e', e se la lettura e' fallita. */
interface Lettura<T> {
  data?: T;
  isError: boolean;
}

/** Una lettura ricavata una volta sola (review H-03): in attesa, fallita o pronta coi suoi dati. */
type Stato<T> = { stato: 'attesa' } | { stato: 'errore' } | { stato: 'pronta'; dati: T };

/**
 * Lo stato di una lettura, solo col grant della sua colonna: senza il grant nessuna colonna e nessuna parte derivata (barra,
 * nota, frase d'errore), anche con una risposta in cache (review A-02). L'errore vince sul dato in cache, come la card di
 * prima e quella del finanziario.
 */
function statoDi<D, T>(conGrant: boolean, { data, isError }: Lettura<D>, ricava: (d: D) => T): Stato<T> | undefined {
  if (!conGrant) return undefined;
  if (isError) return { stato: 'errore' };
  return data ? { stato: 'pronta', dati: ricava(data) } : { stato: 'attesa' };
}

const datiDi = <T,>(s: Stato<T> | undefined): T | undefined => (s?.stato === 'pronta' ? s.dati : undefined);

/** Lo stato della colonna del kit dallo stato della lettura, con le celle ricavate dai dati. */
function statoColonna<T>(s: Stato<T>, celle: (d: T) => Readonly<Partial<Record<string, CellaConfronto>>>): StatoColonnaConfronto {
  return s.stato === 'pronta' ? { stato: 'pronta', celle: celle(s.dati) } : { stato: s.stato };
}

interface DatiNonSigc {
  a: AnteprimaVerifica;
  annoRiferimento: number | null;
  perimetro?: string | null;
}

interface DatiSigc {
  a: AnteprimaVerificaSigc;
  periodo: PeriodoSigc;
  perimetro?: string | null;
}

function colonnaNonSigc(s: Stato<DatiNonSigc>): ColonnaConfronto {
  return { chiave: 'non-sigc', ...intestazioneNonSigc(datiDi(s)?.perimetro), ...statoColonna(s, (d) => celleNonSigc(d.a)), senzaDato: SENZA_DATO_NON_SIGC };
}

/** La colonna SIGC: l'esercizio dell'intestazione e' quello della risposta, prima della risposta quello chiesto. */
function colonnaSigc(s: Stato<DatiSigc>, esercizio: number): ColonnaConfronto {
  const d = datiDi(s);
  return { chiave: 'sigc', ...intestazioneSigc(d?.periodo.esercizio ?? esercizio, d?.perimetro), ...statoColonna(s, (x) => celleSigc(x.a)) };
}

/** Le due letture e la tabella a confronto, con le sole colonne dei grant dell'utente. */
function Confronto({ conVerifica, conSigc }: { conVerifica: boolean; conSigc: boolean }) {
  const esercizio = esercizioUltimoChiuso(new Date());
  const nonSigc = statoDi(conVerifica, useVerificaSmpNonSigc(criteriVerificaSenzaFiltri(), { abilitato: conVerifica }), (d) => ({ a: anteprimaVerifica(d), annoRiferimento: d.annoRiferimento, perimetro: d.perimetro }));
  const sigc = statoDi(conSigc, useVerificaSmpSigc(filtriVerificaSigcSenzaFiltri(), esercizio, { abilitato: conSigc }), (d) => ({ a: anteprimaVerificaSigc(d), periodo: periodoDellaRisposta(d, esercizio), perimetro: d.perimetro }));
  const colonne = [...(nonSigc ? [colonnaNonSigc(nonSigc)] : []), ...(sigc ? [colonnaSigc(sigc, esercizio)] : [])];
  const datiNonSigc = datiDi(nonSigc);
  const nota = notaRiferimenti(datiNonSigc, datiDi(sigc)?.periodo);
  return (
    <>
      <ConfrontoArea titolo={titoloTabella(conVerifica, conSigc)} righe={righeCard(conSigc)} colonne={colonne} />
      {nonSigc?.stato === 'errore' && <NotaArea>Dati della verifica SMP non SIGC non disponibili in questo momento.</NotaArea>}
      {sigc?.stato === 'errore' && <NotaArea>Dati della verifica SMP SIGC non disponibili in questo momento.</NotaArea>}
      {datiNonSigc && <Quota a={datiNonSigc.a} />}
      {nota && <NotaArea>{nota}</NotaArea>}
    </>
  );
}

/** I numeri dell'area per i grant dell'utente; senza nessuno dei due grant, `altrimenti` (cosa c'e' nell'area). */
export function AnteprimaIstituzionale({ altrimenti }: { altrimenti: ReactNode }) {
  const auth = useAuthStatus().data;
  const conVerifica = puoLeggere(auth, 'verifica');
  const conSigc = puoLeggere(auth, 'verificaSigc');
  if (!conVerifica && !conSigc) return <>{altrimenti}</>;
  return (
    <AnteprimaArea nome="L'istituzionale in cifre">
      <Confronto conVerifica={conVerifica} conSigc={conSigc} />
    </AnteprimaArea>
  );
}
