// local/msw-listen-safety — MSW deve chiamare listen()/start() con { onUnhandledRequest: 'error' }.
// Una richiesta non mockata col default 'warn'/'bypass' colpirebbe la RETE REALE (H7: dati PA di cittadini).
//
// 4j #1 (RI-ARCHITETTURA scoped-al-setup): la regola e' RECEIVER-AGNOSTIC. NON tenta di dimostrare che il ricevente
// sia un handle MSW (identificazione per-forma-di-import: strutturalmente permeabile). Lo SCOPING e' compito del
// flat-config: la regola vive SOLO nei file di lifecycle MSW (setup dei test + canary del gate), dove qualunque
// listen/start E' lifecycle MSW. Fuori da li' non gira (un `.start()`/`.listen()` legittimo — animazioni, history —
// non e' MSW: nessun FP).
// 4j GIRO3 #1 (chiusura del buco callee-Identifier): "receiver-agnostic" ora copre TUTTE e tre le forme sintattiche
// di invocazione, non solo la member-call:
//   (M) member: `server.listen(...)`, `mock.server.listen(...)`, `x['listen'](...)`  -> callee MemberExpression;
//   (I) bare/destrutturata: `const { listen } = server; listen(...)`                  -> callee Identifier 'listen';
//   (A) alias/rename: `const { listen: l } = server; l(...)` / `const l = server.listen; l(...)` -> binding tracciato.
// Il caso (I)/(A) prima sfuggiva (il visitor scartava ogni callee non-MemberExpression) -> una listen destrutturata
// con onUnhandledRequest:'bypass' passava ARMATA e in-scope = fail-open rete-reale H7. Dato lo scoping ai soli file
// di lifecycle MSW, un listen()/start() nudo li' e' MSW: nessun FP realistico.
// Spread delle options (`.listen(...opts)`) -> options non ispezionabili staticamente -> fail-closed (scatta): la
// config MSW va inline.
//
// 4j GIRO6 — NATURA DELLA REGOLA (dichiarata, non implicita): questo e' uno SMOKE-CHECK STATICO della FORMA del
// literal al call-site, NON un oracolo avversariale esaustivo. La GARANZIA FORTE che MSW sia armato e' un test
// RUNTIME — `tests/msw-armed.test.ts` — che nel processo di test fa una richiesta NON mockata e verifica che sia
// RIFIUTATA DALL'INTERCEPTOR (errore [MSW] "error" strategy) e non esca in rete: se il setup fosse disarmato a
// 'bypass'/'warn' la richiesta uscirebbe e fallirebbe con un errore di RETE ("fetch failed") => test rosso. Quel
// test copre il COMPORTAMENTO indipendentemente dalla FORMA sintattica; questa regola e' la difesa-in-profondita'
// statica al gate. Percio' NON si insegue piu' la coda di enumerazione delle forme (sotto): la garanzia sta a runtime.
//
// RESIDUI NOTI E CONSCIAMENTE ACCETTATI (limiti di un oracolo STATICO per-file, NON fail-open nascosti — tutti
// coperti dalla garanzia runtime tests/msw-armed.test.ts):
//   (1) listen({bypass}) in un MODULO HELPER fuori dai glob di setup: la regola e' scoped ai file di lifecycle MSW
//       (setup + canary), per non FPare su ogni `.start()`/`.listen()` legittimo (animazioni, history) altrove. Un
//       lifecycle MSW spostato in un file non-setup non e' idiomatico (vitest referenzia setupFiles per path) ma
//       NON e' visto qui. Tradeoff di scoping strutturalmente non vincibile per una regola AST per-file.
//   (2) forme esotiche entro il setup: `listen.call(server, {...})` / `listen.apply(...)` (callee `.call`/`.apply`),
//       o re-alias a catena `const { listen } = server; const x = listen; x(...)`.
//   (3) 4j GIRO6 (MINORE): computed-member con chiave VARIABILE `const m = 'listen'; server[m]({...})` (memberKey
//       ritorna null per una property computed non-costante). Anche questo e' colto a runtime da msw-armed.test.ts.
// Inseguire staticamente questa coda e' asintotico (ogni giro trova una forma nuova): la scelta di disegno e'
// fermarsi allo smoke-check + affidare la garanzia al test runtime. Difese aggiuntive del gate: config-armato via
// (b2) print-config, canary (la regola SCATTA), e il conteggio dei suppressedMessages in fe-gate (un eslint-disable
// inline non declassa la regola).
// COPERTE (4j GIRO5): forme idiomatiche TS6/ESLint10 `{...} satisfies O` e `'error' as const` (unwrap dei nodi-tipo
// TS); property-spread che sovrascrive le options (fail-closed); destructuring con default `const { listen: l = noop }`.

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
const isLifecycleName = (n) => n === 'listen' || n === 'start';

// 4j GIRO5 #1: spoglia i wrapper-tipo TS che avvolgono un'espressione, cosi' che le forme IDIOMATICHE TS6/ESLint10
// (`{...} satisfies O`, `'error' as const`, `x!`, `(x)`) NON nascondano l'ObjectExpression/Literal sottostante.
// Senza questo, `server.listen({ onUnhandledRequest: 'error' } satisfies O)` (config VALIDA e ARMATA) veniva
// bocciata come bareListen -> fail-closed spurio che escalava a SEC_FAIL nel gate.
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
    docs: { description: "MSW listen()/start() deve avere onUnhandledRequest:'error' (no rete reale, H7)." },
    schema: [],
    messages: {
      bareListen: "MSW {{m}}() senza options: passa { onUnhandledRequest: 'error' } (una richiesta non mockata colpirebbe la rete reale - H7).",
      notError: "MSW {{m}}(): onUnhandledRequest deve essere il literal 'error' (il default 'warn'/'bypass' lascia passare richieste reali - H7).",
    },
  },
  create(context) {
    // binding locali che rappresentano il metodo listen/start di un handle (destrutturati o aliasati):
    //   const { listen } = server        -> 'listen'   (nome invariato)
    //   const { listen: l } = server     -> 'l'
    //   const l = server.listen          -> 'l'
    const methodBindings = new Set();
    // TUTTE le call raccolte in traversata; risolte a Program:exit (ordine-indipendente: la destrutturazione
    // potrebbe essere dopo l'uso in casi patologici, e methodBindings e' completo solo a fine file).
    const calls = []; // { node, name } dove name = chiave del metodo (member) o nome dell'Identifier (bare/binding)

    return {
      VariableDeclarator(node) {
        const init = node.init;
        // (A) alias di membro: const l = X.listen / X.start
        if (init && init.type === 'MemberExpression') {
          const k = memberKey(init);
          if (isLifecycleName(k) && node.id && node.id.type === 'Identifier') methodBindings.add(node.id.name);
        }
        // (I)/(A) destrutturazione: const { listen } = X  /  const { listen: l } = X
        if (node.id && node.id.type === 'ObjectPattern') {
          for (const p of node.id.properties) {
            if (p.type !== 'Property' || !isLifecycleName(propKey(p)) || !p.value) continue;
            // binding diretto (const { listen: l } = X)
            if (p.value.type === 'Identifier') methodBindings.add(p.value.name);
            // 4j GIRO5 #3: con default (const { listen: l = noop } = X) il binding e' l'AssignmentPattern.left
            else if (p.value.type === 'AssignmentPattern' && p.value.left.type === 'Identifier') methodBindings.add(p.value.left.name);
          }
        }
      },
      CallExpression(node) {
        const callee = node.callee;
        if (callee && callee.type === 'MemberExpression') {
          const m = memberKey(callee);
          if (isLifecycleName(m)) calls.push({ node, name: m });
        } else if (callee && callee.type === 'Identifier') {
          // bare listen()/start() (destrutturazione col nome invariato) o binding tracciato (alias/rename)
          calls.push({ node, name: callee.name });
        }
      },
      'Program:exit'() {
        for (const c of calls) {
          // un bare-identifier non-listen/start e non-binding non e' un'invocazione di lifecycle MSW -> ignora
          if (!isLifecycleName(c.name) && !methodBindings.has(c.name)) continue;
          const arg = unwrap(c.node.arguments[0]); // 4j GIRO5 #1: spoglia `{...} satisfies O` / `(...)` / ...
          if (!arg || arg.type !== 'ObjectExpression') {
            context.report({ node: c.node, messageId: 'bareListen', data: { m: c.name } });
            continue;
          }
          // 4j GIRO5 #3: uno SpreadElement tra le opzioni puo' RI-SOVRASCRIVERE onUnhandledRequest a runtime
          // (es. `{ onUnhandledRequest: 'error', ...opts }`) -> non ispezionabile staticamente -> fail-closed
          // (specular al fail-closed dello spread di argomento).
          if (arg.properties.some((p) => p.type === 'SpreadElement')) {
            context.report({ node: c.node, messageId: 'notError', data: { m: c.name } });
            continue;
          }
          const oup = arg.properties.find((p) => propKey(p) === 'onUnhandledRequest');
          if (!oup) {
            context.report({ node: c.node, messageId: 'notError', data: { m: c.name } });
            continue;
          }
          const v = unwrap(oup.value); // 4j GIRO5 #1: spoglia `'error' as const`
          if (!(v.type === 'Literal' && v.value === 'error')) {
            context.report({ node: c.node, messageId: 'notError', data: { m: c.name } });
          }
        }
      },
    };
  },
};
