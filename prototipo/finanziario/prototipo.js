// prototipo.js — prototipo cliccabile UI v2 del finanziario. Dati DI ESEMPIO generati qui (nessun dato reale).
// Rotte nell'hash (#/panoramica?intervento=SRA01&og=OG2): i filtri vivono nell'indirizzo, come nel prodotto.
'use strict';
(() => {
  // ---------------------------------------------------------------- dati di esempio
  function generatore(seme) {
    return () => {
      seme = (seme + 0x6d2b79f5) | 0;
      let t = Math.imul(seme ^ (seme >>> 15), 1 | seme);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const caso = generatore(2023);
  const ANNI = [2023, 2024, 2025, 2026];
  const TRIMESTRI = [];
  for (const a of ANNI) for (let q = 1; q <= 4; q++) if (!(a === 2026 && q === 4)) TRIMESTRI.push(`${a} T${q}`);
  const OG = { OG1: 'Competitività e reddito', OG2: 'Ambiente e clima', OG3: 'Aree rurali e ricambio generazionale' };
  const OS = {
    OS1: 'Reddito agricolo', OS2: 'Competitività', OS3: 'Posizione nella filiera', OS4: 'Cambiamenti climatici',
    OS5: 'Risorse naturali', OS6: 'Biodiversità e paesaggio', OS7: 'Ricambio generazionale', OS8: 'Aree rurali',
  };
  const OP = { OP1: 'OP1 · Economia', OP2: 'OP2 · Ambiente', OP5: 'OP5 · Territori' };
  // un colore per obiettivo generale, uguale in tutti i grafici
  const COLORE_OG = { OG1: '#0066cc', OG2: '#4e8a1f', OG3: '#b26b00' };
  const BASE = [
    ['SRA01', 'Produzione integrata', 'OG2', 'OS4', 'OP2', 18.4],
    ['SRA03', 'Tecniche di lavorazione ridotta dei suoli', 'OG2', 'OS5', 'OP2', 9.7],
    ['SRA14', 'Allevatori custodi dell’agrobiodiversità', 'OG2', 'OS6', 'OP2', 4.2],
    ['SRA29', 'Agricoltura biologica', 'OG2', 'OS6', 'OP2', 42.5],
    ['SRB01', 'Zone con svantaggi naturali di montagna', 'OG1', 'OS1', 'OP1', 31.8],
    ['SRD01', 'Investimenti produttivi agricoli', 'OG1', 'OS2', 'OP1', 64.3],
    ['SRD02', 'Investimenti per ambiente e clima', 'OG2', 'OS4', 'OP2', 22.1],
    ['SRD04', 'Investimenti non produttivi agricoli', 'OG2', 'OS6', 'OP2', 8.9],
    ['SRD13', 'Trasformazione e commercializzazione', 'OG1', 'OS3', 'OP1', 27.6],
    ['SRE01', 'Insediamento di giovani agricoltori', 'OG3', 'OS7', 'OP5', 35.0],
    ['SRG06', 'LEADER - sviluppo locale', 'OG3', 'OS8', 'OP5', 38.7],
    ['SRG07', 'Cooperazione per lo sviluppo rurale', 'OG3', 'OS8', 'OP5', 6.4],
    ['SRH01', 'Servizi di consulenza', 'OG1', 'OS2', 'OP1', 3.1],
    ['SRH03', 'Formazione degli addetti', 'OG3', 'OS7', 'OP5', 2.6],
  ];
  const INTERVENTI = BASE.map(([codice, nome, og, os, op, milioni]) => {
    const dotazione = Math.round(milioni * 1e6);
    const impegnato = Math.round(dotazione * (0.45 + caso() * 0.45));
    const pagato = Math.round(impegnato * (0.35 + caso() * 0.45));
    const domande = ANNI.map((_, i) => Math.round((i === 3 ? 20 + caso() * 90 : 120 + caso() * 700) * Math.max(0.3, milioni / 25)));
    const pesi = [0.12, 0.34, 0.42, 0.12].map((p) => p * (0.8 + caso() * 0.4));
    const somma = pesi.reduce((a, b) => a + b, 0);
    const pagatoAnno = pesi.map((p) => Math.round((pagato * p) / somma));
    let cumulato = 0;
    const pagatoTrimestri = TRIMESTRI.map((_, i) => {
      const x = (i + 1) / TRIMESTRI.length;
      cumulato = Math.round(pagato * (x * x * (3 - 2 * x)));
      return cumulato;
    });
    const presentate = domande.reduce((a, b) => a + b, 0);
    const istruite = Math.round(presentate * (0.8 + caso() * 0.15));
    const ammesse = Math.round(istruite * (0.7 + caso() * 0.2));
    const pagate = Math.round(ammesse * (0.4 + caso() * 0.4));
    return { codice, nome, og, os, op, dotazione, impegnato, pagato, domande, pagatoAnno, pagatoTrimestri, sigc: { presentate, istruite, ammesse, pagate } };
  });
  const ULTIMI_DATI = [
    ['DS-12', '2026-03-02T09:15:00Z'], ['PILASTRO_DS06', '2026-03-02T09:37:00Z'], ['PROSA_DS04', '2026-03-03T08:30:00Z'],
    ['SIAN_DS01', '2026-03-01T17:05:00Z'], ['SIAN_DS02', '2026-03-01T17:15:00Z'], ['SIAN_DS03', '2026-03-01T17:16:00Z'], ['SIAN_DS05', '2026-03-01T17:17:00Z'],
  ];

  // ---------------------------------------------------------------- formattazione
  const mln = (v) => (v / 1e6).toLocaleString('it-IT', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const euro = (v) => v.toLocaleString('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
  const pct = (v) => `${(v * 100).toLocaleString('it-IT', { maximumFractionDigits: 1 })}%`;
  const num = (v) => v.toLocaleString('it-IT');
  const etichettaFlusso = (f) => f.replace(/^([A-Z]+)_DS(\d{2})$/, '$1 DS-$2');
  const ROMA = new Intl.DateTimeFormat('it-IT', { timeZone: 'Europe/Rome', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  const dataOra = (iso) => {
    const p = Object.fromEntries(ROMA.formatToParts(new Date(iso)).map((x) => [x.type, x.value]));
    return `${p.day}/${p.month}/${p.year} ${p.hour}:${p.minute}`;
  };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const somma = (xs, f) => xs.reduce((a, x) => a + f(x), 0);

  // ---------------------------------------------------------------- rotte e filtri nell'indirizzo
  const CHIAVI = ['intervento', 'og', 'os', 'op'];
  const ETICHETTE_FILTRO = { intervento: 'Intervento', og: 'OG', os: 'OS', op: 'OP' };
  let filtri = { intervento: [], og: [], os: [], op: [] };
  let bozza = null;

  function leggiRotta() {
    const h = location.hash.slice(1) || '/panoramica';
    const [percorso, q = ''] = h.split('?');
    const p = new URLSearchParams(q);
    filtri = Object.fromEntries(CHIAVI.map((k) => [k, p.getAll(k)]));
    return percorso;
  }
  function query(f) {
    const p = new URLSearchParams();
    for (const k of CHIAVI) for (const v of f[k]) p.append(k, v);
    const s = p.toString();
    return s ? `?${s}` : '';
  }
  const percorsoCorrente = () => (location.hash.slice(1) || '/panoramica').split('?')[0];
  function vai(percorso, f = filtri) { location.hash = `#${percorso}${query(f)}`; }
  const corrisponde = (i, f) => CHIAVI.every((k) => !f[k].length || f[k].includes(k === 'intervento' ? i.codice : i[k]));
  const selezione = (f = filtri) => INTERVENTI.filter((i) => corrisponde(i, f));
  const numeroFiltri = (f) => CHIAVI.reduce((a, k) => a + f[k].length, 0);

  // ---------------------------------------------------------------- menu laterale
  const MENU = [
    { sezione: 'Aree del cruscotto', voci: [
      { gruppo: 'Finanziario', icona: 'bi-cash-coin', voci: [
        { label: 'Panoramica', icona: 'bi-speedometer2', percorso: '/panoramica' },
        { label: 'Riepilogo per intervento', icona: 'bi-table', percorso: '/riepilogo' },
        { label: 'Dotazione e spesa', icona: 'bi-bar-chart', percorso: '/dotazione' },
        { label: 'Avanzamento', icona: 'bi-graph-up-arrow', percorso: '/avanzamento' },
        { label: 'Domande e importi', icona: 'bi-calendar3', percorso: '/domande' },
        { label: 'SIGC', icona: 'bi-funnel', percorso: '/sigc' },
        { label: 'Riserva di efficacia', icona: 'bi-safe', percorso: '/riserva' },
      ] },
      { label: 'Fisico', icona: 'bi-geo-alt', presto: true },
      { label: 'Procedurale', icona: 'bi-diagram-3', presto: true },
      { label: 'Istituzionale', icona: 'bi-bank', presto: true },
      { label: 'Primo pilastro', icona: 'bi-flower1', presto: true },
    ] },
    { sezione: 'Strumenti', voci: [
      { label: 'Esportazioni', icona: 'bi-file-earmark-arrow-down', presto: true },
      { label: 'Guida', icona: 'bi-question-circle', presto: true },
    ] },
  ];
  const gruppiAperti = new Set(['Finanziario']);

  function htmlMenu(prefisso) {
    const attivo = percorsoCorrente();
    const voce = (v) => {
      if (v.presto) return `<li><a aria-disabled="true"><i class="bi ${v.icona}" aria-hidden="true"></i>${v.label}<span class="csr-menu__presto">presto</span></a></li>`;
      const corrente = attivo === v.percorso || (v.percorso === '/riepilogo' && attivo.startsWith('/intervento/'));
      return `<li><a href="#${v.percorso}${query(filtri)}"${corrente ? ' aria-current="page"' : ''}><i class="bi ${v.icona}" aria-hidden="true"></i>${v.label}</a></li>`;
    };
    return `<div class="csr-menu">${MENU.map((s) => `
      <div class="csr-menu__sezione">${s.sezione}</div>
      <ul>${s.voci.map((v) => {
        if (!v.gruppo) return voce(v);
        const id = `${prefisso}-gruppo-${v.gruppo}`;
        const aperto = gruppiAperti.has(v.gruppo);
        return `<li><button class="csr-menu__gruppo" type="button" aria-expanded="${aperto}" aria-controls="${id}" data-gruppo="${v.gruppo}">
            <i class="bi ${v.icona}" aria-hidden="true"></i>${v.gruppo}<i class="bi bi-chevron-right csr-menu__chevron" aria-hidden="true"></i></button>
          <ul id="${id}" class="csr-menu__sub"${aperto ? '' : ' hidden'}>${v.voci.map(voce).join('')}</ul></li>`;
      }).join('')}</ul>`).join('')}</div>`;
  }
  function disegnaMenu() {
    document.getElementById('menu-desktop').innerHTML = htmlMenu('d');
    document.getElementById('menu-mobile-nav').innerHTML = htmlMenu('m');
  }
  document.addEventListener('click', (e) => {
    const g = e.target.closest('[data-gruppo]');
    if (!g) return;
    const nome = g.dataset.gruppo;
    if (gruppiAperti.has(nome)) gruppiAperti.delete(nome); else gruppiAperti.add(nome);
    disegnaMenu();
    document.querySelector(`[data-gruppo="${nome}"]`)?.focus();
  });

  // ---------------------------------------------------------------- barra dei filtri
  function disegnaBarraFiltri() {
    const n = numeroFiltri(filtri);
    const chips = CHIAVI.flatMap((k) => filtri[k].map((v) => {
      const descr = k === 'og' ? ` · ${OG[v]}` : k === 'os' ? ` · ${OS[v]}` : '';
      return `<span class="csr-chip"><b>${ETICHETTE_FILTRO[k]}</b> ${esc(v)}${esc(descr)}
        <button type="button" data-togli="${k}:${esc(v)}" aria-label="Togli il filtro ${ETICHETTE_FILTRO[k]} ${esc(v)}"><i class="bi bi-x" aria-hidden="true"></i></button></span>`;
    }));
    const ultimo = ULTIMI_DATI.map(([, d]) => d).sort().at(-1);
    document.getElementById('barra-filtri').innerHTML = `
      <button type="button" class="btn btn-primary btn-sm csr-filtri__bottone" data-bs-toggle="offcanvas" data-bs-target="#pannello-filtri" aria-controls="pannello-filtri">
        <i class="bi bi-sliders" aria-hidden="true"></i> Filtri${n ? ` <span class="badge bg-white text-primary">${n}</span>` : ''}</button>
      <div class="csr-filtri__chips" aria-label="Filtri attivi" role="group">
        ${chips.length ? chips.join('') + `<button type="button" class="btn btn-link btn-sm p-0 ms-1" id="togli-tutti">Togli tutti</button>`
          : '<span class="csr-chip csr-chip--tutti">Tutti gli interventi, OS, OG e OP</span>'}
      </div>
      <div class="csr-filtri__destra">
        <span class="csr-pill csr-pill--perimetro" title="Perimetro dei dati del profilo"><i class="bi bi-geo" aria-hidden="true"></i> Perimetro regionale</span>
        <div class="csr-pop">
          <button type="button" class="csr-pill csr-pill--dati" aria-expanded="false" aria-controls="pop-dati" id="apri-dati">
            <i class="bi bi-arrow-repeat" aria-hidden="true"></i> Dati al ${dataOra(ultimo).slice(0, 10)}</button>
          <div class="csr-pop__corpo" id="pop-dati" hidden>
            <strong>Ultimo dato sincronizzato</strong>
            <ul>${ULTIMI_DATI.map(([f, d]) => `<li><span>${etichettaFlusso(f)}</span><span>${dataOra(d)}</span></li>`).join('')}</ul>
          </div>
        </div>
      </div>`;
  }
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-togli]');
    if (t) {
      const [k, v] = t.dataset.togli.split(':');
      const f = { ...filtri, [k]: filtri[k].filter((x) => x !== v) };
      vai(percorsoCorrente(), f);
      return;
    }
    if (e.target.closest('#togli-tutti')) { vai(percorsoCorrente(), { intervento: [], og: [], os: [], op: [] }); return; }
    const pop = document.getElementById('pop-dati');
    const apri = e.target.closest('#apri-dati');
    if (apri && pop) {
      const aperto = !pop.hidden;
      pop.hidden = aperto;
      apri.setAttribute('aria-expanded', String(!aperto));
    } else if (pop && !e.target.closest('#pop-dati')) {
      pop.hidden = true;
      document.getElementById('apri-dati')?.setAttribute('aria-expanded', 'false');
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const pop = document.getElementById('pop-dati');
    if (pop && !pop.hidden) { pop.hidden = true; document.getElementById('apri-dati')?.focus(); }
  });

  // ---------------------------------------------------------------- pannello dei filtri
  const pannello = document.getElementById('pannello-filtri');
  pannello.addEventListener('show.bs.offcanvas', () => { bozza = structuredClone(filtri); disegnaPannello(); });
  function disegnaPannello(cerca = '') {
    const corpo = document.getElementById('corpo-filtri');
    const q = cerca.trim().toLowerCase();
    const opzioni = INTERVENTI.filter((i) => !q || `${i.codice} ${i.nome}`.toLowerCase().includes(q)).map((i) => `
      <label class="csr-opzione"><input type="checkbox" data-bozza="intervento" value="${i.codice}"${bozza.intervento.includes(i.codice) ? ' checked' : ''}>
        <span><span class="csr-opzione__codice">${i.codice}</span> <span class="csr-opzione__descr">${esc(i.nome)}</span></span></label>`).join('');
    const chips = (k, voci) => `<div class="csr-toggle-chips" role="group" aria-label="${ETICHETTE_FILTRO[k]}">${Object.entries(voci).map(([c, d]) =>
      `<button type="button" class="csr-toggle-chip" data-bozza-chip="${k}" data-valore="${c}" aria-pressed="${bozza[k].includes(c)}">${k === 'op' ? d : `${c} · ${d}`}</button>`).join('')}</div>`;
    const conta = (k) => (bozza[k].length ? `<span class="csr-gruppo-filtro__conta">${bozza[k].length}</span>` : '');
    corpo.innerHTML = `
      <details class="csr-gruppo-filtro" open><summary><i class="bi bi-list-check" aria-hidden="true"></i> Intervento ${conta('intervento')}<i class="bi bi-chevron-down" aria-hidden="true"></i></summary>
        <div class="csr-gruppo-filtro__corpo">
          <label class="visually-hidden" for="cerca-filtro">Cerca tra gli interventi</label>
          <input id="cerca-filtro" class="csr-cerca-filtro" type="search" placeholder="Cerca per codice o descrizione" value="${esc(cerca)}">
          <div class="csr-opzioni">${opzioni || '<p class="small text-muted mb-0">Nessun intervento corrisponde alla ricerca.</p>'}</div>
        </div></details>
      <details class="csr-gruppo-filtro" open><summary><i class="bi bi-bullseye" aria-hidden="true"></i> Obiettivo generale (OG) ${conta('og')}<i class="bi bi-chevron-down" aria-hidden="true"></i></summary>
        <div class="csr-gruppo-filtro__corpo">${chips('og', OG)}</div></details>
      <details class="csr-gruppo-filtro"><summary><i class="bi bi-crosshair" aria-hidden="true"></i> Obiettivo specifico (OS) ${conta('os')}<i class="bi bi-chevron-down" aria-hidden="true"></i></summary>
        <div class="csr-gruppo-filtro__corpo">${chips('os', OS)}</div></details>
      <details class="csr-gruppo-filtro"><summary><i class="bi bi-flag" aria-hidden="true"></i> Obiettivo di policy (OP) ${conta('op')}<i class="bi bi-chevron-down" aria-hidden="true"></i></summary>
        <div class="csr-gruppo-filtro__corpo">${chips('op', OP)}</div></details>
      <details class="csr-gruppo-filtro"><summary><i class="bi bi-link-45deg" aria-hidden="true"></i> Azione portante<i class="bi bi-chevron-down" aria-hidden="true"></i></summary>
        <div class="csr-gruppo-filtro__corpo"><p class="csr-nota-filtro mb-0"><i class="bi bi-info-circle" aria-hidden="true"></i>
          Non disponibile finché nessun intervento è collegato a un'azione portante.</p></div></details>
      <p class="csr-nota-filtro"><i class="bi bi-info-circle" aria-hidden="true"></i> Valori dello stesso filtro in alternativa (O); filtri diversi insieme (E).</p>`;
    const n = selezione(bozza).length;
    document.getElementById('applica-filtri').innerHTML = `Mostra ${n} ${n === 1 ? 'intervento' : 'interventi'}`;
    document.getElementById('applica-filtri').disabled = n === 0;
  }
  document.getElementById('corpo-filtri').addEventListener('input', (e) => {
    if (e.target.id === 'cerca-filtro') {
      const pos = e.target.selectionStart;
      disegnaPannello(e.target.value);
      const c = document.getElementById('cerca-filtro');
      c.focus(); c.setSelectionRange(pos, pos);
    }
  });
  document.getElementById('corpo-filtri').addEventListener('change', (e) => {
    const k = e.target.dataset.bozza;
    if (!k) return;
    bozza[k] = e.target.checked ? [...bozza[k], e.target.value] : bozza[k].filter((x) => x !== e.target.value);
    const cerca = document.getElementById('cerca-filtro')?.value ?? '';
    disegnaPannello(cerca);
    document.querySelector(`[data-bozza="${k}"][value="${e.target.value}"]`)?.focus();
  });
  document.getElementById('corpo-filtri').addEventListener('click', (e) => {
    const b = e.target.closest('[data-bozza-chip]');
    if (!b) return;
    const k = b.dataset.bozzaChip, v = b.dataset.valore;
    bozza[k] = bozza[k].includes(v) ? bozza[k].filter((x) => x !== v) : [...bozza[k], v];
    disegnaPannello(document.getElementById('cerca-filtro')?.value ?? '');
    document.querySelector(`[data-bozza-chip="${k}"][data-valore="${v}"]`)?.focus();
  });
  document.getElementById('applica-filtri').addEventListener('click', () => {
    bootstrap.Offcanvas.getOrCreateInstance(pannello).hide();
    vai(percorsoCorrente(), bozza);
  });
  document.getElementById('azzera-filtri').addEventListener('click', () => {
    bozza = { intervento: [], og: [], os: [], op: [] };
    disegnaPannello();
  });

  // ---------------------------------------------------------------- grafici (ECharts)
  const PALETTE = ['#0066cc', '#4e8a1f', '#b26b00', '#7a5cb8', '#00838f', '#c0392b', '#0b2d4e', '#8a99a8'];
  echarts.registerTheme('csr', {
    color: PALETTE,
    textStyle: { fontFamily: '"Titillium Web", Geneva, Tahoma, sans-serif', color: '#17212b' },
    tooltip: { backgroundColor: 'rgba(11,45,78,.94)', borderWidth: 0, textStyle: { color: '#fff', fontSize: 13 }, extraCssText: 'border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.18);' },
    legend: { textStyle: { color: '#546474' } },
    categoryAxis: { axisLine: { lineStyle: { color: '#c9d3de' } }, axisTick: { show: false }, axisLabel: { color: '#546474' } },
    valueAxis: { axisLine: { show: false }, splitLine: { lineStyle: { color: '#eef2f6' } }, axisLabel: { color: '#546474' } },
  });
  // ?statico (screenshot e test): niente animazioni
  const STATICO = new URLSearchParams(location.search).has('statico');
  if (STATICO) document.documentElement.classList.add('csr-statico');
  const grafici = new Map();
  const tabelle = new Map();
  function crea(id, opzione) {
    const el = document.getElementById(id);
    if (!el) return null;
    const c = echarts.init(el, 'csr', { renderer: 'svg' });
    c.setOption({ aria: { enabled: true }, animation: !STATICO, animationDuration: 700, animationEasing: 'cubicOut', ...opzione });
    grafici.set(id, c);
    return c;
  }
  function chiudiGrafici() { grafici.forEach((c) => c.dispose()); grafici.clear(); tabelle.clear(); }
  window.addEventListener('resize', () => grafici.forEach((c) => c.resize()));

  function tabellaHtml({ caption, colonne, righe }) {
    return `<div class="csr-tabella-wrap"><table class="csr-tabella"><caption>${esc(caption)}</caption>
      <thead><tr>${colonne.map((c, i) => `<th scope="col"${i ? ' class="csr-num"' : ''}>${esc(c)}</th>`).join('')}</tr></thead>
      <tbody>${righe.map((r) => `<tr>${r.map((v, i) => (i ? `<td class="csr-num">${esc(v)}</td>` : `<th scope="row">${esc(v)}</th>`)).join('')}</tr>`).join('')}</tbody></table></div>`;
  }
  function cardGrafico({ id, titolo, sottotitolo = '', classe = 'csr-grafico', tabella, fonte = 'Fonte: dati di esempio del prototipo', strumenti = '' }) {
    tabelle.set(id, tabella);
    return `<section class="csr-card csr-fade" aria-labelledby="t-${id}">
      <div class="csr-card__testa">
        <div><h2 id="t-${id}">${esc(titolo)}</h2>${sottotitolo ? `<p>${esc(sottotitolo)}</p>` : ''}</div>
        <div class="csr-card__strumenti">${strumenti}
          <div class="csr-seg" role="group" aria-label="Vista di ${esc(titolo)}">
            <button type="button" aria-pressed="true" data-vista="grafico" data-card="${id}">Grafico</button>
            <button type="button" aria-pressed="false" data-vista="tabella" data-card="${id}">Tabella</button>
          </div>
          <button type="button" class="csr-icona-btn" data-scarica="${id}" aria-label="Scarica il grafico ${esc(titolo)} come immagine" title="Scarica come immagine"><i class="bi bi-download" aria-hidden="true"></i></button>
        </div>
      </div>
      <div id="${id}" class="${classe}"></div>
      <div id="${id}-tabella" hidden></div>
      <p class="csr-fonte"><i class="bi bi-info-circle" aria-hidden="true"></i>${esc(fonte)}</p>
    </section>`;
  }
  document.addEventListener('click', (e) => {
    const v = e.target.closest('[data-vista]');
    if (v) {
      const id = v.dataset.card;
      const tab = document.getElementById(`${id}-tabella`);
      const graf = document.getElementById(id);
      const mostraTabella = v.dataset.vista === 'tabella';
      if (mostraTabella && !tab.innerHTML) tab.innerHTML = tabellaHtml(tabelle.get(id)());
      tab.hidden = !mostraTabella;
      graf.hidden = mostraTabella;
      v.parentElement.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b === v)));
      if (!mostraTabella) grafici.get(id)?.resize();
      return;
    }
    const s = e.target.closest('[data-scarica]');
    if (s) {
      const c = grafici.get(s.dataset.scarica);
      if (!c) return;
      const a = document.createElement('a');
      a.href = c.getDataURL({ backgroundColor: '#fff' });
      a.download = `${s.dataset.scarica}.svg`;
      a.click();
    }
  });
  function kpi({ id, etichetta, icona, tono, valore, unita = '', nota = '', quota = null, spark = false }) {
    return `<section class="csr-card csr-kpi csr-fade" aria-label="${esc(etichetta)}">
      <div class="csr-kpi__etichetta"><span class="csr-kpi__icona ${tono}"><i class="bi ${icona}" aria-hidden="true"></i></span>${esc(etichetta)}</div>
      <div class="csr-kpi__valore">${valore}<small>${unita}</small></div>
      ${nota ? `<div class="csr-kpi__nota">${nota}</div>` : ''}
      ${quota !== null ? `<div class="csr-barra" role="img" aria-label="${pct(quota)}"><span style="width:${Math.min(100, quota * 100)}%"></span></div>` : ''}
      ${spark ? `<div class="csr-kpi__spark" id="${id}" aria-hidden="true"></div>` : ''}
    </section>`;
  }
  function spark(id, valori, colore, tipo = 'line') {
    crea(id, {
      aria: { enabled: false }, grid: { left: 4, right: 4, top: 6, bottom: 2 }, xAxis: { type: 'category', show: false, data: valori.map((_, i) => i) },
      yAxis: { type: 'value', show: false }, tooltip: { show: false },
      series: [{ type: tipo, data: valori, smooth: true, symbol: 'none', barWidth: '55%', itemStyle: { color: colore, borderRadius: 3 }, lineStyle: { color: colore, width: 2 },
        areaStyle: tipo === 'line' ? { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: `${colore}55` }, { offset: 1, color: `${colore}00` }]) } : undefined }],
    });
  }

  // ---- fabbriche di grafici
  function sankey(id, sel) {
    const nodi = [...Object.keys(OG).filter((g) => sel.some((i) => i.og === g)).map((g) => ({ name: `${g} · ${OG[g]}`, itemStyle: { color: COLORE_OG[g] } })),
      { name: 'Impegnato', itemStyle: { color: '#0b2d4e' } }, { name: 'Da impegnare', itemStyle: { color: '#c9d3de' } },
      { name: 'Pagato', itemStyle: { color: '#4e8a1f' } }, { name: 'Da pagare', itemStyle: { color: '#b26b00' } }];
    const link = [];
    for (const g of Object.keys(OG)) {
      const s = sel.filter((i) => i.og === g);
      if (!s.length) continue;
      link.push({ source: `${g} · ${OG[g]}`, target: 'Impegnato', value: somma(s, (i) => i.impegnato) });
      link.push({ source: `${g} · ${OG[g]}`, target: 'Da impegnare', value: somma(s, (i) => i.dotazione - i.impegnato) });
    }
    link.push({ source: 'Impegnato', target: 'Pagato', value: somma(sel, (i) => i.pagato) });
    link.push({ source: 'Impegnato', target: 'Da pagare', value: somma(sel, (i) => i.impegnato - i.pagato) });
    crea(id, {
      tooltip: { trigger: 'item', formatter: (p) => (p.dataType === 'edge' ? `${p.data.source} → ${p.data.target}<br><b>${mln(p.value)} M€</b>` : `${p.name}<br><b>${mln(p.value)} M€</b>`) },
      series: [{ type: 'sankey', left: 8, right: 110, top: 12, bottom: 12, nodeGap: 14, nodeWidth: 14, draggable: false, emphasis: { focus: 'adjacency' },
        lineStyle: { color: 'gradient', curveness: 0.5, opacity: 0.3 }, label: { color: '#17212b', fontSize: 12, formatter: (p) => `{n|${p.name}}\n{v|${mln(p.value)} M€}`,
          rich: { n: { fontWeight: 600, fontSize: 12 }, v: { color: '#546474', fontSize: 11 } } }, data: nodi, links: link }],
    });
    return () => ({ caption: 'Flusso della dotazione (milioni di euro)', colonne: ['Da', 'A', 'M€'], righe: link.map((l) => [l.source, l.target, mln(l.value)]) });
  }
  function gerarchia(sel) {
    return Object.keys(OG).map((g) => ({ name: g, nomeLungo: OG[g], itemStyle: { color: COLORE_OG[g] }, children: Object.keys(OS).map((s) => ({ name: s, nomeLungo: OS[s],
      children: sel.filter((i) => i.og === g && i.os === s).map((i) => ({ name: i.codice, codice: i.codice, nomeLungo: i.nome, value: i.dotazione })) }))
      .filter((s) => s.children.length) })).filter((g) => g.children.length);
  }
  function treemap(id, sel, tipo = 'treemap') {
    const dati = gerarchia(sel);
    const tooltip = { formatter: (p) => `${p.data.nomeLungo ? `<b>${p.name}</b> · ${esc(p.data.nomeLungo)}` : `<b>${p.name}</b>`}<br>Dotazione ${mln(p.value)} M€${p.data.codice ? '<br><i>Clic per il dettaglio</i>' : ''}` };
    const serie = tipo === 'treemap'
      ? { type: 'treemap', name: 'Tutti gli obiettivi', roam: false, nodeClick: 'zoomToNode', leafDepth: 2, top: 8, left: 4, right: 4, bottom: 34, breadcrumb: { show: true, bottom: 4, itemStyle: { color: '#e6ecf3', textStyle: { color: '#0b2d4e' } } },
        upperLabel: { show: true, height: 24, color: '#fff', fontWeight: 600 }, label: { formatter: (p) => `${p.name}\n${mln(p.value)} M€`, fontSize: 12 },
        levels: [{ itemStyle: { borderColor: '#fff', borderWidth: 3, gapWidth: 3 } }, { colorSaturation: [0.35, 0.6], itemStyle: { gapWidth: 2, borderColorSaturation: 0.65 } },
          { colorSaturation: [0.35, 0.55], itemStyle: { gapWidth: 1, borderColorSaturation: 0.6 } }], data: dati }
      : { type: 'sunburst', radius: [36, '92%'], nodeClick: 'rootToNode', sort: 'desc', emphasis: { focus: 'ancestor' }, itemStyle: { borderColor: '#fff', borderWidth: 2 },
        label: { rotate: 'radial', fontSize: 11, minAngle: 8 }, levels: [{}, { r0: 36, r: '42%', label: { rotate: 0, fontWeight: 600 } }, { r0: '42%', r: '68%' }, { r0: '68%', r: '92%', label: { align: 'right' } }], data: dati };
    const c = crea(id, { tooltip, series: [serie] });
    c.on('click', (p) => { if (p.data && p.data.codice) vai(`/intervento/${p.data.codice}`); });
    return () => ({ caption: 'Dotazione per obiettivo e intervento (milioni di euro)', colonne: ['Intervento', 'OG', 'OS', 'Dotazione M€'],
      righe: sel.map((i) => [`${i.codice} ${i.nome}`, i.og, i.os, mln(i.dotazione)]) });
  }
  function heatmap(id, sel) {
    const ord = [...sel].sort((a, b) => a.codice.localeCompare(b.codice)).reverse();
    const dati = ord.flatMap((i, y) => ANNI.map((_, x) => [x, y, i.domande[x]]));
    const max = Math.max(...dati.map((d) => d[2]), 1);
    const c = crea(id, {
      tooltip: { formatter: (p) => `<b>${ord[p.data[1]].codice}</b> · ${ANNI[p.data[0]]}<br>${num(p.data[2])} domande` },
      grid: { left: 64, right: 12, top: 8, bottom: 86 }, xAxis: { type: 'category', data: ANNI.map(String), splitArea: { show: true } },
      yAxis: { type: 'category', data: ord.map((i) => i.codice), splitArea: { show: true } },
      visualMap: { min: 0, max, calculable: true, orient: 'horizontal', left: 'center', bottom: 0, itemHeight: 140, inRange: { color: ['#f1f6fc', '#9cc3ec', '#0066cc', '#0b2d4e'] }, textStyle: { color: '#546474' } },
      series: [{ type: 'heatmap', data: dati, label: { show: true, fontSize: 11, formatter: (p) => num(p.data[2]) }, itemStyle: { borderColor: '#fff', borderWidth: 2, borderRadius: 4 },
        emphasis: { itemStyle: { shadowBlur: 8, shadowColor: 'rgba(0,0,0,.25)' } } }],
    });
    c.on('click', (p) => vai(`/intervento/${ord[p.data[1]].codice}`));
    return () => ({ caption: 'Domande presentate per intervento e anno', colonne: ['Intervento', ...ANNI.map(String)], righe: ord.map((i) => [i.codice, ...i.domande.map(num)]) });
  }
  function classifica(id, sel) {
    const ord = [...sel].map((i) => ({ i, q: i.pagato / i.dotazione })).sort((a, b) => a.q - b.q);
    const media = somma(sel, (i) => i.pagato) / Math.max(1, somma(sel, (i) => i.dotazione));
    const c = crea(id, {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: (ps) => { const d = ord[ps[0].dataIndex]; return `<b>${d.i.codice}</b> · ${esc(d.i.nome)}<br>Pagato ${mln(d.i.pagato)} M€ su ${mln(d.i.dotazione)} M€<br><b>${pct(d.q)}</b>`; } },
      grid: { left: 58, right: 54, top: 8, bottom: 24 }, xAxis: { type: 'value', max: 1, axisLabel: { formatter: (v) => pct(v) } },
      yAxis: { type: 'category', data: ord.map((d) => d.i.codice) },
      series: [{ type: 'bar', data: ord.map((d) => ({ value: d.q, itemStyle: { color: d.q >= 0.5 ? '#4e8a1f' : d.q >= 0.3 ? '#0066cc' : '#b26b00', borderRadius: [0, 6, 6, 0] } })),
        barWidth: '58%', label: { show: true, position: 'right', formatter: (p) => pct(p.value), color: '#17212b', fontSize: 11 },
        markLine: { symbol: 'none', silent: true, lineStyle: { type: 'dashed', color: '#0b2d4e' }, label: { show: false }, data: [{ xAxis: media }] } }],
    });
    c.on('click', (p) => vai(`/intervento/${ord[p.dataIndex].i.codice}`));
    return () => ({ caption: 'Pagato sulla dotazione per intervento', colonne: ['Intervento', 'Dotazione M€', 'Pagato M€', 'Pagato su dotazione'],
      righe: [...ord].reverse().map((d) => [d.i.codice, mln(d.i.dotazione), mln(d.i.pagato), pct(d.q)]) });
  }
  function barreRaggruppate(id, sel) {
    crea(id, {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: (v) => `${mln(v)} M€` }, legend: { top: 0 },
      grid: { left: 52, right: 16, top: 40, bottom: 64 }, xAxis: { type: 'category', data: sel.map((i) => i.codice) },
      yAxis: { type: 'value', axisLabel: { formatter: (v) => `${mln(v)}` }, name: 'M€', nameTextStyle: { color: '#546474' } },
      dataZoom: [{ type: 'inside' }, { type: 'slider', height: 18, bottom: 12, borderColor: 'transparent', fillerColor: 'rgba(0,102,204,.12)' }],
      series: [['Dotazione', 'dotazione', '#0b2d4e'], ['Impegnato', 'impegnato', '#0066cc'], ['Pagato', 'pagato', '#4e8a1f']].map(([n, k, col]) => ({
        name: n, type: 'bar', data: sel.map((i) => i[k]), itemStyle: { color: col, borderRadius: [5, 5, 0, 0] }, emphasis: { focus: 'series' }, barGap: '15%' })),
    }).on('click', (p) => vai(`/intervento/${sel[p.dataIndex].codice}`));
    return () => ({ caption: 'Dotazione, impegnato e pagato per intervento (milioni di euro)', colonne: ['Intervento', 'Dotazione', 'Impegnato', 'Pagato'],
      righe: sel.map((i) => [i.codice, mln(i.dotazione), mln(i.impegnato), mln(i.pagato)]) });
  }
  function anni(id, sel) {
    const dom = ANNI.map((_, x) => somma(sel, (i) => i.domande[x]));
    const imp = ANNI.map((_, x) => somma(sel, (i) => i.pagatoAnno[x]));
    crea(id, {
      tooltip: { trigger: 'axis' }, legend: { top: 0 }, grid: { left: 52, right: 60, top: 40, bottom: 28 },
      xAxis: { type: 'category', data: ANNI.map(String) },
      yAxis: [{ type: 'value', name: 'Domande', nameTextStyle: { color: '#546474' } }, { type: 'value', name: 'M€', axisLabel: { formatter: (v) => mln(v) }, splitLine: { show: false }, nameTextStyle: { color: '#546474' } }],
      series: [{ name: 'Domande presentate', type: 'bar', data: dom, barWidth: '42%', itemStyle: { color: '#0066cc', borderRadius: [6, 6, 0, 0] }, tooltip: { valueFormatter: num } },
        { name: 'Importo pagato', type: 'line', yAxisIndex: 1, data: imp, smooth: true, symbolSize: 9, lineStyle: { width: 3, color: '#4e8a1f' }, itemStyle: { color: '#4e8a1f' },
          areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(78,138,31,.25)' }, { offset: 1, color: 'rgba(78,138,31,0)' }]) },
          tooltip: { valueFormatter: (v) => `${mln(v)} M€` } }],
    });
    return () => ({ caption: 'Domande presentate e importo pagato per anno', colonne: ['Anno', 'Domande', 'Pagato M€'], righe: ANNI.map((a, x) => [String(a), num(dom[x]), mln(imp[x])]) });
  }
  function gauge(id, quota, titolo = 'della dotazione pagato') {
    crea(id, {
      series: [{ type: 'gauge', startAngle: 210, endAngle: -30, min: 0, max: 100, radius: '96%', center: ['50%', '58%'], progress: { show: true, width: 18, roundCap: true, itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [{ offset: 0, color: '#0066cc' }, { offset: 1, color: '#4e8a1f' }]) } },
        axisLine: { roundCap: true, lineStyle: { width: 18, color: [[1, '#e6ecf3']] } }, pointer: { show: false }, axisTick: { show: false }, splitLine: { show: false }, axisLabel: { show: false }, anchor: { show: false },
        title: { show: true, offsetCenter: [0, '34%'], color: '#546474', fontSize: 13 }, detail: { valueAnimation: true, offsetCenter: [0, '0%'], fontSize: 34, fontWeight: 700, color: '#0b2d4e', formatter: (v) => `${v.toLocaleString('it-IT', { maximumFractionDigits: 1 })}%` },
        data: [{ value: Math.round(quota * 1000) / 10, name: titolo }] }],
    });
    return () => ({ caption: 'Avanzamento', colonne: ['Misura', 'Valore'], righe: [[titolo, pct(quota)]] });
  }
  function cascata(id, i) {
    const cat = ['Dotazione', 'Non impegnato', 'Impegnato', 'Da pagare', 'Pagato'];
    const base = [0, i.impegnato, 0, i.pagato, 0];
    const val = [i.dotazione, i.dotazione - i.impegnato, i.impegnato, i.impegnato - i.pagato, i.pagato];
    const colori = ['#0b2d4e', '#b26b00', '#0066cc', '#b26b00', '#4e8a1f'];
    crea(id, {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: (ps) => { const p = ps.find((x) => x.seriesName === 'valore'); return `${p.name}<br><b>${mln(p.value)} M€</b>`; } },
      grid: { left: 52, right: 16, top: 16, bottom: 28 }, xAxis: { type: 'category', data: cat }, yAxis: { type: 'value', axisLabel: { formatter: (v) => mln(v) }, name: 'M€' },
      series: [{ name: 'base', type: 'bar', stack: 't', data: base, itemStyle: { color: 'transparent' }, emphasis: { disabled: true }, tooltip: { show: false } },
        { name: 'valore', type: 'bar', stack: 't', barWidth: '46%', data: val.map((v, k) => ({ value: v, itemStyle: { color: colori[k], borderRadius: 6 } })),
          label: { show: true, position: 'top', formatter: (p) => `${mln(p.value)}`, color: '#17212b', fontWeight: 600 } }],
    });
    return () => ({ caption: `Dalla dotazione al pagato, ${i.codice} (milioni di euro)`, colonne: ['Voce', 'M€'], righe: cat.map((c, k) => [c, mln(val[k])]) });
  }
  function imbuto(id, s, titolo) {
    const fasi = [['Presentate', s.presentate], ['Istruite', s.istruite], ['Ammesse', s.ammesse], ['Pagate', s.pagate]];
    crea(id, {
      tooltip: { formatter: (p) => `${p.name}: <b>${num(p.value)}</b> (${pct(p.value / s.presentate)} delle presentate)` },
      series: [{ type: 'funnel', left: '8%', width: '84%', top: 8, bottom: 8, minSize: '22%', sort: 'descending', gap: 4, label: { position: 'inside', color: '#fff', fontWeight: 600, formatter: (p) => `${p.name}  ${num(p.value)}` },
        itemStyle: { borderColor: '#fff', borderWidth: 2 }, data: fasi.map(([n, v], k) => ({ name: n, value: v, itemStyle: { color: ['#0b2d4e', '#0066cc', '#00838f', '#4e8a1f'][k] } })) }],
    });
    return () => ({ caption: titolo, colonne: ['Fase', 'Domande'], righe: fasi.map(([n, v]) => [n, num(v)]) });
  }
  function cumulato(id, valori, colore = '#4e8a1f') {
    crea(id, {
      tooltip: { trigger: 'axis', valueFormatter: (v) => `${mln(v)} M€` }, grid: { left: 52, right: 16, top: 16, bottom: 56 },
      xAxis: { type: 'category', data: TRIMESTRI, boundaryGap: false }, yAxis: { type: 'value', axisLabel: { formatter: (v) => mln(v) }, name: 'M€' },
      dataZoom: [{ type: 'inside' }, { type: 'slider', height: 16, bottom: 8, borderColor: 'transparent' }],
      series: [{ name: 'Pagato cumulato', type: 'line', data: valori, smooth: true, symbolSize: 7, lineStyle: { width: 3, color: colore }, itemStyle: { color: colore },
        areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: `${colore}44` }, { offset: 1, color: `${colore}00` }]) } }],
    });
    return () => ({ caption: 'Pagato cumulato per trimestre (milioni di euro)', colonne: ['Trimestre', 'M€'], righe: TRIMESTRI.map((t, k) => [t, mln(valori[k])]) });
  }

  // ---------------------------------------------------------------- intestazione di pagina
  function testa({ briciole, titolo, sottotitolo, azioni = '' }) {
    document.title = `${titolo} - Finanziario - Cruscotto CSR 2023-2027`;
    return `<nav class="csr-breadcrumb" aria-label="Percorso"><ol>${briciole.map(([t, p]) => (p ? `<li><a href="#${p}${query(filtri)}">${esc(t)}</a></li>` : `<li aria-current="page">${esc(t)}</li>`)).join('')}</ol></nav>
      <div class="csr-titolo"><div><h1 tabindex="-1">${esc(titolo)}</h1>${sottotitolo ? `<p>${sottotitolo}</p>` : ''}</div>${azioni ? `<div class="csr-titolo__azioni">${azioni}</div>` : ''}</div>`;
  }
  const B_FIN = [['Home', '/panoramica'], ['Finanziario', '/panoramica']];
  function nessunRisultato() {
    return `<div class="csr-card text-center py-5"><i class="bi bi-funnel fs-1 text-muted" aria-hidden="true"></i>
      <h2 class="h4 mt-3">Nessun intervento per i filtri scelti</h2><p class="text-muted">Modifica o togli i filtri per vedere i dati.</p>
      <button class="btn btn-primary" type="button" data-bs-toggle="offcanvas" data-bs-target="#pannello-filtri">Modifica i filtri</button></div>`;
  }
  function kpiTotali(sel) {
    const dot = somma(sel, (i) => i.dotazione), imp = somma(sel, (i) => i.impegnato), pag = somma(sel, (i) => i.pagato);
    const dom = somma(sel, (i) => somma(i.domande, (d) => d));
    return `<div class="row g-3 mb-3">
      <div class="col-12 col-sm-6 col-xl-3">${kpi({ etichetta: 'Dotazione', icona: 'bi-wallet2', tono: 'csr-tono-navy', valore: mln(dot), unita: ' M€', nota: `${sel.length} interventi nella selezione` })}</div>
      <div class="col-12 col-sm-6 col-xl-3">${kpi({ etichetta: 'Impegnato', icona: 'bi-journal-check', tono: 'csr-tono-blu', valore: mln(imp), unita: ' M€', nota: `${pct(imp / dot)} della dotazione`, quota: imp / dot })}</div>
      <div class="col-12 col-sm-6 col-xl-3">${kpi({ id: 'spark-pagato', etichetta: 'Pagato', icona: 'bi-cash-stack', tono: 'csr-tono-verde', valore: mln(pag), unita: ' M€', nota: `${pct(pag / dot)} della dotazione`, spark: true })}</div>
      <div class="col-12 col-sm-6 col-xl-3">${kpi({ id: 'spark-domande', etichetta: 'Domande presentate', icona: 'bi-people', tono: 'csr-tono-ambra', valore: num(dom), nota: 'dal 2023', spark: true })}</div>
    </div>`;
  }
  function sparkTotali(sel) {
    spark('spark-pagato', TRIMESTRI.map((_, k) => somma(sel, (i) => i.pagatoTrimestri[k])), '#4e8a1f');
    spark('spark-domande', ANNI.map((_, x) => somma(sel, (i) => i.domande[x])), '#b26b00', 'bar');
  }

  // ---------------------------------------------------------------- viste
  const VISTE = {
    '/panoramica': (pagina, sel) => {
      pagina.innerHTML = testa({ briciole: [...B_FIN, ['Panoramica']], titolo: 'Panoramica finanziaria', sottotitolo: 'Dotazione, impegni, pagamenti e domande degli interventi selezionati. Ogni grafico è cliccabile: porta al dettaglio dell’intervento.' })
        + (sel.length ? kpiTotali(sel) + `
        <div class="row g-3 mb-3">
          <div class="col-12 col-xl-7">${cardGrafico({ id: 'g-sankey', titolo: 'Dove va la dotazione', sottotitolo: 'Dagli obiettivi generali all’impegnato e al pagato', classe: 'csr-grafico csr-grafico--alto', tabella: () => tab.sankey() })}</div>
          <div class="col-12 col-xl-5">${cardGrafico({ id: 'g-albero', titolo: 'Dotazione per obiettivo', sottotitolo: 'Clic su un obiettivo per entrare, su un intervento per il dettaglio', classe: 'csr-grafico csr-grafico--alto', tabella: () => tab.albero(),
            strumenti: `<div class="csr-seg" role="group" aria-label="Forma"><button type="button" aria-pressed="true" data-forma="treemap">Riquadri</button><button type="button" aria-pressed="false" data-forma="sunburst">Anelli</button></div>` })}</div>
        </div>
        <div class="row g-3">
          <div class="col-12 col-xl-7">${cardGrafico({ id: 'g-heat', titolo: 'Domande per intervento e anno', sottotitolo: 'Più scuro = più domande; clic su una cella per il dettaglio', classe: 'csr-grafico csr-grafico--alto', tabella: () => tab.heat() })}</div>
          <div class="col-12 col-xl-5">${cardGrafico({ id: 'g-classifica', titolo: 'Avanzamento della spesa', sottotitolo: `Pagato sulla dotazione; la linea tratteggiata è la media (${pct(somma(sel, (i) => i.pagato) / somma(sel, (i) => i.dotazione))})`, classe: 'csr-grafico csr-grafico--alto', tabella: () => tab.classifica() })}</div>
        </div>` : nessunRisultato());
      if (!sel.length) return;
      const tab = {};
      sparkTotali(sel);
      tab.sankey = sankey('g-sankey', sel);
      tab.albero = treemap('g-albero', sel);
      tab.heat = heatmap('g-heat', sel);
      tab.classifica = classifica('g-classifica', sel);
      pagina.querySelectorAll('[data-forma]').forEach((b) => b.addEventListener('click', () => {
        grafici.get('g-albero')?.dispose();
        tab.albero = treemap('g-albero', sel, b.dataset.forma);
        b.parentElement.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      }));
    },
    '/riepilogo': (pagina, sel) => {
      pagina.innerHTML = testa({ briciole: [...B_FIN, ['Riepilogo per intervento']], titolo: 'Riepilogo per intervento', sottotitolo: 'Cerca, ordina, scegli le colonne. Clic su una riga per l’anteprima, poi il dettaglio completo.',
        azioni: `<div class="csr-seg" role="group" aria-label="Vista"><button type="button" aria-pressed="true" data-riep="tabella">Tabella</button><button type="button" aria-pressed="false" data-riep="grafico">Grafico</button></div>
          <button type="button" class="btn btn-outline-primary btn-sm" id="esporta-csv"><i class="bi bi-filetype-csv me-1" aria-hidden="true"></i>Esporta CSV</button>` })
        + (sel.length ? `<div id="riep-tabella"></div><div id="riep-grafico" hidden>${cardGrafico({ id: 'g-gruppi', titolo: 'Dotazione, impegnato e pagato', sottotitolo: 'Trascina il cursore sotto il grafico per ingrandire; clic su una barra per il dettaglio', classe: 'csr-grafico csr-grafico--alto', tabella: () => tab.gruppi() })}</div>` : nessunRisultato());
      if (!sel.length) return;
      const tab = {};
      tabellaInterattiva(document.getElementById('riep-tabella'), sel);
      pagina.querySelectorAll('[data-riep]').forEach((b) => b.addEventListener('click', () => {
        const graf = b.dataset.riep === 'grafico';
        document.getElementById('riep-tabella').hidden = graf;
        document.getElementById('riep-grafico').hidden = !graf;
        b.parentElement.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
        if (graf && !grafici.has('g-gruppi')) tab.gruppi = barreRaggruppate('g-gruppi', sel);
      }));
      document.getElementById('esporta-csv').addEventListener('click', () => esportaCsv(sel));
    },
    '/dotazione': (pagina, sel) => {
      pagina.innerHTML = testa({ briciole: [...B_FIN, ['Dotazione e spesa']], titolo: 'Dotazione e spesa per intervento' })
        + (sel.length ? `<div class="row g-3"><div class="col-12">${cardGrafico({ id: 'g-gruppi', titolo: 'Dotazione, impegnato e pagato', classe: 'csr-grafico csr-grafico--alto', tabella: () => tab.g() })}</div>
          <div class="col-12">${cardGrafico({ id: 'g-albero', titolo: 'Distribuzione della dotazione', sottotitolo: 'Per obiettivo generale, specifico e intervento', classe: 'csr-grafico csr-grafico--alto', tabella: () => tab.a() })}</div></div>` : nessunRisultato());
      if (!sel.length) return;
      const tab = { g: barreRaggruppate('g-gruppi', sel), a: treemap('g-albero', sel, 'sunburst') };
    },
    '/avanzamento': (pagina, sel) => {
      const q = somma(sel, (i) => i.pagato) / Math.max(1, somma(sel, (i) => i.dotazione));
      pagina.innerHTML = testa({ briciole: [...B_FIN, ['Avanzamento']], titolo: 'Avanzamento finanziario' })
        + (sel.length ? kpiTotali(sel) + `<div class="row g-3"><div class="col-12 col-xl-4">${cardGrafico({ id: 'g-gauge', titolo: 'Spesa pagata', classe: 'csr-grafico', tabella: () => tab.ga() })}</div>
          <div class="col-12 col-xl-8">${cardGrafico({ id: 'g-sankey', titolo: 'Dove va la dotazione', classe: 'csr-grafico', tabella: () => tab.s() })}</div>
          <div class="col-12">${cardGrafico({ id: 'g-classifica', titolo: 'Avanzamento per intervento', classe: 'csr-grafico csr-grafico--alto', tabella: () => tab.c() })}</div></div>` : nessunRisultato());
      if (!sel.length) return;
      sparkTotali(sel);
      const tab = { ga: gauge('g-gauge', q), s: sankey('g-sankey', sel), c: classifica('g-classifica', sel) };
    },
    '/domande': (pagina, sel) => {
      pagina.innerHTML = testa({ briciole: [...B_FIN, ['Domande e importi']], titolo: 'Domande e importi per anno' })
        + (sel.length ? `<div class="row g-3"><div class="col-12 col-xl-6">${cardGrafico({ id: 'g-anni', titolo: 'Domande e pagato per anno', classe: 'csr-grafico csr-grafico--alto', tabella: () => tab.a() })}</div>
          <div class="col-12 col-xl-6">${cardGrafico({ id: 'g-heat', titolo: 'Domande per intervento e anno', classe: 'csr-grafico csr-grafico--alto', tabella: () => tab.h() })}</div></div>` : nessunRisultato());
      if (!sel.length) return;
      const tab = { a: anni('g-anni', sel), h: heatmap('g-heat', sel) };
    },
    '/sigc': (pagina, sel) => {
      const s = { presentate: somma(sel, (i) => i.sigc.presentate), istruite: somma(sel, (i) => i.sigc.istruite), ammesse: somma(sel, (i) => i.sigc.ammesse), pagate: somma(sel, (i) => i.sigc.pagate) };
      pagina.innerHTML = testa({ briciole: [...B_FIN, ['SIGC']], titolo: 'Domande e importi SIGC' })
        + (sel.length ? `<div class="row g-3"><div class="col-12 col-xl-5">${cardGrafico({ id: 'g-imbuto', titolo: 'Dalla presentazione al pagamento', sottotitolo: 'Domande per fase', classe: 'csr-grafico csr-grafico--alto', tabella: () => tab.i() })}</div>
          <div class="col-12 col-xl-7">${cardGrafico({ id: 'g-anni', titolo: 'Domande e pagato per anno', classe: 'csr-grafico csr-grafico--alto', tabella: () => tab.a() })}</div></div>` : nessunRisultato());
      if (!sel.length) return;
      const tab = { i: imbuto('g-imbuto', s, 'Domande SIGC per fase'), a: anni('g-anni', sel) };
    },
    '/riserva': (pagina) => {
      pagina.innerHTML = testa({ briciole: [...B_FIN, ['Riserva di efficacia']], titolo: 'Riserva di efficacia (5%)' })
        + `<div class="csr-card"><h2 class="h5">Schermata non disegnata nel prototipo</h2><p class="mb-0 text-muted">Userà gli stessi componenti: tessere KPI per accumulato, congelato e residuo, linea dell’utilizzo progressivo con zoom, tabella equivalente e dettaglio per anno.</p></div>`;
    },
  };

  function vistaIntervento(pagina, codice) {
    const i = INTERVENTI.find((x) => x.codice === codice);
    if (!i) { pagina.innerHTML = testa({ briciole: [...B_FIN, ['Intervento']], titolo: 'Intervento non trovato' }); return; }
    document.title = `${i.codice} - Finanziario - Cruscotto CSR 2023-2027`;
    const q = i.pagato / i.dotazione;
    pagina.innerHTML = `<nav class="csr-breadcrumb" aria-label="Percorso"><ol><li><a href="#/panoramica${query(filtri)}">Home</a></li><li><a href="#/panoramica${query(filtri)}">Finanziario</a></li>
        <li><a href="#/riepilogo${query(filtri)}">Riepilogo per intervento</a></li><li aria-current="page">${i.codice}</li></ol></nav>
      <section class="csr-hero csr-fade">
        <span class="csr-eyebrow">Intervento ${i.codice}</span>
        <h1 tabindex="-1">${esc(i.nome)}</h1>
        <span class="csr-hero__badge"><i class="bi bi-bullseye" aria-hidden="true"></i>${i.og} · ${OG[i.og]}</span>
        <span class="csr-hero__badge"><i class="bi bi-crosshair" aria-hidden="true"></i>${i.os} · ${OS[i.os]}</span>
        <span class="csr-hero__badge"><i class="bi bi-flag" aria-hidden="true"></i>${OP[i.op]}</span>
        <div class="mt-3 d-flex flex-wrap gap-2">
          <button type="button" class="btn btn-light btn-sm" id="filtra-intervento"><i class="bi bi-funnel me-1" aria-hidden="true"></i>Filtra i report su questo intervento</button>
          <a class="btn btn-outline-light btn-sm" href="#/riepilogo${query(filtri)}"><i class="bi bi-arrow-left me-1" aria-hidden="true"></i>Torna al riepilogo</a>
        </div>
      </section>
      <div class="row g-3 mb-3">
        <div class="col-12 col-sm-6 col-xl-3">${kpi({ etichetta: 'Dotazione', icona: 'bi-wallet2', tono: 'csr-tono-navy', valore: mln(i.dotazione), unita: ' M€' })}</div>
        <div class="col-12 col-sm-6 col-xl-3">${kpi({ etichetta: 'Impegnato', icona: 'bi-journal-check', tono: 'csr-tono-blu', valore: mln(i.impegnato), unita: ' M€', quota: i.impegnato / i.dotazione, nota: `${pct(i.impegnato / i.dotazione)} della dotazione` })}</div>
        <div class="col-12 col-sm-6 col-xl-3">${kpi({ id: 'spark-int', etichetta: 'Pagato', icona: 'bi-cash-stack', tono: 'csr-tono-verde', valore: mln(i.pagato), unita: ' M€', nota: `${pct(q)} della dotazione`, spark: true })}</div>
        <div class="col-12 col-sm-6 col-xl-3">${kpi({ etichetta: 'Domande presentate', icona: 'bi-people', tono: 'csr-tono-ambra', valore: num(i.sigc.presentate), nota: `${num(i.sigc.pagate)} pagate` })}</div>
      </div>
      <div class="csr-tabs" role="tablist" aria-label="Sezioni dell'intervento">
        ${[['sintesi', 'Sintesi'], ['domande', 'Domande'], ['pagamenti', 'Pagamenti'], ['sigc', 'SIGC']].map(([k, t], n) =>
          `<button type="button" role="tab" id="tab-${k}" aria-controls="pan-${k}" aria-selected="${n === 0}" tabindex="${n === 0 ? 0 : -1}" data-tab="${k}">${t}</button>`).join('')}
      </div>
      <div role="tabpanel" id="pan-sintesi" aria-labelledby="tab-sintesi"><div class="row g-3">
        <div class="col-12 col-lg-4">${cardGrafico({ id: 'g-gauge', titolo: 'Avanzamento della spesa', classe: 'csr-grafico', tabella: () => tab.gauge() })}</div>
        <div class="col-12 col-lg-8">${cardGrafico({ id: 'g-cascata', titolo: 'Dalla dotazione al pagato', sottotitolo: 'Quanto resta da impegnare e da pagare', classe: 'csr-grafico', tabella: () => tab.cascata() })}</div></div></div>
      <div role="tabpanel" id="pan-domande" aria-labelledby="tab-domande" hidden>${cardGrafico({ id: 'g-anni', titolo: 'Domande e pagato per anno', classe: 'csr-grafico csr-grafico--alto', tabella: () => tab.anni() })}</div>
      <div role="tabpanel" id="pan-pagamenti" aria-labelledby="tab-pagamenti" hidden>${cardGrafico({ id: 'g-cumulato', titolo: 'Pagato cumulato', sottotitolo: 'Trimestre per trimestre; trascina per ingrandire', classe: 'csr-grafico csr-grafico--alto', tabella: () => tab.cumulato() })}</div>
      <div role="tabpanel" id="pan-sigc" aria-labelledby="tab-sigc" hidden><div class="row g-3"><div class="col-12 col-lg-6">${cardGrafico({ id: 'g-imbuto', titolo: 'Domande SIGC per fase', classe: 'csr-grafico csr-grafico--alto', tabella: () => tab.imbuto() })}</div>
        <div class="col-12 col-lg-6"><section class="csr-card"><h2 class="h6">Fonti</h2><p class="small text-muted mb-0">Le domande pagate vengono dagli elenchi di liquidazione, l’importo pagato dal flusso ASR2-20: le due fonti possono non coincidere.</p></section></div></div></div>`;
    const tab = {};
    const disegna = {
      sintesi: () => { tab.gauge = gauge('g-gauge', q); tab.cascata = cascata('g-cascata', i); },
      domande: () => { tab.anni = anni('g-anni', [i]); },
      pagamenti: () => { tab.cumulato = cumulato('g-cumulato', i.pagatoTrimestri); },
      sigc: () => { tab.imbuto = imbuto('g-imbuto', i.sigc, `Domande SIGC per fase, ${i.codice}`); },
    };
    const fatte = new Set();
    const mostra = (k) => {
      pagina.querySelectorAll('[role="tab"]').forEach((t) => { const s = t.dataset.tab === k; t.setAttribute('aria-selected', String(s)); t.tabIndex = s ? 0 : -1; });
      pagina.querySelectorAll('[role="tabpanel"]').forEach((p) => { p.hidden = p.id !== `pan-${k}`; });
      if (!fatte.has(k)) { disegna[k](); fatte.add(k); } else grafici.forEach((c) => c.resize());
    };
    spark('spark-int', i.pagatoTrimestri, '#4e8a1f');
    mostra('sintesi');
    const lista = pagina.querySelector('[role="tablist"]');
    lista.addEventListener('click', (e) => { const t = e.target.closest('[role="tab"]'); if (t) mostra(t.dataset.tab); });
    lista.addEventListener('keydown', (e) => {
      const tabs = [...lista.querySelectorAll('[role="tab"]')];
      const n = tabs.indexOf(document.activeElement);
      if (n < 0 || !['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(e.key)) return;
      e.preventDefault();
      const m = e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : (n + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
      tabs[m].focus(); mostra(tabs[m].dataset.tab);
    });
    document.getElementById('filtra-intervento').addEventListener('click', () => vai('/panoramica', { intervento: [i.codice], og: [], os: [], op: [] }));
  }

  // ---------------------------------------------------------------- tabella interattiva e drawer
  const COLONNE = [
    { k: 'codice', t: 'Codice', v: (i) => i.codice, fmt: (i) => i.codice, fissa: true },
    { k: 'nome', t: 'Intervento', v: (i) => i.nome, fmt: (i) => esc(i.nome) },
    { k: 'obiettivi', t: 'Obiettivi', v: (i) => i.og + i.os, fmt: (i) => `<span class="csr-badge csr-tono-navy">${i.og}</span> <span class="csr-badge csr-tono-blu">${i.os}</span>` },
    { k: 'domande', t: 'Domande', v: (i) => i.sigc.presentate, fmt: (i) => num(i.sigc.presentate), num: true },
    { k: 'dotazione', t: 'Dotazione', v: (i) => i.dotazione, fmt: (i) => euro(i.dotazione), num: true },
    { k: 'impegnato', t: 'Impegnato', v: (i) => i.impegnato, fmt: (i) => euro(i.impegnato), num: true },
    { k: 'pagato', t: 'Pagato', v: (i) => i.pagato, fmt: (i) => euro(i.pagato), num: true },
    { k: 'avanzamento', t: 'Pagato su dotazione', v: (i) => i.pagato / i.dotazione, fmt: (i) => `${pct(i.pagato / i.dotazione)}<span class="csr-mini-barra" aria-hidden="true"><span style="width:${(i.pagato / i.dotazione) * 100}%"></span></span>`, num: true },
  ];
  function tabellaInterattiva(box, sel) {
    const st = { cerca: '', ord: 'dotazione', dir: -1, pagina: 0, perPagina: 8, nascoste: new Set() };
    const disegna = () => {
      const q = st.cerca.toLowerCase();
      const col = COLONNE.find((c) => c.k === st.ord);
      const righe = sel.filter((i) => !q || `${i.codice} ${i.nome}`.toLowerCase().includes(q)).sort((a, b) => (col.v(a) > col.v(b) ? 1 : col.v(a) < col.v(b) ? -1 : 0) * st.dir);
      const pagine = Math.max(1, Math.ceil(righe.length / st.perPagina));
      st.pagina = Math.min(st.pagina, pagine - 1);
      const vis = COLONNE.filter((c) => !st.nascoste.has(c.k));
      const fetta = righe.slice(st.pagina * st.perPagina, (st.pagina + 1) * st.perPagina);
      box.innerHTML = `<section class="csr-card csr-fade">
        <div class="csr-strumenti-tabella">
          <label class="visually-hidden" for="cerca-riep">Cerca nella tabella</label>
          <input id="cerca-riep" type="search" placeholder="Cerca per codice o descrizione" value="${esc(st.cerca)}">
          <div class="dropdown ms-auto"><button class="btn btn-outline-secondary btn-sm dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false"><i class="bi bi-layout-three-columns me-1" aria-hidden="true"></i>Colonne</button>
            <div class="dropdown-menu dropdown-menu-end p-2">${COLONNE.filter((c) => !c.fissa).map((c) => `<label class="dropdown-item d-flex gap-2"><input type="checkbox" data-col="${c.k}"${st.nascoste.has(c.k) ? '' : ' checked'}>${c.t}</label>`).join('')}</div></div>
        </div>
        <div class="csr-tabella-wrap"><table class="csr-tabella"><caption>Riepilogo per intervento: ${righe.length} interventi${st.cerca ? ` per «${esc(st.cerca)}»` : ''}. Clic o Invio su una riga per l’anteprima.</caption>
          <thead><tr>${vis.map((c) => `<th scope="col"${c.num ? ' class="csr-num"' : ''} aria-sort="${st.ord === c.k ? (st.dir > 0 ? 'ascending' : 'descending') : 'none'}">
            <button type="button" data-ord="${c.k}">${c.t}<i class="bi ${st.ord === c.k ? (st.dir > 0 ? 'bi-sort-up' : 'bi-sort-down') : 'bi-arrow-down-up opacity-50'}" aria-hidden="true"></i></button></th>`).join('')}</tr></thead>
          <tbody>${fetta.map((i) => `<tr class="csr-riga-cliccabile" tabindex="0" data-anteprima="${i.codice}">${vis.map((c, n) => (n === 0 ? `<th scope="row">${c.fmt(i)}</th>` : `<td${c.num ? ' class="csr-num"' : ''}>${c.fmt(i)}</td>`)).join('')}</tr>`).join('')}</tbody>
          <tfoot><tr>${vis.map((c, n) => (n === 0 ? '<th scope="row">Totale</th>' : `<td class="csr-num fw-bold">${['dotazione', 'impegnato', 'pagato'].includes(c.k) ? euro(somma(righe, c.v)) : c.k === 'domande' ? num(somma(righe, c.v)) : ''}</td>`)).join('')}</tr></tfoot>
        </table></div>
        <nav class="csr-paginazione" aria-label="Pagine della tabella"><span class="me-2">Pagina ${st.pagina + 1} di ${pagine}</span>
          ${Array.from({ length: pagine }, (_, n) => `<button type="button" data-pag="${n}"${n === st.pagina ? ' aria-current="page"' : ''} aria-label="Pagina ${n + 1}">${n + 1}</button>`).join('')}</nav>
      </section>`;
    };
    box.addEventListener('input', (e) => { if (e.target.id === 'cerca-riep') { st.cerca = e.target.value; st.pagina = 0; const p = e.target.selectionStart; disegna(); const c = document.getElementById('cerca-riep'); c.focus(); c.setSelectionRange(p, p); } });
    box.addEventListener('change', (e) => { const k = e.target.dataset.col; if (k) { if (e.target.checked) st.nascoste.delete(k); else st.nascoste.add(k); disegna(); } });
    box.addEventListener('click', (e) => {
      const o = e.target.closest('[data-ord]');
      if (o) { const k = o.dataset.ord; st.dir = st.ord === k ? -st.dir : -1; st.ord = k; disegna(); box.querySelector(`[data-ord="${k}"]`)?.focus(); return; }
      const p = e.target.closest('[data-pag]');
      if (p) { st.pagina = Number(p.dataset.pag); disegna(); return; }
      const r = e.target.closest('[data-anteprima]');
      if (r) anteprima(r.dataset.anteprima);
    });
    box.addEventListener('keydown', (e) => { const r = e.target.closest('[data-anteprima]'); if (r && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); anteprima(r.dataset.anteprima); } });
    disegna();
  }
  const drawer = document.getElementById('drawer-intervento');
  let graficoDrawer = null;
  function anteprima(codice) {
    const i = INTERVENTI.find((x) => x.codice === codice);
    document.getElementById('drawer-codice').textContent = `Intervento ${i.codice}`;
    document.getElementById('drawer-titolo').textContent = i.nome;
    document.getElementById('drawer-corpo').innerHTML = `
      <p class="mb-3"><span class="csr-badge csr-tono-navy">${i.og} · ${OG[i.og]}</span> <span class="csr-badge csr-tono-blu">${i.os} · ${OS[i.os]}</span></p>
      <dl><dt>Dotazione</dt><dd>${euro(i.dotazione)}</dd><dt>Impegnato</dt><dd>${euro(i.impegnato)}</dd><dt>Pagato</dt><dd>${euro(i.pagato)}</dd>
        <dt>Pagato su dotazione</dt><dd>${pct(i.pagato / i.dotazione)}</dd><dt>Domande presentate</dt><dd>${num(i.sigc.presentate)}</dd><dt>Domande pagate</dt><dd>${num(i.sigc.pagate)}</dd></dl>
      <h3 class="h6 mt-4">Pagato per anno</h3><div id="g-drawer" style="height:200px" aria-hidden="true"></div>
      <table class="visually-hidden"><caption>Pagato per anno, ${i.codice}</caption><tbody>${ANNI.map((a, x) => `<tr><th scope="row">${a}</th><td>${euro(i.pagatoAnno[x])}</td></tr>`).join('')}</tbody></table>
      <div class="d-grid gap-2 mt-3">
        <a class="btn btn-primary" href="#/intervento/${i.codice}${query(filtri)}" data-chiudi-drawer>Apri il dettaglio completo <i class="bi bi-arrow-right" aria-hidden="true"></i></a>
        <button type="button" class="btn btn-outline-primary" data-filtra="${i.codice}">Filtra i report su questo intervento</button>
      </div>`;
    bootstrap.Offcanvas.getOrCreateInstance(drawer).show();
  }
  drawer.addEventListener('shown.bs.offcanvas', () => {
    graficoDrawer?.dispose();
    const codice = document.getElementById('drawer-codice').textContent.split(' ').at(-1);
    const i = INTERVENTI.find((x) => x.codice === codice);
    graficoDrawer = echarts.init(document.getElementById('g-drawer'), 'csr', { renderer: 'svg' });
    graficoDrawer.setOption({ grid: { left: 40, right: 8, top: 10, bottom: 24 }, tooltip: { trigger: 'axis', valueFormatter: (v) => `${mln(v)} M€` }, xAxis: { type: 'category', data: ANNI.map(String) },
      yAxis: { type: 'value', axisLabel: { formatter: (v) => mln(v) } }, series: [{ type: 'bar', data: i.pagatoAnno, barWidth: '45%', itemStyle: { color: '#4e8a1f', borderRadius: [6, 6, 0, 0] } }] });
  });
  drawer.addEventListener('click', (e) => {
    if (e.target.closest('[data-chiudi-drawer]')) bootstrap.Offcanvas.getOrCreateInstance(drawer).hide();
    const f = e.target.closest('[data-filtra]');
    if (f) { bootstrap.Offcanvas.getOrCreateInstance(drawer).hide(); vai('/panoramica', { intervento: [f.dataset.filtra], og: [], os: [], op: [] }); }
  });
  function esportaCsv(sel) {
    const righe = [['Codice', 'Intervento', 'OG', 'OS', 'Domande', 'Dotazione', 'Impegnato', 'Pagato'], ...sel.map((i) => [i.codice, i.nome, i.og, i.os, i.sigc.presentate, i.dotazione, i.impegnato, i.pagato])];
    const csv = '﻿' + righe.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = 'riepilogo-per-intervento-esempio.csv';
    a.click();
  }

  // ---------------------------------------------------------------- avvisi del prototipo e ricerca
  function avviso(testo) {
    let t = document.getElementById('csr-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'csr-toast';
      t.setAttribute('role', 'status');
      t.style.cssText = 'position:fixed;bottom:1.25rem;left:50%;transform:translateX(-50%);background:#0b2d4e;color:#fff;padding:.7rem 1.1rem;border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,.2);z-index:3000;font-size:.92rem';
      document.body.append(t);
    }
    t.textContent = testo;
    t.hidden = false;
    clearTimeout(avviso.timer);
    avviso.timer = setTimeout(() => { t.hidden = true; }, 3200);
  }
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href="#esci"], a[href="#da-definire"]');
    if (!a) return;
    e.preventDefault();
    avviso(a.getAttribute('href') === '#esci' ? 'Nel prototipo l’uscita non è attiva.' : 'Indirizzo da definire con ARSIAL.');
  });
  const elenco = document.getElementById('elenco-interventi');
  elenco.innerHTML = INTERVENTI.map((i) => `<option value="${i.codice}">${esc(i.nome)}</option>`).join('');
  document.getElementById('cerca-intervento').addEventListener('change', (e) => {
    const c = e.target.value.trim().toUpperCase();
    if (INTERVENTI.some((i) => i.codice === c)) { e.target.value = ''; vai(`/intervento/${c}`); }
  });

  // ---------------------------------------------------------------- router
  function scheletro(pagina) {
    pagina.innerHTML = `<div class="csr-skel mb-2" style="height:18px;width:220px"></div><div class="csr-skel mb-4" style="height:36px;width:380px"></div>
      <div class="row g-3 mb-3">${'<div class="col-12 col-sm-6 col-xl-3"><div class="csr-skel" style="height:132px"></div></div>'.repeat(4)}</div>
      <div class="row g-3"><div class="col-12 col-xl-7"><div class="csr-skel" style="height:420px"></div></div><div class="col-12 col-xl-5"><div class="csr-skel" style="height:420px"></div></div></div>`;
  }
  let primoGiro = true;
  function disegna() {
    const percorso = leggiRotta();
    chiudiGrafici();
    disegnaMenu();
    disegnaBarraFiltri();
    const pagina = document.getElementById('pagina');
    scheletro(pagina);
    bootstrap.Offcanvas.getInstance(document.getElementById('menu-mobile'))?.hide();
    setTimeout(() => {
      const sel = selezione();
      if (percorso.startsWith('/intervento/')) vistaIntervento(pagina, decodeURIComponent(percorso.split('/')[2]));
      else (VISTE[percorso] ?? VISTE['/panoramica'])(pagina, sel);
      if (!primoGiro) pagina.querySelector('h1')?.focus();
      // ?apri=filtri | ?apri=anteprima:SRD01 (screenshot del prototipo)
      const apri = primoGiro ? new URLSearchParams(location.search).get('apri') : null;
      if (apri === 'filtri') bootstrap.Offcanvas.getOrCreateInstance(pannello).show();
      else if (apri?.startsWith('anteprima:')) anteprima(apri.split(':')[1]);
      primoGiro = false;
      if (STATICO) {
        // misure per i controlli headless: viewport, larghezza del documento e l'elemento piu' largo della viewport
        const larghi = [...document.querySelectorAll('body *')].filter((e) => e.getBoundingClientRect().right > innerWidth + 1).slice(0, 5)
          .map((e) => `${e.tagName.toLowerCase()}.${[...e.classList].join('.')}`);
        document.body.dataset.misure = JSON.stringify({ vw: innerWidth, sw: document.documentElement.scrollWidth, larghi });
      }
    }, 260);
  }
  window.addEventListener('hashchange', disegna);
  disegna();
})();
