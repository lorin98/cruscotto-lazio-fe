// icona.tsx — icone dagli sprite di bootstrap-italia (stesso dominio, CSP img-src 'self'). Decorative per default:
// il significato lo porta sempre il testo accanto o l'aria-label del controllo.
import sprite from 'bootstrap-italia/dist/svg/sprites.svg?url';

export type NomeIcona =
  | 'it-search' | 'it-close' | 'it-funnel' | 'it-chevron-right' | 'it-download' | 'it-info-circle' | 'it-user' | 'it-logout'
  | 'it-arrow-left' | 'it-arrow-right' | 'it-calendar' | 'it-chart-line' | 'it-files' | 'it-folder' | 'it-pa' | 'it-list'
  | 'it-refresh' | 'it-map-marker' | 'it-burger' | 'it-card' | 'it-box' | 'it-inbox' | 'it-clock' | 'it-plus' | 'it-minus'
  | 'it-help-circle' | 'it-external-link' | 'it-file-csv' | 'it-file-image' | 'it-file-xlsx' | 'it-presentation' | 'it-settings' | 'it-warning-circle' | 'it-check-circle';

export function Icona({ nome, classe = '' }: { nome: NomeIcona; classe?: string }) {
  return (
    <svg className={`icon ui-icona ${classe}`.trim()} aria-hidden="true" focusable="false">
      <use href={`${sprite}#${nome}`} />
    </svg>
  );
}
