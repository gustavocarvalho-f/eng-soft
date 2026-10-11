/* =========================================================================
   Resolve Aqui - componentes de interface reutilizáveis
   ========================================================================= */
(function () {
  'use strict';
  const RA = window.RA;
  const UI = (RA.UI = {});

  UI.esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const esc = UI.esc;
  UI.$ = (sel, root) => (root || document).querySelector(sel);
  UI.$$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  /* ------------------------------ Ícones (traço, 24x24) ------------------------------ */
  const ICONES = {
    message: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    pin: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
    user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    bell: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
    chart: '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
    search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
    plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    check: '<polyline points="20 6 9 17 4 12"/>',
    x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    edit: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>',
    trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>',
    thumb: '<path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>',
    eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
    clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    alert: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
    send: '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    home: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    filter: '<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>',
    moon: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
    sun: '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>',
    clip: '<path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>',
    mail: '<path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><polyline points="22,6 12,13 2,6"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
    locate: '<circle cx="12" cy="12" r="10"/><line x1="22" y1="12" x2="18" y2="12"/><line x1="6" y1="12" x2="2" y2="12"/><line x1="12" y1="6" x2="12" y2="2"/><line x1="12" y1="22" x2="12" y2="18"/>',
    landmark: '<line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7"/>',
    trend: '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>',
    ban: '<circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>',
    printer: '<polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
    reset: '<polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>',
    info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
    list: '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  };
  UI.icon = (nome, tam) => '<svg class="i" width="' + (tam || 18) + '" height="' + (tam || 18) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + (ICONES[nome] || '') + '</svg>';
  const icon = UI.icon;

  /* ------------------------------ Formatação ------------------------------ */
  UI.num = (n) => Number(n || 0).toLocaleString('pt-BR');
  UI.dec = (n, c) => Number(n).toLocaleString('pt-BR', { minimumFractionDigits: c == null ? 1 : c, maximumFractionDigits: c == null ? 1 : c });
  UI.pct = (x) => Math.round(x * 100) + '%';
  UI.data = (iso) => new Date(iso).toLocaleDateString('pt-BR');
  UI.dataHora = (iso) => new Date(iso).toLocaleDateString('pt-BR') + ' às ' + new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  UI.relativo = (iso) => {
    const d = Math.floor((Date.now() - new Date(iso).getTime()) / 864e5);
    if (d <= 0) return 'hoje';
    if (d === 1) return 'ontem';
    if (d < 30) return 'há ' + d + ' dias';
    if (d < 365) { const m = Math.floor(d / 30); return 'há ' + m + (m === 1 ? ' mês' : ' meses'); }
    return UI.data(iso);
  };
  UI.iniciais = (nome) => String(nome || '?').split(' ').filter(Boolean).map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  UI.debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
  UI.digitos = (s) => String(s || '').replace(/\D/g, '');

  UI.mascaraCPF = (v) => {
    const d = UI.digitos(v).slice(0, 11);
    return d.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  };
  UI.mascaraTel = (v) => {
    const d = UI.digitos(v).slice(0, 11);
    if (d.length <= 2) return d ? '(' + d : '';
    if (d.length <= 6) return '(' + d.slice(0, 2) + ') ' + d.slice(2);
    if (d.length <= 10) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6);
    return '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
  };
  UI.cpfOculto = (cpf) => { const d = UI.digitos(cpf); return d.length === 11 ? '***.' + d.slice(3, 6) + '.' + d.slice(6, 9) + '-**' : cpf; };
  UI.cpfValido = (cpf) => {
    const d = UI.digitos(cpf);
    if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false;
    for (let t = 9; t < 11; t++) {
      let soma = 0;
      for (let i = 0; i < t; i++) soma += Number(d[i]) * (t + 1 - i);
      const dv = ((soma * 10) % 11) % 10;
      if (dv !== Number(d[t])) return false;
    }
    return true;
  };
  UI.emailValido = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(e).trim());

  /* ------------------------------ Badges e pequenos blocos ------------------------------ */
  UI.statusBadge = (s) => '<span class="badge st-' + s + '"><span class="dot" aria-hidden="true"></span>' + esc(RA.STATUS[s].nome) + '</span>';
  UI.prazoBadge = (m) => {
    const p = RA.prazo(m);
    const cls = p.concluida ? (p.noPrazo ? 'pz-ok' : 'pz-late') : p.vencido ? 'pz-late' : p.dias <= 5 ? 'pz-warn' : 'pz-ok';
    return '<span class="prazo ' + cls + '">' + icon(p.concluida ? 'check' : 'clock', 14) + esc(p.texto) + '</span>';
  };
  UI.avatar = (nome) => '<span class="avatar" aria-hidden="true">' + esc(UI.iniciais(nome)) + '</span>';
  UI.vazio = (titulo, texto, acao) => '<div class="empty"><strong>' + esc(titulo) + '</strong><p>' + esc(texto || '') + '</p>' + (acao || '') + '</div>';
  UI.ticket = (m) => '<div class="ticket"><div class="ticket-main"><span class="ticket-l">Número do protocolo</span><strong class="ticket-n">' + esc(m.protocolo) + '</strong></div>' +
    '<div class="ticket-stub"><button type="button" class="btn btn-ghost btn-sm" data-copiar="' + esc(m.protocolo) + '">' + icon('copy', 15) + 'Copiar</button></div></div>';

  UI.kpi = (o) => '<div class="kpi' + (o.tom ? ' kpi-' + o.tom : '') + '"><div class="kpi-top"><span class="kpi-l">' + esc(o.rotulo) + '</span>' + (o.icone ? icon(o.icone, 18) : '') + '</div>' +
    '<div class="kpi-v">' + o.valor + '</div>' + (o.dica ? '<div class="kpi-h">' + o.dica + '</div>' : '') + '</div>';

  /* ------------------------------ Gráficos (HTML/CSS, sem bibliotecas) ------------------------------ */
  UI.legenda = (itens) => '<ul class="legend">' + itens.map((i) => '<li><span class="sw ' + i.cls + '" aria-hidden="true"></span>' + esc(i.nome) + '</li>').join('') + '</ul>';

  /* Barras horizontais de uma série. rows: [{nome, valor, tip}] */
  UI.barras = function (rows, opt) {
    opt = opt || {};
    const max = opt.max || Math.max(1, ...rows.map((r) => r.valor));
    return '<ul class="hbars">' + rows.map((r) => '<li class="hb" tabindex="0" data-tip="' + esc(r.tip || r.nome + ': ' + UI.num(r.valor)) + '">' +
      '<span class="hb-l">' + esc(r.nome) + '</span><span class="hb-t"><span class="hb-f" style="width:' + (r.valor / max * 100).toFixed(1) + '%"></span></span>' +
      '<span class="hb-v">' + (opt.fmt ? opt.fmt(r.valor) : UI.num(r.valor)) + '</span></li>').join('') + '</ul>';
  };

  /* Barras empilhadas por status. rows: saída de Stats.agrupar */
  UI.barrasStatus = function (rows) {
    const max = Math.max(1, ...rows.map((r) => r.total));
    return UI.legenda(Object.keys(RA.STATUS).map((k) => ({ cls: 'sw-' + k, nome: RA.STATUS[k].nome }))) +
      '<ul class="hbars">' + rows.map((r) => {
        const segs = Object.keys(RA.STATUS).map((k) => r[k] ? '<span class="seg seg-' + k + '" style="flex:' + r[k] + '" data-tip="' + esc(r.nome + ', ' + RA.STATUS[k].nome + ': ' + r[k]) + '" tabindex="0"></span>' : '').join('');
        return '<li class="hb"><span class="hb-l">' + esc(r.nome) + '</span><span class="hb-t"><span class="hb-stack" style="width:' + (r.total / max * 100).toFixed(1) + '%">' + segs + '</span></span><span class="hb-v">' + UI.num(r.total) + '</span></li>';
      }).join('') + '</ul>';
  };

  /* Colunas agrupadas por mês: recebidas x concluídas */
  UI.colunasMes = function (meses) {
    const max = Math.max(1, ...meses.map((m) => Math.max(m.recebidas, m.concluidas)));
    return UI.legenda([{ cls: 'sw-recebidas', nome: 'Recebidas' }, { cls: 'sw-concluida', nome: 'Concluídas' }]) +
      '<div class="cols" role="img" aria-label="Manifestações recebidas e concluídas por mês">' + meses.map((m) => {
        const tip = m.nome.charAt(0).toUpperCase() + m.nome.slice(1) + ' de ' + m.ano + ': ' + m.recebidas + ' recebidas, ' + m.concluidas + ' concluídas';
        return '<div class="col" tabindex="0" data-tip="' + esc(tip) + '"><div class="col-bars">' +
          '<span class="cb cb-recebidas" style="height:' + (m.recebidas / max * 100).toFixed(1) + '%"><em>' + m.recebidas + '</em></span>' +
          '<span class="cb cb-concluida" style="height:' + (m.concluidas / max * 100).toFixed(1) + '%"><em>' + m.concluidas + '</em></span></div>' +
          '<span class="col-l">' + esc(m.nome.slice(0, 3)) + '</span></div>';
      }).join('') + '</div>';
  };

  /* Redesenha uma tela sem acumular ouvintes de evento: troca o contêiner por um novo */
  RA.remontar = function (el, fn) {
    const n = el.cloneNode(false);
    el.replaceWith(n);
    fn(n);
    return n;
  };

  /* ------------------------------ Tooltip global ------------------------------ */
  (function () {
    let tip;
    function mostrar(el) {
      if (!tip) { tip = document.getElementById('tooltip'); }
      if (!tip) return;
      tip.textContent = el.getAttribute('data-tip');
      tip.classList.add('on');
      const r = el.getBoundingClientRect();
      const tw = tip.offsetWidth;
      let x = r.left + r.width / 2 - tw / 2;
      x = Math.max(8, Math.min(window.innerWidth - tw - 8, x));
      let y = r.top - tip.offsetHeight - 8;
      if (y < 8) y = r.bottom + 8;
      tip.style.left = x + 'px';
      tip.style.top = y + 'px';
    }
    function esconder() { if (tip) tip.classList.remove('on'); }
    document.addEventListener('mouseover', (e) => { const el = e.target.closest && e.target.closest('[data-tip]'); if (el) mostrar(el); });
    document.addEventListener('mouseout', (e) => { const el = e.target.closest && e.target.closest('[data-tip]'); if (el) esconder(); });
    document.addEventListener('focusin', (e) => { const el = e.target.closest && e.target.closest('[data-tip]'); if (el) mostrar(el); });
    document.addEventListener('focusout', esconder);
    document.addEventListener('scroll', esconder, true);
  })();

  /* ------------------------------ Toasts ------------------------------ */
  UI.toast = function (msg, tipo) {
    const box = document.getElementById('toasts');
    if (!box) return;
    const t = document.createElement('div');
    t.className = 'toast toast-' + (tipo || 'ok');
    t.innerHTML = icon(tipo === 'erro' ? 'alert' : tipo === 'info' ? 'info' : 'check', 18) + '<span>' + esc(msg) + '</span>';
    box.appendChild(t);
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 250); }, 4200);
  };

  /* ------------------------------ Modais ------------------------------ */
  const pilha = [];
  UI.modal = function (html, opt) {
    opt = opt || {};
    const root = document.getElementById('modal-root');
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    const dlg = document.createElement('div');
    dlg.className = 'modal modal-' + (opt.size || 'md');
    dlg.setAttribute('role', 'dialog');
    dlg.setAttribute('aria-modal', 'true');
    dlg.setAttribute('aria-label', opt.title || 'Janela');
    dlg.tabIndex = -1;
    dlg.innerHTML = html;
    overlay.appendChild(dlg);
    root.appendChild(overlay);
    const anterior = document.activeElement;
    let fechado = false;
    const h = {
      el: dlg,
      render(novo) { dlg.innerHTML = novo; },
      close() {
        if (fechado) return;
        fechado = true;
        const i = pilha.indexOf(h);
        if (i >= 0) pilha.splice(i, 1);
        overlay.remove();
        document.body.classList.toggle('no-scroll', pilha.length > 0);
        if (anterior && anterior.focus && document.contains(anterior)) anterior.focus();
        if (opt.aoFechar) opt.aoFechar();
      },
    };
    dlg.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) h.close(); });
    if (opt.dispensavel !== false) overlay.addEventListener('mousedown', (e) => { if (e.target === overlay) h.close(); });
    h.dispensavel = opt.dispensavel !== false;
    pilha.push(h);
    document.body.classList.add('no-scroll');
    const foco = dlg.querySelector('[autofocus]') || dlg;
    setTimeout(() => foco.focus(), 0);
    return h;
  };
  document.addEventListener('keydown', (e) => {
    const topo = pilha[pilha.length - 1];
    if (!topo) return;
    if (e.key === 'Escape' && topo.dispensavel) { e.stopPropagation(); topo.close(); return; }
    if (e.key === 'Tab') {
      const f = UI.$$('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])', topo.el).filter((x) => x.offsetParent !== null);
      if (!f.length) { e.preventDefault(); return; }
      const a = f[0]; const z = f[f.length - 1];
      if (e.shiftKey && (document.activeElement === a || document.activeElement === topo.el)) { e.preventDefault(); z.focus(); }
      else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
    }
  });
  UI.fecharTodos = () => { while (pilha.length) pilha[pilha.length - 1].close(); };
  UI.cabecalhoModal = (titulo, sub) => '<div class="modal-h"><div><h2>' + esc(titulo) + '</h2>' + (sub ? '<p class="muted">' + esc(sub) + '</p>' : '') + '</div>' +
    '<button type="button" class="icon-btn" data-close aria-label="Fechar">' + icon('x', 20) + '</button></div>';

  UI.confirmar = function (o) {
    return new Promise((resolve) => {
      let resp = false;
      const h = UI.modal(UI.cabecalhoModal(o.titulo) + '<div class="modal-b"><p>' + esc(o.mensagem) + '</p></div>' +
        '<div class="modal-f"><button type="button" class="btn btn-ghost" data-close>Cancelar</button><button type="button" class="btn ' + (o.perigo ? 'btn-danger' : 'btn-primary') + '" data-ok autofocus>' + esc(o.ok || 'Confirmar') + '</button></div>',
        { size: 'sm', title: o.titulo, aoFechar: () => resolve(resp) });
      h.el.querySelector('[data-ok]').addEventListener('click', () => { resp = true; h.close(); });
    });
  };

  /* ------------------------------ Formulários ------------------------------ */
  UI.erro = function (input, msg) {
    if (!input) return;
    input.setAttribute('aria-invalid', 'true');
    const ancora = input.closest('.pw, .check') || input;
    let e = ancora.parentElement.querySelector('.field-err');
    if (!e) { e = document.createElement('p'); e.className = 'field-err'; e.id = 'err-' + Math.random().toString(36).slice(2, 8); ancora.insertAdjacentElement('afterend', e); }
    e.textContent = msg;
    input.setAttribute('aria-describedby', e.id);
  };
  UI.limparErros = function (form) {
    UI.$$('.field-err', form).forEach((e) => e.remove());
    UI.$$('[aria-invalid]', form).forEach((i) => { i.removeAttribute('aria-invalid'); i.removeAttribute('aria-describedby'); });
  };
  UI.contador = function (textarea, saida, min, max) {
    const f = () => {
      const n = textarea.value.length;
      saida.textContent = n + '/' + max + ' caracteres' + (min && n < min ? ' (mínimo de ' + min + ')' : '');
    };
    textarea.addEventListener('input', f);
    f();
  };
  UI.opcoes = (lista, sel, vazio) => (vazio ? '<option value="">' + esc(vazio) + '</option>' : '') + lista.map((o) => {
    const v = typeof o === 'string' ? o : o.id; const n = typeof o === 'string' ? o : o.nome;
    return '<option value="' + esc(v) + '"' + (v === sel ? ' selected' : '') + '>' + esc(n) + '</option>';
  }).join('');

  /* ------------------------------ Arquivos ------------------------------ */
  UI.baixar = function (nome, conteudo, mime) {
    const blob = new Blob([conteudo], { type: mime || 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = nome;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  UI.csv = function (linhas) {
    const cel = (v) => { const s = String(v == null ? '' : v); return /[";\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
    return '﻿' + linhas.map((l) => l.map(cel).join(';')).join('\r\n');
  };
  UI.lerImagem = function (file, lado, qualidade) {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onerror = reject;
      fr.onload = () => {
        const img = new Image();
        img.onerror = reject;
        img.onload = () => {
          const esc2 = Math.min(1, (lado || 900) / Math.max(img.width, img.height));
          const c = document.createElement('canvas');
          c.width = Math.round(img.width * esc2); c.height = Math.round(img.height * esc2);
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          resolve(c.toDataURL('image/jpeg', qualidade || 0.72));
        };
        img.src = fr.result;
      };
      fr.readAsDataURL(file);
    });
  };

  /* Impressão: copia o conteúdo para #print-root e usa o diálogo de impressão do navegador (salvar como PDF) */
  UI.imprimir = function (html) {
    const p = document.getElementById('print-root');
    p.innerHTML = html;
    document.body.classList.add('printing');
    const limpar = () => { document.body.classList.remove('printing'); p.innerHTML = ''; window.removeEventListener('afterprint', limpar); };
    window.addEventListener('afterprint', limpar);
    setTimeout(() => window.print(), 50);
  };

  /* Copiar texto (delegado: qualquer [data-copiar]) */
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-copiar]');
    if (!b) return;
    const txt = b.getAttribute('data-copiar');
    const ok = () => UI.toast('Copiado: ' + txt, 'info');
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(ok, ok);
    else ok();
  });
})();
