// SinotticoDomande — sinottico sopra le righe (pattern interrogazione, ADR 0029; wireframe domande): indicatori e grafici
// della vista per ambito, tutti campi di SinotticoElenco (TX-0057) calcolati dal server sull'INTERO insieme filtrato, mai
// somme della pagina. Un importo assente non e' mai zero (il motivo lo dice la tessera). Il clic su una barra aggiunge il
// filtro della voce (le voci che il filtro non accetta non hanno clic, vedi lib/grafici). Kit UI v2: Kpi, CardGrafico.
import { Fragment, useMemo } from 'react';
import type { ReactNode } from 'react';
import { formatNumber, plurale } from '../../../shared/lib';
import { CardGrafico, Griglia, Kpi } from '../../../shared/ui';
import type { ClicGrafico } from '../../../shared/ui';
import type { SinotticoElenco } from '../api';
import { TESTI_RIPARTIZIONE, filtroDalClic, graficoRipartizione } from '../lib/grafici';
import type { Ripartizione } from '../lib/grafici';
import { testoQuotaPagata, testoSomma } from '../lib/formato';
import type { Indicatore, Vista } from '../lib/viste';

const FONTE = 'Fonte: sinottico dell’insieme filtrato (TX-0057), calcolato dal server su tutte le domande, non sulla pagina.';

function KpiSomma({ etichetta, somma, icona }: { etichetta: string; somma: SinotticoElenco['richiesto']; icona: 'it-chart-line' | 'it-card' }) {
  const t = testoSomma(somma);
  return <Kpi etichetta={etichetta} valore={t.valore} nota={t.nota} icona={icona} />;
}

const n = (v: number | undefined) => formatNumber(v ?? 0);

// un indicatore per voce della vista (lib/viste): tutti campi del sinottico, mai calcoli sulle righe
const INDICATORI: Record<Indicatore, (s: SinotticoElenco) => ReactNode> = {
  domande: (s) => <Kpi etichetta="Domande" valore={n(s.domande)} nota={`di sostegno ${n(s.sostegno)} - di pagamento ${n(s.pagamento)}`} icona="it-files" />,
  presentate: (s) => <Kpi etichetta="Presentate" valore={n(s.presentate)} nota={`di cui SIGC ${n(s.sigc)}`} icona="it-file-signed" tono="verde" />,
  beneficiari: (s) => <Kpi etichetta="Beneficiari distinti" valore={n(s.beneficiari)} icona="it-user" tono="scuro" />,
  esitiPagamento: (s) => <Kpi etichetta="Pagate / da pagare / senza importi" valore={`${n(s.pagate)} / ${n(s.daPagare)} / ${n(s.senzaImporti)}`} icona="it-check-circle" tono="ambra" />,
  richiesto: (s) => <KpiSomma etichetta="Richiesto" somma={s.richiesto} icona="it-chart-line" />,
  ammesso: (s) => <KpiSomma etichetta="Ammesso" somma={s.ammesso} icona="it-chart-line" />,
  pagato: (s) => <KpiSomma etichetta="Pagato" somma={s.pagato} icona="it-card" />,
  ancoraDaPagare: (s) => <KpiSomma etichetta="Ancora da pagare" somma={s.ancoraDaPagare} icona="it-card" />,
  liquidato: (s) => <Kpi etichetta="Liquidato negli elenchi" valore={testoSomma({ totale: s.liquidato }).valore} icona="it-card" tono="verde" />,
  recuperato: (s) => <Kpi etichetta="Recuperato" valore={testoSomma({ totale: s.recuperato }).valore} icona="it-refresh" tono="ambra" />,
  quotaPagata: (s) => (
    <Kpi etichetta="Quota pagata sull'ammesso" valore={testoQuotaPagata(s.quotaPagata)} quota={s.quotaPagata == null ? null : s.quotaPagata / 100} icona="it-chart-line" />
  ),
};

function GraficoRipartizione({ r, sinottico, onFiltra }: { r: Ripartizione; sinottico: SinotticoElenco; onFiltra: (r: Ripartizione, valore: string) => void }) {
  const voci = sinottico[r];
  const dati = useMemo(() => graficoRipartizione(r, voci), [r, voci]);
  const testi = TESTI_RIPARTIZIONE[r];
  const onClic = (p: ClicGrafico) => {
    const valore = filtroDalClic(p);
    if (valore) onFiltra(r, valore);
  };
  return (
    <CardGrafico
      titolo={testi.titolo}
      sottotitolo={`Clic su una barra: aggiunge il filtro ${testi.colonna.toLowerCase()}.`}
      dati={dati}
      fonte={`Fonte: TX-0057 (${r}).`}
      altezza={r === 'perStato' ? 'alto' : 'normale'}
      onClic={onClic}
    />
  );
}

export function SinotticoDomande({ sinottico, vista, onFiltra }: { sinottico: SinotticoElenco; vista: Vista; onFiltra: (r: Ripartizione, valore: string) => void }) {
  return (
    <section className="ui-sinottico" aria-labelledby="t-sinottico">
      <h2 id="t-sinottico">Sinottico dell’insieme filtrato</h2>
      <p className="visually-hidden">{`${plurale(sinottico.domande ?? 0, 'domanda', 'domande')} con questi filtri.`}</p>
      <Griglia colonne={4}>
        {vista.indicatori.map((id) => (
          <Fragment key={id}>{INDICATORI[id](sinottico)}</Fragment>
        ))}
      </Griglia>
      {vista.grafici.length > 0 && (
        <Griglia colonne={2}>
          {vista.grafici.map((r) => (
            <GraficoRipartizione key={r} r={r} sinottico={sinottico} onFiltra={onFiltra} />
          ))}
        </Griglia>
      )}
      <p className="ui-fonte">{FONTE}</p>
    </section>
  );
}
