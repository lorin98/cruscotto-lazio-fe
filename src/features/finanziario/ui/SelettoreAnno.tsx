// SelettoreAnno — il selettore d'anno del kit (shared/ui, form con select e "Mostra"; wireframe riserva.html) con gli anni
// del finanziario: il periodo CSR con la regola n+2 per l'anno della riserva (lib/filtri), e "Scegli un anno" come voce
// senza anno.
import { SelettoreAnno as SelettoreDelKit } from '../../../shared/ui';
import { anniDellaRiserva } from '../lib/filtri';

export function SelettoreAnno(props: { id: string; etichetta: string; aiuto: string; anno: number | undefined; onCambia: (anno: number | undefined) => void }) {
  return <SelettoreDelKit {...props} anni={anniDellaRiserva(props.anno)} voceVuota="Scegli un anno" />;
}
