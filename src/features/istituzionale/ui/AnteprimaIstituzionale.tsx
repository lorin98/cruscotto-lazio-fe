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
import type { ColonnaConfronto } from '../../../shared/ui';
import { useVerificaSmpNonSigc, useVerificaSmpSigc } from '../api';
import type { VerificaSmp, VerificaSmpNonSigc } from '../api';
import { QUOTA_NON_SIGC, SENZA_DATO_NON_SIGC, anteprimaVerifica, anteprimaVerificaSigc, celleNonSigc, celleSigc, intestazioneNonSigc, intestazioneSigc, notaRiferimenti, righeCard } from '../lib/anteprima';
import type { AnteprimaVerifica } from '../lib/anteprima';
import { criteriVerificaSenzaFiltri, esercizioUltimoChiuso, filtriVerificaSigcSenzaFiltri } from '../lib/criteri';
import { puoLeggere } from '../lib/grant';
import { periodoDellaRisposta } from '../lib/verificaSigc';

/** La quota della spesa non SIGC sul valore finanziato: barra, oppure il motivo per cui manca. */
function Quota({ a }: { a: AnteprimaVerifica }) {
  return a.quotaSpesa.valore !== null ? <AvanzamentoArea etichetta={QUOTA_NON_SIGC} percentuale={a.quotaSpesa.valore} /> : <NotaArea>{`${QUOTA_NON_SIGC}: ${a.quotaSpesa.motivo}`}</NotaArea>;
}

/** Lo stato di una lettura che serve a una colonna: la risposta, se c'e', e se la lettura e' fallita. */
interface Lettura<T> {
  data?: T;
  isError: boolean;
}

/** La risposta da mostrare: nessuna se la lettura e' fallita, anche con un dato vecchio in cache (come la card di prima). */
function risposta<T>({ data, isError }: Lettura<T>): T | undefined {
  return isError ? undefined : data;
}

/** Le celle di una colonna dalla sua lettura: i valori, null se e' fallita, undefined mentre legge. */
function celleDellaLettura<T>(lettura: Lettura<T>, celle: (d: T) => ColonnaConfronto['celle']): ColonnaConfronto['celle'] {
  if (lettura.isError) return null;
  return lettura.data ? celle(lettura.data) : undefined;
}

function colonnaNonSigc(lettura: Lettura<VerificaSmpNonSigc>): ColonnaConfronto {
  return { chiave: 'non-sigc', ...intestazioneNonSigc(risposta(lettura)?.perimetro), celle: celleDellaLettura(lettura, (d) => celleNonSigc(anteprimaVerifica(d))), senzaDato: SENZA_DATO_NON_SIGC };
}

/** La colonna SIGC: l'esercizio dell'intestazione e' quello della risposta, prima della risposta quello chiesto. */
function colonnaSigc(lettura: Lettura<VerificaSmp>, esercizio: number): ColonnaConfronto {
  const d = risposta(lettura);
  const p = d && periodoDellaRisposta(d, esercizio);
  return { chiave: 'sigc', ...intestazioneSigc(p?.esercizio ?? esercizio, d?.perimetro), celle: celleDellaLettura(lettura, (r) => celleSigc(anteprimaVerificaSigc(r))) };
}

/** La frase di una lettura fallita, sotto la tabella (una lettura non abilitata non fallisce mai). */
function ErroreDellaLettura({ lettura, children }: { lettura: Lettura<unknown>; children: string }) {
  return lettura.isError ? <NotaArea>{children}</NotaArea> : null;
}

/** Le due letture e la tabella a confronto, con le sole colonne dei grant dell'utente. */
function Confronto({ conVerifica, conSigc }: { conVerifica: boolean; conSigc: boolean }) {
  const esercizio = esercizioUltimoChiuso(new Date());
  const nonSigc = useVerificaSmpNonSigc(criteriVerificaSenzaFiltri(), { abilitato: conVerifica });
  const sigc = useVerificaSmpSigc(filtriVerificaSigcSenzaFiltri(), esercizio, { abilitato: conSigc });
  const colonne = [...(conVerifica ? [colonnaNonSigc(nonSigc)] : []), ...(conSigc ? [colonnaSigc(sigc, esercizio)] : [])];
  const nonSigcLetta = risposta(nonSigc);
  const sigcLetta = risposta(sigc);
  const nota = notaRiferimenti(nonSigcLetta, sigcLetta && periodoDellaRisposta(sigcLetta, esercizio));
  return (
    <>
      <ConfrontoArea titolo="L'istituzionale in cifre: verifica SMP non SIGC e SIGC" righe={righeCard(conSigc)} colonne={colonne} />
      <ErroreDellaLettura lettura={nonSigc}>Dati della verifica SMP non SIGC non disponibili in questo momento.</ErroreDellaLettura>
      <ErroreDellaLettura lettura={sigc}>Dati della verifica SMP SIGC non disponibili in questo momento.</ErroreDellaLettura>
      {nonSigcLetta && <Quota a={anteprimaVerifica(nonSigcLetta)} />}
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
