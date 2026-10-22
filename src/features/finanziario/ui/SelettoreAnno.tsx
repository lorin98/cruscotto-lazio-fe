// SelettoreAnno — il selettore d'anno del kit (shared/ui, form con select e "Mostra"; wireframe riserva.html e
// verifica-smp.html) con gli anni del finanziario: il periodo CSR con la regola n+2 per l'anno della riserva e
// l'esercizio della verifica SMP (lib/filtri), e "Scegli un anno" come voce senza anno.
import { SelettoreAnno as SelettoreDelKit } from '../../../shared/ui';
import { anniSelezionabili } from '../lib/filtri';

export function SelettoreAnno(props: { id: string; etichetta: string; aiuto: string; tipo: 'riserva' | 'esercizio'; anno: number | undefined; onCambia: (anno: number | undefined) => void }) {
  const { tipo, ...resto } = props;
  return <SelettoreDelKit {...resto} anni={anniSelezionabili(tipo, props.anno)} voceVuota="Scegli un anno" />;
}
