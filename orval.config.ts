import { defineConfig } from 'orval';
import { readdirSync } from 'node:fs';

// D-F4-1 NO-MERGE: un progetto orval per slice, output separati. Slice-agnostico: un progetto per
// ogni specs/openapi-<slice>.json presente (le spec dell'handover, gia' riconciliate dal gate BE).
// Tag collidenti fra slice e schemi condivisi finiscono in namespace distinti (innocuo).
// externalRefs resta fail-closed (le spec sono autocontenute): NON disattivarlo.
// Nessun useQuery/useMutation forzato: orval sceglie per metodo (GET => query, POST/... => mutation).

const MUTATOR = { path: './src/shared/api/mutator/bff-mutator.ts', name: 'customInstance' };

type OrvalConfig = Parameters<typeof defineConfig>[0];

const specs = readdirSync('./specs')
  .filter((f) => /^openapi-.+\.json$/.test(f))
  .sort();

const config: Record<string, unknown> = {};
for (const file of specs) {
  const slice = file.replace(/^openapi-/, '').replace(/\.json$/, '');
  config[slice] = {
    input: { target: `./specs/${file}` },
    output: {
      target: `./src/shared/api/generated/${slice}`,
      client: 'react-query',
      mode: 'tags-split',
      httpClient: 'axios',
      clean: true,
      mock: { generators: [{ type: 'msw', delay: false }] },
      override: { mutator: MUTATOR, query: { version: 5, signal: true } },
    },
  };
}

export default defineConfig(config as OrvalConfig);
