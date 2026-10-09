// SigcReport — pattern DS "report" (route /finanziario/sigc, TX-0012/RF012 e TX-0013/RF013, wireframe sigc.html):
// domande SIGC presentate, pagate e da pagare; importi SIGC richiesto, ammesso, pagato e ancora da pagare con i conteggi
// delle domande senza importo. Ogni sezione ha il suo grant e il suo perimetro. Lo stato vuoto viene dal conteggio delle
// domande presentate (RF012), mai da importi a zero. "Pagato" ha due fonti diverse (OP-FE-05): il conteggio delle
// pagate dagli elenchi di liquidazione, l'importo pagato dal flusso ASR2-20; la nota lo dice accanto ai dati.
// UI v2 (wireframe sigc v2): imbuto delle domande e cascata degli importi, con le voci in tabella sotto ogni grafico.
import { ValoreImporto } from '../../../entities/importo';
import { CardGrafico, Griglia, TabellaVoci, VistaQuery } from '../../../shared/ui';
import { useSigcDomande, useSigcImporti } from '../api';
import { useSelezioneSenzaDomandeSigc } from './selezione';
import type { Filtri } from '../lib/filtri';
import { graficoCascataSigc, graficoImbutoSigc } from '../lib/grafici';
import { GRANT } from '../lib/report';
import { ConGrant, Numero, PerimetroSezione, vuotoConPerimetro } from './comuni';

const TITOLO_DOMANDE = 'Domande SIGC (RF012)';
const TITOLO_IMPORTI = 'Importi SIGC (RF013)';
const VUOTO = vuotoConPerimetro('Nessuna domanda SIGC per i filtri scelti.');

function NotaFonti() {
  return (
    <p className="small mb-0">
      {"Fonti diverse: le domande pagate si contano dagli elenchi di liquidazione, l'importo pagato viene dal flusso ASR2-20. I due dati possono non coincidere."}
    </p>
  );
}

function DomandeSigc({ filtri }: { filtri: Filtri }) {
  const stato = useSigcDomande(filtri);
  return (
    <VistaQuery stato={stato} eVuoto={(d) => d.presentate === 0} vuoto={VUOTO}>
      {(d) => (
        <div>
          <CardGrafico titolo={TITOLO_DOMANDE} sottotitolo="Dalla presentazione al pagamento" dati={graficoImbutoSigc(d)} fonte="Fonte: TX-0012, elenchi di liquidazione" />
          <section className="ui-card mt-3" aria-label="Voci delle domande SIGC">
            <PerimetroSezione perimetro={d.perimetro} />
            <TabellaVoci
              caption="Domande SIGC"
              voci={[
                { etichetta: 'Presentate', valore: <Numero valore={d.presentate} /> },
                { etichetta: 'Pagate (con pagamento in un elenco di liquidazione)', valore: <Numero valore={d.pagate} /> },
                { etichetta: 'Da pagare (presentate meno pagate, comprese le non ammesse)', valore: <Numero valore={d.daPagare} /> },
              ]}
            />
            <NotaFonti />
          </section>
        </div>
      )}
    </VistaQuery>
  );
}

function ImportiSigc({ filtri }: { filtri: Filtri }) {
  const stato = useSigcImporti(filtri);
  // segnale positivo: il conteggio delle domande SIGC presentate per gli stessi filtri (cache condivisa con RF012)
  const segnale = useSelezioneSenzaDomandeSigc(filtri);
  return (
    <VistaQuery stato={stato} inAttesa={segnale === 'in-attesa'} eVuoto={() => segnale === 'vuota'} vuoto={VUOTO}>
      {(d) => (
        <div>
          <CardGrafico titolo={TITOLO_IMPORTI} sottotitolo="Dal richiesto al pagato" dati={graficoCascataSigc(d)} fonte="Fonte: TX-0013, pagato dal flusso ASR2-20" />
          <section className="ui-card mt-3" aria-label="Voci degli importi SIGC">
            <PerimetroSezione perimetro={d.perimetro} />
            <TabellaVoci
              caption="Importi SIGC"
              voci={[
                { etichetta: 'Importo richiesto', valore: <ValoreImporto importo={d.richiesto} aggregato /> },
                { etichetta: 'Importo ammesso', valore: <ValoreImporto importo={d.ammesso} aggregato /> },
                { etichetta: 'Importo pagato (flusso ASR2-20)', valore: <ValoreImporto importo={d.pagato} aggregato /> },
                { etichetta: 'Ancora da pagare', valore: <ValoreImporto importo={d.ancoraDaPagare} aggregato /> },
                { etichetta: 'Domande senza importo richiesto', valore: <Numero valore={d.domandeSenza?.richiesto} /> },
                { etichetta: 'Domande senza importo ammesso', valore: <Numero valore={d.domandeSenza?.ammesso} /> },
                { etichetta: 'Domande senza importo pagato', valore: <Numero valore={d.domandeSenza?.pagato} /> },
              ]}
            />
            <NotaFonti />
          </section>
        </div>
      )}
    </VistaQuery>
  );
}

export function SigcReport({ filtri }: { filtri: Filtri }) {
  return (
    <Griglia>
      <ConGrant grant={GRANT.sigcDomande} titolo={TITOLO_DOMANDE}>
        <DomandeSigc filtri={filtri} />
      </ConGrant>
      <ConGrant grant={GRANT.sigcImporti} titolo={TITOLO_IMPORTI}>
        <ImportiSigc filtri={filtri} />
      </ConGrant>
    </Griglia>
  );
}
