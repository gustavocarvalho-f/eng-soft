/* =========================================================================
   Resolve Aqui - blocos compartilhados entre os perfis
   (filtros de lista, cartão de manifestação, janela de detalhes, notificações)
   ========================================================================= */
(function () {
  'use strict';
  const RA = window.RA;
  const UI = RA.UI;
  const esc = UI.esc;
  const icon = UI.icon;

  const sem = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  RA.sem = sem;

  /* Filtra e ordena uma lista de manifestações */
  RA.filtrar = function (list, f) {
    let r = list;
    if (f.q) {
      const q = sem(f.q);
      r = r.filter((m) => sem(m.titulo + ' ' + m.descricao + ' ' + m.protocolo + ' ' + m.endereco + ' ' + m.bairro).includes(q));
    }
    if (f.bairro) r = r.filter((m) => m.bairro === f.bairro);
    if (f.categoria) r = r.filter((m) => m.categoria === f.categoria);
    if (f.status === 'pendente') r = r.filter((m) => m.status !== 'concluida');
    else if (f.status) r = r.filter((m) => m.status === f.status);
    if (f.tipo) r = r.filter((m) => m.tipo === f.tipo);
    if (f.orgao) r = r.filter((m) => m.orgao === f.orgao);
    if (f.atrasadas) r = r.filter((m) => m.status !== 'concluida' && RA.prazo(m).vencido);
    r = r.slice();
    const t = (m) => new Date(m.dataCriacao).getTime();
    if (f.ordem === 'apoios') r.sort((a, b) => RA.Stats.apoios(b) - RA.Stats.apoios(a) || t(b) - t(a));
    else if (f.ordem === 'antigas') r.sort((a, b) => t(a) - t(b));
    else r.sort((a, b) => t(b) - t(a));
    return r;
  };

  /* Cartão usado na lista pública da região */
  RA.cartaoManifestacao = function (m, user) {
    const cat = RA.categoria(m.categoria);
    const apoios = RA.Stats.apoios(m);
    const apoiei = user && m.apoios.indexOf(user.id) >= 0;
    const meu = user && user.id === m.autorId;
    return '<article class="card mcard">' +
      '<div class="mcard-top"><h3>' + esc(m.titulo) + '</h3>' + UI.statusBadge(m.status) + '</div>' +
      '<p class="meta"><span>' + icon('pin', 15) + esc(m.bairro) + '</span><span>' + icon('clock', 15) + UI.data(m.dataCriacao) + '</span><span class="chip">' + esc(cat.nome) + '</span>' +
      (m.tipo !== 'reclamacao' ? '<span class="chip chip-soft">' + esc(RA.TIPOS[m.tipo].nome) + '</span>' : '') + (meu ? '<span class="chip chip-me">Sua manifestação</span>' : '') + '</p>' +
      '<p class="mcard-desc">' + esc(m.descricao) + '</p>' +
      '<div class="mcard-act">' +
      '<button type="button" class="btn btn-primary btn-sm" data-detalhe="' + m.id + '">' + icon('eye', 16) + 'Ver detalhes</button>' +
      '<button type="button" class="btn btn-ghost btn-sm' + (apoiei ? ' is-on' : '') + '" data-apoiar="' + m.id + '" aria-pressed="' + (apoiei ? 'true' : 'false') + '">' + icon('thumb', 16) + (apoiei ? 'Apoiado' : 'Apoiar') + ' (' + apoios + ')</button>' +
      '<span class="mcard-n">' + icon('message', 15) + m.comentarios.length + '</span></div></article>';
  };

  /* Lista de passos do acompanhamento */
  RA.linhaDoTempo = function (m) {
    const itens = m.historico.slice().sort((a, b) => new Date(a.data) - new Date(b.data));
    return '<ol class="timeline">' + itens.map((h, i) => '<li class="tl-' + h.status + (i === itens.length - 1 ? ' is-last' : '') + '"><span class="tl-dot" aria-hidden="true"></span>' +
      '<div><strong>' + esc(h.texto) + '</strong><span class="muted">' + UI.dataHora(h.data) + '</span></div></li>').join('') + '</ol>';
  };

  /* ------------------------------ Janela de detalhes ------------------------------ */
  function corpo(m, ctx) {
    const user = ctx.user;
    const modo = ctx.modo;
    const tipo = RA.TIPOS[m.tipo];
    const cat = RA.categoria(m.categoria);
    const dono = user && user.id === m.autorId;
    const visivel = tipo.publica || dono || modo === 'gestor';
    const autor = RA.nomeAutor(m, modo === 'gestor' ? 'gestor' : 'publica');
    const apoios = RA.Stats.apoios(m);
    const apoiei = user && m.apoios.indexOf(user.id) >= 0;
    const podeApoiar = user && user.nivel === 'cidadao' && !dono && tipo.publica && m.status !== 'concluida';
    const podeComentar = user && user.nivel !== 'vereador' && tipo.publica;

    let h = '<div class="modal-h"><div><div class="title-row"><h2>' + esc(m.titulo) + '</h2>' + UI.statusBadge(m.status) + '</div>' +
      '<p class="meta"><span>' + icon('pin', 15) + esc(m.bairro) + '</span><span>' + icon('clock', 15) + UI.data(m.dataCriacao) + '</span>' +
      '<span class="chip">' + esc(cat.nome) + '</span><span class="chip chip-soft">' + esc(tipo.nome) + '</span></p></div>' +
      '<button type="button" class="icon-btn" data-close aria-label="Fechar">' + icon('x', 20) + '</button></div><div class="modal-b">';

    h += UI.ticket(m);
    h += '<div class="prazo-line">' + UI.prazoBadge(m) + '<span class="muted">Encaminhada para ' + esc(m.orgao) + '</span></div>';

    if (!visivel) {
      h += '<div class="note">' + icon('lock', 18) + '<p>O conteúdo desta ' + esc(tipo.nome.toLowerCase()) + ' é restrito ao autor e à ouvidoria. Aqui aparecem apenas o andamento e a resposta.</p></div>';
    } else {
      h += '<h3>Descrição do problema</h3><p class="pre">' + esc(m.descricao) + '</p>';
      if (m.endereco) h += '<p class="muted">' + icon('pin', 14) + ' ' + esc(m.endereco) + '</p>';
      h += '<p class="muted">Registrada por ' + esc(autor) + '</p>';
      if (m.anexos.length) {
        h += '<h3>' + icon('image', 18) + 'Anexos (' + m.anexos.length + ')</h3><div class="anexos">' + m.anexos.map((a) => a.dataUrl
          ? '<figure class="anexo"><img src="' + a.dataUrl + '" alt="Anexo: ' + esc(a.nome) + '"><figcaption>' + esc(a.nome) + '</figcaption></figure>'
          : '<figure class="anexo anexo-vazio">' + icon('image', 28) + '<figcaption>' + esc(a.nome) + '</figcaption></figure>').join('') + '</div>';
      }
    }

    if (tipo.publica) {
      h += '<div class="stats3"><div class="stat s-blue">' + icon('thumb', 18) + '<span>Apoios</span><strong>' + apoios + '</strong></div>' +
        '<div class="stat s-violet">' + icon('message', 18) + '<span>Comentários</span><strong>' + m.comentarios.length + '</strong></div>' +
        '<div class="stat s-green">' + icon('eye', 18) + '<span>Visualizações</span><strong>' + m.visualizacoes + '</strong></div></div>';
    }

    if (m.resposta) {
      h += '<div class="resposta"><h3>' + icon('shield', 18) + 'Resposta oficial</h3><p class="pre">' + esc(m.resposta.texto) + '</p>' +
        '<p class="muted">' + esc(m.resposta.orgao) + ', ' + UI.dataHora(m.resposta.data) + '</p></div>';
    }

    h += '<h3>Acompanhamento</h3>' + RA.linhaDoTempo(m);

    if (modo === 'gestor') {
      const autorU = RA.DB.usuario(m.autorId);
      h += '<form class="painel-trat" data-form="tratar"><h3>' + icon('edit', 18) + 'Tratamento pela ouvidoria</h3>' +
        (autorU ? '<p class="muted">Autor: ' + esc(autorU.nome) + ', ' + esc(autorU.email) + (autorU.telefone ? ', ' + esc(autorU.telefone) : '') + '</p>' : '') +
        '<div class="grid-2"><div class="field"><label for="tr-status">Situação</label><select id="tr-status" class="input">' +
        Object.keys(RA.STATUS).map((k) => '<option value="' + k + '"' + (k === m.status ? ' selected' : '') + '>' + RA.STATUS[k].nome + '</option>').join('') + '</select></div>' +
        '<div class="field"><label for="tr-orgao">Órgão responsável</label><select id="tr-orgao" class="input">' + UI.opcoes(RA.ORGAOS, m.orgao) + '</select></div></div>' +
        '<div class="field"><label for="tr-resp">Resposta ao cidadão</label><textarea id="tr-resp" class="input" rows="3" maxlength="1000" placeholder="Descreva a providência adotada. O autor será notificado.">' + esc(m.resposta ? m.resposta.texto : '') + '</textarea>' +
        '<p class="hint">Obrigatória para concluir a manifestação.</p></div>' +
        '<button type="submit" class="btn btn-primary">' + icon('check', 16) + 'Salvar tratamento</button></form>';
    }

    if (tipo.publica) {
      h += '<h3>' + icon('message', 18) + 'Comentários (' + m.comentarios.length + ')</h3>';
      if (!m.comentarios.length) h += '<p class="muted">Ainda não há comentários.</p>';
      else {
        h += '<ul class="comentarios">' + m.comentarios.map((c) => {
          const u = RA.DB.usuario(c.usuarioId);
          const nome = RA.nomePublico(u);
          const novo = Date.now() - new Date(c.data).getTime() < 2 * 864e5;
          return '<li>' + UI.avatar(nome) + '<div><p class="c-nome"><strong>' + esc(nome) + '</strong>' + (novo ? '<span class="chip chip-new">Recente</span>' : '') + '<span class="muted">' + UI.dataHora(c.data) + '</span></p><p>' + esc(c.texto) + '</p></div></li>';
        }).join('') + '</ul>';
      }
      if (podeComentar) {
        h += '<form class="field cform" data-form="comentar"><label for="cm-texto">Adicionar seu comentário</label>' +
          '<textarea id="cm-texto" class="input" rows="3" maxlength="500" placeholder="Compartilhe sua opinião ou informações adicionais."></textarea>' +
          '<div class="row-between"><span class="hint" id="cm-cont"></span><button type="submit" class="btn btn-primary btn-sm">' + icon('send', 15) + 'Enviar comentário</button></div></form>';
      } else if (!user) {
        h += '<p class="muted"><a href="#/entrar">Entre na sua conta</a> para comentar e apoiar.</p>';
      }
    }

    h += '</div><div class="modal-f">';
    if (podeApoiar) h += '<button type="button" class="btn btn-primary' + (apoiei ? ' is-on' : '') + '" data-act="apoiar" aria-pressed="' + (apoiei ? 'true' : 'false') + '">' + icon('thumb', 16) + (apoiei ? 'Você apoiou esta manifestação' : 'Apoiar esta manifestação') + '</button>';
    h += '<button type="button" class="btn btn-ghost" data-close>Fechar</button></div>';
    if (podeApoiar) h += '<p class="modal-note">Ao apoiar, você mostra que o problema também afeta você.</p>';
    return h;
  }

  /* modo: 'cidadao' | 'gestor' | 'leitura' (Legislativo). aoMudar: avisa a tela de fundo para atualizar. */
  RA.abrirDetalhe = function (id, opt) {
    opt = opt || {};
    const user = RA.DB.usuarioAtual();
    const m0 = RA.DB.manifestacao(id);
    if (!m0) { UI.toast('Manifestação não encontrada.', 'erro'); return null; }
    const modo = opt.modo || (user && user.nivel === 'gestor' ? 'gestor' : user && user.nivel === 'vereador' ? 'leitura' : 'cidadao');
    RA.DB.visualizar(m0.id);
    const ctx = { user, modo };
    const h = UI.modal(corpo(RA.DB.manifestacao(id), ctx), { size: 'lg', title: m0.titulo, aoFechar: opt.aoMudar });

    function redesenhar(foco) {
      const m = RA.DB.manifestacao(id);
      if (!m) { h.close(); return; }
      const rolagem = h.el.scrollTop;
      h.render(corpo(m, ctx));
      ligarContador();
      h.el.scrollTop = rolagem;
      if (foco) { const el = h.el.querySelector(foco); if (el) el.focus(); }
    }
    function ligarContador() {
      const ta = h.el.querySelector('#cm-texto');
      if (ta) UI.contador(ta, h.el.querySelector('#cm-cont'), 0, 500);
    }
    ligarContador();

    h.el.addEventListener('click', (e) => {
      const b = e.target.closest('[data-act="apoiar"]');
      if (!b) return;
      const r = RA.DB.alternarApoio(id, user);
      UI.toast(r.apoiou ? 'Apoio registrado.' : 'Apoio removido.', 'ok');
      redesenhar('[data-act="apoiar"]');
    });
    h.el.addEventListener('submit', (e) => {
      const form = e.target.closest('form');
      if (!form) return;
      e.preventDefault();
      if (form.dataset.form === 'comentar') {
        const ta = form.querySelector('textarea');
        UI.limparErros(form);
        const r = RA.DB.comentar(id, ta.value, user);
        if (!r.ok) { UI.erro(ta, r.erro); return; }
        UI.toast('Comentário enviado.', 'ok');
        redesenhar('#cm-texto');
      } else if (form.dataset.form === 'tratar') {
        UI.limparErros(form);
        const r = RA.DB.tratar(id, {
          status: form.querySelector('#tr-status').value,
          orgao: form.querySelector('#tr-orgao').value,
          resposta: form.querySelector('#tr-resp').value,
        }, user);
        if (!r.ok) {
          if (r.campo === 'resposta') UI.erro(form.querySelector('#tr-resp'), r.erro); else UI.toast(r.erro, 'info');
          return;
        }
        UI.toast('Tratamento salvo. O autor foi notificado.', 'ok');
        redesenhar();
        if (RA.atualizarCabecalho) RA.atualizarCabecalho();
      }
    });
    return h;
  };

  /* Delegação global: qualquer [data-detalhe] abre a janela; [data-apoiar] alterna o apoio no cartão */
  RA.ligarCartoes = function (raiz, aoMudar) {
    raiz.addEventListener('click', (e) => {
      const d = e.target.closest('[data-detalhe]');
      if (d) { RA.abrirDetalhe(Number(d.dataset.detalhe), { aoMudar }); return; }
      const a = e.target.closest('[data-apoiar]');
      if (a) {
        const user = RA.DB.usuarioAtual();
        if (!user) { UI.toast('Entre na sua conta para apoiar.', 'info'); location.hash = '#/entrar'; return; }
        if (user.nivel !== 'cidadao') { UI.toast('Apenas cidadãos podem apoiar manifestações.', 'info'); return; }
        const m = RA.DB.manifestacao(Number(a.dataset.apoiar));
        if (m.autorId === user.id) { UI.toast('Você não pode apoiar a sua própria manifestação.', 'info'); return; }
        if (m.status === 'concluida') { UI.toast('Esta manifestação já foi concluída.', 'info'); return; }
        const r = RA.DB.alternarApoio(m.id, user);
        UI.toast(r.apoiou ? 'Apoio registrado.' : 'Apoio removido.', 'ok');
        if (aoMudar) aoMudar();
      }
    });
  };

  /* ------------------------------ Notificações ------------------------------ */
  RA.abrirNotificacoes = function () {
    const user = RA.DB.usuarioAtual();
    if (!user) return;
    const lista = RA.DB.notificacoesDe(user.id);
    const h = UI.modal(UI.cabecalhoModal('Notificações', lista.length ? '' : 'Nada por aqui ainda.') +
      '<div class="modal-b">' + (lista.length ? '<ul class="notifs">' + lista.map((n) => '<li class="' + (n.lida ? '' : 'nova') + '">' +
        '<span class="n-ico">' + icon('bell', 16) + '</span><div><p>' + esc(n.texto) + '</p><span class="muted">' + UI.dataHora(n.data) + '</span></div>' +
        (n.manifestacaoId && RA.DB.manifestacao(n.manifestacaoId) ? '<button type="button" class="btn btn-ghost btn-sm" data-notif="' + n.manifestacaoId + '">Abrir</button>' : '') + '</li>').join('') + '</ul>'
        : UI.vazio('Sem notificações', 'Quando a ouvidoria atualizar uma manifestação sua, o aviso aparece aqui.')) + '</div>', { size: 'md', title: 'Notificações' });
    RA.DB.marcarLidas(user.id);
    if (RA.atualizarCabecalho) RA.atualizarCabecalho();
    h.el.addEventListener('click', (e) => {
      const b = e.target.closest('[data-notif]');
      if (b) { h.close(); RA.abrirDetalhe(Number(b.dataset.notif)); }
    });
  };
})();
