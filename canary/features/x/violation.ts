// Canary fixture (features -> pages): VIOLAZIONE FSD NOTA. boundaries/dependencies DEVE segnalarla.
// Se il check fsd_import gira questa canary e NON ottiene l'errore, la config e' inerte => il check fallisce.
import { canaryPageValue } from '../../pages/y/page';

export const canaryFeatureValue = canaryPageValue;
