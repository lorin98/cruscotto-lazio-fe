// local/no-credential-header — copre le forme CREDENZIALE a TEMPLATE-LITERAL / BACKTICK, punto cieco degli
// esquery `no-restricted-syntax` (credentialRules), finora coperto SOLO dal grep bash check-csrf-static.sh.
// 4j #3: spostando questa copertura sul parser AST, check-csrf-static.sh (lexer keyword-blind col bug
// phantom-block-comment) puo' essere ELIMINATO. Le forme non-backtick restano su credentialRules (gia' AST).
//   - schema Bearer come template literal senza ${}: `Bearer ` / `bearer ` ;
//   - chiave header 'Authorization' a backtick: h[`Authorization`] , { [`Authorization`]: x } ;
//   - accessor AxiosHeaders 'setAuthorization' a backtick: h[`setAuthorization`](t) .
// Discriminante col dominio: si ancora alla PAROLA INGLESE ESATTA 'authorization'/'setAuthorization' (CASE-INSENSITIVE:
// gli header HTTP lo sono). 4j hardening #3: rimosso il requisito >=1-MAIUSCOLA — la parola inglese esatta NON collide
// col PA italiano ('autorizzazione', lettere diverse: manca la 'h', ha 'zz'), quindi `^authorization$/i` e' sicuro e
// simmetrico con credentialRules del flat-config. Lo schema Bearer e' un leak a prescindere.
//
// RESIDUO NOTO E ACCETTATO (4j GIRO4): un letterale a RIGA-HEADER-GREZZA con testo PRIMA di 'Bearer', es.
// `\`Authorization: Bearer ${t}\``, non e' colto (l'ancoraggio Bearer e' a inizio-stringa). Ma la forma IDIOMATICA
// (chiave header separata dal valore) SI': `{ Authorization: \`Bearer ${t}\` }` -> la chiave 'Authorization' scatta
// (Property credentialRules) e il valore `Bearer ${t}` scatta (ramo interpolato qui). Passare una riga-header grezza
// come singola stringa ad axios non e' idiomatico. Coda di enumerazione di un oracolo statico: enforcement reale
// server-side (nessun bearer client-side). NB: la forma decomposta e' sempre coperta.

function cooked(tl) {
  // valore di un TemplateLiteral SENZA interpolazione (byte-identico a una stringa), altrimenti null
  if (tl && tl.type === 'TemplateLiteral' && tl.expressions.length === 0 && tl.quasis.length === 1) {
    return tl.quasis[0].value.cooked;
  }
  return null;
}
const isAuth = (s) => s != null && /^authorization$/i.test(s);
const isSetAuth = (s) => s != null && /^setauthorization$/i.test(s);
// 4j GIRO3 #4: una credenziale Bearer LETTERALE e' lo schema nudo (`Bearer `) o schema + UN singolo token senza
// spazi interni (`Bearer eyJ...`), MAI una frase multi-parola. Il vecchio `/^\s*bearer\s/i` (nessun ancoraggio
// finale) faceva FP su un letterale di dominio/i18n benigno che INIZIA con 'Bearer ' (es. `Bearer of the certificate
// holder`) -> errore bloccante al gate = fail-closed spurio. `(\s+\S+)?\s*$` ancora alla fine: token singolo o niente.
const isBearer = (s) => s != null && /^\s*bearer(\s+\S+)?\s*$/i.test(s);

export default {
  meta: {
    type: 'problem',
    docs: { description: 'Nessuna credenziale/header Authorization a backtick nella SPA (modello BFF).' },
    schema: [],
    messages: {
      bearer: 'Schema Bearer in template literal vietato nella SPA (modello BFF): nessun token lato client.',
      authKey: "Header 'Authorization' (chiave a backtick) vietato nella SPA (modello BFF): la sessione e' via cookie BFF.",
      setAuth: "Accessor 'setAuthorization' (backtick) vietato nella SPA (modello BFF): nessun header Authorization/token lato client.",
    },
  },
  create(context) {
    return {
      // schema Bearer come template literal (valore stringa) ovunque
      TemplateLiteral(node) {
        // template SENZA ${}: valore byte-identico a una stringa
        if (isBearer(cooked(node))) { context.report({ node, messageId: 'bearer' }); return; }
        // 4j hardening #4: `Bearer ${token}` (template CON interpolazione, la forma IDIOMATICA di un header
        // Authorization Bearer client-side che il grep eliminato \bBearer\b coglieva) -> cooked() e' null, ma il
        // PRIMO quasi porta 'Bearer ' PRIMA del ${}.
        // 4j hardening #9: NON far FP su una frase che INIZIA con "Bearer " ma prosegue con testo di dominio
        // (es. `Bearer of the certificate: ${name}`). La forma credenziale interpolata ha il PRIMO quasi = SOLO lo
        // schema ('Bearer' + whitespace, NIENTE altro): il token arriva dal ${} subito dopo. Se dopo 'Bearer ' c'e'
        // altro nel quasi, non e' un header Authorization -> non scatta. `/^\s*bearer\s+$/i` ancora la fine-quasi.
        if (node.expressions.length > 0) {
          const first = node.quasis[0] && node.quasis[0].value.cooked;
          if (first != null && /^\s*bearer\s+$/i.test(first)) context.report({ node, messageId: 'bearer' });
        }
      },
      // chiave/accessor a backtick su membro computed: h[`Authorization`] , h[`setAuthorization`](t)
      MemberExpression(node) {
        if (!node.computed) return;
        const c = cooked(node.property);
        if (isAuth(c)) context.report({ node, messageId: 'authKey' });
        else if (isSetAuth(c)) context.report({ node, messageId: 'setAuth' });
      },
      // chiave header a backtick in un object literal: { [`Authorization`]: x }
      Property(node) {
        if (!node.computed) return;
        const c = cooked(node.key);
        if (isAuth(c)) context.report({ node, messageId: 'authKey' });
      },
    };
  },
};
