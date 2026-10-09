// msw-armed.test.ts — GARANZIA RUNTIME (H7) che MSW sia ARMATO nel processo di test.
//
// Con onUnhandledRequest:'error' (impostato dal setup globale src/shared/test/setup.ts) una richiesta NON mockata
// viene RIFIUTATA DALL'INTERCEPTOR e non raggiunge la rete reale (dati PA di cittadini). Se il setup fosse disarmato
// a 'bypass'/'warn', la stessa richiesta USCIREBBE in rete e fallirebbe con un errore di RETE ("fetch failed"),
// NON con l'errore di MSW: il match sulla firma MSW fallirebbe e questo test diventerebbe ROSSO.
//
// E' la GARANZIA FORTE complementare allo smoke-check STATICO local/msw-listen-safety (eslint-local/rules/
// msw-listen-safety.js), che ispeziona la sola FORMA del literal al call-site: qui si prova il COMPORTAMENTO a
// runtime, indipendente dalla forma sintattica con cui listen() e' invocato.
import { expect, test } from 'vitest';

test("MSW armato: una richiesta non mockata e' rifiutata dall'interceptor, non esce in rete (H7)", async () => {
  // host .invalid (RFC 2606: mai risolvibile) => nessuna dipendenza da rete esterna.
  //  - armato 'error'  : MSW rigetta PRIMA della rete col proprio errore ([MSW] ... "error" strategy).
  //  - disarmato bypass: la richiesta esce in rete e fallisce con "fetch failed" (errore di RETE) => il match sulla
  //    firma MSW fallisce => test rosso (segnale di disarmo). Verificato confirm-by-run su vitest+jsdom.
  await expect(fetch('http://msw-armed-probe.invalid/never-mocked')).rejects.toThrow(
    /\[MSW\]|Cannot bypass|error.{0,24}strateg/i,
  );
});
