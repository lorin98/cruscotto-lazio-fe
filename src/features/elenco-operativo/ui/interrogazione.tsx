// interrogazione — lo scheletro comune delle due pagine dell'interrogazione (domande e pagamenti, review v2 H-04): la
// sezione dei risultati (h2, aggiornamento dichiarato, ordinamento attivo, pagina oltre l'ultima o tabella del server con
// i file e la scelta delle colonne, paginazione, anteprima della riga) e il pannello dei filtri col conteggio dal vivo.
// Le pagine tengono solo sinottico, colonne e piede. Le scelte della pagina da ritrovare tornando dalla scheda (vista e
// colonne) sono subito quelle mostrate (stato locale) e la history ne tiene la copia (useScelteElenco, review v2 V-03).
// I comandi che spariscono col proprio clic ("Ordine predefinito", "Vai all'ultima pagina") portano il focus sull'h2
// della sezione, mai sul body (review v2 X-03, WCAG 2.4.3).
import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Paginazione, PulsantiScarica, TabellaServer, colonneNascoste, useStatoNellaHistory } from '../../../shared/ui';
import type { ColonnaServer } from '../../../shared/ui';
import { CHIAVE_STATO_ELENCO, FIRMA_STATO_ELENCO, statoElencoValido } from '../lib/collegamenti';
import type { StatoElenco } from '../lib/collegamenti';
import { conDimensione, conPagina, dimensioneDi, ordinaPer, ordinamentoDi, ordinamentoPredefinito, paginaDi, senzaOrdinamento, testoOrdinamento, ultimaPagina } from '../lib/criteri';
import type { Criteri, Elenco, NomeFiltro } from '../lib/criteri';
import { testoConteggio } from '../lib/formato';
import { titoloDelCampo } from './colonne';
import { AvvisoAggiornamento, OrdinamentoAttivo, PaginaOltreLUltima } from './comuni';
import { avvisoLimite, scaricamentiElenco } from './esportazioni';
import { PannelloFiltriElenco } from './PannelloFiltriElenco';
import type { useInterrogazione } from './useInterrogazione';

export type Interrogazione = ReturnType<typeof useInterrogazione>;

/**
 * Vista e colonne della pagina: stato locale (la scelta e' subito quella mostrata: la history si aggiorna in una
 * transizione del router) con la copia nello state della voce di history, da cui riparte tornando dalla scheda.
 */
export function useScelteElenco(): [StatoElenco, (s: StatoElenco) => void] {
  const [salvate, salva] = useStatoNellaHistory<StatoElenco>(CHIAVE_STATO_ELENCO, FIRMA_STATO_ELENCO, statoElencoValido);
  const [scelte, setScelte] = useState<StatoElenco>(() => salvate ?? {});
  const cambia = (s: StatoElenco) => {
    setScelte(s);
    salva(s);
  };
  return [scelte, cambia];
}

interface PropsRisultati<T> {
  elenco: Elenco;
  idTitolo: string;
  titolo: string;
  /** "domande", "righe": cosa conta la paginazione. */
  oggetto: string;
  /** Oggetto dei file ("l'elenco delle domande"). */
  oggettoFile: string;
  totale: number;
  righe: readonly T[];
  /** Criteri appena scritti (useCriteri.criteriScritti): pagina, dimensione e ordinamento senza tornare indietro (X-02). */
  criteri: Criteri;
  applica: (c: Criteri) => void;
  aggiornando: boolean;
  tabella: {
    caption: string;
    colonne: ColonnaServer<T>[];
    chiaveRiga: (r: T) => string;
    etichettaRiga: (r: T) => string;
    piede: Partial<Record<string, ReactNode>>;
    /** Chiave che rimonta la tabella (la vista per ambito: colonne di partenza diverse). */
    chiave?: string;
  };
  /** Colonne nascoste scelte dall'utente (assenti = quelle di partenza) e il loro cambio. */
  nascoste: readonly string[] | undefined;
  onNascoste: (n: string[]) => void;
  anteprima: (riga: T | null, chiudi: () => void) => ReactNode;
}

export function RisultatiInterrogazione<T>({ elenco, idTitolo, titolo, oggetto, oggettoFile, totale, righe, criteri, applica, aggiornando, tabella, nascoste, onNascoste, anteprima }: PropsRisultati<T>) {
  const [aperta, setAperta] = useState<T | null>(null);
  const h2 = useRef<HTMLHeadingElement>(null);
  const ordinamento = ordinamentoDi(criteri, elenco);
  const dimensione = dimensioneDi(criteri);
  const ultima = ultimaPagina(totale, dimensione);
  const limite = avvisoLimite(elenco, totale);
  /** Un comando che sparisce col proprio clic: il focus va sull'h2 della sezione (X-03). */
  const eSulTitolo = (c: Criteri) => {
    applica(c);
    h2.current?.focus();
  };
  return (
    <section className="ui-card ui-risultati" aria-labelledby={idTitolo} aria-busy={aggiornando}>
      <div className="ui-card__testa">
        <h2 id={idTitolo} ref={h2} tabIndex={-1}>
          {titolo}
        </h2>
      </div>
      <AvvisoAggiornamento attivo={aggiornando} />
      <OrdinamentoAttivo
        testo={testoOrdinamento(titoloDelCampo(elenco, ordinamento.campo), ordinamento)}
        predefinito={ordinamentoPredefinito(ordinamento, elenco)}
        onPredefinito={() => eSulTitolo(senzaOrdinamento(criteri))}
      />
      {paginaDi(criteri) > ultima && totale > 0 ? (
        <PaginaOltreLUltima pagina={paginaDi(criteri)} ultima={ultima} onUltima={() => eSulTitolo(conPagina(criteri, ultima))} />
      ) : (
        <TabellaServer
          key={tabella.chiave}
          caption={tabella.caption}
          colonne={tabella.colonne}
          righe={righe}
          chiaveRiga={tabella.chiaveRiga}
          ordinamento={ordinamento}
          // ordinare non sposta il focus: resta sull'intestazione, e il nuovo ordinamento lo dice OrdinamentoAttivo
          onOrdina={(campo) => applica(ordinaPer(criteri, elenco, campo))}
          onRiga={setAperta}
          etichettaRiga={tabella.etichettaRiga}
          piede={tabella.piede}
          nascoste={nascoste ? new Set(nascoste) : colonneNascoste(tabella.colonne)}
          onNascoste={(n) => onNascoste([...n])}
          strumenti={
            <>
              <PulsantiScarica oggetto={oggettoFile} scaricamenti={scaricamentiElenco(elenco, criteri, totale)} />
              {limite && <p className="ui-nota w-100 mb-0">{limite}</p>}
            </>
          }
        />
      )}
      <Paginazione
        pagina={paginaDi(criteri)}
        dimensione={dimensione}
        totale={totale}
        oggetto={oggetto}
        onPagina={(p) => eSulTitolo(conPagina(criteri, p))}
        // la dimensione cambia senza spostare il focus dalla select (WCAG 3.2.2)
        onDimensione={(d) => applica(conDimensione(criteri, d))}
      />
      {anteprima(aperta, () => setAperta(null))}
    </section>
  );
}

/** Lo stato della lettura principale della pagina (elenco delle domande o dei pagamenti) che il pannello conta. */
interface LetturaPrincipale {
  data?: { totaleRighe?: number };
  isFetching: boolean;
  isError: boolean;
  error: unknown;
}

/** Il pannello dei filtri dell'interrogazione col conteggio dal vivo della lettura principale (V-03). */
export function PannelloInterrogazione({
  i,
  elenco,
  lettura,
  aggiornando,
  altriErrori = [],
  unita,
}: {
  i: Interrogazione;
  elenco: Elenco;
  lettura: LetturaPrincipale;
  aggiornando: boolean;
  /** Errori di altre letture della pagina (il sinottico delle domande). */
  altriErrori?: readonly unknown[];
  unita: readonly [string, string];
}) {
  return (
    <PannelloFiltriElenco
      aperto={i.pannello.aperto}
      onChiudi={i.pannello.chiudi}
      elenco={elenco}
      criteri={i.criteriVisti}
      applica={i.applicaRitardato}
      ritira={(nomi: NomeFiltro[]) => i.ritira(nomi)}
      valori={i.valori}
      errori={[...altriErrori, lettura.error].filter((e) => e != null)}
      conteggio={testoConteggio(lettura.data?.totaleRighe, unita, {
        inAggiornamento: i.inAttesa || aggiornando || (lettura.isFetching && !lettura.data),
        inErrore: lettura.isError,
      })}
      onAzzera={i.togliTutti}
    />
  );
}
