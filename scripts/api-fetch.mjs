// api-fetch.mjs — greenfield: NON scarica da un backend vivo. Copia+hash delle spec STATICHE
// dell'handover (gia' riconciliate dal gate BE, verificate da fe-handover-check.sh a step0).
// Deterministico: scrive specs/.spec-lock.json con lo sha256 di ogni spec.
import { readdirSync, readFileSync, writeFileSync, copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

const SRC = process.env.HANDOVER_SPEC_DIR || './specs';
const DEST = './specs';
if (!existsSync(DEST)) mkdirSync(DEST, { recursive: true });

// SRC mancante -> messaggio diagnostico pulito col prefisso, non uno stack ENOENT grezzo di node.
if (!existsSync(SRC)) {
  console.error(`api:fetch: cartella spec dell'handover assente: ${SRC}`);
  process.exit(1);
}

const files = readdirSync(SRC)
  .filter((f) => /^openapi-.+\.json$/.test(f))
  .sort();

if (files.length === 0) {
  console.error(`api:fetch: nessuna spec openapi-*.json in ${SRC}`);
  process.exit(1);
}

const lock = {};
for (const f of files) {
  if (SRC !== DEST) copyFileSync(join(SRC, f), join(DEST, f));
  const buf = readFileSync(join(DEST, f));
  lock[f] = 'sha256:' + createHash('sha256').update(buf).digest('hex');
}

const keys = Object.keys(lock).sort();
writeFileSync(join(DEST, '.spec-lock.json'), JSON.stringify(lock, keys, 2) + '\n');
console.log(`api:fetch: ${files.length} spec pinnate`);
