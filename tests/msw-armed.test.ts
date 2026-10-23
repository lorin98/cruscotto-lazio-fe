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
import { handlers } from '../src/shared/api/mock/handlers';

test("MSW armato: una richiesta non mockata e' rifiutata dall'interceptor, non esce in rete (H7)", async () => {
  // host .invalid (RFC 2606: mai risolvibile) => nessuna dipendenza da rete esterna.
  //  - armato 'error'  : MSW rigetta PRIMA della rete col proprio errore ([MSW] ... "error" strategy).
  //  - disarmato bypass: la richiesta esce in rete e fallisce con "fetch failed" (errore di RETE) => il match sulla
  //    firma MSW fallisce => test rosso (segnale di disarmo). Verificato confirm-by-run su vitest+jsdom.
  await expect(fetch('http://msw-armed-probe.invalid/never-mocked')).rejects.toThrow(
    /\[MSW\]|Cannot bypass|error.{0,24}strateg/i,
  );
});

// review v2 H-06 (canarino del fail-closed dei test dell'elenco, H-16): i mock generati dell'elenco operativo ci sono
// nel worker di sviluppo ma non nel server dei test. Se l'esclusione per percorso smettesse di funzionare (forma del path
// degli handler cambiata), una lettura dell'elenco non dichiarata riceverebbe dati inventati: qui sarebbe rossa.
test("MSW dei test: una lettura dell'elenco operativo non dichiarata dal test e' rifiutata (H-16)", async () => {
  expect(handlers.some((h) => JSON.stringify(h.info).includes('/api/elenco-operativo'))).toBe(true);
  for (const percorso of ['/api/elenco-operativo/domande', '/api/elenco-operativo/domande/sinottico', '/api/elenco-operativo/pagamenti', '/api/elenco-operativo/filtri']) {
    await expect(fetch(`http://localhost${percorso}`), percorso).rejects.toThrow(/\[MSW\]|Cannot bypass|error.{0,24}strateg/i);
  }
});

// lo stesso canarino per i mock generati dell'istituzionale (step3 della feature): esclusi dal server dei test
test("MSW dei test: una lettura dell'istituzionale non dichiarata dal test e' rifiutata (H-16)", async () => {
  expect(handlers.some((h) => JSON.stringify(h.info).includes('/api/istituzionale'))).toBe(true);
  for (const percorso of ['/api/istituzionale/verifica-smp-non-sigc', '/api/istituzionale/output-regionale', '/api/istituzionale/output-regionale/csv']) {
    await expect(fetch(`http://localhost${percorso}`), percorso).rejects.toThrow(/\[MSW\]|Cannot bypass|error.{0,24}strateg/i);
  }
});

// lo stesso canarino per i mock generati del procedurale (step3 della feature): esclusi dal server dei test
test("MSW dei test: una lettura del procedurale non dichiarata dal test e' rifiutata (H-16)", async () => {
  expect(handlers.some((h) => JSON.stringify(h.info).includes('/api/procedurale'))).toBe(true);
  for (const percorso of ['/api/procedurale/filtri', '/api/procedurale/domande-ammesse', '/api/procedurale/stati-sostegno', '/api/procedurale/riepilogo/xlsx']) {
    await expect(fetch(`http://localhost${percorso}`), percorso).rejects.toThrow(/\[MSW\]|Cannot bypass|error.{0,24}strateg/i);
  }
});
