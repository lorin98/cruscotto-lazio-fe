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
  // residuo H-11: il blocco dei lib/ e quello dei test sotto src/ ridefiniscono no-restricted-imports, quindi ognuno ha
  // la sua canary (il difetto originale era proprio in lib/)
  const DA_FEATURE = ['src/features/finanziario/ui/__canary__.ts', 'src/features/finanziario/lib/__canary__.ts', 'src/features/finanziario/ui/__canary__.test.tsx'];
  const ristretti = (m: string[]) => m.filter((x) => x.startsWith('no-restricted-imports'));
  it.each(DA_FEATURE)("scatta su un import dentro l'entity da %s", async (percorso) => {
    const codice = "import { descriviImporto } from '../../../entities/importo/lib/importo';\nexport const x = descriviImporto;\n";
    expect(ristretti(await regole(codice, percorso)).length).toBeGreaterThan(0);
  });
  it.each(DA_FEATURE)("non scatta sul barrel dell'entity da %s", async (percorso) => {
    const codice = "import { descriviImporto } from '../../../entities/importo';\nexport const x = descriviImporto;\n";
    expect(ristretti(await regole(codice, percorso))).toEqual([]);
  });
});

describe('soglie dei lib/ (H-06)', () => {
  // funzione con n rami: n - 1 if e il return finale, complessita' n
  const conRami = (n: number) =>
    `export function rami(x: number): number {\n${Array.from({ length: n - 1 }, (_, i) => `  if (x === ${i}) return ${i};`).join('\n')}\n  return -1;\n}\n`;
  // funzione di n righe, dalla firma alla graffa di chiusura, senza righe vuote ne' commenti
  const conRighe = (n: number) =>
    `export function righe(): number {\n  let x = 0;\n${Array.from({ length: n - 4 }, (_, i) => `  x += ${i};`).join('\n')}\n  return x;\n}\n`;
  const di = (regola: string) => async (codice: string, percorso: string) => (await regole(codice, percorso)).filter((m) => m.startsWith(`${regola}:`));
  const complessita = di('complexity');
  const lunghezza = di('max-lines-per-function');

  it.each(['src/shared/lib/__canary__.ts', 'src/entities/importo/lib/__canary__.ts', 'src/features/finanziario/lib/__canary__.ts'])(
    'in %s scattano con 11 rami e con 61 righe, non al limite (10 e 60)',
    async (percorso) => {
      expect(await complessita(conRami(11), percorso)).toHaveLength(1);
      expect(await lunghezza(conRighe(61), percorso)).toHaveLength(1);
      expect(await complessita(conRami(10), percorso)).toEqual([]);
      expect(await lunghezza(conRighe(60), percorso)).toEqual([]);
    },
  );
  it('non scattano in ui/', async () => {
    const percorso = 'src/features/finanziario/ui/__canary__.ts';
    expect(await complessita(conRami(11), percorso)).toEqual([]);
    expect(await lunghezza(conRighe(61), percorso)).toEqual([]);
  });
});

describe('moduli di prova fuori dal codice di produzione (Z-02)', () => {
  const vietati = (m: string[]) => m.filter((x) => x.startsWith('no-restricted-imports') && x.includes('Z-02'));
  const fixture = "import { FILTRI } from '../../../features/finanziario/testing/fixture';\nexport const x = FILTRI;\n";
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
    const codice = "import { FILTRI } from '../../../features/finanziario/testing/fixture';\nexport const x = FILTRI;\n";
    expect(vietati(await regole(codice, 'src/pages/finanziario/__canary__/page.test.tsx'))).toEqual([]);
  });
  // H-20: nei test delle pagine l'ingresso testing della feature e' ammesso, le altre sotto-cartelle no
  const sottoCartelle = (m: string[]) => m.filter((x) => x.startsWith('no-restricted-imports') && x.includes('invariante #3'));
  it("test delle pagine: fixture della feature ammesse, sotto-cartelle interne vietate", async () => {
    const percorso = 'src/pages/finanziario/__canary__/page.test.tsx';
    const fixture = "import { FILTRI } from '../../../features/finanziario/testing/fixture';\nexport const x = FILTRI;\n";
    const interno = "import { GRANT } from '../../../features/finanziario/lib/report';\nexport const x = GRANT;\n";
    expect(sottoCartelle(await regole(fixture, percorso))).toEqual([]);
    expect(sottoCartelle(await regole(interno, percorso)).length).toBeGreaterThan(0);
  });
  // M-03: il gruppo confronta lo specificatore scritto; quello relativo dentro lo slice va vietato anche lui, compresi i
  // wrapper api/ (fuori dal blocco dei consumatori)
  const fixtureRelativa = "import { FILTRI } from '../testing/fixture';\nexport const x = FILTRI;\n";
  it.each([
    ['src/features/finanziario/api/__canary__.ts', "import { handlersEsempio } from './mock/esempio';\nexport const x = handlersEsempio;\n"],
    ['src/features/finanziario/api/__canary__.ts', fixtureRelativa],
    ['src/features/finanziario/ui/__canary__.ts', fixtureRelativa],
    ['src/features/finanziario/lib/__canary__.ts', fixtureRelativa],
    ['src/features/finanziario/ui/__canary__.ts', "import { handlersEsempio } from '../api/mock/esempio';\nexport const x = handlersEsempio;\n"],
  ])('moduli di prova vietati con lo specificatore relativo, in %s', async (percorso, codice) => {
    expect(vietati(await regole(codice, percorso)).length).toBeGreaterThan(0);
  });
  it('le librerie con testing nel nome non sono moduli di prova', async () => {
    const codice = "import { render } from '@testing-library/react';\nexport const x = render;\n";
    expect(vietati(await regole(codice, 'src/features/finanziario/ui/__canary__.ts'))).toEqual([]);
  });
  it('gli esempi del dev server in api/mock/ restano liberi', async () => {
    const codice = "import { http } from 'msw';\nexport const x = http;\n";
    expect(vietati(await regole(codice, 'src/features/finanziario/api/mock/__canary__.ts'))).toEqual([]);
  });
  it('esempi del dev server nella feature: vietati nel codice di produzione', async () => {
    const codice = "import { handlersEsempio } from '../api/mock/esempio';\nexport const x = handlersEsempio;\n";
    expect(vietati(await regole(codice, 'src/features/finanziario/ui/__canary__.ts')).length).toBeGreaterThan(0);
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
