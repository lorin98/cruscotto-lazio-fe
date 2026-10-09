// esempio.ts — dati DI ESEMPIO del finanziario per il dev server con MSW (npm run dev): valori INVENTATI e
// deterministici, nella forma dei DTO della spec e con le stesse assenze dei dati reali (impegni, stanziato, quote Stato
// e Regione, vincolo LEADER da fonte non attiva). Rispettano i filtri intervento/og/os/op, cosi' panoramica, dettaglio e
// pannello dei filtri si provano davvero. Solo il worker del browser li usa: i test hanno le loro fixture.
// Stanno nella feature (review v2 H-20): il worker di shared/api/mock/browser.ts li raccoglie per convenzione di percorso
// (features/<slice>/api/mock/esempio.ts, export handlersEsempio).
import { http, HttpResponse } from 'msw';
import type { RequestHandler } from 'msw';

function generatore(seme: number) {
  return () => {
    seme = (seme + 0x6d2b79f5) | 0;
    let t = Math.imul(seme ^ (seme >>> 15), 1 | seme);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const caso = generatore(2023);
const ANNI = [2023, 2024, 2025];
const euro = (v: number | null, motivo: string | null = null, fonte: string | null = null) => ({ valore: v, motivo: v === null ? motivo : null, fonte: v === null ? fonte : null });
const fna = (fonte: string) => euro(null, 'FONTE_NON_ATTIVA', fonte);
const nv = () => euro(null, 'NON_VALORIZZATO');
const tondo = (v: number) => Math.round(v * 100) / 100;

const BASE: Array<[string, string, string, string, string, number]> = [
  ['SRA01', 'Produzione integrata (esempio)', 'OG2', 'OS4', 'OP2', 18.4],
  ['SRA03', 'Tecniche di lavorazione ridotta dei suoli (esempio)', 'OG2', 'OS5', 'OP2', 9.7],
  ['SRA14', "Allevatori custodi dell'agrobiodiversità (esempio)", 'OG2', 'OS6', 'OP2', 4.2],
  ['SRA29', 'Agricoltura biologica (esempio)', 'OG2', 'OS6', 'OP2', 42.5],
  ['SRB01', 'Zone con svantaggi naturali di montagna (esempio)', 'OG1', 'OS1', 'OP1', 31.8],
  ['SRD01', 'Investimenti produttivi agricoli (esempio)', 'OG1', 'OS2', 'OP1', 64.3],
  ['SRD02', 'Investimenti per ambiente e clima (esempio)', 'OG2', 'OS4', 'OP2', 22.1],
  ['SRD04', 'Investimenti non produttivi agricoli (esempio)', 'OG2', 'OS6', 'OP2', 8.9],
  ['SRD13', 'Trasformazione e commercializzazione (esempio)', 'OG1', 'OS3', 'OP1', 27.6],
  ['SRE01', 'Insediamento di giovani agricoltori (esempio)', 'OG3', 'OS7', 'OP5', 35.0],
  ['SRG06', 'LEADER - sviluppo locale (esempio)', 'OG3', 'OS8', 'OP5', 38.7],
  ['SRG07', 'Cooperazione per lo sviluppo rurale (esempio)', 'OG3', 'OS8', 'OP5', 6.4],
  ['SRH01', 'Servizi di consulenza (esempio)', 'OG1', 'OS2', 'OP1', 3.1],
  ['SRH03', 'Formazione degli addetti (esempio)', 'OG3', 'OS7', 'OP5', 2.6],
];

const INTERVENTI = BASE.map(([codice, descrizione, og, os, op, milioni], n) => {
  const dotazione = tondo(milioni * 1e6);
  const pagato = tondo(dotazione * (0.15 + caso() * 0.45));
  const domande = ANNI.map(() => Math.round((120 + caso() * 700) * Math.max(0.3, milioni / 25)));
  const prime = domande.map((d) => Math.round(d * (0.5 + caso() * 0.3)));
  const ammesso = ANNI.map(() => tondo(dotazione * (0.1 + caso() * 0.25)));
  const presentate = domande.reduce((a, b) => a + b, 0);
  const pagate = Math.round(presentate * (0.3 + caso() * 0.4));
  return {
    codice, descrizione, og, os, op, dotazione, pagato, domande, prime, ammesso, presentate, pagate,
    contributo: Math.round(caso() * 100),
    // come nei dati reali: qualche intervento senza pagamenti netti valorizzati
    nettiValorizzati: n % 5 !== 3,
  };
});

function selezione(url: string) {
  const p = new URL(url).searchParams;
  const filtro = (k: string) => p.getAll(k);
  const [interventi, og, os, op] = ['intervento', 'og', 'os', 'op'].map(filtro);
  return INTERVENTI.filter(
    (i) => (!interventi.length || interventi.includes(i.codice)) && (!og.length || og.includes(i.og)) && (!os.length || os.includes(i.os)) && (!op.length || op.includes(i.op)),
  );
}
const somma = <T>(xs: T[], f: (x: T) => number) => tondo(xs.reduce((a, x) => a + f(x), 0));
const PERIMETRO = 'REGIONALE';
const B = '*/api/finanziario';

export const handlersEsempio: RequestHandler[] = [
  http.get(`${B}/filtri`, () =>
    HttpResponse.json({
      interventi: INTERVENTI.map((i) => ({ chiave: i.codice, descrizione: i.descrizione })),
      obiettiviSpecifici: [...new Set(INTERVENTI.map((i) => i.os))].sort().map((c) => ({ chiave: c, descrizione: null })),
      obiettiviGenerali: ['OG1', 'OG2', 'OG3'],
      obiettiviPolicy: ['OP1', 'OP2', 'OP5'],
      azioniPortanti: [{ chiave: '1', descrizione: 'Azione portante di esempio' }],
      legameAzioniDisponibile: false,
      ultimiDatiSincronizzati: [
        { flusso: 'DS-12', conclusoIl: '2026-03-02T09:15:00Z' },
        { flusso: 'PILASTRO_DS06', conclusoIl: '2026-03-02T09:37:00Z' },
        { flusso: 'PROSA_DS04', conclusoIl: '2026-03-03T08:30:00Z' },
        { flusso: 'SIAN_DS01', conclusoIl: '2026-03-01T17:05:00Z' },
      ],
    }),
  ),
  http.get(`${B}/spesa-per-intervento`, ({ request }) =>
    HttpResponse.json({
      perimetro: PERIMETRO,
      righe: selezione(request.url).map((i) => ({
        codiceIntervento: i.codice,
        dotazioneSpesaPubblica: euro(i.dotazione),
        impegnatoCofinanziatoFeasrENon: fna('IMPEGNI'),
        impegnatoSpesaPubblica: fna('IMPEGNI'),
        pagamentiTotali: euro(i.pagato),
        percentualeContributoAmbientale: i.contributo,
        quotaStato: fna('RIPARTO_STATO_REGIONE'),
        quotaRegione: fna('RIPARTO_STATO_REGIONE'),
        vincoloDotazioneLeader: fna('VINCOLO_LEADER'),
      })),
    }),
  ),
  http.get(`${B}/distribuzione-dotazione`, ({ request }) => {
    const dot = somma(selezione(request.url), (i) => i.dotazione);
    return HttpResponse.json({ perimetro: PERIMETRO, dotazioneSpesaPubblica: euro(dot), quotaFeasr: euro(tondo(dot * 0.4036)), quotaNonFeasr: euro(tondo(dot * 0.5964)) });
  }),
  http.get(`${B}/stanziato`, () => HttpResponse.json({ perimetro: PERIMETRO, importoStanziato: fna('QUADRO_SINOTTICO'), importoDaStanziare: fna('QUADRO_SINOTTICO') })),
  http.get(`${B}/pagamenti-su-impegnato`, ({ request }) =>
    HttpResponse.json({ perimetro: PERIMETRO, totaleImpegnato: fna('IMPEGNI'), pagamentiTotali: euro(somma(selezione(request.url), (i) => i.pagato)), impegnatoDaPagare: fna('IMPEGNI') }),
  ),
  http.get(`${B}/residuo-impegni`, ({ request }) =>
    HttpResponse.json({ perimetro: PERIMETRO, dotazioneSpesaPubblica: euro(somma(selezione(request.url), (i) => i.dotazione)), importoImpegnato: fna('IMPEGNI'), dotazioneResidua: fna('IMPEGNI') }),
  ),
  http.get(`${B}/residuo-pagamenti`, ({ request }) => {
    const s = selezione(request.url);
    return HttpResponse.json({
      perimetro: PERIMETRO,
      dotazioneSpesaPubblica: euro(somma(s, (i) => i.dotazione)),
      importoPagato: euro(somma(s, (i) => i.pagato)),
      importoRecuperato: nv(),
      pagamentiNettoRettifiche: nv(),
      dotazioneResidua: nv(),
    });
  }),
  http.get(`${B}/domande-per-anno`, ({ request }) => {
    const s = selezione(request.url);
    return HttpResponse.json({
      perimetro: PERIMETRO,
      righe: [
        ...ANNI.map((a, k) => {
          const totali = somma(s, (i) => i.domande[k]);
          const prima = somma(s, (i) => i.prime[k]);
          return { annoRaccolta: a, primaAnnualita: prima, altreAnnualita: Math.round((totali - prima) * 0.9), nonClassificate: Math.round((totali - prima) * 0.1), totali };
        }),
        { annoRaccolta: null, primaAnnualita: 0, altreAnnualita: 0, nonClassificate: s.length * 3, totali: s.length * 3 },
      ],
    });
  }),
  http.get(`${B}/totale-domande`, ({ request }) => {
    const s = selezione(request.url);
    return HttpResponse.json({ perimetro: PERIMETRO, presentate: somma(s, (i) => i.presentate), primaAnnualita: somma(s, (i) => i.prime.reduce((a, b) => a + b, 0)) });
  }),
  http.get(`${B}/importi-per-anno`, ({ request }) => {
    const s = selezione(request.url);
    return HttpResponse.json({
      perimetro: PERIMETRO,
      righe: ANNI.map((a, k) => ({
        annoRaccolta: a,
        importoStanziato: fna('QUADRO_SINOTTICO'),
        importoAmmesso: euro(somma(s, (i) => i.ammesso[k])),
        importoDecretato: euro(somma(s, (i) => i.ammesso[k] * 0.7)),
        domandeSenzaAmmesso: s.length * (k + 1),
      })),
    });
  }),
  http.get(`${B}/riepilogo/csv`, () => new HttpResponse('Codice;Dotazione\nSRA01;0\n', { headers: { 'Content-Type': 'text/csv' } })),
  http.get(`${B}/riepilogo`, ({ request }) =>
    HttpResponse.json({
      perimetro: PERIMETRO,
      dotazioneAssistenzaTecnica: euro(9_800_000),
      righe: selezione(request.url).map((i) => ({
        codiceIntervento: i.codice,
        domandePresentate: i.presentate,
        dotazioneSpesaPubblica: euro(i.dotazione),
        risorseQuotaFeasr: euro(tondo(i.dotazione * 0.4036)),
        importoStanziato: fna('QUADRO_SINOTTICO'),
        impegnatoCofinanziatoFeasr: fna('IMPEGNI'),
        impegnatoCofinanziatoFeasrENon: fna('IMPEGNI'),
        pagamentiNettoRettifiche: i.nettiValorizzati ? euro(tondo(i.pagato * 0.97)) : nv(),
        dotazioneResiduaSuImpegni: fna('IMPEGNI'),
        dotazioneResiduaSuPagamenti: i.nettiValorizzati ? euro(tondo(i.dotazione - i.pagato * 0.97)) : nv(),
      })),
    }),
  ),
  http.get(`${B}/sigc/domande`, ({ request }) => {
    const s = selezione(request.url);
    const presentate = somma(s, (i) => i.presentate);
    const pagate = somma(s, (i) => i.pagate);
    return HttpResponse.json({ perimetro: PERIMETRO, presentate, pagate, daPagare: presentate - pagate });
  }),
  http.get(`${B}/sigc/importi`, ({ request }) => {
    const s = selezione(request.url);
    const richiesto = somma(s, (i) => i.dotazione * 0.9);
    const ammesso = somma(s, (i) => i.dotazione * 0.75);
    const pagato = somma(s, (i) => i.pagato);
    return HttpResponse.json({
      perimetro: PERIMETRO,
      richiesto: euro(richiesto),
      ammesso: euro(ammesso),
      pagato: euro(pagato),
      ancoraDaPagare: euro(tondo(ammesso - pagato)),
      domandeSenza: { richiesto: s.length * 4, ammesso: s.length * 6, pagato: s.length * 9 },
    });
  }),
  http.get(`${B}/riserva/:anno`, ({ params }) => {
    const anno = Number(params.anno);
    if (anno !== 2024) {
      return HttpResponse.json(
        { type: 'urn:cruscottocsr:problem:not-found', title: 'Non trovato', status: 404, errorCode: 'NOT_FOUND' },
        { status: 404, headers: { 'Content-Type': 'application/problem+json' } },
      );
    }
    // anno 2024: accumulo dal 1/10/2024 al 30/6/2025, utilizzo dal 1/7/2025 al 31/12/2025, residuo dal 1/1/2026; i
    // movimenti cadono nella finestra di utilizzo e l'istantanea e' dopo il congelamento (come il backend li produce)
    const utilizzi = [3.1, 2.4, 4.8, 1.9].map((m, k) => ({ data: `2025-${String(k + 7).padStart(2, '0')}-15`, importo: m * 1e6 }));
    let cumulato = 0;
    return HttpResponse.json({
      perimetro: PERIMETRO,
      anno,
      fase: 'RESIDUO',
      dataEstrazione: '2025-11-30',
      dataCongelamento: '2025-06-30',
      montantePagamenti: 410e6,
      importoAccumulato: 20.5e6,
      importoCongelato: 20.5e6,
      importoUtilizzato: 12.2e6,
      importoResiduoDisponibile: 8.2e6,
      regolaN2: fna('REGOLA_N2'),
      utilizzoProgressivo: utilizzi.map((u) => ({ ...u, cumulato: (cumulato += u.importo) })),
    });
  }),
  http.get(`${B}/sigc/verifica-smp`, ({ request }) => {
    const esercizio = Number(new URL(request.url).searchParams.get('esercizio') ?? 2025);
    return HttpResponse.json({
      perimetro: PERIMETRO,
      esercizio,
      annoDomande: esercizio - 1,
      pagamentiSenzaData: 3,
      righe: selezione(request.url).map((i) => ({
        codiceIntervento: i.codice,
        avvisiAttivati: 2,
        azioniAttivate: null,
        domandeRicevute: i.domande[2],
        domandeRicevuteSenzaRichiesto: 4,
        valoreDomandeRicevute: euro(tondo(i.dotazione * 0.3)),
        domandeFinanziate: Math.round(i.domande[2] * 0.6),
        valoreDomandeFinanziate: euro(tondo(i.dotazione * 0.2)),
        dotazioneAnnoPrecedente: euro(tondo(i.dotazione * 0.25)),
        dotazionePeriodoImpegno: euro(i.dotazione),
        domandePagateEsercizio: Math.round(i.domande[2] * 0.4),
        spesaErogataCampagnaPrecedente: euro(tondo(i.pagato * 0.4)),
        spesaErogataCampagneAnteriori: euro(tondo(i.pagato * 0.3)),
        previsionePagamentoEsercizio: fna('PREVISIONE_PAGAMENTO'),
        importoTopUp: euro(0),
        includeTopUp: false,
        ettariUbaRichiesti: null,
        outputAttesoFinanziate: null,
        outputErogatoEsercizio: null,
        indicatoreOutput: null,
        indicatoreRisultato: null,
      })),
    });
  }),
];
