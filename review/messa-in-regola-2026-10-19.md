# Messa in regola delle modifiche del 19/10/2026

Il 19/10/2026 si pushano su `main` i commit e754863 (handover di finanziario riallineato al backend), 2767efe
(previsione di pagamento si'/no nella verifica SMP, D-11 del backend) e cb79f67 (il riepilogo parte dal grafico).
Scelta dell'utente del 19/10: prima il push, poi la messa in regola secondo la procedura green-fe. Test verdi
(vitest 985/985, typecheck, lint), ma la catena del plugin non e' stata ripercorsa.

## Cosa manca (feature finanziario)
- `handover.json` cambiato dopo la verifica di `step0-config` (`handover_verified`): va rifatto il refresh
  (`/green-fe:refresh`), dopo il nuovo sigillo del manifest di finanziario lato backend.
- Wireframe `sigc` modificato dopo l'approvazione (`wireframes/sigc/verifica-smp.html`, `sigc.md`): da riapprovare.
- `step8-gate` e `step9-review` non rieseguiti.

## Sequenza
1. Messa in regola del backend (approvazioni, gate, manifest: `cruscotto-lazio-be/review/messa-in-regola-2026-10-19.md`).
2. Refresh del finanziario, riapprovazione del wireframe `sigc`, `step8-gate`.
3. Review FULL sul delta del 19/10.
