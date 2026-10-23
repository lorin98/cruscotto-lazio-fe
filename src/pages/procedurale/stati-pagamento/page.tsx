// Pagina /procedurale/stati-pagamento (green-fe step6, flusso stati): compone dal barrel della feature. Barra dei filtri, h1 col focus
// al cambio di pagina e contenuto stanno nel componente della feature (stati delle domande di pagamento); i criteri dei report stanno
// nell'indirizzo.
import { StatiPagamento } from '../../../features/procedurale';

export default function Pagina() {
  return <StatiPagamento />;
}
