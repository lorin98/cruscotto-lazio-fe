// SinotticoDomande — sinottico sopra le righe (pattern interrogazione, ADR 0029; wireframe domande): indicatori e grafici
// della vista per ambito, tutti campi di SinotticoElenco (TX-0057) calcolati dal server sull'INTERO insieme filtrato, mai
// somme della pagina. Un importo assente non e' mai zero (il motivo lo dice la tessera). Mentre arriva il sinottico dei
// criteri nuovi restano i numeri precedenti, dichiarati in aggiornamento (aria-busy e avviso: review v1 V-03). Il clic su
// una barra aggiunge il filtro della voce; la vista Tabella della card ha lo stesso comando per voce, il percorso da
// tastiera (V-18). Le voci che il filtro non accetta non hanno clic (vedi lib/grafici). Kit UI v2: Kpi, CardGrafico.
import { Fragment, useMemo } from 'react';
import type { ReactNode } from 'react';
import { formatNumber, plurale } from '../../../shared/lib';
import { CardGrafico, Griglia, Kpi } from '../../../shared/ui';
import type { ClicGrafico } from '../../../shared/ui';
import type { SinotticoElenco } from '../api';
import { TESTI_RIPARTIZIONE, filtroDalClic, filtroDellaVoce, graficoRipartizione, nomeVoce } from '../lib/grafici';
import type { Ripartizione } from '../lib/grafici';
import { testoAggregato, testoQuotaPagata, testoSomma } from '../lib/formato';
import type { Indicatore, Vista } from '../lib/viste';
import { AvvisoAggiornamento } from './comuni';

const FONTE = 'Fonte: sinottico dell’insieme filtrato (TX-0057), calcolato dal server su tutte le domande, non sulla pagina.';

/** Tessera di una somma: la nota delle domande senza importo e, se c'e', una nota in piu' (quota, liquidato e recuperato). */
function KpiSomma({ etichetta, somma, icona, altro }: { etichetta: string; somma: SinotticoElenco['richiesto']; icona: 'it-chart-line' | 'it-card'; altro?: string }) {
  const t = testoSomma(somma);
  const nota = [t.nota, altro].filter(Boolean).join(' - ') || undefined;
  return <Kpi etichetta={etichetta} valore={t.valore} nota={nota} icona={icona} />;
}

function KpiAggregato({ etichetta, campo, s, tono, icona }: { etichetta: string; campo: 'liquidato' | 'recuperato'; s: SinotticoElenco; tono: 'verde' | 'ambra'; icona: 'it-card' | 'it-refresh' }) {
  const t = testoAggregato(s[campo], campo);
  return <Kpi etichetta={etichetta} valore={t.valore} nota={t.nota} icona={icona} tono={tono} />;
}

const n = (v: number | undefined) => formatNumber(v ?? 0);

/** "liquidato 1,2 M - recuperato 3 k" (wireframe: nota della tessera Ancora da pagare nella vista generale). */
function notaLiquidatoRecuperato(s: SinotticoElenco): string {
  return `liquidato ${testoAggregato(s.liquidato, 'liquidato').valore} - recuperato ${testoAggregato(s.recuperato, 'recuperato').valore}`;
}

// un indicatore per voce della vista (lib/viste): tutti campi del sinottico, mai calcoli sulle righe. Pagato e Ancora da
// pagare portano quota e liquidato/recuperato quando la vista non ha le tessere proprie (wireframe, review v1 V-09).
const INDICATORI: Record<Indicatore, (s: SinotticoElenco, vista: Vista) => ReactNode> = {
  domande: (s) => <Kpi etichetta="Domande" valore={n(s.domande)} nota={`di sostegno ${n(s.sostegno)} - di pagamento ${n(s.pagamento)}`} icona="it-files" />,
  presentate: (s) => <Kpi etichetta="Presentate" valore={n(s.presentate)} nota={`di cui SIGC ${n(s.sigc)}`} icona="it-file-signed" tono="verde" />,
  beneficiari: (s) => <Kpi etichetta="Beneficiari distinti" valore={n(s.beneficiari)} icona="it-user" tono="scuro" />,
  esitiPagamento: (s) => <Kpi etichetta="Pagate / da pagare / senza importi" valore={`${n(s.pagate)} / ${n(s.daPagare)} / ${n(s.senzaImporti)}`} icona="it-check-circle" tono="ambra" />,
  richiesto: (s) => <KpiSomma etichetta="Richiesto" somma={s.richiesto} icona="it-chart-line" />,
  ammesso: (s) => <KpiSomma etichetta="Ammesso" somma={s.ammesso} icona="it-chart-line" />,
  pagato: (s, v) => (
    <KpiSomma etichetta="Pagato" somma={s.pagato} icona="it-card" altro={v.indicatori.includes('quotaPagata') ? undefined : `quota pagata sull'ammesso: ${testoQuotaPagata(s.quotaPagata)}`} />
  ),
  ancoraDaPagare: (s, v) => <KpiSomma etichetta="Ancora da pagare" somma={s.ancoraDaPagare} icona="it-card" altro={v.indicatori.includes('liquidato') ? undefined : notaLiquidatoRecuperato(s)} />,
  liquidato: (s) => <KpiAggregato etichetta="Liquidato negli elenchi" campo="liquidato" s={s} icona="it-card" tono="verde" />,
  recuperato: (s) => <KpiAggregato etichetta="Recuperato" campo="recuperato" s={s} icona="it-refresh" tono="ambra" />,
  quotaPagata: (s) => (
    <Kpi etichetta="Quota pagata sull'ammesso" valore={testoQuotaPagata(s.quotaPagata)} quota={s.quotaPagata == null ? null : s.quotaPagata / 100} icona="it-chart-line" />
  ),
};

/** Tabella equivalente della card con il comando "Filtra" per voce: gli stessi valori della tabella del grafico. */
function TabellaRipartizione({ r, sinottico, onFiltra }: { r: Ripartizione; sinottico: SinotticoElenco; onFiltra: (r: Ripartizione, valore: string) => void }) {
  const t = TESTI_RIPARTIZIONE[r];
  const voci = sinottico[r] ?? [];
  const tabella = graficoRipartizione(r, voci).tabella;
  return (
    <div className="ui-tabella-contenitore">
      <table className="ui-tabella">
        <caption>{tabella.caption}</caption>
        <thead>
          <tr>
            {tabella.colonne.map((c, i) => (
              <th key={c} scope="col" className={i ? 'ui-num' : undefined}>
                {c}
              </th>
            ))}
            <th scope="col">Filtro</th>
          </tr>
        </thead>
        <tbody>
          {tabella.righe.map((riga, k) => {
            const voce = voci[k];
            const valore = voce ? filtroDellaVoce(r, voce) : undefined;
            return (
              <tr key={`${k}-${riga[0]}`}>
                <th scope="row">{riga[0]}</th>
                {riga.slice(1).map((v, i) => (
                  <td key={i} className="ui-num">
                    {v}
                  </td>
                ))}
                <td>
                  {valore && voce ? (
                    <button type="button" className="btn btn-link btn-sm p-0" onClick={() => onFiltra(r, valore)}>
                      {`Filtra per ${t.colonna.toLowerCase()} ${nomeVoce(r, voce)}`}
                    </button>
                  ) : (
                    ''
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

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
      sottotitolo={`Clic su una barra, o "Filtra" nella vista Tabella: aggiunge il filtro ${testi.colonna.toLowerCase()}.`}
      dati={dati}
      fonte={`Fonte: TX-0057 (${r}).`}
      altezza={r === 'perStato' ? 'alto' : 'normale'}
      onClic={onClic}
      tabella={<TabellaRipartizione r={r} sinottico={sinottico} onFiltra={onFiltra} />}
    />
  );
}

export function SinotticoDomande({
  sinottico,
  vista,
  inAggiornamento,
  onFiltra,
}: {
  sinottico: SinotticoElenco;
  vista: Vista;
  inAggiornamento: boolean;
  onFiltra: (r: Ripartizione, valore: string) => void;
}) {
  return (
    <section className="ui-sinottico ui-risultati" aria-labelledby="t-sinottico" aria-busy={inAggiornamento}>
      <h2 id="t-sinottico">Sinottico dell’insieme filtrato</h2>
      <AvvisoAggiornamento attivo={inAggiornamento} testo="Aggiornamento del sinottico: restano visibili i numeri precedenti finché arrivano i nuovi." />
      <p className="visually-hidden">{`${plurale(sinottico.domande ?? 0, 'domanda', 'domande')} con questi filtri.`}</p>
      <Griglia colonne={4}>
        {vista.indicatori.map((id) => (
          <Fragment key={id}>{INDICATORI[id](sinottico, vista)}</Fragment>
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
