// AnteprimaIstituzionale — i numeri chiave dell'istituzionale nella card dell'area della Home (flusso verifica-smp-non-sigc
// approvato, home.html, OP-IS-11, decisione dell'utente del 26/10/2026): domande finanziate, spesa pubblica erogata, quota
// della spesa sul valore delle domande finanziate (barra) e domande ricevute, totali della verifica SMP non SIGC (lib/
// anteprima) con l'anno di riferimento del file, dalla lettura di TX-0016 senza filtri e senza anno, la stessa della pagina
// aperta senza filtri (in cache). Nessuna lettura di TX-0017: l'output non si somma fra interventi (OP-IS-06). Solo col
// grant di TX-0016; senza, `altrimenti` (cosa c'e' nell'area). Un errore non ferma la Home: la card resta l'ingresso
// all'area e dice che il dato non e' disponibile. Pezzi del kit (AnteprimaArea) come la card del finanziario.
import type { ReactNode } from 'react';
import { useAuthStatus } from '../../../shared/api/auth/use-auth-status';
import { importoBreve, intero } from '../../../shared/lib';
import { AnteprimaArea, AttesaArea, AvanzamentoArea, NotaArea, NumeriArea, NumeroArea, RiferimentoArea } from '../../../shared/ui';
import { useVerificaSmpNonSigc } from '../api';
import { anteprimaVerifica, etichetteAnteprima, riferimentoAnteprima } from '../lib/anteprima';
import { puoLeggere } from '../lib/grant';

function Verifica() {
  const { data, isPending, isError } = useVerificaSmpNonSigc({});
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
      {a.quotaSpesa.valore !== null ? <AvanzamentoArea etichetta={e.quota} quota={a.quotaSpesa.valore} /> : <NotaArea>{`${e.quota}: ${a.quotaSpesa.motivo}`}</NotaArea>}
      <NumeriArea>
        <NumeroArea etichetta={e.ricevute} valore={a.domandeRicevute} formato={intero} />
      </NumeriArea>
    </>
  );
}

/** I numeri dell'area col grant di TX-0016; senza, `altrimenti` (cosa c'e' nell'area). */
export function AnteprimaIstituzionale({ altrimenti }: { altrimenti: ReactNode }) {
  const auth = useAuthStatus().data;
  if (!puoLeggere(auth, 'verifica')) return <>{altrimenti}</>;
  return (
    <AnteprimaArea nome="L'istituzionale in cifre">
      <Verifica />
    </AnteprimaArea>
  );
}
