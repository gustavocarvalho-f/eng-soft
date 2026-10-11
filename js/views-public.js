/* =========================================================================
   Resolve Aqui - telas públicas e de acesso
   Início, entrar (UC08), cadastro (UC10/UC11), recuperar acesso (UC09),
   consulta de protocolo.
   ========================================================================= */
(function () {
  'use strict';
  const RA = window.RA;
  const UI = RA.UI;
  const esc = UI.esc;
  const icon = UI.icon;
  const $ = UI.$;
  RA.views = RA.views || {};

  RA.homeDoNivel = (n) => (n === 'gestor' ? '#/painel' : n === 'vereador' ? '#/fiscalizacao' : '#/nova');

  const CONTAS_DEMO = [
    { nome: 'Cidadão', quem: 'João Silva', email: 'joao@gmail.com', senha: '123456', icone: 'user', texto: 'Registra manifestações, acompanha o protocolo e vê o que acontece no bairro.' },
    { nome: 'Ouvidoria', quem: 'Helena Duarte', email: 'admin@itapetininga.sp.gov.br', senha: 'admin123', icone: 'shield', texto: 'Trata a fila, responde ao cidadão, gera relatórios e gerencia usuários.' },
    { nome: 'Câmara de Vereadores', quem: 'Ver. Roberto Almeida', email: 'vereador@camara.exemplo.gov.br', senha: 'camara123', icone: 'landmark', texto: 'Consulta indicadores e pontos recorrentes para fiscalizar o Executivo.' },
  ];

  function entrarComo(email, senha) {
    const r = RA.DB.entrar(email, senha);
    if (!r.ok) { UI.toast(r.erro, 'erro'); return r; }
    UI.toast('Olá, ' + r.user.nome.split(' ')[0] + '.', 'ok');
    location.hash = RA.homeDoNivel(r.user.nivel);
    return r;
  }

  /* ------------------------------ Início ------------------------------ */
  RA.views.inicio = function (main) {
    const todas = RA.DB.manifestacoes();
    const r = RA.Stats.resumo(todas);
    const cats = RA.Stats.porCategoria(todas).slice(0, 5);
    const resolvidas = todas.filter((m) => RA.TIPOS[m.tipo].publica && m.status === 'concluida' && m.dataConclusao)
      .sort((a, b) => new Date(b.dataConclusao) - new Date(a.dataConclusao)).slice(0, 4);
    const exemplos = todas.slice(-3).reverse().map((m) => m.protocolo);
    const user = RA.DB.usuarioAtual();

    main.innerHTML =
      '<section class="hero"><div class="container hero-grid">' +
      '<div class="hero-text"><h1>Registre o problema da sua cidade e acompanhe a resposta.</h1>' +
      '<p class="lead">O Resolve Aqui reúne reclamações, solicitações, sugestões, elogios e denúncias sobre os serviços públicos de Itapetininga em um só lugar, com protocolo, prazo e histórico.</p>' +
      '<div class="btn-row"><a class="btn btn-primary btn-lg" href="' + (user ? RA.homeDoNivel(user.nivel) : '#/cadastro') + '">' + icon('plus', 18) + (user ? 'Ir para o meu painel' : 'Criar conta e registrar') + '</a>' +
      (user ? '' : '<a class="btn btn-ghost btn-lg" href="#/entrar">Já tenho conta</a>') + '</div></div>' +
      '<form class="ticket ticket-big" id="f-protocolo" role="search"><div class="ticket-main">' +
      '<label for="in-protocolo" class="ticket-l">Já registrou? Consulte pelo protocolo</label>' +
      '<input id="in-protocolo" class="ticket-input" type="text" inputmode="text" autocomplete="off" placeholder="RA-2026-00001" spellcheck="false">' +
      '<p class="ticket-ex">Para testar: ' + exemplos.map((p) => '<button type="button" class="chip-btn" data-ex="' + esc(p) + '">' + esc(p) + '</button>').join('') + '</p></div>' +
      '<div class="ticket-stub"><button type="submit" class="btn btn-primary">' + icon('search', 17) + 'Consultar</button></div></form>' +
      '</div></section>' +

      '<section class="container sec"><div class="sec-head"><h2>O que o município recebeu</h2><p class="muted">Números abertos a qualquer cidadão. Atualizados a cada nova manifestação.</p></div>' +
      '<div class="kpis">' +
      UI.kpi({ rotulo: 'Manifestações recebidas', valor: UI.num(r.total), icone: 'message', dica: UI.num(r.pendentes) + ' ainda em tratamento' }) +
      UI.kpi({ rotulo: 'Concluídas', valor: UI.num(r.concluida), tom: 'ok', icone: 'check', dica: UI.pct(r.taxa) + ' do total' }) +
      UI.kpi({ rotulo: 'Tempo médio de resolução', valor: r.mediaDias == null ? '-' : UI.dec(r.mediaDias) + ' dias', icone: 'clock', dica: 'Prazo legal: ' + RA.PRAZO_DIAS + ' dias' }) +
      UI.kpi({ rotulo: 'Apoios dos cidadãos', valor: UI.num(r.apoios), icone: 'thumb', dica: 'Quem apoia mostra que o problema é de muitos' }) +
      '</div>' +
      '<div class="grid-2 gap-lg"><div class="card"><h3>Assuntos mais registrados</h3>' + UI.barras(cats.map((c) => ({ nome: c.nome, valor: c.total }))) + '</div>' +
      '<div class="card"><h3>Resolvidas recentemente</h3>' + (resolvidas.length ? '<ul class="feed">' + resolvidas.map((m) =>
        '<li><button type="button" class="feed-btn" data-detalhe="' + m.id + '"><strong>' + esc(m.titulo) + '</strong><span class="muted">' + esc(m.bairro) + ', concluída ' + UI.relativo(m.dataConclusao) + '</span></button></li>').join('') + '</ul>' : UI.vazio('Nada concluído ainda', '')) + '</div></div></section>' +

      '<section class="band"><div class="container sec"><div class="sec-head"><h2>Como funciona</h2></div><ol class="steps">' +
      '<li><span class="step-n">1</span><h3>Registre</h3><p>Descreva o problema, escolha o assunto e o bairro. Pode anexar fotos e, se preferir, pedir anonimato.</p></li>' +
      '<li><span class="step-n">2</span><h3>Triagem</h3><p>A ouvidoria classifica, junta manifestações parecidas e encaminha ao órgão responsável.</p></li>' +
      '<li><span class="step-n">3</span><h3>Tratamento</h3><p>O órgão resolve o problema. Cada mudança entra no histórico e avisa você.</p></li>' +
      '<li><span class="step-n">4</span><h3>Resposta</h3><p>A resposta oficial fica registrada junto ao protocolo, dentro do prazo de ' + RA.PRAZO_DIAS + ' dias.</p></li></ol></div></section>' +

      '<section class="container sec" id="perfis"><div class="sec-head"><h2>Explore o protótipo por perfil</h2><p class="muted">Cada botão entra com uma conta de demonstração. Os dados são fictícios e ficam só neste navegador.</p></div>' +
      '<div class="perfis">' + CONTAS_DEMO.map((c, i) => '<article class="card perfil"><span class="perfil-ico">' + icon(c.icone, 22) + '</span><h3>' + esc(c.nome) + '</h3><p>' + esc(c.texto) + '</p>' +
        '<button type="button" class="btn btn-ghost" data-demo="' + i + '">Entrar como ' + esc(c.quem) + '</button></article>').join('') + '</div></section>';

    $('#f-protocolo', main).addEventListener('submit', (e) => {
      e.preventDefault();
      const v = $('#in-protocolo', main).value.trim();
      location.hash = '#/protocolo' + (v ? '?p=' + encodeURIComponent(v) : '');
    });
    main.addEventListener('click', (e) => {
      const ex = e.target.closest('[data-ex]');
      if (ex) { $('#in-protocolo', main).value = ex.dataset.ex; $('#in-protocolo', main).focus(); return; }
      const d = e.target.closest('[data-demo]');
      if (d) { const c = CONTAS_DEMO[Number(d.dataset.demo)]; entrarComo(c.email, c.senha); }
    });
    RA.ligarCartoes(main);
  };

  /* ------------------------------ Entrar (UC08) ------------------------------ */
  RA.views.entrar = function (main) {
    main.innerHTML = '<div class="container narrow auth"><div class="card card-pad">' +
      '<h1 class="h2">Entrar</h1><p class="muted">Use o e-mail e a senha do seu cadastro.</p>' +
      '<form id="f-login" novalidate><div class="field"><label for="lg-email">E-mail</label><input id="lg-email" class="input" type="email" autocomplete="username" placeholder="voce@exemplo.com" required></div>' +
      '<div class="field"><label for="lg-senha">Senha</label><div class="pw"><input id="lg-senha" class="input" type="password" autocomplete="current-password" required>' +
      '<button type="button" class="pw-btn" data-pw aria-label="Mostrar senha">Mostrar</button></div></div>' +
      '<button class="btn btn-primary btn-block" type="submit">Entrar</button></form>' +
      '<p class="links"><a href="#/recuperar">Esqueci minha senha</a><a href="#/cadastro">Criar conta</a></p>' +
      '<button type="button" class="btn btn-ghost btn-block" disabled title="Integração prevista nos objetivos do projeto. Não está ativa no protótipo.">Entrar com conta gov.br (integração prevista)</button>' +
      '</div>' +
      '<div class="card card-pad demo"><h2 class="h3">Contas de demonstração</h2><ul class="demo-list">' + CONTAS_DEMO.map((c, i) =>
        '<li><div><strong>' + esc(c.nome) + '</strong><span class="muted">' + esc(c.email) + '<br>Senha: ' + esc(c.senha) + '</span></div><button type="button" class="btn btn-ghost btn-sm" data-demo="' + i + '">Usar</button></li>').join('') + '</ul></div></div>';

    const f = $('#f-login', main);
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      UI.limparErros(f);
      const email = $('#lg-email', f); const senha = $('#lg-senha', f);
      if (!UI.emailValido(email.value)) { UI.erro(email, 'Informe um e-mail válido.'); email.focus(); return; }
      if (!senha.value) { UI.erro(senha, 'Informe a senha.'); senha.focus(); return; }
      const r = RA.DB.entrar(email.value, senha.value);
      if (r.ok) { UI.toast('Olá, ' + r.user.nome.split(' ')[0] + '.', 'ok'); location.hash = RA.homeDoNivel(r.user.nivel); return; }
      UI.erro(senha, r.erro);
      if (r.pendente) {
        const p = senha.closest('.field').querySelector('.field-err');
        if (p) p.insertAdjacentHTML('beforeend', ' <button type="button" class="link-btn" data-reenviar="' + r.userId + '">Receber código de confirmação</button>');
      }
    });
    main.addEventListener('click', (e) => {
      const pw = e.target.closest('[data-pw]');
      if (pw) {
        const i = $('#lg-senha', main); const mostrar = i.type === 'password';
        i.type = mostrar ? 'text' : 'password'; pw.textContent = mostrar ? 'Ocultar' : 'Mostrar'; pw.setAttribute('aria-label', mostrar ? 'Ocultar senha' : 'Mostrar senha');
        return;
      }
      const d = e.target.closest('[data-demo]');
      if (d) { const c = CONTAS_DEMO[Number(d.dataset.demo)]; entrarComo(c.email, c.senha); return; }
      const re = e.target.closest('[data-reenviar]');
      if (re) { const id = Number(re.dataset.reenviar); RA.abrirConfirmacao(id, RA.DB.reenviarCodigo(id)); }
    });
    $('#lg-email', main).focus();
  };

  /* ------------------------------ Confirmação de e-mail (UC11) ------------------------------ */
  RA.abrirConfirmacao = function (userId, codigo) {
    const u = RA.DB.usuario(userId);
    if (!u) return;
    const h = UI.modal(UI.cabecalhoModal('Confirme seu e-mail', 'Enviamos um código de 6 dígitos para ' + u.email + '.') +
      '<form class="modal-b" id="f-conf" novalidate><div class="mail-sim"><p class="mail-tag">' + icon('mail', 15) + 'Caixa de entrada simulada</p>' +
      '<p><strong>Assunto:</strong> Seu código de confirmação</p><p>Use o código <strong class="cod" id="cod-sim">' + esc(codigo) + '</strong> para ativar sua conta no Resolve Aqui.</p>' +
      '<p class="muted">No sistema final, este e-mail seria enviado pelo servidor. Aqui ele aparece na tela para a demonstração.</p></div>' +
      '<div class="field"><label for="cf-cod">Código recebido</label><input id="cf-cod" class="input" inputmode="numeric" maxlength="6" autocomplete="one-time-code" autofocus></div>' +
      '<div class="modal-f flush"><button type="button" class="btn btn-ghost" data-novo>Reenviar código</button><button type="submit" class="btn btn-primary">Confirmar cadastro</button></div></form>', { size: 'sm', title: 'Confirmar e-mail' });
    const f = $('#f-conf', h.el);
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      UI.limparErros(f);
      const r = RA.DB.confirmarEmail(userId, $('#cf-cod', f).value);
      if (!r.ok) { UI.erro($('#cf-cod', f), r.erro); return; }
      h.close();
      UI.toast('Cadastro confirmado. Você já está conectado.', 'ok');
      location.hash = RA.homeDoNivel(r.user.nivel);
    });
    f.addEventListener('click', (e) => {
      if (e.target.closest('[data-novo]')) { $('#cod-sim', f).textContent = RA.DB.reenviarCodigo(userId); UI.toast('Novo código gerado.', 'info'); }
    });
  };

  /* ------------------------------ Cadastro (UC10) ------------------------------ */
  RA.views.cadastro = function (main) {
    main.innerHTML = '<div class="container narrow auth"><div class="card card-pad"><h1 class="h2">Criar conta</h1>' +
      '<p class="muted">Seus dados identificam você perante a ouvidoria. Eles não aparecem para outros cidadãos.</p>' +
      '<form id="f-cad" novalidate><div class="field"><label for="cd-nome">Nome completo</label><input id="cd-nome" class="input" autocomplete="name" required></div>' +
      '<div class="grid-2"><div class="field"><label for="cd-cpf">CPF</label><input id="cd-cpf" class="input" inputmode="numeric" placeholder="000.000.000-00" autocomplete="off" required></div>' +
      '<div class="field"><label for="cd-tel">Telefone (opcional)</label><input id="cd-tel" class="input" inputmode="tel" placeholder="(15) 90000-0000" autocomplete="tel"></div></div>' +
      '<div class="field"><label for="cd-email">E-mail</label><input id="cd-email" class="input" type="email" autocomplete="email" required></div>' +
      '<div class="grid-2"><div class="field"><label for="cd-bairro">Bairro</label><select id="cd-bairro" class="input" required>' + UI.opcoes(RA.BAIRROS, '', 'Selecione') + '</select></div>' +
      '<div class="field"><label for="cd-end">Endereço (opcional)</label><input id="cd-end" class="input" autocomplete="street-address"></div></div>' +
      '<div class="grid-2"><div class="field"><label for="cd-senha">Senha</label><input id="cd-senha" class="input" type="password" autocomplete="new-password" minlength="6" required><p class="hint">Mínimo de 6 caracteres, com letras e números.</p></div>' +
      '<div class="field"><label for="cd-senha2">Repita a senha</label><input id="cd-senha2" class="input" type="password" autocomplete="new-password" required></div></div>' +
      '<label class="check"><input type="checkbox" id="cd-lgpd"><span>Li e concordo que meus dados sejam tratados para o registro e o acompanhamento das minhas manifestações, conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).</span></label>' +
      '<button class="btn btn-primary btn-block" type="submit">Criar conta</button></form>' +
      '<p class="links"><a href="#/entrar">Já tenho conta</a></p></div></div>';
    const f = $('#f-cad', main);
    $('#cd-cpf', f).addEventListener('input', (e) => { e.target.value = UI.mascaraCPF(e.target.value); });
    $('#cd-tel', f).addEventListener('input', (e) => { e.target.value = UI.mascaraTel(e.target.value); });
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      UI.limparErros(f);
      const g = (id) => $('#' + id, f);
      let primeiro = null;
      const falha = (id, msg) => { UI.erro(g(id), msg); if (!primeiro) primeiro = g(id); };
      if (g('cd-nome').value.trim().split(/\s+/).length < 2) falha('cd-nome', 'Informe nome e sobrenome.');
      if (!UI.cpfValido(g('cd-cpf').value)) falha('cd-cpf', 'CPF inválido. Confira os 11 dígitos.');
      if (!UI.emailValido(g('cd-email').value)) falha('cd-email', 'Informe um e-mail válido.');
      if (!g('cd-bairro').value) falha('cd-bairro', 'Escolha o seu bairro.');
      const s = g('cd-senha').value;
      if (s.length < 6 || !/[A-Za-z]/.test(s) || !/\d/.test(s)) falha('cd-senha', 'A senha precisa ter 6 ou mais caracteres, com letras e números.');
      if (g('cd-senha2').value !== s) falha('cd-senha2', 'As senhas não são iguais.');
      if (!g('cd-lgpd').checked) { UI.erro(g('cd-lgpd'), 'É preciso concordar para criar a conta.'); if (!primeiro) primeiro = g('cd-lgpd'); }
      if (primeiro) { primeiro.focus(); return; }
      const r = RA.DB.registrar({
        nome: g('cd-nome').value, cpf: g('cd-cpf').value, telefone: g('cd-tel').value, email: g('cd-email').value,
        bairro: g('cd-bairro').value, endereco: g('cd-end').value, senha: s,
      });
      if (!r.ok) { UI.erro(g(r.campo === 'cpf' ? 'cd-cpf' : 'cd-email'), r.erro); g(r.campo === 'cpf' ? 'cd-cpf' : 'cd-email').focus(); return; }
      RA.abrirConfirmacao(r.user.id, r.codigo);
    });
    $('#cd-nome', main).focus();
  };

  /* ------------------------------ Recuperar acesso (UC09) ------------------------------ */
  RA.views.recuperar = function (main) {
    main.innerHTML = '<div class="container narrow auth"><div class="card card-pad"><h1 class="h2">Recuperar acesso</h1>' +
      '<div id="rec-1"><p class="muted">Informe o e-mail da sua conta. Enviaremos um código para criar uma nova senha.</p>' +
      '<form id="f-rec1" novalidate><div class="field"><label for="rc-email">E-mail</label><input id="rc-email" class="input" type="email" autocomplete="email" required></div>' +
      '<button class="btn btn-primary btn-block" type="submit">Enviar código</button></form></div>' +
      '<div id="rec-2" hidden></div><p class="links"><a href="#/entrar">Voltar para entrar</a></p></div></div>';
    const f1 = $('#f-rec1', main);
    f1.addEventListener('submit', (e) => {
      e.preventDefault();
      UI.limparErros(f1);
      const em = $('#rc-email', f1);
      if (!UI.emailValido(em.value)) { UI.erro(em, 'Informe um e-mail válido.'); em.focus(); return; }
      const r = RA.DB.pedirRecuperacao(em.value);
      $('#rec-1', main).hidden = true;
      const box = $('#rec-2', main);
      box.hidden = false;
      box.innerHTML = '<p class="muted">Se este e-mail estiver cadastrado, o código foi enviado. Ele vale por 15 minutos.</p>' +
        (r.codigo ? '<div class="mail-sim"><p class="mail-tag">' + icon('mail', 15) + 'Caixa de entrada simulada</p><p><strong>Assunto:</strong> Recuperação de acesso</p><p>Seu código é <strong class="cod">' + esc(r.codigo) + '</strong>.</p></div>' : '') +
        '<form id="f-rec2" novalidate><div class="field"><label for="rc-cod">Código recebido</label><input id="rc-cod" class="input" inputmode="numeric" maxlength="6" autocomplete="one-time-code"></div>' +
        '<div class="field"><label for="rc-s1">Nova senha</label><input id="rc-s1" class="input" type="password" autocomplete="new-password"><p class="hint">Mínimo de 6 caracteres, com letras e números.</p></div>' +
        '<div class="field"><label for="rc-s2">Repita a nova senha</label><input id="rc-s2" class="input" type="password" autocomplete="new-password"></div>' +
        '<button class="btn btn-primary btn-block" type="submit">Salvar nova senha</button></form>';
      const f2 = $('#f-rec2', box);
      $('#rc-cod', f2).focus();
      f2.addEventListener('submit', (ev) => {
        ev.preventDefault();
        UI.limparErros(f2);
        const s1 = $('#rc-s1', f2).value;
        if (s1.length < 6 || !/[A-Za-z]/.test(s1) || !/\d/.test(s1)) { UI.erro($('#rc-s1', f2), 'A senha precisa ter 6 ou mais caracteres, com letras e números.'); return; }
        if ($('#rc-s2', f2).value !== s1) { UI.erro($('#rc-s2', f2), 'As senhas não são iguais.'); return; }
        const rr = RA.DB.redefinirSenha(em.value, $('#rc-cod', f2).value, s1);
        if (!rr.ok) { UI.erro($('#rc-cod', f2), rr.erro); return; }
        UI.toast('Senha alterada. Entre com a nova senha.', 'ok');
        location.hash = '#/entrar';
      });
    });
    $('#rc-email', main).focus();
  };

  /* ------------------------------ Consulta de protocolo ------------------------------ */
  RA.views.protocolo = function (main, ctx) {
    const p = (ctx.params.p || '').trim();
    const user = RA.DB.usuarioAtual();
    const exemplos = RA.DB.manifestacoes().slice(-3).reverse().map((m) => m.protocolo);
    main.innerHTML = '<div class="container narrow"><h1 class="h2">Consultar protocolo</h1>' +
      '<p class="muted">Digite o número recebido ao registrar a manifestação. Não é preciso estar conectado.</p>' +
      '<form class="card card-pad row-form" id="f-prot" role="search"><div class="field grow"><label for="pt-in">Número do protocolo</label>' +
      '<input id="pt-in" class="input" placeholder="RA-2026-00001" value="' + esc(p) + '" autocomplete="off" spellcheck="false"></div>' +
      '<button class="btn btn-primary" type="submit">' + icon('search', 17) + 'Consultar</button></form>' +
      '<p class="muted">Para testar, use: ' + exemplos.map((x) => '<button type="button" class="chip-btn" data-ex="' + esc(x) + '">' + esc(x) + '</button>').join('') + '</p>' +
      '<div id="prot-res"></div></div>';
    const res = $('#prot-res', main);
    if (p) {
      const m = RA.DB.porProtocolo(p);
      if (!m) res.innerHTML = '<div class="card card-pad">' + UI.vazio('Protocolo não encontrado', 'Confira se o número está completo. O formato é RA-AAAA-NNNNN.') + '</div>';
      else {
        const tipo = RA.TIPOS[m.tipo];
        const visivel = tipo.publica || (user && (user.id === m.autorId || user.nivel === 'gestor'));
        const cat = RA.categoria(m.categoria);
        res.innerHTML = '<article class="card card-pad res-prot">' + UI.ticket(m) +
          '<div class="title-row"><h2 class="h3">' + (visivel ? esc(m.titulo) : esc(tipo.nome) + ' registrada') + '</h2>' + UI.statusBadge(m.status) + '</div>' +
          '<p class="meta"><span>' + icon('pin', 15) + esc(m.bairro) + '</span><span>' + icon('clock', 15) + 'Registrada em ' + UI.data(m.dataCriacao) + '</span><span class="chip">' + esc(cat.nome) + '</span><span class="chip chip-soft">' + esc(tipo.nome) + '</span></p>' +
          '<div class="prazo-line">' + UI.prazoBadge(m) + '<span class="muted">Encaminhada para ' + esc(m.orgao) + '</span></div>' +
          (visivel ? '<p class="pre">' + esc(m.descricao) + '</p>' : '<div class="note">' + icon('lock', 18) + '<p>O conteúdo de denúncias é restrito. Você vê apenas o andamento.</p></div>') +
          (m.resposta ? '<div class="resposta"><h3>' + icon('shield', 18) + 'Resposta oficial</h3><p class="pre">' + esc(m.resposta.texto) + '</p><p class="muted">' + esc(m.resposta.orgao) + ', ' + UI.dataHora(m.resposta.data) + '</p></div>' : '') +
          '<h3>Acompanhamento</h3>' + RA.linhaDoTempo(m) +
          (tipo.publica ? '<button type="button" class="btn btn-ghost" data-detalhe="' + m.id + '">' + icon('message', 16) + 'Ver comentários e apoios</button>' : '') + '</article>';
      }
    }
    $('#f-prot', main).addEventListener('submit', (e) => {
      e.preventDefault();
      const v = $('#pt-in', main).value.trim();
      location.hash = '#/protocolo' + (v ? '?p=' + encodeURIComponent(v) : '');
    });
    main.addEventListener('click', (e) => {
      const ex = e.target.closest('[data-ex]');
      if (ex) { location.hash = '#/protocolo?p=' + encodeURIComponent(ex.dataset.ex); }
    });
    RA.ligarCartoes(main, () => RA.remontar(main, (n) => RA.views.protocolo(n, ctx)));
    if (!p) $('#pt-in', main).focus();
  };
})();
