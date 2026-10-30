// AnteprimaIstituzionale — i numeri chiave dell'istituzionale nella card dell'area della Home (flusso verifica-smp-non-sigc
// approvato, home.html, OP-IS-11; decisione dell'utente del 26/10/2026 e rework 1 della card del 30/10/2026). Due blocchi,
// ognuno col grant della sua transazione, che leggono e falliscono in modo indipendente (scheletro e frase d'errore per
// blocco):
// - non SIGC (csr.tx-0016.read): domande finanziate, spesa pubblica erogata, quota della spesa sul valore delle domande
//   finanziate (barra) e domande ricevute, totali della verifica SMP non SIGC (lib/anteprima) con l'anno dell'ultimo file
//   (valori cumulativi, D3), dalla lettura di TX-0016 coi criteri della pagina aperta senza filtri ne' anno (stessa cache,
//   a lettura finita, D2);
// - SIGC (csr.tx-0015.read), in un gruppo col nome dell'esercizio: domande finanziate, spesa pubblica erogata
//   nell'esercizio (campagna precedente + campagne anteriori), domande pagate nell'esercizio, domande ricevute, da TX-0015
//   senza filtri con l'ultimo esercizio chiuso (dal 16/10 di un anno quello dell'anno, prima quello precedente, nel
//   calendario italiano qualunque sia il fuso del browser: decisione D3; la stessa lettura della pagina Verifica SMP SIGC
//   aperta con quell'esercizio); nessuna quota.
// Nessuna lettura di TX-0017 (output regionale, del fisico dal 29/10/2026). Senza nessuno dei due grant, `altrimenti` (cosa
// c'e' nell'area). Un errore non ferma la Home: la card resta l'ingresso all'area e dice che il dato non e' disponibile.
// Pezzi del kit (AnteprimaArea) come la card del finanziario.
import type { ReactNode } from 'react';
import { useAuthStatus } from '../../../shared/api/auth/use-auth-status';
import { importoBreve, intero } from '../../../shared/lib';
import { AnteprimaArea, AttesaArea, AvanzamentoArea, NotaArea, NumeriArea, NumeroArea, RiferimentoArea } from '../../../shared/ui';
import { useVerificaSmpNonSigc, useVerificaSmpSigc } from '../api';
import type { VerificaSmp } from '../api';
import { anteprimaVerifica, anteprimaVerificaSigc, etichetteAnteprima, etichetteAnteprimaSigc, nomeGruppoSigc, riferimentoAnteprima, riferimentoAnteprimaSigc } from '../lib/anteprima';
import { criteriVerificaSenzaFiltri, esercizioUltimoChiuso, filtriVerificaSigcSenzaFiltri } from '../lib/criteri';
import { puoLeggere } from '../lib/grant';
import { periodoDellaRisposta } from '../lib/verificaSigc';

function Verifica() {
  const { data, isPending, isError } = useVerificaSmpNonSigc(criteriVerificaSenzaFiltri());
  if (isPending) return <AttesaArea />;
  if (isError || !data) return <NotaArea>Dati della verifica SMP non SIGC non disponibili in questo momento.</NotaArea>;
  const a = anteprimaVerifica(data);
  const e = etichetteAnteprima(data.perimetro);
  return (
    <>
      <RiferimentoArea>{riferimentoAnteprima(data.annoRiferimento)}</RiferimentoArea>
      <NumeriArea>
        <NumeroArea etichetta={e.finanziate} valore={a.domandeFinanziate} formato={intero} />
        <NumeroArea etichetta={e.spesa} valore={a.spesaErogata.valore} motivo={a.spesaErogata.motivo} formato={importoBreve} />
      </NumeriArea>
      {a.quotaSpesa.valore !== null ? <AvanzamentoArea etichetta={e.quota} percentuale={a.quotaSpesa.valore} /> : <NotaArea>{`${e.quota}: ${a.quotaSpesa.motivo}`}</NotaArea>}
      <NumeriArea>
        <NumeroArea etichetta={e.ricevute} valore={a.domandeRicevute} formato={intero} />
      </NumeriArea>
    </>
  );
}

/** I numeri del blocco SIGC dalla risposta: riferimento con esercizio e periodo, quattro totali, nessuna quota. */
function NumeriSigc({ d, esercizio }: { d: VerificaSmp; esercizio: number }) {
  const a = anteprimaVerificaSigc(d);
  const e = etichetteAnteprimaSigc(d.perimetro);
  const p = periodoDellaRisposta(d, esercizio);
  return (
    <>
      <RiferimentoArea>{riferimentoAnteprimaSigc(p.esercizio, p.annoDomande)}</RiferimentoArea>
      <NumeriArea>
        <NumeroArea etichetta={e.finanziate} valore={a.domandeFinanziate.valore} motivo={a.domandeFinanziate.motivo} formato={intero} />
        <NumeroArea etichetta={e.spesa} valore={a.spesaErogata.valore} motivo={a.spesaErogata.motivo} formato={importoBreve} />
        <NumeroArea etichetta={e.pagate} valore={a.domandePagate.valore} motivo={a.domandePagate.motivo} formato={intero} />
        <NumeroArea etichetta={e.ricevute} valore={a.domandeRicevute.valore} motivo={a.domandeRicevute.motivo} formato={intero} />
      </NumeriArea>
    </>
  );
}

function VerificaSigc() {
  const esercizio = esercizioUltimoChiuso(new Date());
  const { data, isPending, isError } = useVerificaSmpSigc(filtriVerificaSigcSenzaFiltri(), esercizio);
  return (
    <AnteprimaArea nome={nomeGruppoSigc(esercizio)}>
      {isPending ? <AttesaArea /> : isError || !data ? <NotaArea>Dati della verifica SMP SIGC non disponibili in questo momento.</NotaArea> : <NumeriSigc d={data} esercizio={esercizio} />}
    </AnteprimaArea>
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
      {conVerifica && <Verifica />}
      {conSigc && <VerificaSigc />}
    </AnteprimaArea>
  );
}
