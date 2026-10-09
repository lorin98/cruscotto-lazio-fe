// SelettoreAnno — form con select singola e pulsante "Mostra" (wireframe riserva.html e verifica-smp.html) per l'anno
// della riserva e l'esercizio della verifica SMP: la scelta si applica solo al submit, cosi' scorrere gli anni con la
// tastiera non crea voci di cronologia ne' letture al backend. Gli anni proposti vengono da lib (periodo CSR con la
// regola n+2); un anno valido gia' scelto resta selezionabile. Select nativa bootstrap-italia, nessun react-aria, col
// markup del suo select-wrapper (label e select senza form-select: con entrambi le frecce erano due, quella del browser
// lasciata da select-wrapper e quella di sfondo di form-select). Il wrapper sta dentro la colonna, non sulla colonna.
import { useEffect, useState } from 'react';
import { anniSelezionabili, isAnnoValido } from '../lib/filtri';

export function SelettoreAnno(props: {
  id: string;
  etichetta: string;
  aiuto: string;
  tipo: 'riserva' | 'esercizio';
  anno: number | undefined;
  onCambia: (anno: number | undefined) => void;
}) {
  const { id, etichetta, aiuto, tipo, anno, onCambia } = props;
  const [scelta, setScelta] = useState(anno === undefined ? '' : String(anno));
  useEffect(() => setScelta(anno === undefined ? '' : String(anno)), [anno]);
  return (
    <form
      className="row g-2 align-items-end mb-3"
      onSubmit={(e) => {
        e.preventDefault();
        const n = Number(scelta);
        onCambia(scelta !== '' && isAnnoValido(n) ? n : undefined);
      }}
    >
      <div className="col-sm-6 col-md-4">
        <div className="select-wrapper">
          <label htmlFor={id}>{etichetta}</label>
          <select id={id} value={scelta} aria-describedby={`${id}-aiuto`} onChange={(e) => setScelta(e.target.value)}>
            <option value="">Scegli un anno</option>
            {anniSelezionabili(tipo, anno).map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="col-auto">
        <button type="submit" className="btn btn-primary">
          Mostra
        </button>
      </div>
      <p className="form-text col-12 mb-0" id={`${id}-aiuto`}>
        {aiuto}
      </p>
    </form>
  );
}
