// usePngDelGrafico — il PNG di una card del grafico (review v3 H-01: fuori dalla card, che resta composizione): tiene
// l'istanza del grafico disegnato e prepara il file con l'intestazione di NFR-50 (V-01). Le righe della pagina (filtri,
// profilo, ultimo dato sincronizzato) arrivano da ContestoIntestazione, che la pagina fornisce; titolo e fonte dalla card.
import { createContext, useCallback, useContext, useRef } from 'react';
import { COLORI } from '../../lib/grafici';
import { righeIntestazione } from '../../lib/intestazione';
import { blobDaDataUrl, salvaFile } from '../salva-file';
import type { Scaricamento } from '../scarica/PulsantiScarica';
import { pngDelGrafico } from './echarts';
import type { IstanzaGrafico } from './echarts';

/** Righe di contesto della pagina per l'intestazione dei file generati nel browser; vuoto fuori da una pagina che le dà. */
export const ContestoIntestazione = createContext<readonly string[]>([]);

/** `attivo` falso (vista Tabella o grafico non disegnabile): nessun PNG. `file` = nome del file salvato. */
export function usePngDelGrafico({ titolo, fonte, file, attivo }: { titolo: string; fonte: string; file: string; attivo: boolean }) {
  const istanza = useRef<IstanzaGrafico | null>(null);
  const contesto = useContext(ContestoIntestazione);
  const onIstanza = useCallback((c: IstanzaGrafico | null) => {
    istanza.current = c;
  }, []);
  const png: Scaricamento[] = attivo
    ? [
        {
          formato: 'PNG',
          file,
          scarica: () => {
            const c = istanza.current;
            if (!c) throw new Error('grafico non ancora disegnato');
            const intestazione = righeIntestazione({ titolo, fonte, contesto, estrattoIl: new Date() });
            salvaFile(blobDaDataUrl(pngDelGrafico(c, { sfondo: COLORI.superficie, intestazione })), file);
          },
        },
      ]
    : [];
  return { onIstanza, png };
}
