// esempio.ts — dati DI ESEMPIO del finanziario per il dev server con MSW (npm run dev): valori INVENTATI e
// deterministici, nella forma dei DTO della spec 1.5.0 e con le stesse assenze dei dati reali (impegni e stanziato da
// fonte non attiva). Rispettano i filtri intervento/og/os/op e sigc, cosi' panoramica, dettaglio e
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
// Un solo costruttore dei dati col motivo dell'assenza (Importo: review delta 21/10 H4): il valore, oppure null col motivo e la fonte attesa. Importi e assenze ne derivano.
const dato = <T>(v: T | null, motivo: string | null = null, fonte: string | null = null) => ({ valore: v, motivo: v === null ? motivo : null, fonte: v === null ? fonte : null });
const euro = (v: number | null) => dato(v);
const fna = (fonte: string) => dato(null, 'FONTE_NON_ATTIVA', fonte);
const nv = () => dato(null, 'NON_VALORIZZATO');
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
  // una domanda senza campagna ne' anno di rilascio della domanda di sostegno: la riga "senza anno di raccolta" (D-09)
  const senzaAnno = 1;
  const presentate = domande.reduce((a, b) => a + b, 0) + senzaAnno;
  const pagate = Math.round(presentate * (0.3 + caso() * 0.4));
  // TX-0012 come il backend (D-09): senza importi = campagne senza ASR2-20, ne' pagate ne' da pagare; da pagare = le
  // pagate in parte piu' le ammesse non ancora pagate (pagate e da pagare si sovrappongono)
  const senzaImporti = Math.round(presentate * 0.08);
  const daPagare = Math.round(pagate * 0.2) + Math.round((presentate - senzaImporti - pagate) * 0.6);
  return {
    codice, descrizione, og, os, op, dotazione, pagato, domande, prime, ammesso, senzaAnno, presentate, pagate, senzaImporti, daPagare,
    // il seme della quota stimata dell'impegnato (R04; prima 'contributo', del contributo ambientale tolto: review V1-16)
    semeStima: Math.round(caso() * 100),
    // come nei dati reali: qualche intervento senza pagamenti netti valorizzati
    nettiValorizzati: n % 5 !== 3,
  };
});

type Intervento = (typeof INTERVENTI)[number];

// classificazione SIGC degli interventi della programmazione (revisioni del 31/10/2026, F1: SRA01/03/14/15/29/30, SRB01,
// SRC01 SIGC; gli altri NO SIGC)
const SIGC = new Set(['SRA01', 'SRA03', 'SRA14', 'SRA15', 'SRA29', 'SRA30', 'SRB01', 'SRC01']);
const perimetroDi = (codice: string) => (SIGC.has(codice) ? 'SIGC' : 'NO_SIGC');

function selezione(url: string) {
  const p = new URL(url).searchParams;
  const filtro = (k: string) => p.getAll(k);
  const [interventi, og, os, op] = ['intervento', 'og', 'os', 'op'].map(filtro);
  const sigc = p.get('sigc');
  const tipo = (i: Intervento) => sigc === null || (sigc === 'true') === SIGC.has(i.codice);
  return INTERVENTI.filter(
    (i) => (!interventi.length || interventi.includes(i.codice)) && (!og.length || og.includes(i.og)) && (!os.length || os.includes(i.os)) && (!op.length || op.includes(i.op)) && tipo(i),
  );
}

// la parte stimata dell'impegnato: solo per gli interventi SIGC (la previsione sui bandi pluriennali SIGC, R04)
const stimato = (i: Intervento) => (SIGC.has(i.codice) ? tondo(i.dotazione * 0.6 * (i.semeStima / 400)) : 0);

// la stima dell'impegnato (R04) e due righe di rettifiche per intervento (R08), come le produce il backend
const STIMA = { metodo: 'MEDIA_ANNUALITA_RILEVATE_PER_BANDO_X_ANNI_RESIDUI', orizzonte: 2029, ultimaCampagnaRilevata: 2025, calcolatoIl: '2026-10-31', quotaDaRichiesto: euro(0) };
function righeRettifiche(codice: string, totale: number) {
  return [
    { progressivo: 1, programmazione: 'CSR_2023_2027', importo: -totale, codiceAzione: `${codice}.1`, riferimento: 'riga 12 del foglio' },
    { progressivo: 2, programmazione: 'TRASCINAMENTI_PSR', importo: -1000, codiceAzione: null, riferimento: 'riga 13 del foglio' },
  ];
}
const somma = <T>(xs: T[], f: (x: T) => number) => tondo(xs.reduce((a, x) => a + f(x), 0));
const PERIMETRO = 'REGIONALE';
const B = '*/api/finanziario';

export const handlersEsempio: RequestHandler[] = [
  http.get(`${B}/filtri`, () =>
    HttpResponse.json({
      interventi: INTERVENTI.map((i) => ({ chiave: i.codice, descrizione: i.descrizione, perimetro: perimetroDi(i.codice) })),
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
        impegnatoCofinanziatoFeasrENon: euro(tondo(i.dotazione * 0.6)),
        // revisioni del 31/10/2026: impegnato di spesa pubblica con la parte stimata (R03, R04)
        impegnatoSpesaPubblica: euro(tondo(i.dotazione * 0.6)),
        impegnatoStimato: euro(stimato(i)),
        pagamentiTotali: euro(i.pagato),
      })),
      stimaImpegni: STIMA,
    }),
  ),
  http.get(`${B}/distribuzione-dotazione`, ({ request }) => {
    const dot = somma(selezione(request.url), (i) => i.dotazione);
    return HttpResponse.json({ perimetro: PERIMETRO, dotazioneSpesaPubblica: euro(dot), quotaFeasr: euro(tondo(dot * 0.407)), quotaNonFeasr: euro(tondo(dot * 0.593)) });
  }),
  http.get(`${B}/stanziato`, () => HttpResponse.json({ perimetro: PERIMETRO, importoStanziato: fna('QUADRO_SINOTTICO'), importoDaStanziare: fna('QUADRO_SINOTTICO') })),
  http.get(`${B}/pagamenti-su-impegnato`, ({ request }) => {
    const s = selezione(request.url);
    const impegnato = somma(s, (i) => tondo(i.dotazione * 0.6));
    const pagato = somma(s, (i) => i.pagato);
    return HttpResponse.json({ perimetro: PERIMETRO, totaleImpegnato: euro(impegnato), pagamentiTotali: euro(pagato), impegnatoDaPagare: euro(tondo(impegnato - pagato)), impegnatoStimato: euro(somma(s, stimato)), stimaImpegni: STIMA });
  }),
  http.get(`${B}/residuo-impegni`, ({ request }) => {
    const s = selezione(request.url);
    const [dotazione, impegnato] = [somma(s, (i) => i.dotazione), somma(s, (i) => tondo(i.dotazione * 0.6))];
    return HttpResponse.json({ perimetro: PERIMETRO, dotazioneSpesaPubblica: euro(dotazione), importoImpegnato: euro(impegnato), dotazioneResidua: euro(tondo(dotazione - impegnato)), impegnatoStimato: euro(somma(s, stimato)), stimaImpegni: STIMA });
  }),
  http.get(`${B}/residuo-pagamenti`, ({ request }) => {
    const s = selezione(request.url);
    // revisioni del 31/10/2026 (R08): rettifiche al posto del recuperato, il residuo per intervento con le righe
    const rettifiche = (i: Intervento) => (i.nettiValorizzati ? tondo(i.pagato * 0.03) : null);
    const conRettifiche = s.filter((i) => i.nettiValorizzati);
    const totaleRettifiche = somma(conRettifiche, (i) => rettifiche(i) ?? 0);
    const tutteValorizzate = conRettifiche.length === s.length;
    return HttpResponse.json({
      perimetro: PERIMETRO,
      dotazioneSpesaPubblica: euro(somma(s, (i) => i.dotazione)),
      importoPagato: euro(somma(s, (i) => i.pagato)),
      importoRettifiche: tutteValorizzate ? euro(totaleRettifiche) : nv(),
      pagamentiNettoRettifiche: tutteValorizzate ? euro(tondo(somma(s, (i) => i.pagato) - totaleRettifiche)) : nv(),
      dotazioneResidua: tutteValorizzate ? euro(tondo(somma(s, (i) => i.dotazione - i.pagato) + totaleRettifiche)) : nv(),
      fonteRettifiche: { documento: 'FEASR 23.27 Report', dataRiferimento: '2026-02-28' },
      interventi: s.map((i) => ({
        codiceIntervento: i.codice,
        dotazioneSpesaPubblica: euro(i.dotazione),
        pagatoLordo: euro(i.pagato),
        importoRettifiche: i.nettiValorizzati ? euro(rettifiche(i) ?? 0) : fna('RETTIFICHE'),
        pagamentiNettoRettifiche: i.nettiValorizzati ? euro(tondo(i.pagato - (rettifiche(i) ?? 0))) : fna('RETTIFICHE'),
        dotazioneResidua: i.nettiValorizzati ? euro(tondo(i.dotazione - i.pagato + (rettifiche(i) ?? 0))) : fna('RETTIFICHE'),
        conRettifiche: i.nettiValorizzati ? true : null,
        rettifiche: i.nettiValorizzati ? righeRettifiche(i.codice, rettifiche(i) ?? 0) : [],
      })),
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
        // senza anno di raccolta: poche domande, tutte non classificate
        { annoRaccolta: null, primaAnnualita: 0, altreAnnualita: 0, nonClassificate: somma(s, (i) => i.senzaAnno), totali: somma(s, (i) => i.senzaAnno) },
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
  // export del riepilogo (D-08): il CSV d'esempio; l'XLSX e' un segnaposto (il dev server non scrive fogli veri), gli altri
  // export restano agli handler generati
  http.get(`${B}/riepilogo/:formato`, ({ params }) =>
    params.formato === 'xlsx'
      ? new HttpResponse('esempio', { headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' } })
      : new HttpResponse('Codice;Dotazione\nSRA01;0\n', { headers: { 'Content-Type': 'text/csv' } }),
  ),
  http.get(`${B}/riepilogo`, ({ request }) =>
    HttpResponse.json({
      perimetro: PERIMETRO,
      dotazioneAssistenzaTecnica: euro(9_800_000),
      righe: selezione(request.url).map((i) => ({
        codiceIntervento: i.codice,
        domandePresentate: i.presentate,
        dotazioneSpesaPubblica: euro(i.dotazione),
        risorseQuotaFeasr: euro(tondo(i.dotazione * 0.407)),
        importoStanziato: euro(tondo(i.dotazione * 0.8)),
        impegnatoCofinanziatoFeasr: euro(tondo(i.dotazione * 0.6 * 0.407)),
        impegnatoCofinanziatoFeasrENon: euro(tondo(i.dotazione * 0.6)),
        impegnatoStimato: euro(stimato(i)),
        // revisioni del 31/10/2026 (R08): lordi, rettifiche e netto
        pagamentiLordi: euro(i.pagato),
        importoRettifiche: i.nettiValorizzati ? euro(tondo(i.pagato * 0.03)) : fna('RETTIFICHE'),
        conRettifiche: i.nettiValorizzati ? true : null,
        rettifiche: i.nettiValorizzati ? righeRettifiche(i.codice, tondo(i.pagato * 0.03)) : [],
        pagamentiNettoRettifiche: i.nettiValorizzati ? euro(tondo(i.pagato * 0.97)) : fna('RETTIFICHE'),
        dotazioneResiduaSuImpegni: euro(tondo(i.dotazione * 0.4)),
        dotazioneResiduaSuPagamenti: i.nettiValorizzati ? euro(tondo(i.dotazione - i.pagato * 0.97)) : fna('RETTIFICHE'),
      })),
      stimaImpegni: STIMA,
    }),
  ),
  http.get(`${B}/sigc/domande`, ({ request }) => {
    const s = selezione(request.url);
    return HttpResponse.json({
      perimetro: PERIMETRO,
      presentate: somma(s, (i) => i.presentate),
      pagate: somma(s, (i) => i.pagate),
      daPagare: somma(s, (i) => i.daPagare),
      senzaImporti: somma(s, (i) => i.senzaImporti),
    });
  }),
  http.get(`${B}/sigc/importi`, ({ request }) => {
    const s = selezione(request.url);
    const richiesto = somma(s, (i) => i.dotazione * 0.9);
    const ammesso = somma(s, (i) => i.dotazione * 0.75);
    const pagato = somma(s, (i) => i.pagato);
    // qualche domanda pagata oltre l'ammesso: ammesso = pagato + ancora da pagare - pagato oltre l'ammesso (D-09)
    const oltre = somma(s, (i) => i.pagato * 0.004);
    // le domande senza importi sono le stesse per richiesto, ammesso e pagato (campagne senza ASR2-20, come TX-0012)
    const senza = somma(s, (i) => i.senzaImporti);
    return HttpResponse.json({
      perimetro: PERIMETRO,
      richiesto: euro(richiesto),
      ammesso: euro(ammesso),
      pagato: euro(pagato),
      ancoraDaPagare: euro(tondo(ammesso - pagato + oltre)),
      pagatoOltreAmmesso: euro(oltre),
      domandeSenza: { richiesto: senza, ammesso: senza, pagato: senza },
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
      // revisioni del 31/10/2026 (R17): quote e natura della riserva e del residuo
      quotaRiserva: 0.05,
      quotaResiduo: 0.02,
      naturaRiserva: 'CONSUNTIVO',
      naturaResiduo: 'CONSUNTIVO',
      importoAccumulato: 20.5e6,
      importoCongelato: 20.5e6,
      importoUtilizzato: 12.2e6,
      importoResiduoDisponibile: 8.2e6,
      regolaN2: fna('REGOLA_N2'),
      utilizzoProgressivo: utilizzi.map((u) => ({ ...u, cumulato: (cumulato += u.importo) })),
    });
  }),
];
