/* =========================================================================
   Resolve Aqui - telas do cidadão
   Nova manifestação (UC05), manifestações na região (UC01 a UC03),
   minha conta (UC04, UC06, UC07).
   ========================================================================= */
(function () {
  'use strict';
  const RA = window.RA;
  const UI = RA.UI;
  const esc = UI.esc;
  const icon = UI.icon;
  const $ = UI.$;
  RA.views = RA.views || {};

  const MAX_ANEXOS = 3;
  const MAX_MB = 10;
  const PARADAS = new Set(['para', 'com', 'uma', 'que', 'nos', 'dos', 'das', 'est', 'esta', 'esse', 'essa', 'mais', 'muito', 'sem', 'por', 'como', 'tem', 'ser', 'foi', 'ha', 'ja', 'rua', 'avenida']);

  function palavras(t) {
    return new Set(RA.sem(t).replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter((p) => p.length >= 4 && !PARADAS.has(p)));
  }

  /* Procura manifestações parecidas ainda abertas, para o cidadão apoiar em vez de duplicar */
  function parecidas(d) {
    if (!d.categoria) return [];
    const meus = palavras(d.titulo + ' ' + d.descricao);
    return RA.DB.manifestacoes()
      .filter((m) => RA.TIPOS[m.tipo].publica && m.status !== 'concluida' && m.categoria === d.categoria)
      .map((m) => {
        const outras = palavras(m.titulo + ' ' + m.descricao);
        let comuns = 0;
        meus.forEach((p) => { if (outras.has(p)) comuns++; });
        return { m, pontos: comuns + (d.bairro && m.bairro === d.bairro ? 2 : 0) };
      })
      .filter((x) => x.pontos >= 2 && (d.titulo.length + d.descricao.length > 0))
      .sort((a, b) => b.pontos - a.pontos || RA.Stats.apoios(b.m) - RA.Stats.apoios(a.m))
      .slice(0, 3).map((x) => x.m);
  }

  /* ------------------------------ Nova manifestação ------------------------------ */
  RA.views.nova = function (main) {
    const user = RA.DB.usuarioAtual();
    let anexos = [];
    let coord = null;

    main.innerHTML = '<div class="container"><div class="page-head"><h1 class="h2">Nova manifestação</h1>' +
      '<p class="muted">Conte o que está acontecendo. Quanto mais detalhes, mais rápido o órgão consegue agir.</p></div>' +
      '<div class="split"><form id="f-nova" class="card card-pad" novalidate>' +
      '<fieldset class="seg"><legend>Tipo de manifestação</legend><div class="seg-opts">' + Object.keys(RA.TIPOS).map((k, i) =>
        '<label class="seg-opt"><input type="radio" name="tipo" value="' + k + '"' + (i === 0 ? ' checked' : '') + '><span><strong>' + esc(RA.TIPOS[k].nome) + '</strong><small>' + esc(RA.TIPOS[k].desc) + '</small></span></label>').join('') + '</div></fieldset>' +
      '<div class="field"><label for="nv-titulo">Título</label><input id="nv-titulo" class="input" maxlength="80" placeholder="Descreva brevemente o problema" autocomplete="off"></div>' +
      '<div class="field"><label for="nv-cat">Assunto</label><select id="nv-cat" class="input">' + UI.opcoes(RA.CATEGORIAS, '', 'Selecione') + '</select></div>' +
      '<div class="field"><label for="nv-desc">Descrição</label><textarea id="nv-desc" class="input" rows="5" maxlength="1500" placeholder="Descreva detalhadamente o problema: o que acontece, desde quando e quem é afetado."></textarea><p class="hint" id="nv-cont"></p></div>' +
      '<div class="grid-2"><div class="field"><label for="nv-bairro">Bairro</label><select id="nv-bairro" class="input">' + UI.opcoes(RA.BAIRROS, user.bairro, 'Selecione') + '</select></div>' +
      '<div class="field"><label for="nv-end">Endereço ou ponto de referência</label><input id="nv-end" class="input" maxlength="120" placeholder="Rua, número ou referência"></div></div>' +
      '<div class="field"><button type="button" class="btn btn-ghost btn-sm" id="nv-geo">' + icon('locate', 16) + 'Usar minha localização atual</button><p class="hint" id="nv-geo-s">Opcional. Ajuda a equipe a achar o local exato.</p></div>' +
      '<div class="field"><span class="label" id="lb-anexo">Fotos ou vídeos (opcional)</span>' +
      '<label class="drop" for="nv-arq" id="drop">' + icon('clip', 22) + '<span><strong>Clique ou arraste os arquivos aqui</strong><small>Até ' + MAX_ANEXOS + ' arquivos de ' + MAX_MB + ' MB. Fotos são reduzidas para caber no navegador.</small></span></label>' +
      '<input id="nv-arq" type="file" accept="image/*,video/*" multiple class="sr-only" aria-labelledby="lb-anexo"><ul class="prev" id="nv-prev"></ul></div>' +
      '<label class="check"><input type="checkbox" id="nv-anon"><span>Não mostrar meu nome para outros cidadãos. A ouvidoria continua identificando você para poder responder.</span></label>' +
      '<button type="submit" class="btn btn-primary btn-lg">' + icon('send', 18) + 'Enviar manifestação</button></form>' +
      '<aside class="side"><div class="card card-pad" id="similares" aria-live="polite"></div>' +
      '<div class="card card-pad"><h2 class="h3">O que acontece depois</h2><ul class="ticks"><li>Você recebe um número de protocolo.</li><li>A ouvidoria faz a triagem e encaminha ao órgão responsável.</li><li>Cada etapa fica no histórico e você é avisado.</li><li>A resposta vem em até ' + RA.PRAZO_DIAS + ' dias.</li></ul></div></aside></div></div>';

    const f = $('#f-nova', main);
    UI.contador($('#nv-desc', f), $('#nv-cont', f), 10, 1500);

    function dados() {
      return {
        tipo: ($('input[name="tipo"]:checked', f) || {}).value, titulo: $('#nv-titulo', f).value, categoria: $('#nv-cat', f).value,
        descricao: $('#nv-desc', f).value, bairro: $('#nv-bairro', f).value, endereco: $('#nv-end', f).value, anonima: $('#nv-anon', f).checked,
      };
    }
    function pintarSimilares() {
      const d = dados();
      const box = $('#similares', main);
      const l = parecidas(d);
      if (l.length) {
        box.innerHTML = '<h2 class="h3">Já existe algo parecido</h2><p class="muted">Apoiar uma manifestação aberta ajuda a priorizar o problema e evita registros repetidos.</p><ul class="sim">' + l.map((m) =>
          '<li><button type="button" class="feed-btn" data-detalhe="' + m.id + '"><strong>' + esc(m.titulo) + '</strong><span class="muted">' + esc(m.bairro) + ', ' + RA.Stats.apoios(m) + ' apoios, ' + esc(RA.STATUS[m.status].nome) + '</span></button></li>').join('') + '</ul>';
      } else {
        box.innerHTML = '<h2 class="h3">Antes de enviar</h2><ul class="ticks"><li>Escolha o assunto: o sistema avisa se já houver registro parecido.</li><li>Informe onde acontece. Bairro e referência aceleram o atendimento.</li><li>Fotos ajudam a equipe a avaliar a urgência.</li></ul>';
      }
    }
    pintarSimilares();
    const pintarSimilaresLento = UI.debounce(pintarSimilares, 250);
    ['#nv-titulo', '#nv-cat', '#nv-desc', '#nv-bairro'].forEach((s) => { $(s, f).addEventListener('input', pintarSimilaresLento); $(s, f).addEventListener('change', pintarSimilares); });

    /* anexos */
    function pintarAnexos() {
      $('#nv-prev', f).innerHTML = anexos.map((a, i) => '<li>' + (a.dataUrl ? '<img src="' + a.dataUrl + '" alt="">' : '<span class="prev-ico">' + icon('image', 22) + '</span>') +
        '<span class="prev-n">' + esc(a.nome) + (a.dataUrl ? '' : '<small>Vídeo: só o nome é guardado no protótipo</small>') + '</span>' +
        '<button type="button" class="icon-btn" data-rm="' + i + '" aria-label="Remover ' + esc(a.nome) + '">' + icon('x', 16) + '</button></li>').join('');
    }
    async function adicionar(files) {
      for (const file of Array.from(files)) {
        if (anexos.length >= MAX_ANEXOS) { UI.toast('O limite é de ' + MAX_ANEXOS + ' arquivos.', 'info'); break; }
        if (file.size > MAX_MB * 1048576) { UI.toast(file.name + ' passa de ' + MAX_MB + ' MB.', 'erro'); continue; }
        if (file.type.startsWith('image/')) {
          try { anexos.push({ nome: file.name, tipo: 'image/jpeg', dataUrl: await UI.lerImagem(file, 900, 0.7) }); }
          catch (e) { UI.toast('Não foi possível ler ' + file.name + '.', 'erro'); }
        } else if (file.type.startsWith('video/')) anexos.push({ nome: file.name, tipo: file.type, dataUrl: null });
        else UI.toast(file.name + ' não é foto nem vídeo.', 'erro');
      }
      pintarAnexos();
    }
    $('#nv-arq', f).addEventListener('change', (e) => { adicionar(e.target.files); e.target.value = ''; });
    const drop = $('#drop', f);
    ['dragenter', 'dragover'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('over'); }));
    ['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove('over'); }));
    drop.addEventListener('drop', (e) => adicionar(e.dataTransfer.files));
    f.addEventListener('click', (e) => {
      const rm = e.target.closest('[data-rm]');
      if (rm) { anexos.splice(Number(rm.dataset.rm), 1); pintarAnexos(); }
    });

    /* localização */
    $('#nv-geo', f).addEventListener('click', () => {
      const s = $('#nv-geo-s', f);
      if (!navigator.geolocation) { s.textContent = 'Este navegador não oferece localização.'; return; }
      s.textContent = 'Buscando a sua localização...';
      navigator.geolocation.getCurrentPosition((p) => {
        coord = { lat: Number(p.coords.latitude.toFixed(5)), lng: Number(p.coords.longitude.toFixed(5)) };
        s.textContent = 'Localização anexada: ' + coord.lat + ', ' + coord.lng + '.';
      }, () => { s.textContent = 'Não foi possível obter a localização. Informe o endereço no campo ao lado.'; }, { timeout: 8000 });
    });

    f.addEventListener('submit', (e) => {
      e.preventDefault();
      UI.limparErros(f);
      const d = dados();
      let primeiro = null;
      const falha = (sel, msg) => { UI.erro($(sel, f), msg); if (!primeiro) primeiro = $(sel, f); };
      if (d.titulo.trim().length < 5) falha('#nv-titulo', 'Escreva um título com pelo menos 5 caracteres.');
      if (!d.categoria) falha('#nv-cat', 'Escolha o assunto.');
      if (d.descricao.trim().length < 10) falha('#nv-desc', 'A descrição precisa ter pelo menos 10 caracteres.');
      if (!d.bairro) falha('#nv-bairro', 'Escolha o bairro.');
      if (primeiro) { primeiro.focus(); return; }
      const r = RA.DB.criarManifestacao(Object.assign(d, { anexos, coord }), user);
      if (!r.ok) { UI.toast(r.erro, 'erro'); return; }
      const m = r.manifestacao;
      const h = UI.modal('<div class="modal-b sucesso"><span class="ok-ico">' + icon('check', 28) + '</span><h2>Manifestação registrada</h2>' +
        '<p>Guarde o número abaixo. Com ele você acompanha o andamento, mesmo sem entrar na conta.</p>' + UI.ticket(m) +
        '<p class="muted">Prazo para resposta: até ' + RA.PRAZO_DIAS + ' dias, conforme a Lei nº 13.460/2017.</p>' +
        '<div class="btn-row center"><a class="btn btn-primary" href="#/protocolo?p=' + encodeURIComponent(m.protocolo) + '" data-close>Acompanhar</a>' +
        '<button type="button" class="btn btn-ghost" data-close>Registrar outra</button></div></div>', { size: 'sm', title: 'Manifestação registrada' });
      h.el.addEventListener('click', (ev) => { if (ev.target.closest('a[data-close]')) h.close(); });
      anexos = []; coord = null;
      f.reset();
      $('#nv-bairro', f).value = user.bairro;
      $('#nv-geo-s', f).textContent = 'Opcional. Ajuda a equipe a achar o local exato.';
      pintarAnexos();
      UI.contador($('#nv-desc', f), $('#nv-cont', f), 10, 1500);
      pintarSimilares();
    });

    RA.ligarCartoes(main, pintarSimilares);
    $('#nv-titulo', f).focus();
  };

  /* ------------------------------ Na minha região ------------------------------ */
  const estadoRegiao = { q: '', bairro: null, categoria: '', status: '', ordem: 'recentes', limite: 9 };

  RA.views.regiao = function (main) {
    const user = RA.DB.usuarioAtual();
    if (estadoRegiao.bairro === null) estadoRegiao.bairro = user ? user.bairro : '';
    const e = estadoRegiao;

    main.innerHTML = '<div class="container"><div class="page-head"><h1 class="h2">Manifestações na região</h1>' +
      '<p class="muted">Veja o que os vizinhos registraram, comente e apoie. Denúncias não aparecem aqui.</p></div>' +
      '<form class="filters card" id="f-reg" role="search"><div class="field grow"><label for="rg-q">Buscar</label><input id="rg-q" class="input" type="search" placeholder="Palavra, rua ou protocolo" value="' + esc(e.q) + '"></div>' +
      '<div class="field"><label for="rg-bairro">Bairro</label><select id="rg-bairro" class="input">' + UI.opcoes(RA.BAIRROS, e.bairro, 'Todos os bairros') + '</select></div>' +
      '<div class="field"><label for="rg-cat">Assunto</label><select id="rg-cat" class="input">' + UI.opcoes(RA.CATEGORIAS, e.categoria, 'Todos os assuntos') + '</select></div>' +
      '<div class="field"><label for="rg-st">Situação</label><select id="rg-st" class="input"><option value="">Todas</option>' + Object.keys(RA.STATUS).map((k) => '<option value="' + k + '"' + (e.status === k ? ' selected' : '') + '>' + RA.STATUS[k].nome + '</option>').join('') + '</select></div>' +
      '<div class="field"><label for="rg-ord">Ordem</label><select id="rg-ord" class="input"><option value="recentes"' + (e.ordem === 'recentes' ? ' selected' : '') + '>Mais recentes</option><option value="apoios"' + (e.ordem === 'apoios' ? ' selected' : '') + '>Mais apoiadas</option><option value="antigas"' + (e.ordem === 'antigas' ? ' selected' : '') + '>Mais antigas</option></select></div></form>' +
      '<p class="result-line" id="rg-resumo" aria-live="polite"></p><div class="mgrid" id="rg-lista"></div><div class="center" id="rg-mais"></div></div>';

    function pintar() {
      const base = RA.DB.manifestacoes().filter((m) => RA.TIPOS[m.tipo].publica);
      const l = RA.filtrar(base, e);
      const r = RA.Stats.resumo(l);
      $('#rg-resumo', main).innerHTML = '<strong>' + l.length + '</strong> ' + (l.length === 1 ? 'manifestação' : 'manifestações') + (e.bairro ? ' em ' + esc(e.bairro) : ' na cidade') +
        (l.length ? ': ' + r.pendentes + ' em tratamento e ' + r.concluida + ' concluídas.' : '.');
      const vis = l.slice(0, e.limite);
      $('#rg-lista', main).innerHTML = vis.length ? vis.map((m) => RA.cartaoManifestacao(m, user)).join('') :
        UI.vazio('Nada encontrado', 'Tente outro bairro ou assunto. Se o problema não está na lista, registre uma nova manifestação.', '<a class="btn btn-primary" href="#/nova">' + icon('plus', 16) + 'Nova manifestação</a>');
      $('#rg-mais', main).innerHTML = l.length > vis.length ? '<button type="button" class="btn btn-ghost" id="bt-mais">Mostrar mais (' + (l.length - vis.length) + ')</button>' : '';
    }
    pintar();

    const f = $('#f-reg', main);
    f.addEventListener('submit', (ev) => ev.preventDefault());
    const mapa = { 'rg-q': 'q', 'rg-bairro': 'bairro', 'rg-cat': 'categoria', 'rg-st': 'status', 'rg-ord': 'ordem' };
    const lento = UI.debounce(pintar, 200);
    f.addEventListener('input', (ev) => { const k = mapa[ev.target.id]; if (k) { e[k] = ev.target.value; e.limite = 9; lento(); } });
    main.addEventListener('click', (ev) => { if (ev.target.closest('#bt-mais')) { e.limite += 9; pintar(); } });
    RA.ligarCartoes(main, pintar);
  };

  /* ------------------------------ Minha conta ------------------------------ */
  function formEditar(m) {
    return UI.cabecalhoModal('Editar manifestação', m.protocolo) + '<form id="f-edit" novalidate class="modal-b">' +
      '<div class="field"><label for="ed-tipo">Tipo</label><select id="ed-tipo" class="input">' + Object.keys(RA.TIPOS).map((k) => '<option value="' + k + '"' + (k === m.tipo ? ' selected' : '') + '>' + RA.TIPOS[k].nome + '</option>').join('') + '</select></div>' +
      '<div class="field"><label for="ed-titulo">Título</label><input id="ed-titulo" class="input" maxlength="80" value="' + esc(m.titulo) + '"></div>' +
      '<div class="field"><label for="ed-cat">Assunto</label><select id="ed-cat" class="input">' + UI.opcoes(RA.CATEGORIAS, m.categoria) + '</select></div>' +
      '<div class="field"><label for="ed-desc">Descrição</label><textarea id="ed-desc" class="input" rows="5" maxlength="1500">' + esc(m.descricao) + '</textarea><p class="hint" id="ed-cont"></p></div>' +
      '<div class="grid-2"><div class="field"><label for="ed-bairro">Bairro</label><select id="ed-bairro" class="input">' + UI.opcoes(RA.BAIRROS, m.bairro) + '</select></div>' +
      '<div class="field"><label for="ed-end">Endereço ou referência</label><input id="ed-end" class="input" maxlength="120" value="' + esc(m.endereco) + '"></div></div>' +
      '<label class="check"><input type="checkbox" id="ed-anon"' + (m.anonima ? ' checked' : '') + '><span>Não mostrar meu nome para outros cidadãos.</span></label>' +
      '<div class="modal-f flush"><button type="button" class="btn btn-ghost" data-close>Cancelar</button><button type="submit" class="btn btn-primary">Salvar alterações</button></div></form>';
  }

  const estadoMinhas = { q: '', status: '' };

  RA.views.conta = function (main, ctx) {
    const user = RA.DB.usuarioAtual();
    const aba = ctx.params.aba || 'dados';
    const naoLidas = RA.DB.notificacoesDe(user.id).filter((n) => !n.lida).length;
    const abas = [['dados', 'Meus dados', 'user'], ['manifestacoes', 'Minhas manifestações', 'list'], ['avisos', 'Notificações', 'bell']];

    main.innerHTML = '<div class="container narrow-lg"><div class="page-head"><h1 class="h2">Minha conta</h1></div>' +
      '<div class="tabs" role="tablist" aria-label="Seções da conta">' + abas.map((a) => '<a role="tab" class="tab' + (a[0] === aba ? ' on' : '') + '" aria-selected="' + (a[0] === aba ? 'true' : 'false') + '" href="#/conta?aba=' + a[0] + '">' + icon(a[2], 17) + a[1] + (a[0] === 'avisos' && naoLidas ? '<span class="count">' + naoLidas + '</span>' : '') + '</a>').join('') + '</div>' +
      '<div id="aba" role="tabpanel"></div></div>';
    const box = $('#aba', main);

    if (aba === 'dados') {
      box.innerHTML = '<form class="card card-pad" id="f-dados" novalidate><div class="grid-2"><div class="field"><label for="dt-nome">Nome completo</label><input id="dt-nome" class="input" value="' + esc(user.nome) + '" autocomplete="name"></div>' +
        '<div class="field"><label for="dt-cpf">CPF</label><input id="dt-cpf" class="input" value="' + esc(UI.cpfOculto(user.cpf)) + '" readonly aria-describedby="dt-cpf-h"><p class="hint" id="dt-cpf-h">O CPF não pode ser alterado por aqui.</p></div></div>' +
        '<div class="grid-2"><div class="field"><label for="dt-email">E-mail</label><input id="dt-email" class="input" type="email" value="' + esc(user.email) + '" autocomplete="email"></div>' +
        '<div class="field"><label for="dt-tel">Telefone</label><input id="dt-tel" class="input" inputmode="tel" value="' + esc(user.telefone || '') + '" autocomplete="tel"></div></div>' +
        '<div class="grid-2"><div class="field"><label for="dt-bairro">Bairro</label><select id="dt-bairro" class="input">' + UI.opcoes(RA.BAIRROS, user.bairro) + '</select></div>' +
        '<div class="field"><label for="dt-end">Endereço</label><input id="dt-end" class="input" value="' + esc(user.endereco || '') + '" autocomplete="street-address"></div></div>' +
        '<button class="btn btn-primary" type="submit">Salvar alterações</button></form>' +
        '<form class="card card-pad" id="f-senha" novalidate><h2 class="h3">Alterar senha</h2><div class="grid-3"><div class="field"><label for="sn-a">Senha atual</label><input id="sn-a" class="input" type="password" autocomplete="current-password"></div>' +
        '<div class="field"><label for="sn-n">Nova senha</label><input id="sn-n" class="input" type="password" autocomplete="new-password"></div>' +
        '<div class="field"><label for="sn-n2">Repita a nova senha</label><input id="sn-n2" class="input" type="password" autocomplete="new-password"></div></div>' +
        '<button class="btn btn-ghost" type="submit">Alterar senha</button></form>';
      $('#dt-tel', box).addEventListener('input', (e) => { e.target.value = UI.mascaraTel(e.target.value); });
      const f = $('#f-dados', box);
      f.addEventListener('submit', (e) => {
        e.preventDefault();
        UI.limparErros(f);
        if ($('#dt-nome', f).value.trim().split(/\s+/).length < 2) { UI.erro($('#dt-nome', f), 'Informe nome e sobrenome.'); return; }
        if (!UI.emailValido($('#dt-email', f).value)) { UI.erro($('#dt-email', f), 'Informe um e-mail válido.'); return; }
        const r = RA.DB.atualizarUsuario(user.id, { nome: $('#dt-nome', f).value.trim(), email: $('#dt-email', f).value.trim(), telefone: $('#dt-tel', f).value, bairro: $('#dt-bairro', f).value, endereco: $('#dt-end', f).value });
        if (!r.ok) { UI.erro($('#dt-email', f), r.erro); return; }
        UI.toast('Dados atualizados.', 'ok');
        RA.atualizarCabecalho();
      });
      const fs = $('#f-senha', box);
      fs.addEventListener('submit', (e) => {
        e.preventDefault();
        UI.limparErros(fs);
        if ($('#sn-a', fs).value !== user.senha) { UI.erro($('#sn-a', fs), 'A senha atual não confere.'); return; }
        const n = $('#sn-n', fs).value;
        if (n.length < 6 || !/[A-Za-z]/.test(n) || !/\d/.test(n)) { UI.erro($('#sn-n', fs), 'Use 6 ou mais caracteres, com letras e números.'); return; }
        if ($('#sn-n2', fs).value !== n) { UI.erro($('#sn-n2', fs), 'As senhas não são iguais.'); return; }
        RA.DB.atualizarUsuario(user.id, { senha: n });
        fs.reset();
        UI.toast('Senha alterada.', 'ok');
      });
    } else if (aba === 'manifestacoes') {
      const e = estadoMinhas;
      box.innerHTML = '<form class="filters card" role="search"><div class="field grow"><label for="mn-q">Buscar nas minhas manifestações</label><input id="mn-q" class="input" type="search" value="' + esc(e.q) + '" placeholder="Título, protocolo ou bairro"></div>' +
        '<div class="field"><label for="mn-st">Situação</label><select id="mn-st" class="input"><option value="">Todas</option>' + Object.keys(RA.STATUS).map((k) => '<option value="' + k + '"' + (e.status === k ? ' selected' : '') + '>' + RA.STATUS[k].nome + '</option>').join('') + '</select></div>' +
        '<a class="btn btn-primary" href="#/nova">' + icon('plus', 16) + 'Nova</a></form><div id="mn-lista"></div>';
      const pintar = () => {
        const l = RA.filtrar(RA.DB.doUsuario(user.id), e);
        $('#mn-lista', box).innerHTML = l.length ? '<ul class="lista-m">' + l.map((m) => {
          const edit = m.status === 'aberta';
          return '<li class="card"><div class="lm-main"><div class="title-row"><h3>' + esc(m.titulo) + '</h3>' + UI.statusBadge(m.status) + '</div>' +
            '<p class="meta"><span>' + esc(m.protocolo) + '</span><span>' + icon('pin', 15) + esc(m.bairro) + '</span><span>' + icon('clock', 15) + UI.data(m.dataCriacao) + '</span><span class="chip chip-soft">' + esc(RA.TIPOS[m.tipo].nome) + '</span></p>' +
            '<p>' + UI.prazoBadge(m) + '</p></div>' +
            '<div class="lm-act"><button type="button" class="btn btn-ghost btn-sm" data-detalhe="' + m.id + '">' + icon('eye', 15) + 'Ver</button>' +
            (edit ? '<button type="button" class="btn btn-ghost btn-sm" data-editar="' + m.id + '">' + icon('edit', 15) + 'Editar</button><button type="button" class="btn btn-ghost btn-sm perigo" data-excluir="' + m.id + '">' + icon('trash', 15) + 'Excluir</button>' : '') + '</div></li>';
        }).join('') + '</ul>' : UI.vazio('Nenhuma manifestação por aqui', RA.DB.doUsuario(user.id).length ? 'Nenhum resultado para esse filtro.' : 'Quando você registrar uma manifestação, ela aparece nesta lista.', '<a class="btn btn-primary" href="#/nova">' + icon('plus', 16) + 'Registrar manifestação</a>');
      };
      pintar();
      const lento = UI.debounce(pintar, 200);
      $('#mn-q', box).addEventListener('input', (ev) => { e.q = ev.target.value; lento(); });
      $('#mn-st', box).addEventListener('change', (ev) => { e.status = ev.target.value; pintar(); });
      box.addEventListener('click', async (ev) => {
        const ed = ev.target.closest('[data-editar]');
        const ex = ev.target.closest('[data-excluir]');
        if (ed) {
          const m = RA.DB.manifestacao(Number(ed.dataset.editar));
          const h = UI.modal(formEditar(m), { size: 'md', title: 'Editar manifestação' });
          UI.contador($('#ed-desc', h.el), $('#ed-cont', h.el), 10, 1500);
          const f = $('#f-edit', h.el);
          f.addEventListener('submit', (e2) => {
            e2.preventDefault();
            UI.limparErros(f);
            if ($('#ed-titulo', f).value.trim().length < 5) { UI.erro($('#ed-titulo', f), 'Escreva um título com pelo menos 5 caracteres.'); return; }
            if ($('#ed-desc', f).value.trim().length < 10) { UI.erro($('#ed-desc', f), 'A descrição precisa ter pelo menos 10 caracteres.'); return; }
            const r = RA.DB.editarManifestacao(m.id, { tipo: $('#ed-tipo', f).value, titulo: $('#ed-titulo', f).value, categoria: $('#ed-cat', f).value, descricao: $('#ed-desc', f).value, bairro: $('#ed-bairro', f).value, endereco: $('#ed-end', f).value, anonima: $('#ed-anon', f).checked }, user);
            if (!r.ok) { UI.toast(r.erro, 'erro'); return; }
            h.close();
            UI.toast('Manifestação atualizada.', 'ok');
            pintar();
          });
        } else if (ex) {
          const m = RA.DB.manifestacao(Number(ex.dataset.excluir));
          if (await UI.confirmar({ titulo: 'Excluir manifestação?', mensagem: 'A manifestação "' + m.titulo + '" será removida e não poderá ser recuperada.', ok: 'Excluir', perigo: true })) {
            const r = RA.DB.excluirManifestacao(m.id, user);
            UI.toast(r.ok ? 'Manifestação excluída.' : r.erro, r.ok ? 'ok' : 'erro');
            pintar();
          }
        }
      });
      RA.ligarCartoes(box, pintar);
    } else {
      const l = RA.DB.notificacoesDe(user.id);
      box.innerHTML = '<div class="card card-pad">' + (l.length ? '<ul class="notifs">' + l.map((n) => '<li class="' + (n.lida ? '' : 'nova') + '"><span class="n-ico">' + icon('bell', 16) + '</span><div><p>' + esc(n.texto) + '</p><span class="muted">' + UI.dataHora(n.data) + '</span></div>' +
        (n.manifestacaoId && RA.DB.manifestacao(n.manifestacaoId) ? '<button type="button" class="btn btn-ghost btn-sm" data-detalhe="' + n.manifestacaoId + '">Abrir</button>' : '') + '</li>').join('') + '</ul>' :
        UI.vazio('Sem notificações', 'Quando a ouvidoria atualizar uma manifestação sua, o aviso aparece aqui.')) + '</div>';
      RA.DB.marcarLidas(user.id);
      RA.atualizarCabecalho();
      RA.ligarCartoes(box);
    }
  };
})();
