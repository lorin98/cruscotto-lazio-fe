// eslint-local — plugin di regole di SICUREZZA del progetto generato (green-fe, 4j Thread A).
// Sposta l'AUTORITA' di MSW-listen-safety e delle credenziali a-backtick da lexer bash (fe-gate _sc/_scstr,
// check-csrf-static.sh) al PARSER REALE (typescript-eslint AST): niente piu' lexer bash su TS/JSX (classe di
// difetti #3/#4). Le regole depositano le violazioni in eslint.json che fe-gate.sh adjudica (lint + security),
// con prova config-armed (eslint --print-config) e canary (step8-gate) che dimostrano che scattano davvero.
// RuleModule puri (nessuna dipendenza npm nuova, nessun package-lock rigenerato).
import mswListenSafety from './rules/msw-listen-safety.js';
import noCredentialHeader from './rules/no-credential-header.js';
import bffMutatorArmed from './rules/bff-mutator-armed.js';

export default {
  meta: { name: 'local', version: '1.0.0' },
  rules: {
    'msw-listen-safety': mswListenSafety,
    'no-credential-header': noCredentialHeader,
    'bff-mutator-armed': bffMutatorArmed,
  },
};
