// local/bff-mutator-armed — il mutator BFF deve armare il contratto CSRF (ADR 0013): withCredentials:true +
// xsrfCookieName/xsrfHeaderName come stringhe NON vuote. Sostituisce il Group A del lexer bash check-csrf-static.sh
// con l'AST (immune a whitespace/newline/quoting). Va SCOPED al solo bff-mutator.ts nel flat-config.
//
// 4j GIRO3 (Opzione B — CONTRATTO LITERAL-INLINE): la regola verifica la FORMA CANONICA che il generatore emette e
// fallisce-chiuso su ogni forma non-canonica, invece di inseguire la robustezza per-istanza (una regola AST
// single-file che prova una proprieta' di sicurezza per enumerazione di forme genera varianti all'infinito). Il
// CONTRATTO del mutator e':
//   - ESATTAMENTE UNA `Axios.create(...)` / `axios.create(...)` nel file (l'istanza condivisa AXIOS_INSTANCE);
//   - il suo unico argomento e' un OGGETTO LITERAL inline (niente spread/variabile/Object.assign);
//   - withCredentials:true + xsrfCookieName + xsrfHeaderName come STRINGHE non vuote INLINE (o const LOCALE
//     inizializzata con un literal: nomi header condivisi via costante same-file).
// Ogni deviazione = fail-closed con messaggio esplicito, MAI un pass:
//   - piu' di una create()      -> multiCreate    (un decoy armato NON puo' piu' ri-armare l'istanza disarmata);
//   - config non-literal/spread -> nonLiteralConfig (non verificabile staticamente);
//   - valore xsrf via import / espressione non risolvibile -> nonLiteralValue (usa literal inline o const locale).
// NB (modello di minaccia): il confine CSRF e' SERVER-SIDE (il BFF valida il double-submit); un client disarmato e'
// una MISCONFIGURAZIONE FUNZIONALE (403), non un buco. Questa e' uno SMOKE-check della forma canonica, non un
// oracolo esaustivo: refactoring del mutator fuori dal contratto letterale-inline riceve un segnale chiaro
// ("non-canonico, non verificabile"), non un falso verde.

function memberKey(me) {
  if (!me || me.type !== 'MemberExpression') return null;
  if (!me.computed) return me.property.type === 'Identifier' ? me.property.name : null;
  const p = me.property;
  if (p.type === 'Literal') return typeof p.value === 'string' ? p.value : null;
  if (p.type === 'TemplateLiteral' && p.expressions.length === 0) return p.quasis[0].value.cooked;
  return null;
}
function propKey(prop) {
  if (!prop || prop.type !== 'Property') return null;
  const k = prop.key;
  if (!prop.computed) {
    if (k.type === 'Identifier') return k.name;
    if (k.type === 'Literal') return typeof k.value === 'string' ? k.value : null;
    return null;
  }
  if (k.type === 'Literal') return typeof k.value === 'string' ? k.value : null;
  if (k.type === 'TemplateLiteral' && k.expressions.length === 0) return k.quasis[0].value.cooked;
  return null;
}
const isTrue = (v) => v && v.type === 'Literal' && v.value === true;
const isFalse = (v) => v && v.type === 'Literal' && v.value === false;
// 4j GIRO6: valore-stringa staticamente noto = Literal-stringa O TemplateLiteral SENZA espressioni (cooked). Un
// `xsrfCookieName: `XSRF-TOKEN`` e' una costante nota tanto quanto 'XSRF-TOKEN' -> non va bocciato come nonLiteralValue.
function strLiteralValue(node) {
  if (node && node.type === 'Literal' && typeof node.value === 'string') return node.value;
  if (node && node.type === 'TemplateLiteral' && node.expressions.length === 0) return node.quasis[0].value.cooked;
  return null;
}
const isDisarmVal = (v) =>
  (v && v.type === 'Identifier' && v.name === 'undefined') ||
  (v && v.type === 'Literal' && (v.value === null || v.value === false));
// 4j GIRO5 #4: spoglia i wrapper-tipo TS (gemello della fix in msw-listen-safety) cosi' che `true as const`,
// `'XSRF-TOKEN' as const`/`satisfies string`, `({...} as X)` NON facciano FP su un mutator correttamente armato.
function unwrap(node) {
  let n = node;
  while (n && (n.type === 'TSAsExpression' || n.type === 'TSSatisfiesExpression' ||
               n.type === 'TSNonNullExpression' || n.type === 'ParenthesizedExpression')) {
    n = n.expression;
  }
  return n;
}

export default {
  meta: {
    type: 'problem',
    docs: { description: 'Il mutator BFF deve armare withCredentials + xsrf* (CSRF double-submit), forma canonica literal-inline.' },
    schema: [],
    messages: {
      notWithCredentials: 'bff-mutator: manca withCredentials:true nell\'istanza axios (modello BFF: la sessione e\' via cookie).',
      withCredentialsFalse: 'bff-mutator: withCredentials disarmato a false.',
      noXsrfCookie: 'bff-mutator: manca xsrfCookieName (stringa non vuota): CSRF non armato.',
      noXsrfHeader: 'bff-mutator: manca xsrfHeaderName (stringa non vuota): CSRF non armato.',
      xsrfDisarmed: 'bff-mutator: xsrf*Name disarmato (undefined/null/false).',
      noInstance: 'bff-mutator: nessuna istanza axios creata (atteso Axios.create({...}) col contratto CSRF armato).',
      multiCreate: 'bff-mutator: piu\' di una Axios.create() nel file — forma NON canonica non verificabile (contratto literal-inline: una sola istanza con config inline). Un decoy non deve poter armare l\'istanza reale.',
      nonLiteralConfig: 'bff-mutator: la config di Axios.create() non e\' un oggetto literal inline (spread/variabile/Object.assign): non verificabile staticamente (contratto literal-inline).',
      nonLiteralValue: 'bff-mutator: {{k}} non e\' un literal inline ne\' una const locale (es. valore via import): non verificabile (contratto literal-inline: usa la stringa inline o una const LOCALE).',
      noRequestedWith: "bff-mutator: manca headers con 'X-Requested-With' (stringa non vuota) inline: con il backend ARSCSR e' la difesa CSRF effettiva (RegolaOrigine), senza esportazioni e scritture rispondono 403.",
    },
  },
  create(context) {
    const sc = context.sourceCode || context.getSourceCode();
    let createCount = 0;             // numero di Axios.create()/axios.create() nel file
    const createConfigs = [];        // ObjectExpression config-arg delle create() (solo quelle con oggetto literal)
    const axiosBindings = new Set(); // binding locali del modulo 'axios' (default/namespace import)

    // risolve un Identifier a un const LOCALE inizializzato con literal (altrimenti ritorna il nodo cosi' com'e':
    // un binding di import NON e' un const locale -> resta non risolto -> nonLiteralValue, per contratto).
    function resolve(node) {
      if (!node || node.type !== 'Identifier') return node;
      let scope = sc.getScope(node);
      while (scope) {
        const v = scope.variables.find((vv) => vv.name === node.name);
        if (v) {
          const def = v.defs[v.defs.length - 1];
          if (def && def.node && def.node.type === 'VariableDeclarator' &&
              def.parent && def.parent.kind === 'const' && def.node.init) {
            return def.node.init;
          }
          return node;
        }
        scope = scope.upper;
      }
      return node;
    }

    // classifica il valore di uno xsrf*Name: 'ok' (literal non vuoto o const-locale literal) | 'disarmed'
    // (undefined/null/false) | 'nonliteral' (identifier/espressione non risolvibile: import, call, ecc.)
    function classifyXsrf(rawVal) {
      const v = unwrap(resolve(rawVal)); // 4j GIRO5 #4: `'XSRF-TOKEN' as const` -> Literal stringa
      // 4j GIRO6 (MAGGIORE — FP che RIFIUTAVA codice VALIDO): accetta anche un TemplateLiteral senza espressioni
      // (`xsrfCookieName: `XSRF-TOKEN``), costante nota quanto un Literal-stringa; prima cadeva in 'nonliteral'.
      const s = strLiteralValue(v);
      if (s !== null && s.length > 0) return 'ok';
      if (isDisarmVal(v)) return 'disarmed';
      return 'nonliteral';
    }

    return {
      // 4j GIRO4: traccia il binding del modulo 'axios' (default/namespace import) per ancorare .create() ad Axios.
      ImportDeclaration(node) {
        if (node.source && node.source.value === 'axios') {
          for (const spec of node.specifiers) {
            if (spec.type === 'ImportDefaultSpecifier' || spec.type === 'ImportNamespaceSpecifier') axiosBindings.add(spec.local.name);
            else if (spec.type === 'ImportSpecifier' && spec.imported && spec.imported.name === 'default') axiosBindings.add(spec.local.name);
          }
        }
      },
      // Axios.create({...}) / axios.create({...}) — SOLO sul binding del modulo axios. 4j GIRO4: un qualsiasi
      // X.create() non-axios (es. uno schema-builder `z.object().create`, un factory di dominio) NON deve far
      // scattare multiCreate su un mutator correttamente armato (falso positivo introdotto dall'Opzione B).
      CallExpression(node) {
        const callee = node.callee;
        if (!callee || callee.type !== 'MemberExpression') return;
        if (memberKey(callee) !== 'create') return;
        if (!callee.object || callee.object.type !== 'Identifier' || !axiosBindings.has(callee.object.name)) return;
        createCount += 1;
        const cfg = unwrap(node.arguments[0]); // 4j GIRO5 #4: `Axios.create({...} as X)` -> ObjectExpression
        if (cfg && cfg.type === 'ObjectExpression') createConfigs.push(cfg);
      },
      'Program:exit'(node) {
        if (createCount === 0) { context.report({ node, messageId: 'noInstance' }); return; }
        // 4j GIRO3 #3: piu' di una create() = forma non canonica (un decoy armato mascherava l'istanza disarmata).
        if (createCount > 1) { context.report({ node, messageId: 'multiCreate' }); return; }
        // una sola create(): il suo argomento DEVE essere un oggetto literal inline (niente spread/variabile).
        if (createConfigs.length !== 1) { context.report({ node, messageId: 'nonLiteralConfig' }); return; }
        const cfg = createConfigs[0];
        // uno SpreadElement dentro la config -> parte non-inline -> non verificabile.
        if (cfg.properties.some((p) => p.type !== 'Property')) { context.report({ node, messageId: 'nonLiteralConfig' }); return; }

        let wc = 'absent', cookie = 'absent', header = 'absent', requestedWith = false;
        for (const p of cfg.properties) {
          const key = propKey(p);
          if (key === 'withCredentials') { const v = unwrap(resolve(p.value)); wc = isTrue(v) ? 'true' : (isFalse(v) ? 'false' : 'other'); }
          else if (key === 'xsrfCookieName') cookie = classifyXsrf(p.value);
          else if (key === 'xsrfHeaderName') header = classifyXsrf(p.value);
          // Adattamento ARSCSR (review step9 R-11): headers literal inline con 'X-Requested-With' valorizzato.
          else if (key === 'headers') {
            const h = unwrap(p.value);
            requestedWith = !!h && h.type === 'ObjectExpression' && h.properties.some((q) => q.type === 'Property'
              && propKey(q) === 'X-Requested-With' && classifyXsrf(q.value) === 'ok');
          }
        }
        if (!requestedWith) context.report({ node, messageId: 'noRequestedWith' });

        if (wc === 'false') context.report({ node, messageId: 'withCredentialsFalse' });
        else if (wc !== 'true') context.report({ node, messageId: 'notWithCredentials' });

        if (cookie === 'absent') context.report({ node, messageId: 'noXsrfCookie' });
        else if (cookie === 'disarmed') context.report({ node, messageId: 'xsrfDisarmed' });
        else if (cookie === 'nonliteral') context.report({ node, messageId: 'nonLiteralValue', data: { k: 'xsrfCookieName' } });

        if (header === 'absent') context.report({ node, messageId: 'noXsrfHeader' });
        else if (header === 'disarmed') context.report({ node, messageId: 'xsrfDisarmed' });
        else if (header === 'nonliteral') context.report({ node, messageId: 'nonLiteralValue', data: { k: 'xsrfHeaderName' } });
      },
    };
  },
};
