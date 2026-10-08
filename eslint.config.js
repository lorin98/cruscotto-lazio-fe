// eslint.config.js — flat config (ESLint 10). Confini FSD via eslint-plugin-boundaries.
// Difesa fail-open (spike S3): boundaries/element-types e' INERTE sui file non classificati =>
// si armano SEMPRE anche no-unknown + no-unknown-files, e il check fsd_import ha una canary.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import boundaries from 'eslint-plugin-boundaries';
import globals from 'globals';
// 4j Thread A: regole di sicurezza AST (parser reale) che sostituiscono i lexer bash (fe-gate _sc/_scstr per
// MSW-listen-safety; check-csrf-static.sh per la credenziale a-backtick). fe-gate.sh adjudica le loro violazioni
// da eslint.json + prova config-armed (--print-config) + canary (step8-gate). Vedi eslint-local/index.js.
import local from './eslint-local/index.js';

// Oracolo credenziale del contratto BFF (AST — 4j: UNICA autorita', il grep bash check-csrf-static.sh e' ELIMINATO).
// Estratto in un const perche' va applicato a TUTTE le estensioni che il bundler impacchetta: eslint deve coprire
// non solo .ts/.tsx ma anche .js/.jsx/.mjs/.cjs/.mts/.cts -> su quelle un header spezzato su piu' righe o uno shorthand
// `{ Authorization }` sfuggirebbe a un grep line-oriented. L'AST e' immune a whitespace/newline/backtick/shorthand.
// La chiave a BACKTICK (punto cieco esquery) e' coperta dalla regola local/no-credential-header (eslint-local/).
const credentialRules = {
  // niente token/stato nella SPA -> nessun Web Storage. L'accesso dinamico OFFUSCATO (bracket-con-variabile,
  // concat 'local'+'Storage', fromCharCode/atob) resta best-effort: limite noto, enforcement reale server-side.
  'no-restricted-globals': [
    'error',
    { name: 'localStorage', message: 'Nessun Web Storage nella SPA (modello BFF): niente token/stato lato client.' },
    { name: 'sessionStorage', message: 'Nessun Web Storage nella SPA (modello BFF): niente token/stato lato client.' },
  ],
  // Schema Bearer come valore stringa (CASE-INSENSITIVE, RFC 7235: 'Bearer'/'BEARER'/'BeArEr'); chiave header
  // 'Authorization' come proprieta' di oggetto INCL. shorthand `{ Authorization }`, CASE-INSENSITIVE (gli header
  // HTTP sono case-insensitive: axios/fetch accettano `authorization` minuscolo come header valido -> e' un leak
  // tanto quanto 'Authorization'). 4j hardening #3 (MAGGIORE): rimosso il lookahead >=1-MAIUSCOLA che lasciava
  // sfuggire la forma tutto-minuscola: la parola INGLESE esatta `authorization` NON collide col dominio PA italiano
  // ('autorizzazione', lettere diverse), quindi l'ancoraggio `^authorization$/i` e' sicuro e simmetrico con
  // l'AssignmentExpression sotto (che era gia' /i). SCRITTURA su un membro header 'authorization' (ci, QUALSIASI
  // operatore; solo assignment-LEFT -> una LETTURA `Enum.Authorization` NON scatta).
  // Offuscamento semantico: best-effort. La chiave a BACKTICK `h[`Authorization`]` e' un punto cieco di esquery
  // (TemplateLiteral senza `.name/.value` selezionabili): la copre la regola local/no-credential-header (visitor AST).
  // TRADEOFF ACCETTATO (4j GIRO5 rank 5): il selettore scatta anche su una PROPRIETA' di dominio inglese minuscola
  // `authorization` in un object-literal qualsiasi (non solo header). Direzione SICURA (fail-closed: al piu' blocca
  // un campo-dato, raro nel PA italiano che usa 'autorizzazione'); ancorare al contesto-header sarebbe un selettore
  // complesso con nuovi buchi. Workaround per un campo legittimo: rinominarlo o un eslint-disable puntuale.
  'no-restricted-syntax': [
    'error',
    { selector: "Literal[value=/^\\s*bearer(\\s+\\S+)?\\s*$/i]", message: 'Schema Bearer vietato nella SPA (modello BFF): nessun token/credenziale lato client.' },
    { selector: "Property[key.name=/^authorization$/i]", message: "Header 'Authorization' vietato nella SPA (modello BFF): la sessione e' via cookie BFF." },
    { selector: "Property[key.value=/^authorization$/i]", message: "Header 'Authorization' vietato nella SPA (modello BFF): la sessione e' via cookie BFF." },
    { selector: "AssignmentExpression[left.property.name=/^authorization$/i]", message: "Header 'Authorization' vietato nella SPA (modello BFF): la sessione e' via cookie BFF." },
    { selector: "AssignmentExpression[left.property.value=/^authorization$/i]", message: "Header 'Authorization' vietato nella SPA (modello BFF): la sessione e' via cookie BFF." },
    // 4j GIRO6 (MAGGIORE — ripristino della copertura del grep ELIMINATO check-csrf-static.sh): il nome header
    // 'Authorization' passato come ARGOMENTO a un setter (`headers.set('Authorization', t)`,
    // `xhr.setRequestHeader('Authorization', t)`, `.append(...)`) sfugge ai selettori Property/AssignmentExpression/
    // setAuthorization sopra (qui e' un argomento di call, non una chiave ne' un accessor dedicato). Selettore
    // GENERICO (qualsiasi CallExpression), non per-metodo (niente enumerazione). Ancorato a `CallExpression > Literal`
    // per NON FPare su una LETTURA/`delete` DIFENSIVA del nome header (`delete cfg.headers['Authorization']`, che e'
    // buona pratica). Stesso tradeoff-parola-inglese degli altri selettori 'authorization' (non collide con
    // 'autorizzazione' del dominio PA italiano). NB best-effort: la difesa REALE e' server-side + il mutator BFF e'
    // l'unica istanza axios sancita; questo e' uno smoke-check contro leak ACCIDENTALI.
    { selector: "CallExpression > Literal[value=/^authorization$/i]", message: "Nome header 'Authorization' come argomento di un setter vietato nella SPA (modello BFF): la sessione e' via cookie BFF, nessun header/credenziale lato client." },
    // Accessor AxiosHeaders v1 setAuthorization: imposta l'header 'Authorization' col nome incapsulato nel metodo
    // -> sfugge ai selettori Property/AssignmentExpression sopra. Coperte ENTRAMBE le forme (giro 14 dot + giro 15
    // computed): `.setAuthorization(t)` (property.name) e `['setAuthorization'](t)` (property.value, computed).
    // get/hasAuthorization sono LETTURE (non un leak) e restano fuori dal pattern 'set'.
    { selector: "MemberExpression[property.name=/^setAuthorization$/i]", message: "Accessor 'setAuthorization' vietato nella SPA (modello BFF): nessun header Authorization/token lato client." },
    { selector: "MemberExpression[property.value=/^setAuthorization$/i]", message: "Accessor 'setAuthorization' (computed) vietato nella SPA (modello BFF): nessun header Authorization/token lato client." },
    // Opzione axios `auth: { username, password }` (HTTP Basic): axios emette 'Authorization: Basic base64(u:p)' col
    // nome-header incapsulato nella semantica -> nessuna stringa 'Authorization' visibile (giro 15). Ancorato alla
    // SHAPE (value ObjectExpression con username+password) per NON far FP sui campi di dominio auth/authorized ubiqui.
    { selector: "Property[key.name=/^auth$/][value.type='ObjectExpression']:has(Property[key.name=/^username$/], Property[key.value=/^username$/]):has(Property[key.name=/^password$/], Property[key.value=/^password$/])", message: "Basic auth axios (auth:{username,password}) vietato nella SPA (modello BFF): nessuna credenziale lato client." },
    { selector: "Property[key.value=/^auth$/][value.type='ObjectExpression']:has(Property[key.name=/^username$/], Property[key.value=/^username$/]):has(Property[key.name=/^password$/], Property[key.value=/^password$/])", message: "Basic auth axios (auth:{username,password}) vietato nella SPA (modello BFF): nessuna credenziale lato client." },
    // Forma ASSIGNMENT della stessa opzione: `cfg.auth = { username, password }` (e computed `cfg['auth']=...`) — non e'
    // una Property ma un AssignmentExpression, quindi i due selettori sopra non la vedono (giro 15). Stessa SHAPE-anchoring.
    { selector: "AssignmentExpression[left.property.name=/^auth$/][right.type='ObjectExpression']:has(Property[key.name=/^username$/], Property[key.value=/^username$/]):has(Property[key.name=/^password$/], Property[key.value=/^password$/])", message: "Basic auth axios (cfg.auth={username,password}) vietato nella SPA (modello BFF): nessuna credenziale lato client." },
    { selector: "AssignmentExpression[left.property.value=/^auth$/][right.type='ObjectExpression']:has(Property[key.name=/^username$/], Property[key.value=/^username$/]):has(Property[key.name=/^password$/], Property[key.value=/^password$/])", message: "Basic auth axios (cfg['auth']={username,password}) vietato nella SPA (modello BFF): nessuna credenziale lato client." },
    // XMLHttpRequest.open(method,url,async,username,password) emette 'Authorization: Basic base64(u:p)' con le credenziali
    // come argomenti POSIZIONALI (nessun literal 'Authorization', nessuna shape auth) -> sfuggirebbe a tutti gli altri
    // selettori (giro 17). Nel modello BFF/axios la SPA non usa raw XHR: si vieta la COSTRUZIONE (indipendente dall'uso).
    { selector: "NewExpression[callee.name='XMLHttpRequest']", message: "XMLHttpRequest vietato nella SPA (modello BFF): usa l'istanza axios (withCredentials + cookie); XHR puo' portare Basic auth via open(user,pass)." },
    // ...anche via membro del globale — `new window.XMLHttpRequest()`, `self.`, `globalThis.` (callee MemberExpression:
    // callee.name assente) e computed `new window['XMLHttpRequest']()` (giro 18). Insieme FINITO (bare + member + computed).
    { selector: "NewExpression[callee.property.name='XMLHttpRequest']", message: "XMLHttpRequest (via membro globale) vietato nella SPA (modello BFF): usa l'istanza axios; XHR puo' portare Basic auth via open(user,pass)." },
    { selector: "NewExpression[callee.property.value='XMLHttpRequest']", message: "XMLHttpRequest (computed) vietato nella SPA (modello BFF): usa l'istanza axios; XHR puo' portare Basic auth via open(user,pass)." },
  ],
};

// I blocchi 4f (layer ui/pages/widgets) devono RIDEFINIRE no-restricted-syntax per aggiungere i selettori
// del client generato/barrel-only. In flat config ESLint la stessa rule-key NON si fonde tra config-object:
// l'ultimo REPLACE. Percio' ogni blocco 4f RI-SPREDE i selettori credenziale, altrimenti li disattiverebbe
// sull'intero layer dove i componenti fanno le chiamate API (hardening 4f g3 F11). Estratti qui una volta.
const credentialSyntaxSelectors = credentialRules['no-restricted-syntax'].slice(1);
// Ban del client orval GENERATO (shared/api/generated) — invariante #3 CATEGORICA su TUTTO lo slice, non solo ui/
// (g5: un consumatore in features/<f> root, model/ o lib/ sfuggiva sia al grep del gate sia all'eslint scoped a ui/).
// Lo importano SOLO i wrapper api/. Statico via ImportDeclaration + dinamico via ImportExpression/require: cosi' il
// ban vive su no-restricted-syntax ed e' spreadabile UNIFORME su ogni segmento consumatore. Il group
// no-restricted-imports (sotto) resta come 2^ via (copre l'@generated alias, che la regex /api\/generated/ non vede).
// La regex e' `/api\\/generated/` (doppio backslash: la stringa JS collassa \\ -> \ prima di esquery).
const generatedClientSyntaxSelectors = [
  { selector: "ImportDeclaration[source.value=/api\\/generated/]", message: "Import del client generato (shared/api/generated) vietato fuori dai wrapper api/: usa ../api (step3)." },
  { selector: "ImportExpression[source.value=/api\\/generated/]", message: "import() dinamico del client generato vietato fuori dai wrapper api/: usa ../api (step3)." },
  { selector: "CallExpression[callee.name='require'][arguments.0.value=/api\\/generated/]", message: "require() del client generato vietato fuori dai wrapper api/: usa ../api (step3)." },
];
// Guard fail-closed (g5): import()/require() con path NON-literale (concat 'a'+'b', template, variabile) nei layer
// consumatori. Non analizzabili staticamente -> potrebbero aggirare il ban del generato (rollup fa constant-folding
// e bundlizza davvero il client). Nei consumatori un path dinamico calcolato non ha uso legittimo (il lazy per-route
// e' import.meta.glob nel router generico, non un import() calcolato). :not([...Literal]) copre l'INTERA classe.
const dynamicPathGuardSelectors = [
  { selector: "ImportExpression:not([source.type='Literal'])", message: "import() con path calcolato (concat/template/variabile) vietato nei consumatori: non analizzabile, puo' aggirare il ban del client generato. Usa un import statico dei wrapper ../api." },
  { selector: "CallExpression[callee.name='require']:not([arguments.0.type='Literal'])", message: "require() con path calcolato vietato nei consumatori: non analizzabile. Usa un import statico dei wrapper ../api." },
];
// Barrel-only (invariante #3 step6-page): pagine/widgets importano dal BARREL della feature/entity, mai da una
// sotto-cartella interna (>=2 livelli sotto features/entities). Copre l'import() DINAMICO (lo statico e' su
// no-restricted-imports). boundaries/dependencies e' type-level (pages->features), non distingue il barrel.
const deepFeatureSyntaxSelectors = [
  { selector: "ImportExpression[source.value=/\\/(features|entities)\\/[^/]+\\/[^/]+\\//]", message: "import() dinamico da una sotto-cartella interna di feature/entity vietato in pages/widgets: importa dal barrel (public API)." },
];
// Z-02: i moduli di prova (dati inventati, render dei test, handler MSW) non entrano nel codice di produzione. Riusato nei
// blocchi dei consumatori; i file di test sotto src/ e il bootstrap dei mock di src/app/main.tsx lo riaprono piu' sotto.
const barrelOnlyImportGroup = {
  group: ['**/features/*/*', '**/features/*/*/**', '**/entities/*/*', '**/entities/*/*/**'],
  message: "Le pagine/widgets compongono SOLO dal barrel della feature/entity (public API), mai da una sotto-cartella interna (invariante #3 step6-page).",
};

const testingImportGroup = {
  group: ['**/shared/testing', '**/shared/testing/*', '**/api/mock', '**/api/mock/*'],
  message: 'I moduli di prova (shared/testing, api/mock) servono solo ai test e al dev server: non vanno nel codice di produzione (Z-02).',
};

// Group no-restricted-imports del client generato (statico + @generated alias) — 2^ via allo statico, riusato in
// ogni blocco consumatore (flat-config: ridefinire no-restricted-imports REPLACE, quindi va re-incluso ogni volta).
const generatedImportGroup = {
  group: ['**/api/generated', '**/api/generated/*', '@generated', '@generated/*'],
  message: 'Il client generato si consuma via i wrapper ../api (step3), mai diretto.',
};

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'coverage/**',
      'node_modules/**',
      // Codice generato da orval: non e' nostro, non si linta.
      'src/shared/api/generated/**',
      // 4k: canary/ e' scaffolding di SELF-TEST con una VIOLAZIONE FSD DELIBERATA (canary/features->pages),
      // verificata a scaffold-time da step2-codegen via `npm run lint:canary` (che la ri-include con --no-ignore).
      // Va ESCLUSA dallo sweep di default (`eslint .` del gate step8, editor, `lint`): altrimenti la violazione
      // intenzionale entrerebbe in eslint.json e il check fsd_import la conterebbe come difetto reale (falso rosso
      // su OGNI progetto). La prova che i confini FSD siano armati resta doppia: `lint:canary` (scaffold) +
      // la canary EFFIMERA `__gate_canary__` che step8-gate crea/rimuove FUORI da eslint.json (gate).
      'canary/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // 4j GIRO6 (CRITICO — backstop definitivo, non enumerazione di forme): tseslint.configs.recommended DISATTIVA
    // il core `no-dupe-keys` su .ts (TS lo delega a ts(1117) in compilazione), ma il GATE adjudica eslint.json, NON
    // tsc. Senza questo, una chiave DUPLICATA `{ onUnhandledRequest: 'error', onUnhandledRequest: 'bypass' }` nel
    // setup MSW passa lo smoke-check local/msw-listen-safety (che ispeziona la PRIMA occorrenza) mentre a runtime
    // vince l'ULTIMA ('bypass' => rete reale, H7). no-dupe-keys lo blocca alla radice per QUALSIASI oggetto. E' un
    // core rule: una violazione entra in eslint.json (sev 2, ruleId ne' local/* ne' boundaries/*) => gia' contata dal
    // check `lint` del gate. Ri-armato DOPO tseslint.configs.recommended (flat-config: l'ultima config-key vince).
    rules: { 'no-dupe-keys': 'error' },
  },
  {
    files: ['src/**/*.{ts,tsx}', 'canary/**/*.{ts,tsx}'],
    languageOptions: {
      globals: { ...globals.browser },
    },
    plugins: { boundaries, local },
    settings: {
      // Il resolver node bundlato risolve solo .js/.json: senza .ts/.tsx gli import relativi
      // restano "unknown" e no-unknown fallisce sul codice legittimo. Estendiamo le estensioni.
      'import/resolver': {
        node: { extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'] },
      },
      'boundaries/include': ['src/**/*.{ts,tsx}', 'canary/**/*.{ts,tsx}'],
      // API v7: partialMatch:false = il pattern deve combaciare col path intero (ex mode:'full').
      'boundaries/elements': [
        { type: 'app', pattern: 'src/app/**', partialMatch: false },
        { type: 'pages', pattern: ['src/pages/**', 'canary/pages/**'], partialMatch: false },
        { type: 'widgets', pattern: 'src/widgets/**', partialMatch: false },
        // Z-02: lo slice della feature e' catturato, per i confini fra slice (policy sotto)
        // elemento = cartella dello slice (partialMatch: true): fileInternalPath e' il percorso dentro lo slice (index.ts = barrel)
        { type: 'features', pattern: ['src/features/*', 'canary/features/*'], capture: ['slice'], partialMatch: true },
        { type: 'entities', pattern: 'src/entities/**', partialMatch: false },
        { type: 'shared', pattern: 'src/shared/**', partialMatch: false },
      ],
    },
    rules: {
      ...credentialRules,
      // 4j Thread A: autorita' AST (sostituisce i lexer bash). Credenziale-backtick su .ts/.tsx.
      // NB: local/msw-listen-safety NON e' qui: e' RECEIVER-AGNOSTIC e vive SOLO nel blocco dei file di lifecycle
      // MSW (setup dei test + canary), altrimenti FPerebbe su ogni `.start()`/`.listen()` legittimo (animazioni, history).
      'local/no-credential-header': 'error',
      // Backstop fail-closed: un file/dipendenza non classificato diventa errore rumoroso (spike S3).
      'boundaries/no-unknown-dependencies': 'error',
      'boundaries/no-unknown-files': 'error',
      // Regola FSD: si importa solo verso il basso (app -> ... -> shared). API v7: dependencies+policies.
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          policies: [
            { from: { element: { type: 'app' } }, allow: { to: { element: { types: { anyOf: ['app', 'pages', 'widgets', 'features', 'entities', 'shared'] } } } } },
            { from: { element: { type: 'pages' } }, allow: { to: { element: { types: { anyOf: ['pages', 'widgets', 'features', 'entities', 'shared'] } } } } },
            { from: { element: { type: 'widgets' } }, allow: { to: { element: { types: { anyOf: ['widgets', 'features', 'entities', 'shared'] } } } } },
            { from: { element: { type: 'features' } }, allow: { to: { element: { types: { anyOf: ['entities', 'shared'] } } } } },
            // Z-02: dentro lo stesso slice si importa liberamente; da un altro slice solo dal barrel (public API)
            { from: { element: { type: 'features' } }, allow: { to: { element: { type: 'features', captured: { slice: '{{ from.element.captured.slice }}' } } } } },
            { from: { element: { type: 'features' } }, allow: { to: { element: { type: 'features', fileInternalPath: 'index.{ts,tsx}' } } } },
            { from: { element: { type: 'entities' } }, allow: { to: { element: { types: { anyOf: ['entities', 'shared'] } } } } },
            { from: { element: { type: 'shared' } }, allow: { to: { element: { type: 'shared' } } } },
          ],
        },
      ],
    },
  },
  {
    // L'oracolo credenziale (AST, immune a whitespace/newline/backtick/shorthand) copre ANCHE le altre estensioni
    // bundlate da vite (.js/.jsx/.mjs/.cjs/.mts/.cts) — un leak in un .js sarebbe comunque impacchettato — senza le
    // regole FSD/boundaries (specifiche dei sorgenti .ts/.tsx). credentialRules + local/no-credential-header su tutto lo scope.
    files: ['src/**/*.{js,jsx,mjs,cjs,mts,cts}', 'canary/**/*.{js,jsx,mjs,cjs,mts,cts}'],
    languageOptions: {
      globals: { ...globals.browser },
    },
    plugins: { local },
    rules: {
      ...credentialRules,
      // 4j Thread A: stessa regola credenziale-backtick anche sulle altre estensioni bundlate (parita' di scope col
      // vecchio grep). msw-listen-safety resta fuori (receiver-agnostic, solo nel blocco di lifecycle MSW).
      'local/no-credential-header': 'error',
    },
  },
  {
    // Fase 4f + g5 — TUTTI i consumatori (features/entities/pages/widgets/app), ESCLUSI i wrapper api/ che sono
    // gli unici a importare il client generato. Invariante #3 CATEGORICA (non solo ui/): ban del generato — statico
    // via group no-restricted-imports E via no-restricted-syntax ImportDeclaration, dinamico via import()/require —
    // su OGNI segmento consumatore (ui, model, lib, feature root, app). Guard fail-closed sui path dinamici calcolati.
    // Ri-spread dei selettori credenziale (F11: no-restricted-syntax REPLACE in flat-config).
    files: ['src/features/**/*.{ts,tsx}', 'src/entities/**/*.{ts,tsx}', 'src/pages/**/*.{ts,tsx}', 'src/widgets/**/*.{ts,tsx}', 'src/app/**/*.{ts,tsx}'],
    ignores: ['src/features/*/api/**', 'src/entities/*/api/**'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [generatedImportGroup, testingImportGroup] }],
      'no-restricted-syntax': ['error', ...credentialSyntaxSelectors, ...generatedClientSyntaxSelectors, ...dynamicPathGuardSelectors],
    },
  },
  {
    // Fase 4f — layer pages/widgets: come i consumatori (ban generato + guard dinamico + credenziali) PIU' il
    // BARREL-ONLY (invariante #3 step6-page): compongono SOLO dal barrel della feature/entity (public API), mai da
    // sotto-cartelle interne. AUTORITATIVO: statico via no-restricted-imports (group features/*/*), dinamico via
    // no-restricted-syntax. Flat-config REPLACE: re-include il group generato e TUTTI i selettori dei consumatori.
    // NB: il barrel di UN'ALTRA feature (segmento singolo, es. features/OtherFeature) NON e' preso da qui (serve
    // >=2 segmenti): a chiuderlo e' il detector feature-aware del gate step6-page (§3), fail-closed nel gate.
    files: ['src/pages/**/*.{ts,tsx}', 'src/widgets/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [generatedImportGroup, barrelOnlyImportGroup, testingImportGroup] }],
      'no-restricted-syntax': ['error', ...credentialSyntaxSelectors, ...generatedClientSyntaxSelectors, ...dynamicPathGuardSelectors, ...deepFeatureSyntaxSelectors],
    },
  },
  {
    // Fase 4e: il layer lib/ e' PURO (zero React). Difesa AUTORITATIVA via eslint — indipendente dalla
    // sintassi (apici, whitespace, type-only), a differenza del grep best-effort del gate di step4-lib:
    // niente react/@tanstack/react-router nei segmenti lib degli slice FSD. Predicati/validatori/
    // formattatori non montano hook: se serve React la funzione e' nel layer sbagliato (api/ o ui/).
    // Review step9 H-06: il blocco stava PRIMA dei consumatori e in flat config la stessa rule-key la vince l'ultimo
    // blocco che combacia -> su entities/*/lib la regola era annullata, e features/*/lib non era mai coperto. Ora sta
    // DOPO i consumatori, copre ogni segmento lib/ (shared, entities, features) e ri-include il ban del generato.
    // Glob dell'INTERO ecosistema react: `react-*`/`react-*/*` coprono react-dom/react-aria-components/react-aria/
    // react-stately/react-router(-dom) e i loro subpath; `react`/`react/*` la radice; `@react-*/*` l'intera famiglia
    // scoped; `@tanstack/*` React Query. (@internationalized/date NON matcha: non e' react.)
    files: ['src/**/lib/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [
        generatedImportGroup,
        {
          group: ['react', 'react/*', 'react-*', 'react-*/*', '@react-*/*', '@tanstack/*'],
          message: "Il layer lib/ e' puro: niente React/React Query/router (sposta la funzione in api/ o ui/).",
        },
        testingImportGroup,
      ] }],
    },
  },
  {
    // Z-02: i test delle pagine sotto src/ usano i moduli di prova; restano gli altri divieti del loro layer.
    files: ['src/pages/**/*.test.{ts,tsx}', 'src/widgets/**/*.test.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [generatedImportGroup, barrelOnlyImportGroup] }],
    },
  },
  {
    // Z-02: gli altri test sotto src/ e il bootstrap dei mock del dev server (main.tsx avvia MSW solo fuori dal mode be).
    files: ['src/features/**/*.test.{ts,tsx}', 'src/entities/**/*.test.{ts,tsx}', 'src/app/**/*.test.{ts,tsx}', 'src/app/main.tsx'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [generatedImportGroup] }],
    },
  },
  {
    files: ['tests/**/*.{ts,tsx}'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    // 4j Thread A: la credenziale a-backtick resta vietata anche nei test (nessun bearer nel codice, punto).
    // msw-listen-safety NON e' qui: e' receiver-agnostic e vive solo nel blocco di lifecycle MSW sotto (un test
    // che chiama `.start()`/`.listen()` non-MSW — animazioni, timer — non deve FPare).
    plugins: { local },
    rules: {
      'local/no-credential-header': 'error',
    },
  },
  {
    // 4j #1 (RI-ARCHITETTURA scoped-al-setup): local/msw-listen-safety e' RECEIVER-AGNOSTIC (ogni `.listen()`/
    // `.start()` esige onUnhandledRequest:'error') e vive SOLO qui, nei file di LIFECYCLE MSW: il setup dei test
    // (dove vitest avvia il server MSW) + la canary del gate (step8). Scoping-by-file, non identificazione-dell-handle:
    // chiude TUTTE le forme di import (namespace-mock, alias, direct-chain, ...) senza whack-a-mole, e FUORI da questi
    // file la regola non gira -> nessun FP su `.start()`/`.listen()` legittimi (animazioni, history) altrove nel src.
    // I glob coprono le convenzioni comuni del setup file + la canary __msw_canary__ prodotta dal gate.
    // Il --print-config di step8 su src/shared/test/setup.ts (check `security` (b2) di fe-gate) risolve qui a 'error'.
    files: [
      'src/shared/test/setup.{ts,tsx,js,jsx}',
      '**/test/setup.{ts,tsx,js,jsx}',
      '**/tests/setup.{ts,tsx,js,jsx}',
      '**/*.setup.{ts,tsx,js,jsx}',
      '**/setupTests.{ts,tsx,js,jsx}',
      '**/vitest.setup.{ts,tsx,js,jsx}',
      'src/shared/__msw_canary__/**/*.{ts,tsx}',
    ],
    plugins: { local },
    rules: {
      'local/msw-listen-safety': 'error',
    },
  },
  {
    // 4j Thread A: il mutator BFF DEVE armare withCredentials + xsrf* (CSRF double-submit, ADR 0013).
    // Scoped al solo bff-mutator.ts (report a Program:exit sull'ASSENZA): rimpiazza il Group A del lexer
    // check-csrf-static.sh con l'AST (immune a whitespace/newline/quoting).
    files: ['src/shared/api/mutator/bff-mutator.ts'],
    plugins: { local },
    rules: {
      'local/bff-mutator-armed': 'error',
    },
  },
  {
    files: ['*.config.ts', 'orval.config.ts'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
  {
    // Gli helper di BUILD in scripts/ (es. api-fetch.mjs) girano su Node, non nel browser: usano
    // process/console/Buffer + node:fs/node:crypto. Il gate lancia `eslint .` sull'INTERO progetto
    // (step8-gate: `npx eslint .`), quindi questi file DEVONO lintare puliti; senza i globali Node
    // `js.configs.recommended` li segnerebbe no-undef (process/console) e il check `lint` fallirebbe su
    // codice legittimo. NB non-bundlati nella SPA (build-time only): fuori dallo scope delle regole
    // credenziale/FSD (browser), qui bastano i globali Node — coerente col blocco *.config.ts sopra.
    files: ['scripts/**/*.{js,mjs,cjs}'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
);
