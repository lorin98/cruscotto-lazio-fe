# =============================================================================
# Immagine del frontend del Cruscotto CSR: si costruisce con Node, si serve con nginx
# =============================================================================
# Modellata sui Dockerfile di fascazieterr-fe e terreni-silenti-fe: stessa immagine
# nginx non privilegiata (uid 101, porta 8080), pinnata per digest.
#
# Si costruisce con un `docker build` NUDO dalla radice del repository: niente
# --build-arg, niente --secret, niente funzioni di BuildKit.
#   docker build -t cruscotto-csr-fe .
#
# Topologia: un'origine sola per il browser. Questa immagine serve la SPA E inoltra
# /api e /auth al backend (BFF), come fa il dev server con `npm run dev:be`: cookie di
# sessione, redirect OIDC e controllo dell'origine restano sulla stessa origine.
# L'indirizzo del backend si sceglie a RUNTIME con CSR_BE_UPSTREAM
# (predefinito http://csr-be:8080, il nome del container sulla rete Docker); nginx lo
# risolve all'avvio, quindi il backend deve essere gia' raggiungibile.
#   docker run --rm --network csr-rete -p 127.0.0.1:8088:8080 cruscotto-csr-fe
# =============================================================================

# ---- Fase 1: build della SPA ------------------------------------------------
# Node 24: package.json richiede ^24.15.0 e .npmrc ha engine-strict (npm ci fallisce
# con una versione diversa). 24.21.0 e' la versione delle postazioni.
FROM node:24.21.0-bookworm-slim@sha256:d6aa754f16b3197301076f047b5def2f02ea1dbbc2ca920407d46d7ec7f87b20 AS build
WORKDIR /app

# Prima i manifest: il livello delle dipendenze si riusa finche' non cambiano.
COPY package.json package-lock.json .npmrc ./
RUN npm ci --no-audit --no-fund

# Il client delle API (src/shared/api/generated) non e' versionato: si genera da specs/
# con orval, come fa `npm run api:generate` sulle postazioni, prima della build.
COPY . .
RUN npm run api:generate && npm run build

# ---- Fase 2: nginx statico, NON privilegiato ---------------------------------
FROM nginxinc/nginx-unprivileged:1.27-alpine@sha256:65e3e85dbaed8ba248841d9d58a899b6197106c23cb0ff1a132b7bfe0547e4c0 AS runtime

# Indirizzo del backend. Il template viene risolto all'avvio dallo script envsubst
# dell'immagine (20-envsubst-on-templates.sh), che scrive /etc/nginx/conf.d/default.conf:
# sostituisce SOLO le variabili d'ambiente definite, non quelle di nginx ($host, $uri...).
ENV CSR_BE_UPSTREAM=http://csr-be:8080

COPY docker/nginx.conf.template /etc/nginx/templates/default.conf.template
# Fuori da conf.d: tutto cio' che sta li' viene incluso a livello http.
COPY docker/intestazioni-sicurezza.conf /etc/nginx/snippets/intestazioni-sicurezza.conf
COPY --from=build /app/dist /usr/share/nginx/html

USER 101
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD wget -qO- http://127.0.0.1:8080/healthz || exit 1
STOPSIGNAL SIGQUIT
