// esempio.ts — dati DI ESEMPIO dell'elenco operativo per il dev server con MSW (npm run dev): valori INVENTATI e
// deterministici, nella forma dei DTO della spec (TX-0056..TX-0060), con le stesse assenze dei dati reali (importi non
// valorizzati). Il mock fa da server: filtra per intervento, tipo, SIGC, anno e testo, ordina per codice a barre o
// ammesso, pagina, e calcola sinottico e totali sull'insieme filtrato. Solo il worker del browser li usa (browser.ts li
// raccoglie per convenzione di percorso); i test hanno le loro fixture.
import { http, HttpResponse } from 'msw';
import type { RequestHandler } from 'msw';

const INTERVENTI: Array<[string, string]> = [
  ['SRA01', 'Produzione integrata (esempio)'],
  ['SRA29', 'Agricoltura biologica (esempio)'],
  ['SRD01', 'Investimenti produttivi agricoli (esempio)'],
  ['SRG03', 'Regimi di qualità (esempio)'],
];
const STATI: Array<[string, string]> = [
  ['RILASCIATO', 'Rilasciata'],
  ['VALIDO', 'Valida'],
  ['ISTRUITA', 'Istruita con esito positivo'],
];
const NOMI = ['AZIENDA AGRICOLA ROSSI', 'COOPERATIVA VERDI', 'BIANCHI LUCA', 'SOCIETA AGRICOLA COLLE', 'FATTORIA DEL LAGO', 'NERI ANNA'];
const PROVINCE = ['FROSINONE', 'LATINA', 'RIETI', 'ROMA', 'VITERBO'];
const ULTIMI = [{ flusso: 'DS-12', conclusoIl: '2026-03-02T09:15:00Z' }];

const euro = (valore: number | null) => ({ valore, motivo: valore === null ? 'NON_VALORIZZATO' : null, fonte: null });

interface DomandaEsempio {
  codiceABarre: string;
  tipo: 'SOSTEGNO' | 'PAGAMENTO';
  cuaa: string;
  denominazione: string;
  codiceIntervento: string;
  annoRaccolta: number;
  sigc: boolean;
  statoCodice: string;
  statoDescrizione: string;
  provincia: string;
  richiesto: ReturnType<typeof euro>;
  ammesso: ReturnType<typeof euro>;
  pagato: ReturnType<typeof euro>;
  ancoraDaPagare: ReturnType<typeof euro>;
}

const DOMANDE: DomandaEsempio[] = Array.from({ length: 87 }, (_, k) => {
  const tipo = k % 3 === 0 ? 'SOSTEGNO' : 'PAGAMENTO';
  const ammesso = k % 7 === 0 ? null : 2000 + ((k * 731) % 9000);
  const pagato = ammesso === null || k % 4 === 0 ? null : Math.round(ammesso * ((k % 5) / 5) * 100) / 100;
  const [statoCodice, statoDescrizione] = STATI[k % STATI.length];
  return {
    codiceABarre: `${tipo === 'SOSTEGNO' ? '0423' : '5423'}${String(1000000 + k).slice(1)}0`,
    tipo,
    cuaa: `0${String(1234567890 + k * 17).slice(0, 10)}`,
    denominazione: NOMI[k % NOMI.length],
    codiceIntervento: INTERVENTI[k % INTERVENTI.length][0],
    annoRaccolta: 2023 + (k % 3),
    sigc: tipo === 'PAGAMENTO' && k % 2 === 0,
    statoCodice,
    statoDescrizione,
    provincia: PROVINCE[k % PROVINCE.length],
    richiesto: euro(ammesso === null ? null : ammesso + 500),
    ammesso: euro(ammesso),
    pagato: euro(pagato),
    ancoraDaPagare: euro(ammesso !== null && pagato !== null ? Math.max(ammesso - pagato, 0) : null),
  };
});

function filtrate(p: URLSearchParams): DomandaEsempio[] {
  const tra = (nome: string, v: string) => p.getAll(nome).length === 0 || p.getAll(nome).includes(v);
  const testo = (p.get('testo') ?? '').toLowerCase();
  return DOMANDE.filter(
    (d) =>
      tra('intervento', d.codiceIntervento) &&
      tra('tipo', d.tipo) &&
      tra('anno', String(d.annoRaccolta)) &&
      tra('stato', d.statoCodice) &&
      tra('provincia', d.provincia) &&
      (p.get('sigc') === null || String(d.sigc) === p.get('sigc')) &&
      (testo === '' || d.codiceABarre.startsWith(testo) || d.cuaa.toLowerCase().startsWith(testo) || d.denominazione.toLowerCase().includes(testo)),
  );
}

function somma(righe: DomandaEsempio[], campo: 'richiesto' | 'ammesso' | 'pagato' | 'ancoraDaPagare') {
  const con = righe.filter((d) => d[campo].valore !== null);
  const totale = con.length === 0 ? null : Math.round(con.reduce((s, d) => s + (d[campo].valore ?? 0), 0) * 100) / 100;
  return { totale: euro(totale), senzaValore: righe.length - con.length };
}

function ripartizione(righe: DomandaEsempio[], chiave: (d: DomandaEsempio) => string, descrizione: (k: string) => string | null) {
  const conta = new Map<string, number>();
  for (const d of righe) conta.set(chiave(d), (conta.get(chiave(d)) ?? 0) + 1);
  return [...conta.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => ({ chiave: k, descrizione: descrizione(k), domande: n }));
}

function sinottico(righe: DomandaEsempio[]) {
  const presentate = righe.filter((d) => d.tipo === 'SOSTEGNO' || d.sigc);
  return {
    perimetro: 'REGIONALE',
    domande: righe.length,
    sostegno: righe.filter((d) => d.tipo === 'SOSTEGNO').length,
    pagamento: righe.filter((d) => d.tipo === 'PAGAMENTO').length,
    presentate: presentate.length,
    sigc: righe.filter((d) => d.sigc).length,
    beneficiari: new Set(righe.map((d) => d.cuaa)).size,
    richiesto: somma(righe, 'richiesto'),
    ammesso: somma(righe, 'ammesso'),
    pagato: somma(righe, 'pagato'),
    ancoraDaPagare: somma(righe, 'ancoraDaPagare'),
    liquidato: euro(null),
    recuperato: euro(null),
    quotaPagata: null,
    pagate: righe.filter((d) => d.pagato.valore !== null && d.ancoraDaPagare.valore === 0).length,
    daPagare: righe.filter((d) => (d.ancoraDaPagare.valore ?? 0) > 0).length,
    senzaImporti: righe.filter((d) => d.ammesso.valore === null).length,
    perStato: ripartizione(righe, (d) => d.statoCodice, (k) => STATI.find((s) => s[0] === k)?.[1] ?? null),
    perIntervento: ripartizione(righe, (d) => d.codiceIntervento, (k) => INTERVENTI.find((i) => i[0] === k)?.[1] ?? null),
    perAnno: ripartizione(righe, (d) => String(d.annoRaccolta), () => null),
    ultimiDatiSincronizzati: ULTIMI,
  };
}

function pagina(p: URLSearchParams, righe: DomandaEsempio[]) {
  const [campo, verso] = (p.get('ordina') ?? 'codiceABarre:asc').split(':');
  const ordinate = [...righe].sort((a, b) => {
    const x = campo === 'ammesso' ? (a.ammesso.valore ?? -1) : a.codiceABarre;
    const y = campo === 'ammesso' ? (b.ammesso.valore ?? -1) : b.codiceABarre;
    const c = x < y ? -1 : x > y ? 1 : 0;
    return verso === 'desc' ? -c : c;
  });
  const dimensione = Math.min(Math.max(Number(p.get('dimensione') ?? 25) || 25, 1), 100);
  const n = Number(p.get('pagina') ?? 0) || 0;
  return {
    perimetro: 'REGIONALE',
    pagina: n,
    dimensione,
    ordinamento: `${campo}:${verso}`,
    totaleRighe: righe.length,
    righe: ordinate.slice(n * dimensione, n * dimensione + dimensione).map((d) => ({ ...d, primaAnnualita: true, statoProgrammazione: null, anomalie: 0 })),
  };
}

export const handlersEsempio: RequestHandler[] = [
  http.get('*/api/elenco-operativo/filtri', () =>
    HttpResponse.json({
      perimetro: 'REGIONALE',
      interventi: INTERVENTI.map(([chiave, descrizione]) => ({ chiave, descrizione })),
      obiettiviSpecifici: [],
      obiettiviGenerali: [],
      obiettiviPolicy: [],
      azioniPortanti: [],
      legameAzioniDisponibile: false,
      stati: STATI.map(([codice, descrizione]) => ({ codice, descrizione, tipo: null })),
      statiProgrammazione: [],
      province: PROVINCE,
      enti: [],
      anni: [2023, 2024, 2025],
      decreti: [],
      tipi: ['PAGAMENTO', 'SOSTEGNO'],
    }),
  ),
  http.get('*/api/elenco-operativo/domande/sinottico', ({ request }) => HttpResponse.json(sinottico(filtrate(new URL(request.url).searchParams)))),
  http.get('*/api/elenco-operativo/domande', ({ request }) => {
    const p = new URL(request.url).searchParams;
    return HttpResponse.json(pagina(p, filtrate(p)));
  }),
  http.get('*/api/elenco-operativo/pagamenti', () =>
    HttpResponse.json({ perimetro: 'REGIONALE', pagina: 0, dimensione: 25, ordinamento: 'decreto:asc', totaleRighe: 0, righe: [], totali: { pagate: 0, escluse: 0 }, ultimiDatiSincronizzati: ULTIMI }),
  ),
];
