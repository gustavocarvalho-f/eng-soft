/* =========================================================================
   Resolve Aqui - camada de dados
   Os dados ficam no localStorage do navegador. Cada função de RA.DB equivale
   a uma operação que, na versão final, viraria uma chamada à API / consulta SQL.
   ========================================================================= */
(function () {
  'use strict';
  const RA = window.RA;
  const KEY = 'resolveaqui.db.v1';
  const SKEY = 'resolveaqui.sessao.v1';
  let db = null;
  const visualizadas = new Set(); // evita contar várias vezes a mesma visualização na sessão

  const lsGet = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } };
  const lsDel = (k) => { try { localStorage.removeItem(k); } catch (e) { /* ignora */ } };
  const agora = () => new Date().toISOString();
  const norm = (s) => String(s || '').trim().toLowerCase();
  const digitos = (s) => String(s || '').replace(/\D/g, '');

  function save() { return lsSet(KEY, JSON.stringify(db)); }

  function load() {
    const raw = lsGet(KEY);
    if (raw) { try { db = JSON.parse(raw); } catch (e) { db = null; } }
    if (!db || db.v !== 1) { db = RA.seed(); save(); }
  }

  function proximo(nome) { return db.seq[nome]++; }
  const clone = (o) => JSON.parse(JSON.stringify(o));

  const DB = (RA.DB = {
    iniciar: load,
    reiniciar() { lsDel(KEY); lsDel(SKEY); visualizadas.clear(); load(); },
    persistiu() { return !!lsGet(KEY); },

    /* ------------------------------ Sessão ------------------------------ */
    usuarioAtual() {
      const id = Number(lsGet(SKEY));
      return id ? db.usuarios.find((u) => u.id === id) || null : null;
    },
    entrar(email, senha) {
      const u = db.usuarios.find((x) => norm(x.email) === norm(email));
      if (!u || u.senha !== senha) return { ok: false, erro: 'E-mail ou senha incorretos.' };
      if (u.status === 'pendente') return { ok: false, pendente: true, userId: u.id, erro: 'Confirme seu e-mail antes de entrar.' };
      if (u.status === 'suspenso') return { ok: false, erro: 'Esta conta está suspensa. Fale com a ouvidoria.' };
      lsSet(SKEY, String(u.id));
      return { ok: true, user: u };
    },
    sair() { lsDel(SKEY); },

    /* ------------------------------ Usuários ------------------------------ */
    usuarios() { return db.usuarios.slice(); },
    usuario(id) { return db.usuarios.find((u) => u.id === Number(id)) || null; },

    registrar(d) {
      if (db.usuarios.some((u) => norm(u.email) === norm(d.email))) return { ok: false, campo: 'email', erro: 'Já existe uma conta com este e-mail.' };
      if (db.usuarios.some((u) => digitos(u.cpf) === digitos(d.cpf))) return { ok: false, campo: 'cpf', erro: 'Já existe uma conta com este CPF.' };
      const codigo = String(Math.floor(100000 + Math.random() * 900000));
      const u = {
        id: proximo('usuario'), nome: d.nome.trim(), email: d.email.trim(), senha: d.senha, cpf: d.cpf, telefone: d.telefone || '',
        bairro: d.bairro, endereco: d.endereco || '', nivel: 'cidadao', status: 'pendente', criadoEm: agora(), codigoConfirmacao: codigo,
      };
      db.usuarios.push(u);
      save();
      return { ok: true, user: u, codigo };
    },
    reenviarCodigo(userId) {
      const u = DB.usuario(userId);
      if (!u) return null;
      u.codigoConfirmacao = String(Math.floor(100000 + Math.random() * 900000));
      save();
      return u.codigoConfirmacao;
    },
    confirmarEmail(userId, codigo) {
      const u = DB.usuario(userId);
      if (!u || u.codigoConfirmacao !== String(codigo).trim()) return { ok: false, erro: 'Código incorreto. Confira o e-mail e tente de novo.' };
      u.status = 'ativo';
      delete u.codigoConfirmacao;
      save();
      lsSet(SKEY, String(u.id));
      DB.notificar([u.id], 'Cadastro confirmado. Bem-vindo ao Resolve Aqui.', null);
      return { ok: true, user: u };
    },
    pedirRecuperacao(email) {
      const u = db.usuarios.find((x) => norm(x.email) === norm(email));
      if (!u) return { ok: true, codigo: null }; // resposta igual para não revelar quais e-mails existem
      const codigo = String(Math.floor(100000 + Math.random() * 900000));
      db.tokens = db.tokens.filter((t) => norm(t.email) !== norm(email));
      db.tokens.push({ email: u.email, codigo, expira: Date.now() + 15 * 60 * 1000 });
      save();
      return { ok: true, codigo };
    },
    redefinirSenha(email, codigo, nova) {
      const t = db.tokens.find((x) => norm(x.email) === norm(email) && x.codigo === String(codigo).trim() && x.expira > Date.now());
      if (!t) return { ok: false, erro: 'Código inválido ou expirado. Peça um novo código.' };
      const u = db.usuarios.find((x) => norm(x.email) === norm(email));
      u.senha = nova;
      if (u.status === 'pendente') u.status = 'ativo';
      db.tokens = db.tokens.filter((x) => x !== t);
      save();
      return { ok: true };
    },
    atualizarUsuario(id, patch) {
      const u = DB.usuario(id);
      if (!u) return { ok: false, erro: 'Usuário não encontrado.' };
      if (patch.email && db.usuarios.some((x) => x.id !== u.id && norm(x.email) === norm(patch.email))) return { ok: false, campo: 'email', erro: 'Este e-mail já está em uso.' };
      if (patch.cpf && db.usuarios.some((x) => x.id !== u.id && digitos(x.cpf) === digitos(patch.cpf))) return { ok: false, campo: 'cpf', erro: 'Este CPF já está em uso.' };
      Object.assign(u, patch);
      save();
      return { ok: true, user: u };
    },
    removerUsuario(id) {
      db.usuarios = db.usuarios.filter((u) => u.id !== Number(id));
      db.notificacoes = db.notificacoes.filter((n) => n.usuarioId !== Number(id));
      save();
    },

    /* ------------------------------ Manifestações ------------------------------ */
    manifestacoes() { return db.manifestacoes.slice(); },
    manifestacao(id) { return db.manifestacoes.find((m) => m.id === Number(id)) || null; },
    porProtocolo(texto) {
      const alvo = String(texto || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (!alvo) return null;
      return db.manifestacoes.find((m) => m.protocolo.replace(/[^A-Z0-9]/g, '') === alvo) || null;
    },
    doUsuario(id) { return db.manifestacoes.filter((m) => m.autorId === Number(id)); },

    criarManifestacao(d, user) {
      const cat = RA.categoria(d.categoria);
      const dt = new Date();
      const id = proximo('manifestacao');
      const m = {
        id, protocolo: 'RA-' + dt.getFullYear() + '-' + String(id).padStart(5, '0'),
        tipo: d.tipo, titulo: d.titulo.trim(), descricao: d.descricao.trim(), categoria: d.categoria,
        bairro: d.bairro, endereco: (d.endereco || '').trim(), status: 'aberta', orgao: cat.orgao,
        dataCriacao: dt.toISOString(), dataConclusao: null, autorId: user.id, anonima: !!d.anonima,
        anexos: d.anexos || [], apoiosBase: 0, apoios: [], visualizacoes: 0, comentarios: [],
        historico: [{ data: dt.toISOString(), status: 'aberta', texto: 'Manifestação registrada.' }], resposta: null,
      };
      if (d.coord) m.coord = d.coord;
      db.manifestacoes.push(m);
      if (!save()) {
        db.manifestacoes.pop();
        db.seq.manifestacao--;
        return { ok: false, erro: 'O armazenamento do navegador está cheio. Envie menos anexos ou imagens menores.' };
      }
      return { ok: true, manifestacao: m };
    },
    editarManifestacao(id, patch, user) {
      const m = DB.manifestacao(id);
      if (!m || m.autorId !== user.id) return { ok: false, erro: 'Você só pode editar as suas manifestações.' };
      if (m.status !== 'aberta') return { ok: false, erro: 'Só é possível editar enquanto a manifestação está aberta.' };
      const cat = RA.categoria(patch.categoria || m.categoria);
      Object.assign(m, {
        titulo: patch.titulo.trim(), descricao: patch.descricao.trim(), categoria: cat.id, orgao: cat.orgao,
        bairro: patch.bairro, endereco: (patch.endereco || '').trim(), tipo: patch.tipo || m.tipo, anonima: !!patch.anonima,
      });
      m.historico.push({ data: agora(), status: m.status, texto: 'Manifestação editada pelo autor.' });
      save();
      return { ok: true, manifestacao: m };
    },
    excluirManifestacao(id, user) {
      const m = DB.manifestacao(id);
      if (!m) return { ok: false, erro: 'Manifestação não encontrada.' };
      const gestor = user.nivel === 'gestor';
      if (!gestor && (m.autorId !== user.id || m.status !== 'aberta')) return { ok: false, erro: 'Só é possível excluir manifestações suas que ainda estão abertas.' };
      db.manifestacoes = db.manifestacoes.filter((x) => x.id !== m.id);
      save();
      return { ok: true };
    },
    alternarApoio(id, user) {
      const m = DB.manifestacao(id);
      if (!m) return null;
      const i = m.apoios.indexOf(user.id);
      if (i >= 0) m.apoios.splice(i, 1); else m.apoios.push(user.id);
      save();
      return { apoiou: i < 0, total: m.apoiosBase + m.apoios.length };
    },
    comentar(id, texto, user) {
      const m = DB.manifestacao(id);
      const t = String(texto || '').trim();
      if (!m || !t) return { ok: false, erro: 'Escreva um comentário.' };
      if (t.length > 500) return { ok: false, erro: 'O comentário pode ter no máximo 500 caracteres.' };
      m.comentarios.push({ id: proximo('comentario'), usuarioId: user.id, texto: t, data: agora() });
      save();
      return { ok: true };
    },
    visualizar(id) {
      if (visualizadas.has(id)) return;
      visualizadas.add(id);
      const m = DB.manifestacao(id);
      if (m) { m.visualizacoes++; save(); }
    },
    /* Tratamento pelo gestor: muda status, encaminha ao órgão e registra a resposta oficial */
    tratar(id, { status, orgao, resposta }, gestor) {
      const m = DB.manifestacao(id);
      if (!m) return { ok: false, erro: 'Manifestação não encontrada.' };
      const texto = String(resposta || '').trim();
      if (status === 'concluida' && !texto && !m.resposta) return { ok: false, campo: 'resposta', erro: 'Para concluir, escreva a resposta ao cidadão.' };
      const mudouStatus = status !== m.status;
      const mudouOrgao = orgao && orgao !== m.orgao;
      const novaResposta = texto && (!m.resposta || m.resposta.texto !== texto);
      if (!mudouStatus && !mudouOrgao && !novaResposta) return { ok: false, erro: 'Nenhuma alteração para salvar.' };
      const t = agora();
      if (mudouOrgao) {
        m.orgao = orgao;
        m.historico.push({ data: t, status: m.status, texto: 'Encaminhada para ' + orgao + '.' });
      }
      if (mudouStatus) {
        m.status = status;
        const msgs = { aberta: 'Manifestação reaberta.', analise: 'Em análise pela ouvidoria.', andamento: 'Serviço em andamento em ' + m.orgao + '.', concluida: 'Manifestação concluída.' };
        m.historico.push({ data: t, status, texto: msgs[status] });
        m.dataConclusao = status === 'concluida' ? t : null;
      }
      if (novaResposta) m.resposta = { texto, data: t, autor: gestor.nome, orgao: m.orgao };
      const partes = [];
      if (mudouStatus) partes.push('agora está "' + RA.STATUS[m.status].nome + '"');
      if (mudouOrgao && !mudouStatus) partes.push('foi encaminhada para ' + m.orgao);
      if (novaResposta) partes.push('recebeu uma resposta oficial');
      DB.notificar([m.autorId], 'Sua manifestação "' + m.titulo + '" (' + m.protocolo + ') ' + partes.join(' e ') + '.', m.id);
      save();
      return { ok: true, manifestacao: m };
    },

    /* ------------------------------ Notificações ------------------------------ */
    notificar(userIds, texto, manifestacaoId) {
      userIds.forEach((uid) => {
        if (!DB.usuario(uid)) return;
        db.notificacoes.push({ id: proximo('notificacao'), usuarioId: uid, texto, manifestacaoId: manifestacaoId || null, data: agora(), lida: false });
      });
      save();
    },
    notificacoesDe(userId) { return db.notificacoes.filter((n) => n.usuarioId === Number(userId)).sort((a, b) => new Date(b.data) - new Date(a.data)); },
    marcarLidas(userId) { db.notificacoes.forEach((n) => { if (n.usuarioId === Number(userId)) n.lida = true; }); save(); },

    /* ------------------------------ Avaliações do protótipo ------------------------------ */
    avaliacoes() { return db.avaliacoes.slice(); },
    avaliar(d) { db.avaliacoes.push(Object.assign({ id: proximo('avaliacao'), data: agora() }, clone(d))); return save(); },
  });
})();
