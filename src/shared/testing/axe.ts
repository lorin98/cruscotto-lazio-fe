// axe.ts — helper a11y LOCALE dei test (green-fe step7, foundation pins: axe-core diretto, niente vitest-axe).
// Tag WCAG 2.2 (wcag2a, wcag2aa, wcag22aa). Ogni esecuzione appende una riga al sidecar AXE_LOG: step8 ne fa
// l'aggregato e pretende runs >= 1 (una suite a11y saltata non passa come "0 violazioni"). In jsdom le regole di
// layout (contrasto) restano `incomplete`: residuo dichiarato, mai venduto per conforme.
import axe from 'axe-core';
import type { RunOptions } from 'axe-core';
import { appendFileSync } from 'node:fs';

const RUN: RunOptions = { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag22aa'] } };

export async function expectNoA11yViolations(node: Element): Promise<void> {
  const r = await axe.run(node, RUN);
  const log = process.env.AXE_LOG;
  if (log) appendFileSync(log, JSON.stringify({ violations: r.violations.length, incomplete: r.incomplete.length }) + '\n');
  if (r.violations.length > 0) {
    const msg = r.violations.map((v) => `${v.id}: ${v.help}`).join('\n');
    throw new Error(`a11y violations (${r.violations.length}):\n${msg}`);
  }
}
