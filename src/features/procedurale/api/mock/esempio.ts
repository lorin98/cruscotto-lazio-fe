// esempio.ts — dati DI ESEMPIO del procedurale per il dev server con MSW (npm run dev): le letture di prova della feature
// (testing/letture.ts sulle domande degli scenari di accettazione del backend: nessun dato reale), che rispondono come il
// backend ai parametri della query (intervento, obiettivi, stato area programmazione), con le domande non ancora
// rilasciate di SRD01 (SC-PC_IN_COMPILAZIONE) e le fonti non attive di oggi (atto di concessione, sottofasi della domanda
// di sostegno, pagato per Unit Amount); i file CSV e XLSX sono un testo d'esempio. Solo il worker del browser li usa
// (browser.ts li raccoglie per convenzione di percorso); i test montano da se' le letture che servono.
import type { RequestHandler } from 'msw';
import { lettureProcedurale } from '../../testing/letture';

export const handlersEsempio: RequestHandler[] = lettureProcedurale({ varianti: { nonRilasciate: true } }).handlers;
