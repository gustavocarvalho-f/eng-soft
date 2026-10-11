/* =========================================================================
   Resolve Aqui - telas da ouvidoria (gestor) e do Legislativo (vereador)
   Painel, fila de tratamento, relatórios (UC12), usuários (UC13 a UC15),
   avaliações do protótipo e painel de fiscalização.
   ========================================================================= */
(function () {
  'use strict';
  const RA = window.RA;
  const UI = RA.UI;
  const esc = UI.esc;
  const icon = UI.icon;
  const $ = UI.$;
  RA.views = RA.views || {};

  const PERIODOS = [[0, 'Todo o período'], [30, 'Últimos 30 dias'], [90, 'Últimos 90 dias'], [180, 'Últimos 180 dias']];
  const optPeriodo = (sel) => PERIODOS.map((p) => '<option value="' + p[0] + '"' + (Number(sel) === p[0] ? ' selected' : '') + '>' + p[1] + '</option>').join('');
  const nomePeriodo = (n) => (PERIODOS.find((p) => p[0] === Number(n)) || PERIODOS[0])[1];

  const link = (rota, params) => '#/' + rota + '?' + Object.keys(params).filter((k) => params[k]).map((k) => k + '=' + encodeURIComponent(params[k])).join('&');
  const chipTaxa = (x) => '<span class="rate ' + (x >= 0.7 ? 'rt-ok' : x >= 0.5 ? 'rt-mid' : 'rt-low') + '">' + UI.pct(x) + '</span>';
  const tempo = (d) => (d == null ? '-' : UI.dec(d) + ' d');

  function tabela(cols, linhas, classe) {
    return '<div class="tbl-wrap"><table class="tbl ' + (classe || '') + '"><thead><tr>' + cols.map((c) => '<th scope="col"' + (c.num ? ' class="num"' : '') + '>' + esc(c.t) + '</th>').join('') + '</tr></thead><tbody>' +
      linhas.map((l) => '<tr>' + l.map((c, i) => (i === 0 ? '<th scope="row">' + c + '</th>' : '<td' + (cols[i] && cols[i].num ? ' class="num"' : '') + '>' + c + '</td>')).join('') + '</tr>').join('') + '</tbody></table></div>';
  }
  const colsGrupo = (rot) => [{ t: rot }, { t: 'Total', num: 1 }, { t: 'Abertas', num: 1 }, { t: 'Em análise', num: 1 }, { t: 'Em andamento', num: 1 }, { t: 'Concluídas', num: 1 }, { t: 'Taxa', num: 1 }, { t: 'Tempo médio', num: 1 }];
  const linhaGrupo = (g) => [esc(g.nome), UI.num(g.total), g.aberta, g.analise, g.andamento, g.concluida, chipTaxa(g.taxa), tempo(g.mediaDias)];

  const tabelaRecorrentes = (rec, comLink) => tabela(
    [{ t: 'Assunto' }, { t: 'Bairro' }, { t: 'Pendentes', num: 1 }, { t: 'Apoios', num: 1 }, { t: 'Mais antiga', num: 1 }, { t: 'Órgão responsável' }, { t: 'Índice', num: 1 }].concat(comLink ? [{ t: '' }] : []),
    rec.map((r) => [esc(RA.categoria(r.categoria).nome), esc(r.bairro), r.qtd, r.apoios, r.maisAntiga + ' d', esc(r.orgao), '<strong>' + UI.dec(r.indice) + '</strong>']
      .concat(comLink ? ['<a class="btn btn-ghost btn-sm" href="' + link('fila', { categoria: r.categoria, bairro: r.bairro, status: 'pendente' }) + '">Ver</a>'] : [])));

  const AVISO_INDICE = '<details class="como"><summary>Como o índice é calculado</summary><p>Cada manifestação pendente vale 1 ponto. Somam-se 0,25 por apoio de cidadão e até 2 pontos pelo tempo de espera (limite de 60 dias). O índice ajuda a ordenar a análise, mas não substitui os estudos técnicos, o orçamento disponível e os critérios legais da decisão administrativa.</p></details>';

  /* ------------------------------ Painel (gestor) ------------------------------ */
  const estadoPainel = { periodo: 0 };
  RA.views.painel = function (main) {
    const todas = RA.DB.manifestacoes();
    const base = RA.Stats.periodo(todas, estadoPainel.periodo);
    const r = RA.Stats.resumo(base);
    const v = RA.Stats.variacao(todas, estadoPainel.periodo);
    const cats = RA.Stats.porCategoria(base);
    const bairros = RA.Stats.porBairro(base).slice(0, 8);
    const orgaos = RA.Stats.porOrgao(base).sort((a, b) => b.pendentes - a.pendentes);
    const rec = RA.Stats.recorrentes(base, 2).slice(0, 6);
    const user = RA.DB.usuarioAtual();

    main.innerHTML = '<div class="container"><div class="page-head row-between"><div><h1 class="h2">Painel da ouvidoria</h1><p class="muted">Olá, ' + esc(user.nome.split(' ')[0]) + '. Veja onde estão os problemas e o que precisa de resposta.</p></div>' +
      '<div class="field inline"><label for="pn-per">Período</label><select id="pn-per" class="input">' + optPeriodo(estadoPainel.periodo) + '</select></div></div>' +
      '<div class="kpis kpis-6">' +
      UI.kpi({ rotulo: 'Recebidas', valor: UI.num(r.total), icone: 'message', dica: v == null ? 'No período selecionado' : (v >= 0 ? '+' : '') + v + '% contra o período anterior' }) +
      UI.kpi({ rotulo: 'Pendentes', valor: UI.num(r.pendentes), icone: 'alert', tom: 'bad', dica: r.aberta + ' abertas e ' + r.analise + ' em análise' }) +
      UI.kpi({ rotulo: 'Em andamento', valor: UI.num(r.andamento), icone: 'clock', tom: 'warn', dica: 'Com o órgão responsável' }) +
      UI.kpi({ rotulo: 'Concluídas', valor: UI.num(r.concluida), icone: 'check', tom: 'ok', dica: UI.pct(r.taxa) + ' do total' }) +
      UI.kpi({ rotulo: 'Tempo médio', valor: r.mediaDias == null ? '-' : UI.dec(r.mediaDias) + ' dias', icone: 'trend', dica: r.foraPrazo + ' concluídas fora do prazo' }) +
      '<a class="kpi kpi-link' + (r.atrasadas ? ' kpi-bad' : '') + '" href="' + link('fila', { atrasadas: 1 }) + '"><div class="kpi-top"><span class="kpi-l">Prazo vencido</span>' + icon('clock', 18) + '</div><div class="kpi-v">' + UI.num(r.atrasadas) + '</div><div class="kpi-h">Pendentes há mais de ' + RA.PRAZO_DIAS + ' dias. Ver fila</div></a>' +
      '</div>' +
      '<div class="grid-2 gap-lg"><section class="card card-pad"><h2 class="h3">Manifestações por assunto</h2>' + UI.barrasStatus(cats) +
      '<details class="como"><summary>Ver como tabela</summary>' + tabela(colsGrupo('Assunto'), cats.map(linhaGrupo)) + '</details></section>' +
      '<section class="card card-pad"><h2 class="h3">Bairros com mais registros</h2>' + UI.barras(bairros.map((b) => ({ nome: b.nome, valor: b.total, tip: b.nome + ': ' + b.total + ' registros, ' + b.pendentes + ' pendentes' }))) + '</section></div>' +
      '<section class="card card-pad"><h2 class="h3">Volume mensal</h2>' + UI.colunasMes(RA.Stats.porMes(todas, 8)) + '</section>' +
      '<section class="card card-pad"><div class="row-between"><div><h2 class="h3">Prioridades sugeridas</h2><p class="muted">Assuntos que se repetem no mesmo bairro e ainda estão pendentes.</p></div></div>' +
      (rec.length ? tabelaRecorrentes(rec, true) : UI.vazio('Sem pontos recorrentes', 'Nenhum assunto se repete no mesmo bairro neste período.')) + AVISO_INDICE + '</section>' +
      '<section class="card card-pad"><h2 class="h3">Pendências por órgão responsável</h2>' + tabela([{ t: 'Órgão' }, { t: 'Recebidas', num: 1 }, { t: 'Pendentes', num: 1 }, { t: 'Prazo vencido', num: 1 }, { t: 'Taxa de conclusão', num: 1 }],
        orgaos.map((o) => [esc(o.nome), o.total, o.pendentes, o.atrasadas ? '<strong class="txt-bad">' + o.atrasadas + '</strong>' : '0', chipTaxa(o.taxa)])) + '</section></div>';

    $('#pn-per', main).addEventListener('change', (e) => { estadoPainel.periodo = Number(e.target.value); RA.remontar(main, RA.views.painel); });
  };

  /* ------------------------------ Fila / lista (gestor e Legislativo) ------------------------------ */
  const estadoFila = { q: '', bairro: '', categoria: '', status: '', orgao: '', atrasadas: false, ordem: 'antigas', limite: 25 };

  function csvManifestacoes(lista) {
    const cab = ['Protocolo', 'Tipo', 'Assunto', 'Título', 'Bairro', 'Órgão responsável', 'Situação', 'Registrada em', 'Concluída em', 'Dias até concluir', 'Prazo', 'Apoios', 'Comentários'];
    const linhas = lista.map((m) => [m.protocolo, RA.TIPOS[m.tipo].nome, RA.categoria(m.categoria).nome, m.titulo, m.bairro, m.orgao, RA.STATUS[m.status].nome, UI.data(m.dataCriacao),
      m.dataConclusao ? UI.data(m.dataConclusao) : '', m.dataConclusao ? Math.round(RA.dias(m.dataCriacao, m.dataConclusao)) : '', RA.prazo(m).texto, RA.Stats.apoios(m), m.comentarios.length]);
    return UI.csv([cab].concat(linhas));
  }

  RA.views.fila = function (main, ctx) {
    const user = RA.DB.usuarioAtual();
    const gestor = user.nivel === 'gestor';
    const e = estadoFila;
    const p = ctx.params;
    if (Object.keys(p).length) {
      Object.assign(e, { q: '', bairro: p.bairro || '', categoria: p.categoria || '', status: p.status || '', orgao: p.orgao || '', atrasadas: p.atrasadas === '1', limite: 25 });
      history.replaceState(null, '', '#/fila');
    }

    main.innerHTML = '<div class="container"><div class="page-head row-between"><div><h1 class="h2">' + (gestor ? 'Fila de tratamento' : 'Manifestações registradas') + '</h1>' +
      '<p class="muted">' + (gestor ? 'Abra uma manifestação para alterar a situação, encaminhar ao órgão e responder ao cidadão.' : 'Consulta somente leitura. Dados pessoais e denúncias não são exibidos.') + '</p></div>' +
      '<button type="button" class="btn btn-ghost" id="fl-csv">' + icon('download', 16) + 'Exportar CSV</button></div>' +
      '<form class="filters card" id="f-fila" role="search"><div class="field grow"><label for="fl-q">Buscar</label><input id="fl-q" class="input" type="search" placeholder="Título, protocolo, rua..." value="' + esc(e.q) + '"></div>' +
      '<div class="field"><label for="fl-st">Situação</label><select id="fl-st" class="input"><option value="">Todas</option><option value="pendente"' + (e.status === 'pendente' ? ' selected' : '') + '>Pendentes</option>' + Object.keys(RA.STATUS).map((k) => '<option value="' + k + '"' + (e.status === k ? ' selected' : '') + '>' + RA.STATUS[k].nome + '</option>').join('') + '</select></div>' +
      '<div class="field"><label for="fl-cat">Assunto</label><select id="fl-cat" class="input">' + UI.opcoes(RA.CATEGORIAS, e.categoria, 'Todos') + '</select></div>' +
      '<div class="field"><label for="fl-bairro">Bairro</label><select id="fl-bairro" class="input">' + UI.opcoes(RA.BAIRROS, e.bairro, 'Todos') + '</select></div>' +
      '<div class="field"><label for="fl-org">Órgão</label><select id="fl-org" class="input">' + UI.opcoes(RA.ORGAOS, e.orgao, 'Todos') + '</select></div>' +
      '<div class="field"><label for="fl-ord">Ordem</label><select id="fl-ord" class="input"><option value="antigas"' + (e.ordem === 'antigas' ? ' selected' : '') + '>Mais antigas primeiro</option><option value="recentes"' + (e.ordem === 'recentes' ? ' selected' : '') + '>Mais recentes primeiro</option><option value="apoios"' + (e.ordem === 'apoios' ? ' selected' : '') + '>Mais apoiadas</option></select></div>' +
      '<label class="check inline"><input type="checkbox" id="fl-atr"' + (e.atrasadas ? ' checked' : '') + '><span>Só com prazo vencido</span></label></form>' +
      '<p class="result-line" id="fl-resumo" aria-live="polite"></p><div id="fl-lista"></div><div class="center" id="fl-mais"></div></div>';

    let atual = [];
    function pintar() {
      atual = RA.filtrar(RA.DB.manifestacoes(), e);
      $('#fl-resumo', main).innerHTML = '<strong>' + atual.length + '</strong> ' + (atual.length === 1 ? 'manifestação' : 'manifestações') + (e.atrasadas ? ' com prazo vencido' : '') + '.';
      const vis = atual.slice(0, e.limite);
      $('#fl-lista', main).innerHTML = vis.length ? tabela([{ t: 'Protocolo' }, { t: 'Manifestação' }, { t: 'Assunto' }, { t: 'Bairro' }, { t: 'Situação' }, { t: 'Prazo' }, { t: 'Apoios', num: 1 }],
        vis.map((m) => [
          '<span class="mono">' + esc(m.protocolo) + '</span>',
          '<button type="button" class="link-btn" data-detalhe="' + m.id + '">' + esc(m.titulo) + '</button>' + (RA.TIPOS[m.tipo].publica ? '' : ' <span class="chip chip-soft">Denúncia</span>'),
          esc(RA.categoria(m.categoria).nome), esc(m.bairro), UI.statusBadge(m.status), UI.prazoBadge(m), RA.Stats.apoios(m)]), 'tbl-fila') :
        UI.vazio('Nada por aqui', 'Nenhuma manifestação corresponde aos filtros.');
      $('#fl-mais', main).innerHTML = atual.length > vis.length ? '<button type="button" class="btn btn-ghost" id="bt-mais">Mostrar mais (' + (atual.length - vis.length) + ')</button>' : '';
    }
    pintar();

    const f = $('#f-fila', main);
    f.addEventListener('submit', (ev) => ev.preventDefault());
    const mapa = { 'fl-q': 'q', 'fl-st': 'status', 'fl-cat': 'categoria', 'fl-bairro': 'bairro', 'fl-org': 'orgao', 'fl-ord': 'ordem' };
    const lento = UI.debounce(pintar, 200);
    f.addEventListener('input', (ev) => {
      if (ev.target.id === 'fl-atr') { e.atrasadas = ev.target.checked; e.limite = 25; pintar(); return; }
      const k = mapa[ev.target.id];
      if (k) { e[k] = ev.target.value; e.limite = 25; lento(); }
    });
    main.addEventListener('click', (ev) => { if (ev.target.closest('#bt-mais')) { e.limite += 25; pintar(); } });
    $('#fl-csv', main).addEventListener('click', () => {
      UI.baixar('manifestacoes-' + new Date().toISOString().slice(0, 10) + '.csv', csvManifestacoes(atual), 'text/csv;charset=utf-8');
      UI.toast('CSV com ' + atual.length + ' manifestações gerado.', 'ok');
    });
    RA.ligarCartoes(main, pintar);
  };

  /* ------------------------------ Relatórios (UC12) ------------------------------ */
  const TIPOS_REL = {
    categoria: 'Por assunto', bairro: 'Por bairro', status: 'Por situação', orgao: 'Por órgão responsável', tipo: 'Por tipo de manifestação', mensal: 'Evolução mensal',
  };
  const estadoRel = { tipo: 'categoria', periodo: 90, categoria: '', formato: 'pdf' };

  function montarRelatorio(cfg) {
    let base = RA.Stats.periodo(RA.DB.manifestacoes(), cfg.periodo);
    if (cfg.categoria) base = base.filter((m) => m.categoria === cfg.categoria);
    const resumo = RA.Stats.resumo(base);
    let grupos = null; let meses = null;
    if (cfg.tipo === 'categoria') grupos = RA.Stats.porCategoria(base);
    else if (cfg.tipo === 'bairro') grupos = RA.Stats.porBairro(base);
    else if (cfg.tipo === 'status') grupos = RA.Stats.porStatus(base);
    else if (cfg.tipo === 'orgao') grupos = RA.Stats.porOrgao(base);
    else if (cfg.tipo === 'tipo') grupos = RA.Stats.porTipo(base);
    else meses = RA.Stats.porMes(base, 12);
    const concluidas = base.filter((m) => m.status === 'concluida');
    return {
      cfg, base, resumo, grupos, meses,
      rec: RA.Stats.recorrentes(base, 2).slice(0, 5),
      insights: RA.Stats.insights(base),
      providencias: {
        respostas: base.filter((m) => m.resposta).length,
        encaminhadas: base.filter((m) => m.status === 'andamento' || m.status === 'concluida').length,
        noPrazo: concluidas.length - resumo.foraPrazo, fora: resumo.foraPrazo,
      },
    };
  }

  function htmlRelatorio(rel, impressao) {
    const { cfg, resumo: r } = rel;
    let h = '<div class="rel">' + (impressao ? '<header class="rel-cab"><strong>Ouvidoria Municipal de Itapetininga/SP</strong><span>Relatório de gestão de manifestações</span></header>' : '') +
      '<p class="muted">' + esc(TIPOS_REL[cfg.tipo]) + ', ' + esc(nomePeriodo(cfg.periodo).toLowerCase()) + (cfg.categoria ? ', assunto: ' + esc(RA.categoria(cfg.categoria).nome) : '') + '. Gerado em ' + UI.dataHora(new Date().toISOString()) + '.</p>' +
      '<h3>Resumo executivo</h3><div class="kpis kpis-4">' +
      UI.kpi({ rotulo: 'Total', valor: UI.num(r.total), icone: 'message' }) +
      UI.kpi({ rotulo: 'Abertas e em análise', valor: UI.num(r.aberta + r.analise), tom: 'bad', icone: 'alert' }) +
      UI.kpi({ rotulo: 'Em andamento', valor: UI.num(r.andamento), tom: 'warn', icone: 'clock' }) +
      UI.kpi({ rotulo: 'Concluídas', valor: UI.num(r.concluida), tom: 'ok', icone: 'check', dica: UI.pct(r.taxa) + ' do total' }) + '</div>';
    if (rel.meses) {
      h += '<h3>Evolução mensal</h3>' + UI.colunasMes(rel.meses) + '<h3>Dados detalhados</h3>' +
        tabela([{ t: 'Mês' }, { t: 'Recebidas', num: 1 }, { t: 'Concluídas', num: 1 }], rel.meses.map((m) => [esc(m.nome + ' de ' + m.ano), m.recebidas, m.concluidas]));
    } else {
      h += '<h3>Distribuição</h3>' + UI.barrasStatus(rel.grupos.filter((g) => g.total)) + '<h3>Dados detalhados</h3>' + tabela(colsGrupo(TIPOS_REL[cfg.tipo].replace('Por ', '').replace(/^./, (c) => c.toUpperCase())), rel.grupos.map(linhaGrupo));
    }
    h += '<h3>Pontos recorrentes</h3>' + (rel.rec.length ? tabelaRecorrentes(rel.rec, false) : '<p class="muted">Nenhum assunto pendente se repete no mesmo bairro neste recorte.</p>');
    h += '<h3>Providências adotadas</h3><ul class="ticks"><li>' + rel.providencias.respostas + ' manifestações com resposta oficial registrada.</li><li>' + rel.providencias.encaminhadas + ' encaminhadas aos órgãos responsáveis ou já concluídas.</li>' +
      '<li>' + rel.providencias.noPrazo + ' concluídas dentro do prazo de ' + RA.PRAZO_DIAS + ' dias e ' + rel.providencias.fora + ' fora do prazo.</li><li>' + r.atrasadas + ' pendentes com prazo vencido.</li></ul>';
    h += '<div class="insights"><h3>' + icon('chart', 18) + 'Análise e insights</h3><ul class="ticks">' + rel.insights.map((i) => '<li class="in-' + i.tom + '">' + esc(i.texto) + '</li>').join('') + '</ul></div>';
    h += '<p class="rel-nota">Dados fictícios gerados por um protótipo acadêmico. Os indicadores subsidiam a gestão e a fiscalização, mas não substituem a análise técnica nem a decisão administrativa.</p></div>';
    return h;
  }

  function csvRelatorio(rel) {
    const cab = [['Relatório de gestão', TIPOS_REL[rel.cfg.tipo]], ['Período', nomePeriodo(rel.cfg.periodo)], ['Total', rel.resumo.total], ['Concluídas', rel.resumo.concluida], ['Taxa de conclusão', UI.pct(rel.resumo.taxa)], ['Tempo médio (dias)', rel.resumo.mediaDias == null ? '' : UI.dec(rel.resumo.mediaDias)], []];
    const corpo = rel.meses ? [['Mês', 'Recebidas', 'Concluídas']].concat(rel.meses.map((m) => [m.nome + ' de ' + m.ano, m.recebidas, m.concluidas]))
      : [['Grupo', 'Total', 'Abertas', 'Em análise', 'Em andamento', 'Concluídas', 'Taxa', 'Tempo médio (dias)']].concat(rel.grupos.map((g) => [g.nome, g.total, g.aberta, g.analise, g.andamento, g.concluida, UI.pct(g.taxa), g.mediaDias == null ? '' : UI.dec(g.mediaDias)]));
    return UI.csv(cab.concat(corpo));
  }

  RA.views.relatorios = function (main) {
    const e = estadoRel;
    const todas = RA.DB.manifestacoes();
    const r = RA.Stats.resumo(todas);
    main.innerHTML = '<div class="container narrow-lg"><div class="page-head"><h1 class="h2">Relatórios</h1><p class="muted">Consolide as manifestações em informação para decidir e fiscalizar.</p></div>' +
      '<div class="kpis kpis-3">' + UI.kpi({ rotulo: 'Total de manifestações', valor: UI.num(r.total), icone: 'message' }) + UI.kpi({ rotulo: 'Em andamento', valor: UI.num(r.andamento), tom: 'warn', icone: 'clock' }) + UI.kpi({ rotulo: 'Concluídas', valor: UI.num(r.concluida), tom: 'ok', icone: 'check', dica: UI.pct(r.taxa) + ' do total' }) + '</div>' +
      '<form class="card card-pad" id="f-rel"><h2 class="h3">Filtros do relatório</h2><div class="grid-2">' +
      '<div class="field"><label for="rl-tipo">Tipo do relatório</label><select id="rl-tipo" class="input">' + Object.keys(TIPOS_REL).map((k) => '<option value="' + k + '"' + (e.tipo === k ? ' selected' : '') + '>' + TIPOS_REL[k] + '</option>').join('') + '</select></div>' +
      '<div class="field"><label for="rl-per">Período</label><select id="rl-per" class="input">' + optPeriodo(e.periodo) + '</select></div>' +
      '<div class="field"><label for="rl-cat">Assunto</label><select id="rl-cat" class="input">' + UI.opcoes(RA.CATEGORIAS, e.categoria, 'Todos') + '</select></div>' +
      '<div class="field"><label for="rl-fmt">Formato</label><select id="rl-fmt" class="input"><option value="pdf"' + (e.formato === 'pdf' ? ' selected' : '') + '>PDF (impressão)</option><option value="csv"' + (e.formato === 'csv' ? ' selected' : '') + '>CSV (planilha)</option></select></div></div>' +
      '<div class="btn-row"><button type="button" class="btn btn-ghost" id="rl-prev">' + icon('chart', 16) + 'Visualizar prévia</button><button type="submit" class="btn btn-primary">' + icon('download', 16) + 'Baixar relatório</button></div></form></div>';
    const f = $('#f-rel', main);
    const ler = () => { e.tipo = $('#rl-tipo', f).value; e.periodo = Number($('#rl-per', f).value); e.categoria = $('#rl-cat', f).value; e.formato = $('#rl-fmt', f).value; };
    function baixar(rel) {
      if (e.formato === 'csv') { UI.baixar('relatorio-' + e.tipo + '.csv', csvRelatorio(rel), 'text/csv;charset=utf-8'); UI.toast('Relatório em CSV gerado.', 'ok'); }
      else { UI.imprimir(htmlRelatorio(rel, true)); }
    }
    $('#rl-prev', f).addEventListener('click', () => {
      ler();
      const rel = montarRelatorio(e);
      const h = UI.modal(UI.cabecalhoModal('Prévia do relatório', TIPOS_REL[e.tipo] + ', ' + nomePeriodo(e.periodo)) + '<div class="modal-b">' + htmlRelatorio(rel, false) + '</div>' +
        '<div class="modal-f"><button type="button" class="btn btn-primary" data-baixar>' + icon('download', 16) + 'Baixar relatório (' + (e.formato === 'csv' ? 'CSV' : 'PDF') + ')</button><button type="button" class="btn btn-ghost" data-close>Fechar</button></div>', { size: 'xl', title: 'Prévia do relatório' });
      h.el.querySelector('[data-baixar]').addEventListener('click', () => baixar(rel));
    });
    f.addEventListener('submit', (ev) => { ev.preventDefault(); ler(); baixar(montarRelatorio(e)); });
  };

  /* ------------------------------ Usuários (UC13 a UC15) ------------------------------ */
  const estadoUsuarios = { q: '', nivel: '', status: '' };
  const NIVEIS = { cidadao: 'Cidadão', gestor: 'Ouvidoria', vereador: 'Legislativo' };
  const SITUACAO = { ativo: 'Ativo', suspenso: 'Suspenso', pendente: 'Aguardando confirmação' };

  function modalNotificacaoMassa(aoFim) {
    const h = UI.modal(UI.cabecalhoModal('Enviar notificação', 'Escolha quem recebe e escreva a mensagem.') + '<form class="modal-b" id="f-massa" novalidate>' +
      '<div class="grid-2"><div class="field"><label for="ms-dest">Destinatários</label><select id="ms-dest" class="input"><option value="todos">Todos os cidadãos</option><option value="bairro">Cidadãos de um bairro</option><option value="pendentes">Cidadãos com manifestação pendente</option></select></div>' +
      '<div class="field" id="ms-b" hidden><label for="ms-bairro">Bairro</label><select id="ms-bairro" class="input">' + UI.opcoes(RA.BAIRROS, '') + '</select></div></div>' +
      '<div class="field"><label for="ms-txt">Mensagem</label><textarea id="ms-txt" class="input" rows="4" maxlength="500" placeholder="Ex.: A coleta de lixo do bairro será normalizada a partir de segunda-feira."></textarea><p class="hint" id="ms-c"></p></div>' +
      '<p class="muted" id="ms-n"></p><div class="modal-f flush"><button type="button" class="btn btn-ghost" data-close>Cancelar</button><button type="submit" class="btn btn-primary">' + icon('send', 16) + 'Enviar notificação</button></div></form>', { size: 'md', title: 'Enviar notificação' });
    const f = $('#f-massa', h.el);
    UI.contador($('#ms-txt', f), $('#ms-c', f), 0, 500);
    const alvo = () => {
      const t = $('#ms-dest', f).value;
      const cid = RA.DB.usuarios().filter((u) => u.nivel === 'cidadao' && u.status === 'ativo');
      if (t === 'bairro') return cid.filter((u) => u.bairro === $('#ms-bairro', f).value);
      if (t === 'pendentes') { const ids = new Set(RA.DB.manifestacoes().filter((m) => m.status !== 'concluida').map((m) => m.autorId)); return cid.filter((u) => ids.has(u.id)); }
      return cid;
    };
    const atualizar = () => { $('#ms-b', f).hidden = $('#ms-dest', f).value !== 'bairro'; $('#ms-n', f).textContent = alvo().length + ' ' + (alvo().length === 1 ? 'pessoa receberá' : 'pessoas receberão') + ' esta notificação.'; };
    f.addEventListener('change', atualizar);
    atualizar();
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      UI.limparErros(f);
      const t = $('#ms-txt', f).value.trim();
      if (!t) { UI.erro($('#ms-txt', f), 'Escreva a mensagem.'); return; }
      const a = alvo();
      if (!a.length) { UI.toast('Nenhum destinatário para esse filtro.', 'info'); return; }
      RA.DB.notificar(a.map((u) => u.id), t, null);
      h.close();
      UI.toast('Notificação enviada para ' + a.length + (a.length === 1 ? ' pessoa.' : ' pessoas.'), 'ok');
      if (aoFim) aoFim();
    });
  }

  function modalUsuario(id, aoFim) {
    const u = RA.DB.usuario(id);
    const eu = RA.DB.usuarioAtual();
    const ms = RA.DB.doUsuario(u.id).sort((a, b) => new Date(b.dataCriacao) - new Date(a.dataCriacao));
    const res = ms.filter((m) => m.status === 'concluida').length;
    const proprio = u.id === eu.id;
    const h = UI.modal(UI.cabecalhoModal('Editar usuário', 'Código ' + u.id + ', cadastrado em ' + UI.data(u.criadoEm)) + '<form class="modal-b" id="f-usu" novalidate>' +
      '<h3>' + icon('user', 18) + 'Informações pessoais</h3><div class="grid-2"><div class="field"><label for="us-nome">Nome completo</label><input id="us-nome" class="input" value="' + esc(u.nome) + '"></div>' +
      '<div class="field"><label for="us-cpf">CPF</label><input id="us-cpf" class="input" value="' + esc(u.cpf) + '"></div>' +
      '<div class="field"><label for="us-email">E-mail</label><input id="us-email" class="input" type="email" value="' + esc(u.email) + '"></div>' +
      '<div class="field"><label for="us-tel">Telefone</label><input id="us-tel" class="input" value="' + esc(u.telefone || '') + '"></div>' +
      '<div class="field"><label for="us-bairro">Bairro</label><select id="us-bairro" class="input">' + UI.opcoes(RA.BAIRROS, u.bairro) + '</select></div>' +
      '<div class="field"><label for="us-nivel">Perfil de acesso</label><select id="us-nivel" class="input"' + (proprio ? ' disabled' : '') + '>' + Object.keys(NIVEIS).map((k) => '<option value="' + k + '"' + (u.nivel === k ? ' selected' : '') + '>' + NIVEIS[k] + '</option>').join('') + '</select></div></div>' +
      '<div class="field"><label for="us-end">Endereço</label><input id="us-end" class="input" value="' + esc(u.endereco || '') + '"></div>' +
      '<h3>Estatísticas</h3><div class="stats3"><div class="stat s-blue">' + icon('message', 18) + '<span>Total de manifestações</span><strong>' + ms.length + '</strong></div><div class="stat s-green">' + icon('check', 18) + '<span>Resolvidas</span><strong>' + res + '</strong></div><div class="stat s-amber">' + icon('clock', 18) + '<span>Membro desde</span><strong class="sm">' + UI.data(u.criadoEm) + '</strong></div></div>' +
      '<h3>Últimas manifestações</h3>' + (ms.length ? '<ul class="lista-simples">' + ms.slice(0, 3).map((m) => '<li><div><strong>' + esc(m.titulo) + '</strong><span class="muted">' + UI.data(m.dataCriacao) + '</span></div>' + UI.statusBadge(m.status) + '</li>').join('') + '</ul>' : '<p class="muted">Nenhuma manifestação registrada.</p>') +
      '<div class="box-notif"><h3>' + icon('bell', 18) + 'Enviar notificação ao usuário</h3><div class="field"><label for="us-msg" class="sr-only">Mensagem</label><textarea id="us-msg" class="input" rows="3" maxlength="500" placeholder="Digite a mensagem que será enviada ao usuário"></textarea><div class="row-between"><span class="hint" id="us-c"></span><button type="button" class="btn btn-primary btn-sm" id="us-env" disabled>' + icon('send', 15) + 'Enviar notificação</button></div></div></div>' +
      '<div class="box-adm"><h3>' + icon('alert', 18) + 'Ações administrativas</h3><div class="btn-row">' +
      '<button type="button" class="btn btn-warn" id="us-susp"' + (proprio ? ' disabled' : '') + '>' + icon('ban', 16) + (u.status === 'suspenso' ? 'Reativar conta' : 'Suspender conta') + '</button>' +
      '<button type="button" class="btn btn-danger" id="us-del"' + (proprio ? ' disabled' : '') + '>' + icon('trash', 16) + 'Excluir permanentemente</button></div>' + (proprio ? '<p class="hint">Você não pode suspender nem excluir a própria conta.</p>' : '') + '</div>' +
      '<div class="modal-f flush"><button type="button" class="btn btn-ghost" data-close>Cancelar</button><button type="submit" class="btn btn-primary">Salvar alterações</button></div></form>', { size: 'lg', title: 'Editar usuário' });
    const f = $('#f-usu', h.el);
    UI.contador($('#us-msg', f), $('#us-c', f), 0, 500);
    $('#us-msg', f).addEventListener('input', (e) => { $('#us-env', f).disabled = !e.target.value.trim(); });
    $('#us-env', f).addEventListener('click', () => {
      RA.DB.notificar([u.id], $('#us-msg', f).value.trim(), null);
      $('#us-msg', f).value = ''; $('#us-env', f).disabled = true;
      UI.contador($('#us-msg', f), $('#us-c', f), 0, 500);
      UI.toast('Notificação enviada a ' + u.nome.split(' ')[0] + '.', 'ok');
    });
    $('#us-susp', f).addEventListener('click', () => {
      const novo = u.status === 'suspenso' ? 'ativo' : 'suspenso';
      RA.DB.atualizarUsuario(u.id, { status: novo });
      UI.toast(novo === 'suspenso' ? 'Conta suspensa.' : 'Conta reativada.', 'ok');
      h.close(); aoFim();
    });
    $('#us-del', f).addEventListener('click', async () => {
      if (await UI.confirmar({ titulo: 'Excluir usuário?', mensagem: u.nome + ' será removido(a) permanentemente. As manifestações registradas ficam no sistema sem identificação do autor.', ok: 'Excluir', perigo: true })) {
        RA.DB.removerUsuario(u.id); h.close(); UI.toast('Usuário excluído.', 'ok'); aoFim();
      }
    });
    $('#us-cpf', f).addEventListener('input', (e) => { e.target.value = UI.mascaraCPF(e.target.value); });
    $('#us-tel', f).addEventListener('input', (e) => { e.target.value = UI.mascaraTel(e.target.value); });
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      UI.limparErros(f);
      if ($('#us-nome', f).value.trim().split(/\s+/).length < 2 && u.nivel === 'cidadao') { UI.erro($('#us-nome', f), 'Informe nome e sobrenome.'); return; }
      if (!UI.emailValido($('#us-email', f).value)) { UI.erro($('#us-email', f), 'Informe um e-mail válido.'); return; }
      const patch = { nome: $('#us-nome', f).value.trim(), cpf: $('#us-cpf', f).value, email: $('#us-email', f).value.trim(), telefone: $('#us-tel', f).value, bairro: $('#us-bairro', f).value, endereco: $('#us-end', f).value };
      if (!proprio) patch.nivel = $('#us-nivel', f).value;
      const r = RA.DB.atualizarUsuario(u.id, patch);
      if (!r.ok) { UI.erro($(r.campo === 'cpf' ? '#us-cpf' : '#us-email', f), r.erro); return; }
      h.close(); UI.toast('Usuário atualizado.', 'ok'); aoFim();
    });
  }

  RA.views.usuarios = function (main) {
    const e = estadoUsuarios;
    main.innerHTML = '<div class="container"><div class="page-head row-between"><div><h1 class="h2">Usuários</h1><p class="muted">Edite cadastros, suspenda contas e envie avisos.</p></div>' +
      '<button type="button" class="btn btn-primary" id="us-massa">' + icon('bell', 16) + 'Enviar notificação</button></div>' +
      '<form class="filters card" role="search"><div class="field grow"><label for="ul-q">Buscar</label><input id="ul-q" class="input" type="search" placeholder="Nome, e-mail ou bairro" value="' + esc(e.q) + '"></div>' +
      '<div class="field"><label for="ul-n">Perfil</label><select id="ul-n" class="input"><option value="">Todos</option>' + Object.keys(NIVEIS).map((k) => '<option value="' + k + '"' + (e.nivel === k ? ' selected' : '') + '>' + NIVEIS[k] + '</option>').join('') + '</select></div>' +
      '<div class="field"><label for="ul-s">Situação</label><select id="ul-s" class="input"><option value="">Todas</option>' + Object.keys(SITUACAO).map((k) => '<option value="' + k + '"' + (e.status === k ? ' selected' : '') + '>' + SITUACAO[k] + '</option>').join('') + '</select></div></form>' +
      '<p class="result-line" id="ul-n-res" aria-live="polite"></p><div id="ul-lista"></div></div>';
    function pintar() {
      const q = RA.sem(e.q);
      const l = RA.DB.usuarios().filter((u) => (!e.nivel || u.nivel === e.nivel) && (!e.status || u.status === e.status) && (!q || RA.sem(u.nome + ' ' + u.email + ' ' + u.bairro).includes(q)));
      $('#ul-n-res', main).innerHTML = '<strong>' + l.length + '</strong> ' + (l.length === 1 ? 'usuário' : 'usuários') + '.';
      $('#ul-lista', main).innerHTML = l.length ? tabela([{ t: 'Nome' }, { t: 'E-mail' }, { t: 'Perfil' }, { t: 'Bairro' }, { t: 'Manifestações', num: 1 }, { t: 'Cadastro' }, { t: 'Situação' }, { t: 'Ações' }],
        l.map((u) => [UI.avatar(u.nome) + ' ' + esc(u.nome), esc(u.email), NIVEIS[u.nivel], esc(u.bairro), RA.DB.doUsuario(u.id).length, UI.data(u.criadoEm),
          '<span class="badge us-' + u.status + '">' + SITUACAO[u.status] + '</span>',
          '<button type="button" class="icon-btn" data-edit="' + u.id + '" aria-label="Editar ' + esc(u.nome) + '">' + icon('edit', 17) + '</button>'])) : UI.vazio('Nenhum usuário encontrado', 'Ajuste a busca ou os filtros.');
    }
    pintar();
    const lento = UI.debounce(pintar, 200);
    main.addEventListener('input', (ev) => { if (ev.target.id === 'ul-q') { e.q = ev.target.value; lento(); } });
    main.addEventListener('change', (ev) => { if (ev.target.id === 'ul-n') { e.nivel = ev.target.value; pintar(); } if (ev.target.id === 'ul-s') { e.status = ev.target.value; pintar(); } });
    main.addEventListener('click', (ev) => {
      const b = ev.target.closest('[data-edit]');
      if (b) modalUsuario(Number(b.dataset.edit), pintar);
      if (ev.target.closest('#us-massa')) modalNotificacaoMassa(pintar);
    });
  };

  /* ------------------------------ Avaliações do protótipo ------------------------------ */
  const ITENS_AVAL = [
    'Foi fácil registrar uma manifestação.',
    'O acompanhamento pelo protocolo é claro.',
    'Os textos e botões são fáceis de entender.',
    'Consigo usar a plataforma no celular sem dificuldade.',
    'Os relatórios ajudam a entender os problemas da cidade.',
    'Eu usaria uma plataforma como esta no meu município.',
  ];
  const ESCALA = ['Discordo totalmente', 'Discordo', 'Neutro', 'Concordo', 'Concordo totalmente'];
  const PERFIS_AVAL = ['Cidadão', 'Servidor público', 'Vereador ou assessor', 'Outro'];

  RA.abrirAvaliacao = function () {
    const h = UI.modal(UI.cabecalhoModal('Avaliar o protótipo', 'Questionário curto de usabilidade. Leva cerca de dois minutos.') + '<form class="modal-b" id="f-aval" novalidate>' +
      '<div class="field"><label for="av-perfil">Você avalia como</label><select id="av-perfil" class="input">' + UI.opcoes(PERFIS_AVAL, '', 'Selecione') + '</select></div>' +
      ITENS_AVAL.map((t, i) => '<fieldset class="likert"><legend>' + esc(t) + '</legend><div class="likert-opts">' + ESCALA.map((e, k) =>
        '<label><input type="radio" name="av' + i + '" value="' + (k + 1) + '"><span><b>' + (k + 1) + '</b><small>' + e + '</small></span></label>').join('') + '</div></fieldset>').join('') +
      '<div class="field"><label for="av-com">Comentário (opcional)</label><textarea id="av-com" class="input" rows="3" maxlength="500" placeholder="O que funcionou bem? O que poderia melhorar?"></textarea></div>' +
      '<div class="modal-f flush"><button type="button" class="btn btn-ghost" data-close>Cancelar</button><button type="submit" class="btn btn-primary">Enviar avaliação</button></div></form>', { size: 'lg', title: 'Avaliar o protótipo' });
    const f = $('#f-aval', h.el);
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      UI.limparErros(f);
      if (!$('#av-perfil', f).value) { UI.erro($('#av-perfil', f), 'Escolha o seu perfil.'); $('#av-perfil', f).focus(); return; }
      const notas = ITENS_AVAL.map((_, i) => { const c = $('input[name="av' + i + '"]:checked', f); return c ? Number(c.value) : 0; });
      const falta = notas.findIndex((n) => !n);
      if (falta >= 0) { UI.toast('Responda a afirmação ' + (falta + 1) + '.', 'erro'); $('input[name="av' + falta + '"]', f).focus(); return; }
      RA.DB.avaliar({ perfil: $('#av-perfil', f).value, notas, comentario: $('#av-com', f).value.trim() });
      h.close();
      UI.toast('Obrigado pela avaliação.', 'ok');
      if (location.hash.indexOf('#/avaliacoes') === 0) RA.remontar(document.querySelector('#main > div'), (n) => RA.views.avaliacoes(n, { params: {} }));
    });
  };

  RA.views.avaliacoes = function (main) {
    const l = RA.DB.avaliacoes();
    const medias = ITENS_AVAL.map((_, i) => (l.length ? l.reduce((s, a) => s + a.notas[i], 0) / l.length : 0));
    const geral = l.length ? medias.reduce((s, x) => s + x, 0) / medias.length : 0;
    const perfis = PERFIS_AVAL.map((p) => ({ nome: p, valor: l.filter((a) => a.perfil === p).length })).filter((p) => p.valor);
    main.innerHTML = '<div class="container narrow-lg"><div class="page-head row-between"><div><h1 class="h2">Avaliações do protótipo</h1><p class="muted">Respostas do questionário de usabilidade, guardadas neste navegador.</p></div>' +
      '<div class="btn-row"><button type="button" class="btn btn-ghost" id="av-abrir">' + icon('star', 16) + 'Responder</button><button type="button" class="btn btn-ghost" id="av-csv"' + (l.length ? '' : ' disabled') + '>' + icon('download', 16) + 'Exportar CSV</button></div></div>' +
      (l.length ? '<div class="kpis kpis-3">' + UI.kpi({ rotulo: 'Respostas', valor: l.length, icone: 'users' }) + UI.kpi({ rotulo: 'Nota média geral', valor: UI.dec(geral) + ' de 5', icone: 'star', tom: geral >= 4 ? 'ok' : 'warn' }) + UI.kpi({ rotulo: 'Concordam que usariam', valor: UI.pct(l.filter((a) => a.notas[5] >= 4).length / l.length), icone: 'thumb', dica: 'Notas 4 e 5 na última afirmação' }) + '</div>' +
        '<section class="card card-pad"><h2 class="h3">Média por afirmação</h2>' + UI.barras(ITENS_AVAL.map((t, i) => ({ nome: t, valor: medias[i], tip: t + ' Média ' + UI.dec(medias[i], 2) + ' de 5' })), { max: 5, fmt: (x) => UI.dec(x, 1) }) + '</section>' +
        '<section class="card card-pad"><h2 class="h3">Quem respondeu</h2>' + UI.barras(perfis) + '</section>' +
        '<section class="card card-pad"><h2 class="h3">Comentários</h2>' + (l.filter((a) => a.comentario).length ? '<ul class="comentarios">' + l.filter((a) => a.comentario).map((a) => '<li>' + UI.avatar(a.perfil) + '<div><p class="c-nome"><strong>' + esc(a.perfil) + '</strong><span class="muted">' + UI.dataHora(a.data) + '</span></p><p>' + esc(a.comentario) + '</p></div></li>').join('') + '</ul>' : '<p class="muted">Nenhum comentário escrito.</p>') + '</section>'
        : '<div class="card card-pad">' + UI.vazio('Ainda não há respostas', 'Use o botão "Avaliar o protótipo" no rodapé ou clique em Responder para registrar a primeira avaliação.') + '</div>') + '</div>';
    $('#av-abrir', main).addEventListener('click', RA.abrirAvaliacao);
    const csv = $('#av-csv', main);
    csv.addEventListener('click', () => {
      UI.baixar('avaliacoes-prototipo.csv', UI.csv([['Data', 'Perfil'].concat(ITENS_AVAL.map((_, i) => 'Afirmação ' + (i + 1))).concat(['Comentário'])].concat(l.map((a) => [UI.dataHora(a.data), a.perfil].concat(a.notas).concat([a.comentario])))), 'text/csv;charset=utf-8');
    });
  };

  /* ------------------------------ Fiscalização (Legislativo) ------------------------------ */
  const estadoFisc = { periodo: 0 };
  RA.views.fiscalizacao = function (main) {
    const todas = RA.DB.manifestacoes();
    const base = RA.Stats.periodo(todas, estadoFisc.periodo);
    const r = RA.Stats.resumo(base);
    const orgaos = RA.Stats.porOrgao(base).sort((a, b) => b.atrasadas - a.atrasadas || b.pendentes - a.pendentes);
    const rec = RA.Stats.recorrentes(base, 2).slice(0, 8);
    const bairros = RA.Stats.porBairro(base).slice(0, 8);
    const apoiadas = base.filter((m) => m.status !== 'concluida' && RA.TIPOS[m.tipo].publica).sort((a, b) => RA.Stats.apoios(b) - RA.Stats.apoios(a)).slice(0, 5);

    main.innerHTML = '<div class="container"><div class="page-head row-between"><div><h1 class="h2">Painel de fiscalização</h1><p class="muted">O que a população relata e como o Executivo responde. Dados agregados, sem identificação de cidadãos.</p></div>' +
      '<div class="field inline"><label for="fs-per">Período</label><select id="fs-per" class="input">' + optPeriodo(estadoFisc.periodo) + '</select></div></div>' +
      '<div class="note note-wide">' + icon('info', 18) + '<p>Os números abaixo são um subsídio para perguntar, requerer informações e acompanhar o serviço público. Eles mostram o que foi relatado, não substituem laudos técnicos nem a análise de orçamento e prioridades da administração.</p></div>' +
      '<div class="kpis kpis-5">' +
      UI.kpi({ rotulo: 'Manifestações recebidas', valor: UI.num(r.total), icone: 'message' }) +
      UI.kpi({ rotulo: 'Taxa de conclusão', valor: UI.pct(r.taxa), tom: r.taxa >= 0.6 ? 'ok' : 'warn', icone: 'check', dica: r.concluida + ' concluídas' }) +
      UI.kpi({ rotulo: 'Tempo médio de resolução', valor: r.mediaDias == null ? '-' : UI.dec(r.mediaDias) + ' dias', icone: 'clock', dica: 'Prazo legal de ' + RA.PRAZO_DIAS + ' dias' }) +
      UI.kpi({ rotulo: 'Pendentes', valor: UI.num(r.pendentes), tom: 'bad', icone: 'alert' }) +
      '<a class="kpi kpi-link' + (r.atrasadas ? ' kpi-bad' : '') + '" href="' + link('fila', { atrasadas: 1 }) + '"><div class="kpi-top"><span class="kpi-l">Prazo vencido</span>' + icon('clock', 18) + '</div><div class="kpi-v">' + UI.num(r.atrasadas) + '</div><div class="kpi-h">Ver manifestações</div></a></div>' +
      '<section class="card card-pad"><h2 class="h3">Resposta por órgão responsável</h2><p class="muted">Ordenado por manifestações com prazo vencido.</p>' + tabela([{ t: 'Órgão' }, { t: 'Recebidas', num: 1 }, { t: 'Pendentes', num: 1 }, { t: 'Prazo vencido', num: 1 }, { t: 'Concluídas', num: 1 }, { t: 'Taxa', num: 1 }, { t: 'Tempo médio', num: 1 }],
        orgaos.map((o) => [esc(o.nome), o.total, o.pendentes, o.atrasadas ? '<strong class="txt-bad">' + o.atrasadas + '</strong>' : '0', o.concluida, chipTaxa(o.taxa), tempo(o.mediaDias)])) + '</section>' +
      '<section class="card card-pad"><h2 class="h3">Pontos recorrentes</h2><p class="muted">Mesmo assunto, mesmo bairro, ainda sem solução.</p>' + (rec.length ? tabelaRecorrentes(rec, true) : UI.vazio('Sem pontos recorrentes', '')) + AVISO_INDICE + '</section>' +
      '<div class="grid-2 gap-lg"><section class="card card-pad"><h2 class="h3">Bairros com mais registros</h2>' + UI.barras(bairros.map((b) => ({ nome: b.nome, valor: b.total, tip: b.nome + ': ' + b.total + ' registros, ' + b.pendentes + ' pendentes' }))) + '</section>' +
      '<section class="card card-pad"><h2 class="h3">Mais apoiadas e ainda abertas</h2>' + (apoiadas.length ? '<ul class="feed">' + apoiadas.map((m) => '<li><button type="button" class="feed-btn" data-detalhe="' + m.id + '"><strong>' + esc(m.titulo) + '</strong><span class="muted">' + esc(m.bairro) + ', ' + RA.Stats.apoios(m) + ' apoios, ' + esc(RA.STATUS[m.status].nome) + '</span></button></li>').join('') + '</ul>' : UI.vazio('Nada pendente', '')) + '</section></div>' +
      '<div class="btn-row"><a class="btn btn-primary" href="#/relatorios">' + icon('file', 16) + 'Gerar relatório</a><a class="btn btn-ghost" href="#/fila">' + icon('list', 16) + 'Ver todas as manifestações</a></div></div>';
    $('#fs-per', main).addEventListener('change', (e) => { estadoFisc.periodo = Number(e.target.value); RA.remontar(main, RA.views.fiscalizacao); });
    RA.ligarCartoes(main);
  };
})();
