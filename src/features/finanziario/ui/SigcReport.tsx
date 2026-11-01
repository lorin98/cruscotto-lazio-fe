// SigcReport — pattern DS "report" (route /finanziario/sigc, TX-0012/RF012 e TX-0013/RF013, wireframe sigc.html):
// domande SIGC presentate, pagate, da pagare e senza importi; importi SIGC richiesto, ammesso, pagato, pagato oltre
// l'ammesso e ancora da pagare con i conteggi delle domande senza importo. Ogni sezione ha il suo grant e il suo
// perimetro. Lo stato vuoto viene dal conteggio delle domande presentate (RF012), mai da importi a zero. Domande pagate e
// importo pagato hanno la stessa fonte, gli importi della domanda del flusso ASR2-20 (D-09 del backend); pagate e da
// pagare si sovrappongono (domande pagate in parte): la nota lo dice accanto ai dati.
// UI v2 (wireframe sigc v2): barre delle domande e importi in due barre impilate (R13 forma B, revisioni del 31/10/2026),
// con le voci in tabella sotto ogni grafico. Pagina di soli interventi SIGC: col filtro NO SIGC le card sono non pertinenti
// (F3) e mostrano il dato letto senza filtro, in grigio, leggibili e non attivabili.
import { ApriNellElenco } from '../../../entities/domanda';
import { ValoreImporto } from '../../../entities/importo';
import { codiceDalClic, letturaDelTipo } from '../../../shared/lib';
import { CardGrafico, Griglia, InerteSeNonPertinente, NonPertinente, TabellaVoci, VistaQuery } from '../../../shared/ui';
import { useSigcDomande, useSigcImporti } from '../api';
import type { ImportiSigc as ImportiSigcDto } from '../api';
import { datiDelReport } from './esportazioni';
import { useSelezioneSenzaDomandeSigc } from './selezione';
import type { Filtri } from '../lib/filtri';
import { VOCI_DOMANDE_SIGC, graficoDomandeSigc, graficoImportiSigc } from '../lib/grafici';
import { GRANT } from '../lib/report';
import { ConGrant, Numero, PerimetroSezione, vuotoConPerimetro } from './comuni';
import { criteriVoceSigc } from '../lib/link-elenco';
import { useApriNellElenco, useLinkElenco } from './LinkElenco';
import { MOTIVO_SOLO_SIGC } from '../lib/natura';

const TITOLO_DOMANDE = 'Domande SIGC (RF012)';
const TITOLO_IMPORTI = 'Importi SIGC (RF013)';
const VUOTO = vuotoConPerimetro('Nessuna domanda SIGC per i filtri scelti.');
/** Il motivo delle card col filtro NO SIGC (F3). */

function NotaDomande() {
  return (
    <p className="small mb-0">
      {
        "Pagate e da pagare vengono dagli importi della domanda, come l'importo pagato. Una domanda pagata in parte è sia pagata sia da pagare: le voci non sommano alle presentate. Le domande senza importi non si possono classificare; le presentate che non sono in nessuna delle tre voci non sono state ammesse né pagate."
      }
    </p>
  );
}

function NotaImporti() {
  return (
    <p className="small mb-0">
      {
        "Importi della domanda. Ancora da pagare e pagato oltre l'ammesso sono somme per domanda: sulle domande con entrambi gli importi l'ammesso è il pagato più l'ancora da pagare meno il pagato oltre l'ammesso."
      }
    </p>
  );
}

function DomandeSigc({ filtri }: { filtri: Filtri }) {
  const stato = useSigcDomande(filtri);
  const link = useLinkElenco(filtri);
  const apri = useApriNellElenco(filtri);
  const conLink = link('elenco-sigc', { sigc: true }) !== null;
  return (
    <VistaQuery stato={stato} eVuoto={(d) => d.presentate === 0} vuoto={VUOTO}>
      {(d) => (
        <div>
          <CardGrafico
            titolo={TITOLO_DOMANDE}
            sottotitolo={'Presentate, pagate, da pagare e senza importi: pagate e da pagare si sovrappongono.' + (conLink ? " Clic su una barra: le domande nell'elenco operativo" : '')}
            dati={graficoDomandeSigc(d)}
            fonte="Fonte: TX-0012, importi della domanda"
            onClic={(p) => apri('elenco-sigc', criteriVoceSigc(codiceDalClic(p)))}
            scaricamenti={datiDelReport(TITOLO_DOMANDE, 'sigcDomande', filtri)}
          />
          <section className="ui-card mt-3" aria-label="Voci delle domande SIGC">
            <PerimetroSezione perimetro={d.perimetro} />
            <InerteSeNonPertinente>
              <TabellaVoci
                caption="Domande SIGC"
                voci={VOCI_DOMANDE_SIGC.map((v) => ({
                  etichetta: v.etichetta,
                  valore: (
                    <>
                      <Numero valore={d[v.campo]} />
                      <ApriNellElenco variante="testo" indirizzo={link('elenco-sigc', criteriVoceSigc(v.codice))} descrizione={`le domande SIGC ${v.nome.toLowerCase()}`} />
                    </>
                  ),
                }))}
              />
            </InerteSeNonPertinente>
            <NotaDomande />
          </section>
        </div>
      )}
    </VistaQuery>
  );
}

function sottotitoloImporti(conClic: boolean): string {
  return 'Richiesto = ammesso + non ammesso; ammesso = pagato + ancora da pagare.' + (conClic ? " Clic sul grafico: le domande SIGC nell'elenco operativo, con gli stessi importi nel sinottico" : '');
}

function ImportiSigc({ filtri }: { filtri: Filtri }) {
  const stato = useSigcImporti(filtri);
  const indirizzo = useLinkElenco(filtri)('elenco-sigc-importi', { sigc: true });
  const apri = useApriNellElenco(filtri);
  // segnale positivo: il conteggio delle domande SIGC presentate per gli stessi filtri (cache condivisa con RF012)
  const segnale = useSelezioneSenzaDomandeSigc(filtri);
  return (
    <VistaQuery stato={stato} inAttesa={segnale === 'in-attesa'} eVuoto={() => segnale === 'vuota'} vuoto={VUOTO}>
      {(d) => <ContenutoImportiSigc d={d} filtri={filtri} indirizzo={indirizzo} onClic={() => apri('elenco-sigc-importi', { sigc: true })} />}
    </VistaQuery>
  );
}

/** Le due barre impilate (calcolate una volta per il sottotitolo e per la card) e le voci degli importi SIGC. */
function ContenutoImportiSigc({ d, filtri, indirizzo, onClic }: { d: ImportiSigcDto; filtri: Filtri; indirizzo: string | null; onClic: () => void }) {
  const dati = graficoImportiSigc(d);
  return (
    <div>
      <CardGrafico
        titolo={TITOLO_IMPORTI}
        sottotitolo={sottotitoloImporti(indirizzo !== null && dati.opzioni !== null)}
        dati={dati}
        fonte="Fonte: TX-0013, importi della domanda"
        onClic={onClic}
        scaricamenti={datiDelReport(TITOLO_IMPORTI, 'sigcImporti', filtri)}
      />
      <section className="ui-card mt-3" aria-label="Voci degli importi SIGC">
        <PerimetroSezione perimetro={d.perimetro} />
        {/* somme per domanda: un importo assente su tutte le domande e' il dato assente nella fonte (non aggregato) */}
        <InerteSeNonPertinente>
          <TabellaVoci
            caption="Importi SIGC"
            voci={[
              { etichetta: 'Importo richiesto', valore: <ValoreImporto importo={d.richiesto} /> },
              { etichetta: 'Importo ammesso', valore: <ValoreImporto importo={d.ammesso} /> },
              { etichetta: 'Importo pagato', valore: <ValoreImporto importo={d.pagato} /> },
              { etichetta: "Pagato oltre l'ammesso", valore: <ValoreImporto importo={d.pagatoOltreAmmesso} /> },
              { etichetta: 'Ancora da pagare', valore: <ValoreImporto importo={d.ancoraDaPagare} /> },
              { etichetta: 'Domande senza importo richiesto', valore: <Numero valore={d.domandeSenza?.richiesto} /> },
              { etichetta: 'Domande senza importo ammesso', valore: <Numero valore={d.domandeSenza?.ammesso} /> },
              { etichetta: 'Domande senza importo pagato', valore: <Numero valore={d.domandeSenza?.pagato} /> },
            ]}
          />
        </InerteSeNonPertinente>
        <NotaImporti />
        <InerteSeNonPertinente>
          <ApriNellElenco variante="testo" indirizzo={indirizzo} testo="Le domande SIGC nell'elenco operativo" descrizione="(sinottico con richiesto, ammesso, pagato e ancora da pagare)" />
        </InerteSeNonPertinente>
      </section>
    </div>
  );
}

export function SigcReport({ filtri }: { filtri: Filtri }) {
  // col filtro NO SIGC: le card non pertinenti col dato senza filtro (il backend col valore opposto risponde zero)
  const { np, criteri: lettura } = letturaDelTipo(filtri, 'sigc', MOTIVO_SOLO_SIGC);
  return (
    <NonPertinente np={np}>
      <Griglia>
        <ConGrant grant={GRANT.sigcDomande} titolo={TITOLO_DOMANDE}>
          <DomandeSigc filtri={lettura} />
        </ConGrant>
        <ConGrant grant={GRANT.sigcImporti} titolo={TITOLO_IMPORTI}>
          <ImportiSigc filtri={lettura} />
        </ConGrant>
      </Griglia>
    </NonPertinente>
  );
}
