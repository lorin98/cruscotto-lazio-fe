# Style guide del frontend

Decisione del 08/10/2026 (configurazione di green-fe, feature `finanziario`).

- Tema: **bootstrap-italia 2.18.2 di base** (design system Designers Italia), senza personalizzazioni del portale.
- Motivo: il requirements-pack non contiene una style guide del portale SIAN o di Regione Lazio (nessun token JSON,
  override SCSS o documento); la scelta del tema base e' stata presa ora, senza aprire un punto aperto.
- Componenti: bootstrap-italia per lo stile, react-aria-components per l'accessibilita' (WCAG 2.2 AA).

Questo file e' la sorgente pinnata (`style_guide_hash`) nello stato green-fe: se arriva una style guide del portale
(token o SCSS) va sostituito o affiancato, e le feature diventano STALE fino al `refresh`.
