// AnteprimaProcedurale — i numeri chiave del procedurale nella card dell'area della Home (flusso panoramica approvato,
// home.html, OP-PR-10, decisione dell'utente del 26/10/2026): domande ammesse, contributo ammesso e interventi attivati sul
// perimetro ufficiale (barra) da TX-0026, domande di sostegno da TX-0027 (lib/anteprima), senza filtri: le stesse letture
// in cache della panoramica senza filtri. Ogni gruppo di numeri si legge solo col grant della sua transazione; senza
// nessuno dei due, `altrimenti` (cosa c'e' nell'area). Un errore non ferma la Home: la lettura dice che il dato non e'
// disponibile e l'altra resta. Pezzi del kit (AnteprimaArea) come la card del finanziario; nessun react-aria.
import type { ReactNode } from 'react';
import { useAuthStatus } from '../../../shared/api/auth/use-auth-status';
import { importoBreve, intero } from '../../../shared/lib';
import { AnteprimaArea, AttesaArea, AvanzamentoArea, NotaArea, NumeriArea, NumeroArea } from '../../../shared/ui';
import { useDomandeAmmesse, useStatiSostegno } from '../api';
import { anteprimaAmmesse, domandeDiSostegno, etichetteAnteprima, testoInterventi } from '../lib/anteprima';
import { puoLeggere } from '../lib/grant';

function Ammesse() {
  const { data, isPending, isError } = useDomandeAmmesse({});
  if (isPending) return <AttesaArea />;
  const a = isError || !data ? null : anteprimaAmmesse(data);
  if (!a) return <NotaArea>Domande ammesse e contributo non disponibili in questo momento.</NotaArea>;
  const e = etichetteAnteprima(data?.perimetro);
  const { interventi } = a;
  return (
    <>
      <NumeriArea>
        <NumeroArea etichetta={e.ammesse} valore={a.domandeAmmesse} formato={intero} />
        <NumeroArea etichetta={e.contributo} valore={a.contributo.valore} motivo={a.contributo.motivo} formato={importoBreve} />
      </NumeriArea>
      {interventi.quota !== null ? (
        <AvanzamentoArea etichetta={e.interventi} quota={interventi.quota} testo={testoInterventi(interventi)} />
      ) : (
        <NotaArea>{`${e.interventi}: ${testoInterventi(interventi)}`}</NotaArea>
      )}
    </>
  );
}

function DomandeSostegno() {
  const { data, isPending, isError } = useStatiSostegno({});
  if (isPending) return <AttesaArea />;
  return (
    <NumeriArea>
      <NumeroArea
        etichetta={etichetteAnteprima(data?.perimetro).sostegno}
        valore={isError || !data ? null : domandeDiSostegno(data)}
        formato={intero}
        motivo="Conteggio delle domande di sostegno non disponibile in questo momento."
      />
    </NumeriArea>
  );
}

/** I numeri dell'area per i grant dell'utente; senza nessuno dei due grant, `altrimenti` (cosa c'e' nell'area). */
export function AnteprimaProcedurale({ altrimenti }: { altrimenti: ReactNode }) {
  const auth = useAuthStatus().data;
  const ammesse = puoLeggere(auth, 'ammesse');
  const sostegno = puoLeggere(auth, 'statiSostegno');
  if (!ammesse && !sostegno) return <>{altrimenti}</>;
  return (
    <AnteprimaArea nome="Il procedurale in cifre">
      {ammesse && <Ammesse />}
      {sostegno && <DomandeSostegno />}
    </AnteprimaArea>
  );
}
