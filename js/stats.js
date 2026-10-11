/* =========================================================================
   Resolve Aqui - indicadores
   Transformam as manifestações registradas em informação para a gestão e para
   a fiscalização (objetivo geral do projeto de pesquisa).
   ========================================================================= */
(function () {
  'use strict';
  const RA = window.RA;
  const DAY = 864e5;
  const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

  const dias = (a, b) => (new Date(b) - new Date(a)) / DAY;
  RA.dias = dias;
  RA.nomeMes = (i) => MESES[i];

  /* Situação do prazo de resposta (Lei nº 13.460/2017, art. 16) */
  RA.prazo = function (m) {
    const limite = new Date(m.dataCriacao).getTime() + RA.PRAZO_DIAS * DAY;
    if (m.status === 'concluida') {
      const fim = new Date(m.dataConclusao || m.dataCriacao).getTime();
      return { concluida: true, noPrazo: fim <= limite, vencido: false, dias: 0, texto: fim <= limite ? 'Concluída no prazo' : 'Concluída fora do prazo' };
    }
    const resta = Math.ceil((limite - Date.now()) / DAY);
    if (resta < 0) return { concluida: false, vencido: true, dias: -resta, texto: 'Prazo vencido há ' + -resta + (resta === -1 ? ' dia' : ' dias') };
    if (resta === 0) return { concluida: false, vencido: false, dias: 0, texto: 'Vence hoje' };
    return { concluida: false, vencido: false, dias: resta, texto: resta + (resta === 1 ? ' dia restante' : ' dias restantes') };
  };

  const media = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : null);

  const S = (RA.Stats = {});

  S.apoios = (m) => m.apoiosBase + m.apoios.length;

  S.resumo = function (list) {
    const r = { total: list.length, aberta: 0, analise: 0, andamento: 0, concluida: 0 };
    list.forEach((m) => { r[m.status]++; });
    r.pendentes = r.total - r.concluida;
    r.taxa = r.total ? r.concluida / r.total : 0;
    const concl = list.filter((m) => m.status === 'concluida' && m.dataConclusao);
    const tempos = concl.map((m) => dias(m.dataCriacao, m.dataConclusao));
    r.mediaDias = media(tempos);
    r.foraPrazo = tempos.filter((d) => d > RA.PRAZO_DIAS).length;
    r.atrasadas = list.filter((m) => m.status !== 'concluida' && RA.prazo(m).vencido).length;
    r.apoios = list.reduce((s, m) => s + S.apoios(m), 0);
    return r;
  };

  /* Agrupa e resume por uma chave (categoria, bairro, órgão...) */
  S.agrupar = function (list, chave, rotulo) {
    const mapa = new Map();
    list.forEach((m) => {
      const k = chave(m);
      if (!mapa.has(k)) mapa.set(k, []);
      mapa.get(k).push(m);
    });
    return Array.from(mapa, ([k, itens]) => Object.assign({ chave: k, nome: rotulo ? rotulo(k) : k, itens }, S.resumo(itens)))
      .sort((a, b) => b.total - a.total || a.nome.localeCompare(b.nome, 'pt-BR'));
  };

  S.porCategoria = (l) => S.agrupar(l, (m) => m.categoria, (k) => RA.categoria(k).nome);
  S.porBairro = (l) => S.agrupar(l, (m) => m.bairro);
  S.porOrgao = (l) => S.agrupar(l, (m) => m.orgao);
  S.porTipo = (l) => S.agrupar(l, (m) => m.tipo, (k) => RA.TIPOS[k].nome);
  S.porStatus = (l) => Object.keys(RA.STATUS).map((k) => {
    const itens = l.filter((m) => m.status === k);
    return Object.assign({ chave: k, nome: RA.STATUS[k].nome, itens }, S.resumo(itens));
  });

  /* Últimos n meses (recebidas x concluídas) */
  S.porMes = function (list, n) {
    const hoje = new Date();
    const out = [];
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      out.push({ ano: d.getFullYear(), mes: d.getMonth(), recebidas: 0, concluidas: 0, nome: MESES[d.getMonth()] });
    }
    const idx = (iso) => {
      const d = new Date(iso);
      return out.findIndex((x) => x.ano === d.getFullYear() && x.mes === d.getMonth());
    };
    list.forEach((m) => {
      const a = idx(m.dataCriacao);
      if (a >= 0) out[a].recebidas++;
      if (m.status === 'concluida' && m.dataConclusao) {
        const b = idx(m.dataConclusao);
        if (b >= 0) out[b].concluidas++;
      }
    });
    return out;
  };

  /* Pontos recorrentes: mesma categoria no mesmo bairro, ainda sem solução.
     O índice combina quantidade, apoios dos cidadãos e tempo de espera. É um
     subsídio para priorização, não uma decisão automática. */
  S.recorrentes = function (list, minimo) {
    const pend = list.filter((m) => m.status !== 'concluida');
    const grupos = new Map();
    pend.forEach((m) => {
      const k = m.categoria + '|' + m.bairro;
      if (!grupos.has(k)) grupos.set(k, []);
      grupos.get(k).push(m);
    });
    const out = [];
    grupos.forEach((itens, k) => {
      if (itens.length < (minimo || 2)) return;
      const [categoria, bairro] = k.split('|');
      const espera = itens.map((m) => dias(m.dataCriacao, Date.now()));
      const apoios = itens.reduce((s, m) => s + S.apoios(m), 0);
      const indice = itens.reduce((s, m, i) => s + 1 + S.apoios(m) * 0.25 + Math.min(espera[i], 60) / 30, 0);
      out.push({
        categoria, bairro, qtd: itens.length, apoios, maisAntiga: Math.round(Math.max(...espera)),
        atrasadas: itens.filter((m) => RA.prazo(m).vencido).length, indice: Math.round(indice * 10) / 10,
        orgao: RA.categoria(categoria).orgao, itens,
      });
    });
    return out.sort((a, b) => b.indice - a.indice);
  };

  /* Filtra por período em dias (0 = tudo) */
  S.periodo = (list, nDias) => (nDias ? list.filter((m) => Date.now() - new Date(m.dataCriacao).getTime() <= nDias * DAY) : list);

  /* Variação percentual do volume recebido contra o período anterior de mesma duração */
  S.variacao = function (list, nDias) {
    if (!nDias) return null;
    const agora = Date.now();
    const atual = list.filter((m) => agora - new Date(m.dataCriacao) <= nDias * DAY).length;
    const anterior = list.filter((m) => {
      const d = agora - new Date(m.dataCriacao);
      return d > nDias * DAY && d <= 2 * nDias * DAY;
    }).length;
    if (!anterior) return null;
    return Math.round(((atual - anterior) / anterior) * 100);
  };

  /* Textos de apoio à leitura dos números (gerados a partir dos dados) */
  S.insights = function (list) {
    const r = S.resumo(list);
    const out = [];
    if (!r.total) return out;
    const pct = (x) => Math.round(x * 100) + '%';
    out.push({ tom: r.taxa >= 0.6 ? 'ok' : 'atencao', texto: 'Foram concluídas ' + r.concluida + ' de ' + r.total + ' manifestações (' + pct(r.taxa) + ').' });
    const cats = S.porCategoria(list);
    if (cats[0]) out.push({ tom: 'info', texto: cats[0].nome + ' concentra ' + pct(cats[0].total / r.total) + ' das manifestações. Vale analisar as causas e priorizar ações preventivas.' });
    const bairros = S.porBairro(list);
    if (bairros[0]) out.push({ tom: 'info', texto: bairros[0].nome + ' é o bairro com mais registros (' + bairros[0].total + ').' });
    if (r.atrasadas) out.push({ tom: 'alerta', texto: r.atrasadas + (r.atrasadas === 1 ? ' manifestação pendente passou' : ' manifestações pendentes passaram') + ' do prazo de ' + RA.PRAZO_DIAS + ' dias previsto na Lei nº 13.460/2017.' });
    if (r.mediaDias != null) out.push({ tom: r.mediaDias <= RA.PRAZO_DIAS ? 'ok' : 'alerta', texto: 'O tempo médio de resolução foi de ' + r.mediaDias.toFixed(1).replace('.', ',') + ' dias.' });
    const rec = S.recorrentes(list, 3)[0];
    if (rec) out.push({ tom: 'atencao', texto: 'Há ' + rec.qtd + ' ocorrências pendentes de "' + RA.categoria(rec.categoria).nome + '" em ' + rec.bairro + ', o ponto recorrente de maior prioridade.' });
    return out;
  };

  /* Nome do autor conforme o perfil de quem está vendo (proteção de dados pessoais) */
  RA.nomeAutor = function (m, visao) {
    const u = RA.DB.usuario(m.autorId);
    if (visao === 'gestor') return (u ? u.nome : 'Usuário removido') + (m.anonima ? ' (pediu anonimato)' : '');
    if (m.anonima) return 'Anônimo';
    return RA.nomePublico(u);
  };
  RA.nomePublico = function (u) {
    if (!u) return 'Usuário removido';
    const p = u.nome.split(' ');
    return p.length > 1 ? p[0] + ' ' + p[p.length - 1][0] + '.' : p[0];
  };
})();
