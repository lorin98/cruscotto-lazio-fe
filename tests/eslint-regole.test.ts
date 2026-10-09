// @vitest-environment node
// Canary delle regole statiche (review step9 R-03, R-11): la regola deve SCATTARE su una violazione nota, non solo
// risultare configurata (stessa dottrina delle canary FSD/MSW/CSRF del gate). Testo lintato in memoria con il percorso
// che decide quali blocchi della flat config valgono: nessun file di prova sul disco.
import { describe, expect, it } from 'vitest';
import { ESLint } from 'eslint';

const eslint = new ESLint({ cwd: process.cwd() });
async function regole(codice: string, filePath: string): Promise<string[]> {
  const [r] = await eslint.lintText(codice, { filePath });
  return r.messages.map((m) => `${m.ruleId}: ${m.message}`);
}

describe('layer lib/: zero React (H-06, R-03)', () => {
  const reactInLib = "import { useState } from 'react';\nexport const x = useState;\n";
  it.each(['src/features/finanziario/lib/__canary__.ts', 'src/entities/importo/lib/__canary__.ts', 'src/shared/lib/__canary__.ts'])(
    'scatta su un import di React in %s',
    async (percorso) => {
      expect((await regole(reactInLib, percorso)).some((m) => m.startsWith('no-restricted-imports'))).toBe(true);
    },
  );
  it('e resta il ban del client generato nello stesso blocco', async () => {
    const generato = "import { tx0011 } from '../../../shared/api/generated/finanziario/finanziario/finanziario';\nexport const x = tx0011;\n";
    expect((await regole(generato, 'src/features/finanziario/lib/__canary__.ts')).some((m) => m.startsWith('no-restricted-imports'))).toBe(true);
  });
});

describe('confini fra slice delle feature (Z-02)', () => {
  const DA_ALTRA = 'src/features/__altra__/ui/__canary__.ts';
  const confini = (m: string[]) => m.filter((x) => x.startsWith('boundaries/'));
  it('scatta su un import dentro un altro slice', async () => {
    const codice = "import { Panoramica } from '../../finanziario/ui/Panoramica';\nexport const x = Panoramica;\n";
    expect(confini(await regole(codice, DA_ALTRA)).length).toBeGreaterThan(0);
  });
  it("non scatta sul barrel dell'altro slice", async () => {
    const codice = "import { Panoramica } from '../../finanziario';\nexport const x = Panoramica;\n";
    expect(confini(await regole(codice, DA_ALTRA))).toEqual([]);
  });
  it('non scatta dentro lo stesso slice', async () => {
    const codice = "import { testoUltimiDati } from '../lib/aggiornamento';\nexport const x = testoUltimiDati;\n";
    expect(confini(await regole(codice, 'src/features/finanziario/ui/__canary__.ts'))).toEqual([]);
  });
});

describe("un'entity si importa solo dal suo barrel (H-11)", () => {
  const DA_FEATURE = 'src/features/finanziario/ui/__canary__.ts';
  const ristretti = (m: string[]) => m.filter((x) => x.startsWith('no-restricted-imports'));
  it("scatta su un import dentro l'entity", async () => {
    const codice = "import { descriviImporto } from '../../../entities/importo/lib/importo';\nexport const x = descriviImporto;\n";
    expect(ristretti(await regole(codice, DA_FEATURE)).length).toBeGreaterThan(0);
  });
  it("non scatta sul barrel dell'entity", async () => {
    const codice = "import { descriviImporto } from '../../../entities/importo';\nexport const x = descriviImporto;\n";
    expect(ristretti(await regole(codice, DA_FEATURE))).toEqual([]);
  });
});

describe('moduli di prova fuori dal codice di produzione (Z-02)', () => {
  const vietati = (m: string[]) => m.filter((x) => x.startsWith('no-restricted-imports') && x.includes('Z-02'));
  const fixture = "import { FILTRI } from '../../../shared/testing/fixture-finanziario';\nexport const x = FILTRI;\n";
  const mock = "import { handlers } from '../../../shared/api/mock/handlers';\nexport const x = handlers;\n";
  it.each([
    ['src/features/finanziario/ui/__canary__.ts', fixture],
    ['src/features/finanziario/lib/__canary__.ts', fixture],
    ['src/widgets/report-finanziario/ui/__canary__.ts', fixture],
    ['src/features/finanziario/ui/__canary__.ts', mock],
  ])('scatta in %s', async (percorso, codice) => {
    expect(vietati(await regole(codice, percorso)).length).toBeGreaterThan(0);
  });
  it('non scatta nei test delle pagine', async () => {
    const codice = "import { FILTRI } from '../../../shared/testing/fixture-finanziario';\nexport const x = FILTRI;\n";
    expect(vietati(await regole(codice, 'src/pages/finanziario/__canary__/page.test.tsx'))).toEqual([]);
  });
});

describe('mutator BFF: X-Requested-With obbligatorio (R-11)', () => {
  const MUTATOR = 'src/shared/api/mutator/bff-mutator.ts';
  const con = (extra: string) =>
    `import Axios from 'axios';\nexport const AXIOS_INSTANCE = Axios.create({ withCredentials: true, xsrfCookieName: 'XSRF-TOKEN', xsrfHeaderName: 'X-XSRF-TOKEN'${extra} });\n`;
  it('scatta senza header X-Requested-With', async () => {
    expect((await regole(con(''), MUTATOR)).some((m) => m.startsWith('local/bff-mutator-armed') && m.includes('X-Requested-With'))).toBe(true);
  });
  it('non scatta con X-Requested-With inline', async () => {
    const msg = await regole(con(", headers: { 'X-Requested-With': 'XMLHttpRequest' }"), MUTATOR);
    expect(msg.filter((m) => m.startsWith('local/bff-mutator-armed'))).toEqual([]);
  });
});
