// Pagina /finanziario (green-fe step6): i filtri dei report (TX-0001). Applicati, riportano al report da cui si e'
// arrivati con "Modifica filtri" (parametro `da`, validato sul catalogo dei report) con anno/esercizio, altrimenti al
// riepilogo. "Azzera" toglie i filtri anche dall'indirizzo.
import { useLocation, useNavigate } from 'react-router';
import { FiltriForm, PAGINA_FILTRI, REPORT_FINANZIARIO, reportVisibili, ricercaDaFiltri, ritornoValido } from '../../../features/finanziario';
import { hasGrant, useAuthStatus } from '../../../shared/api/auth/use-auth-status';
import { PaginaFinanziario } from '../../../widgets/report-finanziario';

export default function Pagina() {
  const naviga = useNavigate();
  const { search } = useLocation();
  const da = new URLSearchParams(search).get('da');
  const { data: auth } = useAuthStatus();
  // senza un'origine valida si va al primo report che il profilo puo' consultare (gate di UX)
  const primo = reportVisibili((g) => hasGrant(auth, g))[0] ?? REPORT_FINANZIARIO[0];
  const ritorno = ritornoValido(da) ?? { percorso: primo.percorso, parametri: new URLSearchParams() };
  const applica = (filtri: Parameters<typeof ricercaDaFiltri>[0]) => {
    const query = [ricercaDaFiltri(filtri), ritorno.parametri.toString()].filter(Boolean).join('&');
    void naviga(query ? `${ritorno.percorso}?${query}` : ritorno.percorso);
  };
  const azzera = () => void naviga(da && ritornoValido(da) ? `${PAGINA_FILTRI.percorso}?da=${encodeURIComponent(da)}` : PAGINA_FILTRI.percorso);
  return (
    <PaginaFinanziario percorso={PAGINA_FILTRI.percorso} conFiltri={false}>
      {(filtri) => (
        <>
          <p>{"I filtri scelti valgono per tutti i report del finanziario e restano nell'indirizzo della pagina."}</p>
          <FiltriForm key={search} valori={filtri} onApplica={applica} onAzzera={azzera} />
        </>
      )}
    </PaginaFinanziario>
  );
}
