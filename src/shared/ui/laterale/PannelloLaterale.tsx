// PannelloLaterale — dialogo laterale (filtri, drawer di anteprima) su react-aria-components: focus trap, Esc per
// chiudere, ritorno del focus al controllo che l'ha aperto, contenuto della pagina reso inerte mentre e' aperto.
import type { ReactNode } from 'react';
import { Dialog, Heading, Modal, ModalOverlay } from 'react-aria-components';
import { Icona } from '../icona';

export function PannelloLaterale({
  aperto,
  onChiudi,
  titolo,
  sopratitolo,
  descrizione,
  azioni,
  stretto = false,
  children,
}: {
  aperto: boolean;
  onChiudi: () => void;
  titolo: string;
  sopratitolo?: string;
  descrizione?: string;
  azioni?: ReactNode;
  stretto?: boolean;
  children: ReactNode;
}) {
  return (
    <ModalOverlay isOpen={aperto} onOpenChange={(o) => !o && onChiudi()} isDismissable className="ui-velo">
      <Modal className={stretto ? 'ui-laterale ui-laterale--stretto' : 'ui-laterale'}>
        <Dialog className="ui-laterale__dialogo">
          <div className="ui-laterale__testa">
            <div>
              {sopratitolo && <span className="ui-eyebrow">{sopratitolo}</span>}
              <Heading slot="title">{titolo}</Heading>
              {descrizione && <p>{descrizione}</p>}
            </div>
            <button type="button" className="ui-laterale__chiudi" onClick={onChiudi} aria-label={`Chiudi: ${titolo}`}>
              <Icona nome="it-close" />
            </button>
          </div>
          <div className="ui-laterale__corpo">{children}</div>
          {azioni && <div className="ui-laterale__azioni">{azioni}</div>}
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}
