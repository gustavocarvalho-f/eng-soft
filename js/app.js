/* =========================================================================
   Resolve Aqui - roteador, cabeçalho, rodapé e preferências
   ========================================================================= */
(function () {
  'use strict';
  const RA = window.RA;
  const UI = RA.UI;
  const esc = UI.esc;
  const icon = UI.icon;
  const $ = UI.$;

  const ROTAS = {
    '': { v: 'inicio', t: 'Início' },
    entrar: { v: 'entrar', t: 'Entrar', semLogin: true },
    cadastro: { v: 'cadastro', t: 'Criar conta', semLogin: true },
    recuperar: { v: 'recuperar', t: 'Recuperar acesso', semLogin: true },
    protocolo: { v: 'protocolo', t: 'Consultar protocolo' },
    nova: { v: 'nova', t: 'Nova manifestação', niveis: ['cidadao'] },
    regiao: { v: 'regiao', t: 'Manifestações na região', niveis: ['cidadao'] },
    conta: { v: 'conta', t: 'Minha conta', niveis: ['cidadao'] },
    painel: { v: 'painel', t: 'Painel da ouvidoria', niveis: ['gestor'] },
    fila: { v: 'fila', t: 'Manifestações', niveis: ['gestor', 'vereador'] },
    relatorios: { v: 'relatorios', t: 'Relatórios', niveis: ['gestor', 'vereador'] },
    usuarios: { v: 'usuarios', t: 'Usuários', niveis: ['gestor'] },
    avaliacoes: { v: 'avaliacoes', t: 'Avaliações do protótipo', niveis: ['gestor'] },
    fiscalizacao: { v: 'fiscalizacao', t: 'Painel de fiscalização', niveis: ['vereador'] },
  };

  const NAV = {
    anonimo: [['', 'Início', 'home'], ['protocolo', 'Consultar protocolo', 'search'], ['entrar', 'Entrar', 'user'], ['cadastro', 'Criar conta', 'plus']],
    cidadao: [['nova', 'Nova manifestação', 'plus'], ['regiao', 'Na minha região', 'pin'], ['protocolo', 'Consultar protocolo', 'search'], ['conta', 'Minha conta', 'user']],
    gestor: [['painel', 'Painel', 'chart'], ['fila', 'Fila', 'list'], ['relatorios', 'Relatórios', 'file'], ['usuarios', 'Usuários', 'users'], ['avaliacoes', 'Avaliações', 'star']],
    vereador: [['fiscalizacao', 'Fiscalização', 'landmark'], ['fila', 'Manifestações', 'list'], ['relatorios', 'Relatórios', 'file']],
  };
  const PERFIL = { cidadao: 'Cidadão', gestor: 'Ouvidoria', vereador: 'Legislativo' };

  /* ------------------------------ Preferências ------------------------------ */
  const pref = {
    ler(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    gravar(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignora */ } },
  };
  function aplicarPreferencias() {
    const t = pref.ler('resolveaqui.tema');
    if (t === 'claro' || t === 'escuro') document.documentElement.setAttribute('data-theme', t === 'escuro' ? 'dark' : 'light');
    document.documentElement.setAttribute('data-fs', pref.ler('resolveaqui.fonte') || '0');
  }
  function temaEscuroAtivo() {
    const a = document.documentElement.getAttribute('data-theme');
    return a ? a === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  /* ------------------------------ Cabeçalho e rodapé ------------------------------ */
  const MARCA = '<svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true"><rect width="34" height="34" rx="9" fill="currentColor" opacity=".18"/><path d="M8 10.5A2.5 2.5 0 0 1 10.5 8h13A2.5 2.5 0 0 1 26 10.5v9a2.5 2.5 0 0 1-2.5 2.5H15l-5 4v-4h-.5A1.5 1.5 0 0 1 8 20.5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="m13 15.2 2.7 2.7 5.3-5.4" fill="none" stroke="#f2a516" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function caminhoAtual() { return location.hash.replace(/^#\/?/, '').split('?')[0]; }

  function renderCabecalho() {
    const user = RA.DB.usuarioAtual();
    const nav = NAV[user ? user.nivel : 'anonimo'];
    const atual = caminhoAtual();
    const naoLidas = user ? RA.DB.notificacoesDe(user.id).filter((n) => !n.lida).length : 0;
    $('#site-header').innerHTML = '<div class="container hdr-in"><a class="brand" href="#/" aria-label="Resolve Aqui, página inicial">' + MARCA +
      '<span class="brand-t"><strong>Resolve Aqui</strong><small>Ouvidoria digital de Itapetininga</small></span></a>' +
      '<nav class="nav" aria-label="Principal">' + nav.map((n) => '<a href="#/' + n[0] + '"' + (atual === n[0] ? ' aria-current="page"' : '') + '>' + icon(n[2], 17) + '<span>' + n[1] + '</span></a>').join('') + '</nav>' +
      '<div class="hdr-act">' +
      (user ? '<button type="button" class="icon-btn hd" id="hd-bell" aria-label="Notificações' + (naoLidas ? ', ' + naoLidas + ' novas' : '') + '">' + icon('bell', 19) + (naoLidas ? '<span class="dot-n">' + naoLidas + '</span>' : '') + '</button>' : '') +
      '<button type="button" class="icon-btn hd" id="hd-fonte" aria-label="Alterar tamanho do texto" data-tip="Tamanho do texto"><span class="aa" aria-hidden="true">Aa</span></button>' +
      '<button type="button" class="icon-btn hd" id="hd-tema" aria-label="' + (temaEscuroAtivo() ? 'Usar tema claro' : 'Usar tema escuro') + '">' + icon(temaEscuroAtivo() ? 'sun' : 'moon', 19) + '</button>' +
      (user ? '<div class="who"><span class="who-n">' + esc(user.nome.split(' ')[0]) + '<small>' + PERFIL[user.nivel] + '</small></span><button type="button" class="btn btn-onDark btn-sm" id="hd-sair">' + icon('logout', 16) + 'Sair</button></div>' : '') +
      '</div></div>';
  }
  RA.atualizarCabecalho = renderCabecalho;

  function renderRodape() {
    $('#site-footer').innerHTML = '<div class="container ftr-in"><p><strong>Protótipo acadêmico.</strong> Trabalho de graduação do curso de Análise e Desenvolvimento de Sistemas, Fatec Itapetininga. Todos os dados são fictícios e ficam apenas neste navegador.</p>' +
      '<div class="ftr-act"><button type="button" class="link-btn" id="ft-aval">Avaliar o protótipo</button><button type="button" class="link-btn" id="ft-sobre">Sobre o protótipo</button><button type="button" class="link-btn" id="ft-reset">Restaurar dados de demonstração</button></div></div>' +
      (RA.DB.persistiu() ? '' : '<p class="ftr-aviso container">O navegador bloqueou o armazenamento local. As alterações não serão mantidas ao recarregar.</p>');
  }

  document.addEventListener('click', async (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.id === 'hd-sair') { RA.DB.sair(); UI.toast('Você saiu da conta.', 'info'); location.hash = '#/'; renderCabecalho(); }
    else if (b.id === 'hd-bell') RA.abrirNotificacoes();
    else if (b.id === 'hd-tema') {
      const escuro = !temaEscuroAtivo();
      document.documentElement.setAttribute('data-theme', escuro ? 'dark' : 'light');
      pref.gravar('resolveaqui.tema', escuro ? 'escuro' : 'claro');
      renderCabecalho();
    } else if (b.id === 'hd-fonte') {
      const n = ((Number(document.documentElement.getAttribute('data-fs')) || 0) + 1) % 3;
      document.documentElement.setAttribute('data-fs', String(n));
      pref.gravar('resolveaqui.fonte', String(n));
      UI.toast('Tamanho do texto: ' + ['normal', 'grande', 'muito grande'][n] + '.', 'info');
    } else if (b.id === 'ft-aval') RA.abrirAvaliacao();
    else if (b.id === 'ft-sobre') abrirSobre();
    else if (b.id === 'ft-reset') {
      if (await UI.confirmar({ titulo: 'Restaurar dados de demonstração?', mensagem: 'Todas as manifestações, usuários e avaliações criados neste navegador serão apagados e os dados fictícios originais voltam.', ok: 'Restaurar', perigo: true })) {
        RA.DB.reiniciar();
        UI.toast('Dados de demonstração restaurados.', 'ok');
        if (caminhoAtual() === '') route(); else location.hash = '#/';
      }
    }
  });

  function abrirSobre() {
    UI.modal(UI.cabecalhoModal('Sobre o protótipo', 'Plataforma digital para ouvidoria e gestão de reclamações de serviços públicos municipais') + '<div class="modal-b">' +
      '<p>Este protótipo funcional apoia o trabalho de graduação de Gustavo Lepinsk Carvalho (Fatec Itapetininga). Ele junta o sistema Resolve Aqui, documentado em Engenharia de Software II, ao problema de pesquisa: <em>em que medida uma plataforma web que estrutura os relatos da população pode organizar as informações e subsidiar decisões da administração municipal e a fiscalização do Legislativo?</em></p>' +
      '<h3>Onde ver cada objetivo</h3><ul class="ticks">' +
      '<li><strong>Categorias de falhas e demandas:</strong> nove assuntos e cinco tipos de manifestação da Lei nº 13.460/2017, em Nova manifestação e no Painel.</li>' +
      '<li><strong>Registro, classificação, consulta e gerenciamento:</strong> Nova manifestação, Na minha região, Consultar protocolo e Fila de tratamento.</li>' +
      '<li><strong>Organização das informações:</strong> Painel da ouvidoria, Relatórios e pontos recorrentes com índice de prioridade.</li>' +
      '<li><strong>Subsídio à fiscalização:</strong> Painel de fiscalização do Legislativo, com prazos e respostas por órgão.</li>' +
      '<li><strong>Testes e validações:</strong> questionário de usabilidade em Avaliar o protótipo.</li></ul>' +
      '<h3>Limites do protótipo</h3><ul class="ticks"><li>Os dados ficam no localStorage do navegador. A versão final usaria um servidor e um banco SQL.</li>' +
      '<li>O e-mail de confirmação e o de recuperação são simulados na tela.</li><li>As senhas ficam sem criptografia, só para demonstração. Não use senhas reais.</li><li>A integração com o gov.br e a geolocalização por mapa não estão ativas.</li><li>Órgãos, bairros e números são ilustrativos.</li></ul></div>' +
      '<div class="modal-f"><button type="button" class="btn btn-primary" data-close>Entendi</button></div>', { size: 'lg', title: 'Sobre o protótipo' });
  }

  /* ------------------------------ Roteador ------------------------------ */
  function parse() {
    const h = location.hash.replace(/^#\/?/, '');
    const i = h.indexOf('?');
    const caminho = i >= 0 ? h.slice(0, i) : h;
    const params = {};
    new URLSearchParams(i >= 0 ? h.slice(i + 1) : '').forEach((v, k) => { params[k] = v; });
    return { caminho, params };
  }

  function route() {
    UI.fecharTodos();
    const { caminho, params } = parse();
    const def = ROTAS[caminho];
    const user = RA.DB.usuarioAtual();
    const main = $('#main');
    if (def) {
      if (def.niveis && !user) { UI.toast('Entre na sua conta para continuar.', 'info'); location.hash = '#/entrar'; return; }
      if (def.niveis && def.niveis.indexOf(user.nivel) < 0) { location.hash = RA.homeDoNivel(user.nivel); return; }
      if (def.semLogin && user) { location.hash = RA.homeDoNivel(user.nivel); return; }
    }
    main.innerHTML = '';
    const view = document.createElement('div');
    main.appendChild(view);
    if (!def) {
      view.innerHTML = '<div class="container narrow"><div class="card card-pad">' + UI.vazio('Página não encontrada', 'O endereço não existe neste protótipo.', '<a class="btn btn-primary" href="#/">Voltar ao início</a>') + '</div></div>';
      document.title = 'Página não encontrada | Resolve Aqui';
    } else {
      document.title = def.t + ' | Resolve Aqui';
      try { RA.views[def.v](view, { params, user }); }
      catch (err) {
        console.error(err);
        view.innerHTML = '<div class="container narrow"><div class="card card-pad">' + UI.vazio('Algo deu errado ao abrir esta tela', 'Recarregue a página. Se continuar, use "Restaurar dados de demonstração" no rodapé.') + '</div></div>';
      }
    }
    renderCabecalho();
    window.scrollTo(0, 0);
    main.focus({ preventScroll: true });
  }

  window.addEventListener('hashchange', route);
  document.addEventListener('DOMContentLoaded', () => {
    RA.DB.iniciar();
    aplicarPreferencias();
    renderRodape();
    route();
  });
})();
