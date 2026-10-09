// Dati di prova dei report del finanziario per i test: forma delle spec, valori TONDI E INVENTATI (nessun conteggio o
// importo preso dall'ambiente con i dati reali). I codici di intervento e obiettivo sono quelli pubblici del CSR.
// Stanno nella feature (review v2 H-20): li importano i test (tests/ e i test delle pagine), mai il codice di produzione
// (Z-02, eslint.config.js).
const nd = (fonte: string) => ({ valore: null, motivo: 'FONTE_NON_ATTIVA', fonte });
const euro = (valore: number) => ({ valore, motivo: null, fonte: null });

export const FILTRI = {
  interventi: [
    { chiave: 'SRA01', descrizione: 'Intervento di prova A' },
    { chiave: 'SRA03', descrizione: 'Intervento di prova B' },
  ],
  obiettiviSpecifici: [{ chiave: 'OS4', descrizione: null }],
  obiettiviGenerali: ['OG2'],
  obiettiviPolicy: ['OP1', 'OP2', 'OP4', 'OP5'],
  azioniPortanti: [{ chiave: '1', descrizione: 'Azione portante di prova' }],
  legameAzioniDisponibile: false,
  // NFR-25 (b): istanti inventati; in ora italiana 02/03/2026 10:15 e 03/03/2026 09:30
  ultimiDatiSincronizzati: [
    { flusso: 'DS-12', conclusoIl: '2026-03-02T09:15:00Z' },
    { flusso: 'PROSA_DS04', conclusoIl: '2026-03-03T08:30:00Z' },
  ],
};

export const RIEPILOGO = {
  perimetro: 'REGIONALE',
  dotazioneAssistenzaTecnica: euro(100000),
  righe: [
    {
      codiceIntervento: 'SRA01',
      domandePresentate: 12,
      dotazioneSpesaPubblica: euro(1000000),
      risorseQuotaFeasr: euro(400000),
      importoStanziato: nd('QUADRO_SINOTTICO'),
      impegnatoCofinanziatoFeasr: nd('IMPEGNI'),
      impegnatoCofinanziatoFeasrENon: nd('IMPEGNI'),
      pagamentiNettoRettifiche: euro(200000),
      dotazioneResiduaSuImpegni: nd('IMPEGNI'),
      dotazioneResiduaSuPagamenti: euro(800000),
    },
    {
      codiceIntervento: 'SRA03',
      domandePresentate: 3,
      dotazioneSpesaPubblica: euro(500000),
      risorseQuotaFeasr: euro(200000),
      importoStanziato: nd('QUADRO_SINOTTICO'),
      impegnatoCofinanziatoFeasr: nd('IMPEGNI'),
      impegnatoCofinanziatoFeasrENon: nd('IMPEGNI'),
      pagamentiNettoRettifiche: euro(0),
      dotazioneResiduaSuImpegni: nd('IMPEGNI'),
      dotazioneResiduaSuPagamenti: euro(500000),
    },
  ],
};

export const SPESA = {
  perimetro: 'REGIONALE',
  righe: [
    {
      codiceIntervento: 'SRA01',
      dotazioneSpesaPubblica: euro(1000000),
      impegnatoCofinanziatoFeasrENon: nd('IMPEGNI'),
      impegnatoSpesaPubblica: nd('IMPEGNI'),
      pagamentiTotali: euro(200000),
      // come le produce il backend: il riparto Stato - Regione viene da una fonte non attiva (SC-FI_SPESA_INTERVENTO)
      quotaStato: nd('RIPARTO_STATO_REGIONE'),
      quotaRegione: nd('RIPARTO_STATO_REGIONE'),
      vincoloDotazioneLeader: nd('VINCOLO_LEADER'),
      percentualeContributoAmbientale: 12.5,
    },
  ],
};
export const DISTRIBUZIONE = { perimetro: 'REGIONALE', dotazioneSpesaPubblica: euro(1000000), quotaFeasr: euro(400000), quotaNonFeasr: euro(600000) };
export const STANZIATO = { perimetro: 'REGIONALE', importoStanziato: nd('QUADRO_SINOTTICO'), importoDaStanziare: nd('QUADRO_SINOTTICO') };
export const PAGAMENTI = { perimetro: 'REGIONALE', totaleImpegnato: nd('IMPEGNI'), pagamentiTotali: euro(200000), impegnatoDaPagare: nd('IMPEGNI') };
export const RESIDUO_IMPEGNI = { perimetro: 'REGIONALE', dotazioneSpesaPubblica: euro(1000000), importoImpegnato: nd('IMPEGNI'), dotazioneResidua: nd('IMPEGNI') };
export const RESIDUO_PAGAMENTI = {
  perimetro: 'REGIONALE',
  dotazioneSpesaPubblica: euro(1000000),
  importoPagato: euro(220000),
  importoRecuperato: euro(20000),
  pagamentiNettoRettifiche: euro(200000),
  dotazioneResidua: euro(800000),
};
export const TOTALE_DOMANDE = { perimetro: 'REGIONALE', presentate: 1200, primaAnnualita: 400 };
export const DOMANDE_PER_ANNO = {
  perimetro: 'REGIONALE',
  righe: [
    { annoRaccolta: 2024, primaAnnualita: 300, altreAnnualita: 200, nonClassificate: 10, totali: 510 },
    { annoRaccolta: null, primaAnnualita: 0, altreAnnualita: 0, nonClassificate: 40, totali: 40 },
  ],
};
export const IMPORTI_PER_ANNO = {
  perimetro: 'REGIONALE',
  righe: [
    { annoRaccolta: 2024, importoStanziato: nd('QUADRO_SINOTTICO'), importoAmmesso: euro(900000), importoDecretato: euro(700000), domandeSenzaAmmesso: 50 },
    { annoRaccolta: null, importoStanziato: nd('QUADRO_SINOTTICO'), importoAmmesso: euro(10000), importoDecretato: euro(0), domandeSenzaAmmesso: 40 },
  ],
};
export const SIGC_DOMANDE = { perimetro: 'REGIONALE', presentate: 800, pagate: 500, daPagare: 300 };
export const SIGC_IMPORTI = {
  perimetro: 'REGIONALE',
  richiesto: euro(5000000),
  ammesso: euro(4500000),
  pagato: euro(3000000),
  ancoraDaPagare: euro(1500000),
  domandeSenza: { richiesto: 50, ammesso: 50, pagato: 300 },
};
// Riserva come nello scenario SC-FI_RISERVA del backend: anno n = 2025, istantanea estratta il 31/12/2026 (dopo il
// congelamento del 30/6/2026: congelato e residuo valorizzati), fase calcolata al giorno della consultazione.
export const RISERVA = {
  anno: 2025,
  perimetro: 'REGIONALE',
  fase: 'RESIDUO',
  dataEstrazione: '2026-12-31',
  dataCongelamento: '2026-06-30',
  montantePagamenti: 10000,
  importoAccumulato: 500,
  importoCongelato: 500,
  importoUtilizzato: 300,
  importoResiduoDisponibile: 200,
  regolaN2: nd('REGOLA_N2'),
  utilizzoProgressivo: [
    { data: '2026-07-15', importo: 100, cumulato: 100 },
    { data: '2026-09-10', importo: 200, cumulato: 300 },
  ],
};
export const VERIFICA_SMP = {
  perimetro: 'REGIONALE',
  esercizio: 2025,
  annoDomande: 2024,
  pagamentiSenzaData: 3,
  righe: [
    {
      codiceIntervento: 'SRA01',
      avvisiAttivati: 1,
      azioniAttivate: null,
      domandeRicevute: 120,
      domandeRicevuteSenzaRichiesto: 2,
      valoreDomandeRicevute: euro(1500000),
      domandeFinanziate: 100,
      valoreDomandeFinanziate: euro(1200000),
      dotazioneAnnoPrecedente: euro(1000000),
      dotazionePeriodoImpegno: euro(1000000),
      domandePagateEsercizio: 80,
      spesaErogataCampagnaPrecedente: euro(400000),
      spesaErogataCampagneAnteriori: euro(0),
      previsionePagamentoEsercizio: nd('PREVISIONE_PAGAMENTO'),
      importoTopUp: euro(0),
      includeTopUp: false,
      ettariUbaRichiesti: 350.5,
      outputAttesoFinanziate: null,
      outputErogatoEsercizio: null,
      indicatoreOutput: 'O.14',
      indicatoreRisultato: null,
    },
  ],
};
