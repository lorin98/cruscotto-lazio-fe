// home.tsx — porta d'ingresso dell'applicazione (dopo il login il BFF torna su "/"). Non e' una feature (nessuna
// authz-surface propria): resta fuori dal manifest. Mostra i quattro ambiti del catalogo (aree.ts, lo stesso del menu
// laterale) in una griglia bilanciata, nell'ordine fisso del catalogo: quattro colonne, due su due, una sola sugli schermi
// stretti; mai tre piu' una.
// Ogni ambito ha il suo colore. La card di un'area porta alla prima pagina visibile per i grant dell'utente (hide-by-role
// di sola UX, l'enforcement resta server-side) e ne mostra i numeri chiave.
import { Link } from 'react-router';
import { hasGrant, useAuthStatus } from '../shared/api/auth/use-auth-status';
import { NOME_APPLICAZIONE } from '../shared/config/applicazione';
import { resolveLoginPath } from '../shared/config/base-path';
import { Icona, useFocusTitolo } from '../shared/ui';
import { AMBITI, STRUMENTI, areeVisibili } from './aree';
import type { Area, PaginaArea, SchedaArea } from './aree';
import { SessioneNonVerificabile } from './sessione-non-verificabile';

function Contenuti({ voci }: { voci: readonly string[] }) {
  return (
    <ul className="ui-ambito__contenuti">
      {voci.map((v) => (
        <li key={v}>
          <Icona nome="it-check" />
          {v}
        </li>
      ))}
    </ul>
  );
}

/** Fascia colorata della card: icona, stato, titolo e descrizione dell'ambito. */
function Testa({ scheda, id, stato }: { scheda: SchedaArea; id?: string; stato: string }) {
  return (
    <div className="ui-ambito__testa">
      <Icona nome={scheda.icona} classe="ui-ambito__filigrana" />
      <span className="ui-ambito__icona">
        <Icona nome={scheda.icona} />
      </span>
      <span className="ui-ambito__stato">{stato}</span>
      <h2 id={id}>{scheda.titolo}</h2>
      <p>{scheda.descrizione}</p>
    </div>
  );
}

/** Un'area: con pagine visibili porta alla prima, altrimenti dice che il profilo non la comprende. */
function CardArea({ area, pagine }: { area: Area; pagine: PaginaArea[] }) {
  const id = `area-${area.chiave}`;
  const ingresso = pagine[0];
  const Anteprima = ingresso ? area.Anteprima : undefined;
  return (
    <li>
      <section className={`ui-ambito ui-ambito--${area.tono}${ingresso ? ' ui-ambito--attivo' : ''}`} aria-labelledby={id}>
        <Testa scheda={area} id={id} stato={ingresso ? 'Disponibile' : 'Non nel tuo profilo'} />
        <div className="ui-ambito__corpo">{Anteprima ? <Anteprima altrimenti={<Contenuti voci={area.contenuti} />} /> : <Contenuti voci={area.contenuti} />}</div>
        <div className="ui-ambito__piede">
          {ingresso ? (
            <Link className="ui-ambito__entra" to={ingresso.percorso}>
              {`Entra in ${area.titolo}`}
              <Icona nome="it-arrow-right" />
            </Link>
          ) : (
            <span className="ui-ambito__entra ui-ambito__entra--spento">Non disponibile per il tuo profilo</span>
          )}
        </div>
      </section>
    </li>
  );
}

function Ambiti({ haGrant }: { haGrant: (grant: string) => boolean }) {
  const visibili = areeVisibili(haGrant);
  return (
    <>
      {visibili.length === 0 && <p role="status">Il tuo profilo non ha ancora aree del cruscotto da consultare.</p>}
      <nav className="ui-ambiti" aria-label="Aree del cruscotto">
        <ul className="ui-ambiti__griglia">
          {AMBITI.map((a) => (
            <CardArea key={a.chiave} area={a} pagine={visibili.find((v) => v.area === a)?.pagine ?? []} />
          ))}
        </ul>
      </nav>
    </>
  );
}

/** Strumento trasversale (elenco operativo): una card larga sotto gli ambiti, con un link per pagina visibile. */
function CardStrumento({ area, pagine }: { area: Area; pagine: PaginaArea[] }) {
  const id = `strumento-${area.chiave}`;
  return (
    <section className="ui-card ui-strumento ui-dissolvenza" aria-labelledby={id}>
      <div className="ui-strumento__testo">
        <h2 id={id}>
          <Icona nome={area.icona} />
          {area.titolo}
        </h2>
        <p>{area.descrizione}</p>
      </div>
      <ul className="ui-strumento__link">
        {pagine.map((p) => (
          <li key={p.percorso}>
            <Link className="btn btn-primary" to={p.percorso}>
              {p.voceMenu}
              <Icona nome="it-arrow-right" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Strumenti({ haGrant }: { haGrant: (grant: string) => boolean }) {
  const visibili = areeVisibili(haGrant, STRUMENTI);
  if (visibili.length === 0) return null;
  return (
    <nav className="ui-strumenti-home" aria-label="Strumenti del cruscotto">
      {visibili.map(({ area, pagine }) => (
        <CardStrumento key={area.chiave} area={area} pagine={pagine} />
      ))}
    </nav>
  );
}

function Benvenuto() {
  const h1 = useFocusTitolo<HTMLHeadingElement>('Home');
  return (
    <section className="ui-hero ui-benvenuto ui-dissolvenza" aria-labelledby="titolo-home">
      <span className="ui-eyebrow">Regione Lazio · ARSIAL</span>
      <h1 id="titolo-home" ref={h1} tabIndex={-1}>
        {NOME_APPLICAZIONE}
      </h1>
      <p>Monitoraggio del Complemento di Sviluppo Rurale 2023-2027 della Regione Lazio: scegli un ambito per entrare.</p>
    </section>
  );
}

export function Home() {
  const { data: auth, isLoading, isError, refetch } = useAuthStatus();
  if (isLoading) return <p role="status">Caricamento…</p>;
  // stato della sessione non verificabile: come RequireGrant, niente invito ad accedere che rimanderebbe al giro login -> /
  if (isError && auth === undefined) {
    return (
      <main className="ui-pagina" id="contenuto">
        <Benvenuto />
        <SessioneNonVerificabile onRiprova={() => void refetch()} />
      </main>
    );
  }
  return (
    <main className="ui-pagina" id="contenuto">
      <Benvenuto />
      {!auth?.authenticated ? (
        <section className="ui-card">
          <p>Per consultare il cruscotto devi accedere con le tue credenziali.</p>
          <a className="btn btn-primary" href={resolveLoginPath()}>
            Accedi
          </a>
        </section>
      ) : (
        <>
          <Ambiti haGrant={(g) => hasGrant(auth, g)} />
          <Strumenti haGrant={(g) => hasGrant(auth, g)} />
        </>
      )}
    </main>
  );
}
