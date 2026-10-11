/* =========================================================================
   Resolve Aqui - dados de referência e dados de demonstração (seed)
   Todos os dados gerados aqui são FICTÍCIOS e servem apenas para o protótipo.
   ========================================================================= */
(function () {
  'use strict';
  const RA = (window.RA = window.RA || {});
  const DAY = 864e5;

  /* Prazo de resposta conclusiva: Lei nº 13.460/2017, art. 16 (30 dias, prorrogável). */
  RA.PRAZO_DIAS = 30;

  /* Tipos de manifestação previstos na Lei nº 13.460/2017 */
  RA.TIPOS = {
    reclamacao: { nome: 'Reclamação', desc: 'Insatisfação com a prestação de um serviço público.', publica: true },
    solicitacao: { nome: 'Solicitação', desc: 'Pedido de providência ou de um serviço.', publica: true },
    sugestao: { nome: 'Sugestão', desc: 'Ideia para melhorar um serviço ou espaço público.', publica: true },
    elogio: { nome: 'Elogio', desc: 'Reconhecimento por um bom atendimento ou serviço.', publica: true },
    denuncia: { nome: 'Denúncia', desc: 'Irregularidade ou ato ilícito. Não é exibida publicamente.', publica: false },
  };

  RA.STATUS = {
    aberta: { nome: 'Aberta' },
    analise: { nome: 'Em análise' },
    andamento: { nome: 'Em andamento' },
    concluida: { nome: 'Concluída' },
  };

  /* Órgãos responsáveis (nomes genéricos, ilustrativos) */
  RA.ORGAOS = [
    'Secretaria de Obras e Serviços Urbanos',
    'Departamento de Iluminação Pública',
    'Departamento de Limpeza Urbana',
    'Secretaria de Meio Ambiente',
    'Coordenadoria de Proteção Animal',
    'Secretaria de Mobilidade e Trânsito',
    'Secretaria de Saúde',
    'Secretaria de Educação',
    'Ouvidoria Geral',
  ];

  RA.CATEGORIAS = [
    { id: 'infraestrutura', nome: 'Infraestrutura e vias', orgao: RA.ORGAOS[0] },
    { id: 'iluminacao', nome: 'Iluminação pública', orgao: RA.ORGAOS[1] },
    { id: 'saneamento', nome: 'Saneamento e limpeza', orgao: RA.ORGAOS[2] },
    { id: 'meioambiente', nome: 'Meio ambiente', orgao: RA.ORGAOS[3] },
    { id: 'animal', nome: 'Causa animal', orgao: RA.ORGAOS[4] },
    { id: 'transito', nome: 'Trânsito e transporte', orgao: RA.ORGAOS[5] },
    { id: 'saude', nome: 'Saúde', orgao: RA.ORGAOS[6] },
    { id: 'educacao', nome: 'Educação', orgao: RA.ORGAOS[7] },
    { id: 'outros', nome: 'Outros assuntos', orgao: RA.ORGAOS[8] },
  ];
  RA.categoria = (id) => RA.CATEGORIAS.find((c) => c.id === id) || RA.CATEGORIAS[RA.CATEGORIAS.length - 1];

  /* Lista ilustrativa. Em produção, substituir pela base oficial de bairros do município. */
  RA.BAIRROS = [
    'Centro', 'Vila Nova', 'Jardim Paulista', 'Vila Rio Branco', 'Vila Aparecida',
    'Jardim Marabá', 'Vila Barth', 'Vila Isabel', 'Jardim Bela Vista', 'Zona Rural',
  ];

  /* ---------- Modelos de texto usados só para gerar os dados fictícios ---------- */
  const MODELOS = {
    infraestrutura: [
      ['Buraco na rua', 'Buraco grande na via, existe há cerca de duas semanas e causa risco a motoristas, motociclistas e pedestres.'],
      ['Calçada quebrada', 'Calçada com lajotas soltas e desnível que dificulta a passagem de idosos e de pessoas em cadeira de rodas.'],
      ['Bueiro entupido', 'Bueiro entupido. Quando chove, a água acumula e invade a calçada e as casas próximas.'],
      ['Asfalto afundado', 'O asfalto afundou depois das últimas chuvas e os carros precisam desviar para não danificar a suspensão.'],
    ],
    iluminacao: [
      ['Poste apagado', 'Poste sem luz há mais de uma semana. A rua fica muito escura à noite e aumenta a sensação de insegurança.'],
      ['Lâmpada piscando', 'A lâmpada do poste pisca durante a noite toda e depois apaga. Moradores relatam o mesmo problema na quadra.'],
      ['Praça sem iluminação', 'Metade da praça está sem iluminação e o local ficou desfrequentado depois do anoitecer.'],
    ],
    saneamento: [
      ['Lixo acumulado', 'Lixo acumulado na esquina há dias. A coleta não passou e já há mau cheiro e presença de animais.'],
      ['Esgoto a céu aberto', 'Há vazamento de esgoto correndo pela rua, com mau cheiro forte e risco à saúde das crianças que brincam no local.'],
      ['Entulho na calçada', 'Entulho de obra descartado na calçada e parte da rua, atrapalhando pedestres e veículos.'],
    ],
    meioambiente: [
      ['Árvore com risco de queda', 'Árvore com galhos secos sobre a fiação elétrica e sobre o passeio. Há risco de queda em dia de vento forte.'],
      ['Terreno baldio com mato alto', 'Terreno baldio com mato alto, acúmulo de lixo e aparecimento de escorpiões e ratos nas casas vizinhas.'],
      ['Queimada em terreno', 'Queimada em terreno vazio com muita fumaça. Vizinhos com problemas respiratórios.'],
    ],
    animal: [
      ['Animal abandonado', 'Cachorro ferido precisando de resgate urgente. Parece ter sido atropelado e tem dificuldade de locomoção.'],
      ['Maus-tratos a animal', 'Animal mantido sem água, sem abrigo e acorrentado o dia inteiro em um quintal.', 'denuncia'],
      ['Cães soltos em grupo', 'Grupo de cães soltos na rua perseguindo pedestres e ciclistas no fim da tarde.'],
    ],
    transito: [
      ['Semáforo com defeito', 'Semáforo do cruzamento fica piscando em amarelo durante o dia todo, gerando risco de colisão.'],
      ['Placa de pare caída', 'A placa de pare caiu e não foi recolocada. Já houve quase acidentes no cruzamento.'],
      ['Ponto de ônibus sem cobertura', 'O ponto de ônibus não tem cobertura nem banco. Em dias de chuva os passageiros ficam expostos.'],
    ],
    saude: [
      ['Demora no atendimento na UBS', 'Fila de espera muito longa para consulta na unidade básica e poucos profissionais no período da manhã.'],
      ['Falta de medicamento na unidade', 'Medicamento de uso contínuo está em falta há semanas na farmácia da unidade de saúde do bairro.'],
    ],
    educacao: [
      ['Falta de vaga em creche', 'Aguardando vaga em creche próxima de casa há mais de seis meses, sem previsão de chamada.'],
      ['Transporte escolar atrasado', 'O transporte escolar chega com mais de 30 minutos de atraso quase todos os dias.'],
    ],
    outros: [
      ['Sugestão de ciclovia', 'Sugiro a criação de uma ciclovia ligando o bairro ao centro, que hoje exige o uso de avenidas movimentadas.', 'sugestao'],
      ['Elogio ao atendimento da Defesa Civil', 'Quero registrar o elogio à equipe da Defesa Civil, que atendeu rapidamente após as chuvas.', 'elogio'],
      ['Dúvida sobre coleta seletiva', 'Gostaria de saber os dias e horários da coleta seletiva no meu bairro.', 'solicitacao'],
    ],
  };

  const RESPOSTAS = {
    infraestrutura: 'A equipe de manutenção realizou o reparo no local. Se o problema voltar a ocorrer, registre uma nova manifestação citando este protocolo.',
    iluminacao: 'A luminária foi substituída e o funcionamento do ponto foi normalizado.',
    saneamento: 'A equipe de limpeza removeu o material e a rota de coleta do local foi revisada.',
    meioambiente: 'Fiscais vistoriaram o local e adotaram as providências cabíveis, incluindo a notificação do responsável.',
    animal: 'A equipe de proteção animal atendeu a ocorrência e encaminhou o animal para avaliação veterinária.',
    transito: 'A equipe de sinalização realizou a manutenção e o local foi vistoriado.',
    saude: 'A unidade foi notificada e a gestão adotou medidas para regularizar o atendimento.',
    educacao: 'A secretaria analisou o caso e entrou em contato com a família para orientar o encaminhamento.',
    outros: 'Manifestação registrada e encaminhada ao setor responsável. Agradecemos a participação.',
  };

  const COMENTARIOS = [
    'Problema continua no mesmo local, está piorando.',
    'Confirmado, passei por lá hoje e realmente está perigoso.',
    'Já entrei em contato com a prefeitura também.',
    'Moro perto e vejo isso todos os dias.',
    'Obrigado por registrar, estava esperando alguém fazer isso.',
    'Também sofro com isso na minha rua.',
  ];

  const RUAS = [
    'Rua das Flores', 'Avenida Principal', 'Rua Quinze de Novembro', 'Rua Sete de Setembro',
    'Avenida Brasil', 'Rua dos Ipês', 'Rua das Palmeiras', 'Rua Tiradentes', 'Rua Santos Dumont',
  ];

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  RA.seed = function () {
    const now = Date.now();
    const rnd = mulberry32(2026);
    const pick = (a) => a[Math.floor(rnd() * a.length)];
    const wpick = (pairs) => {
      const tot = pairs.reduce((s, p) => s + p[1], 0);
      let r = rnd() * tot;
      for (const [v, w] of pairs) { if ((r -= w) <= 0) return v; }
      return pairs[0][0];
    };
    const iso = (t) => new Date(t).toISOString();
    const ago = (d) => now - d * DAY;

    const mk = (id, nome, email, senha, cpf, tel, bairro, end, nivel, criadoDias, extra) => Object.assign({
      id, nome, email, senha, cpf, telefone: tel, bairro, endereco: end, nivel, status: 'ativo', criadoEm: iso(ago(criadoDias)),
    }, extra || {});

    const usuarios = [
      mk(1, 'João Silva', 'joao@gmail.com', '123456', '123.456.789-00', '(15) 98765-4321', 'Centro', 'Rua das Flores, 123', 'cidadao', 280),
      mk(2, 'Maria Santos', 'maria@email.com', '123456', '987.654.321-00', '(15) 99876-1122', 'Vila Nova', 'Rua Sete de Setembro, 45', 'cidadao', 240),
      mk(3, 'Pedro Oliveira', 'pedro@email.com', '123456', '111.222.333-44', '(15) 99700-3344', 'Jardim Paulista', 'Rua dos Ipês, 310', 'cidadao', 205),
      mk(4, 'Ana Costa', 'ana@email.com', '123456', '555.666.777-88', '(15) 99655-8899', 'Vila Rio Branco', 'Avenida Brasil, 880', 'cidadao', 189),
      mk(5, 'Carlos Mendes', 'carlos@email.com', '123456', '222.333.444-55', '(15) 99611-2020', 'Centro', 'Rua Tiradentes, 77', 'cidadao', 170),
      mk(6, 'Fernanda Lima', 'fernanda@email.com', '123456', '333.444.555-66', '(15) 99622-3131', 'Vila Aparecida', 'Rua das Palmeiras, 12', 'cidadao', 150),
      mk(7, 'Rafael Souza', 'rafael@email.com', '123456', '444.555.666-77', '(15) 99633-4242', 'Jardim Marabá', 'Rua Santos Dumont, 501', 'cidadao', 120),
      mk(8, 'Juliana Prado', 'juliana@email.com', '123456', '666.777.888-99', '(15) 99644-5353', 'Vila Barth', 'Rua Quinze de Novembro, 90', 'cidadao', 95),
      mk(9, 'Marcos Tavares', 'marcos@email.com', '123456', '777.888.999-00', '(15) 99655-6464', 'Vila Isabel', 'Avenida Principal, 1500', 'cidadao', 60),
      mk(10, 'Patrícia Nunes', 'patricia@email.com', '123456', '888.999.000-11', '(15) 99666-7575', 'Jardim Bela Vista', 'Rua dos Ipês, 22', 'cidadao', 30),
      mk(11, 'Helena Duarte', 'admin@itapetininga.sp.gov.br', 'admin123', '000.000.000-01', '(15) 3000-0000', 'Centro', 'Ouvidoria Geral do Município', 'gestor', 300, { cargo: 'Ouvidora-geral' }),
      mk(12, 'Ver. Roberto Almeida', 'vereador@camara.exemplo.gov.br', 'camara123', '000.000.000-02', '(15) 3000-0001', 'Centro', 'Câmara Municipal (exemplo)', 'vereador', 300, { cargo: 'Vereador' }),
    ];
    const cidadaos = usuarios.filter((u) => u.nivel === 'cidadao').map((u) => u.id);

    const manifs = [];

    function criar(o) {
      const cat = RA.categoria(o.categoria);
      const dataCriacao = ago(o.idade);
      const hist = [{ data: iso(dataCriacao), status: 'aberta', texto: 'Manifestação registrada.' }];
      let status = o.status;
      let dataConclusao = null;
      let resposta = null;
      if (status !== 'aberta') {
        const dAn = dataCriacao + Math.min(o.idade, 1 + Math.floor(rnd() * 2)) * DAY;
        hist.push({ data: iso(dAn), status: 'analise', texto: 'Em análise pela ouvidoria.' });
        if (status === 'andamento' || status === 'concluida') {
          const dAnd = dAn + Math.floor(rnd() * 3 + 1) * DAY;
          hist.push({ data: iso(Math.min(dAnd, now)), status: 'andamento', texto: 'Encaminhada para ' + cat.orgao + '.' });
        }
        if (status === 'concluida') {
          const dias = Math.max(1, Math.min(o.idade, o.resolucao));
          dataConclusao = dataCriacao + dias * DAY;
          hist.push({ data: iso(dataConclusao), status: 'concluida', texto: 'Manifestação concluída.' });
          resposta = { texto: RESPOSTAS[o.categoria], data: iso(dataConclusao), autor: 'Ouvidoria Geral', orgao: cat.orgao };
        }
      }
      const comentarios = (o.comentarios || []).map((c, i) => ({
        id: 0, usuarioId: c.usuarioId, texto: c.texto, data: iso(Math.min(now, dataCriacao + (i + 1) * 0.6 * DAY + rnd() * DAY * 0.5)),
      }));
      manifs.push({
        id: 0, protocolo: '', tipo: o.tipo, titulo: o.titulo, descricao: o.descricao, categoria: o.categoria,
        bairro: o.bairro, endereco: o.endereco, status, orgao: cat.orgao,
        dataCriacao: iso(dataCriacao), dataConclusao: dataConclusao ? iso(dataConclusao) : null,
        autorId: o.autorId, anonima: !!o.anonima, anexos: o.anexos || [],
        apoiosBase: o.apoiosBase, apoios: o.apoios || [], visualizacoes: o.visualizacoes,
        comentarios, historico: hist, resposta,
      });
    }

    /* Manifestações exemplo, espelhando as telas da documentação do Resolve Aqui */
    criar({
      tipo: 'reclamacao', titulo: 'Buraco na rua', categoria: 'infraestrutura', bairro: 'Centro',
      descricao: 'Buraco grande na Av. Principal, altura do número 500. O problema existe há cerca de 2 semanas e está causando risco aos motoristas e pedestres. Já houve relatos de acidentes com motos e bicicletas.',
      endereco: 'Avenida Principal, 500', status: 'aberta', idade: 3, autorId: 1, apoiosBase: 9, apoios: [2, 4, 5], visualizacoes: 45,
      anexos: [{ nome: 'buraco_rua_1.jpg', tipo: 'image/jpeg', dataUrl: null }, { nome: 'buraco_rua_2.jpg', tipo: 'image/jpeg', dataUrl: null }],
      comentarios: [
        { usuarioId: 4, texto: 'Já entrei em contato com a prefeitura também.' },
        { usuarioId: 5, texto: 'Confirmado, passei por lá hoje e realmente está perigoso.' },
        { usuarioId: 2, texto: 'Problema continua no mesmo local, está piorando!' },
      ],
    });
    criar({
      tipo: 'reclamacao', titulo: 'Lixo acumulado', categoria: 'saneamento', bairro: 'Jardim Paulista',
      descricao: 'Acúmulo de lixo há 5 dias na esquina da Rua dos Ipês com a Av. Brasil. O lixo está atraindo animais e gerando mau cheiro. A coleta não está sendo feita regularmente.',
      endereco: 'Rua dos Ipês, esquina com Avenida Brasil', status: 'andamento', idade: 12, autorId: 1, apoiosBase: 9, apoios: [3], visualizacoes: 38,
      comentarios: [{ usuarioId: 3, texto: 'Moro perto e vejo isso todos os dias.' }],
    });
    criar({
      tipo: 'solicitacao', titulo: 'Iluminação pública apagada na praça', categoria: 'iluminacao', bairro: 'Centro',
      descricao: 'Dois postes da praça central estão sem funcionar há dias. O local fica escuro à noite.',
      endereco: 'Praça central', status: 'analise', idade: 5, autorId: 1, apoiosBase: 4, apoios: [], visualizacoes: 22,
    });
    criar({
      tipo: 'reclamacao', titulo: 'Animal abandonado', categoria: 'animal', bairro: 'Vila Nova',
      descricao: 'Cachorro ferido precisando de resgate urgente na Praça da Matriz. Animal aparenta ter sido atropelado e tem dificuldade de locomoção.',
      endereco: 'Praça da Matriz', status: 'concluida', idade: 40, resolucao: 4, autorId: 2, apoiosBase: 10, apoios: [], visualizacoes: 51,
    });

    /* Demais manifestações geradas aleatoriamente (repetíveis: semente fixa) */
    const catPesos = [['infraestrutura', 22], ['iluminacao', 12], ['saneamento', 18], ['meioambiente', 10], ['animal', 8], ['transito', 10], ['saude', 8], ['educacao', 4], ['outros', 3]];
    const bairroPesos = [['Centro', 20], ['Vila Nova', 14], ['Jardim Paulista', 12], ['Vila Rio Branco', 9], ['Vila Aparecida', 8], ['Jardim Marabá', 8], ['Vila Barth', 6], ['Vila Isabel', 6], ['Jardim Bela Vista', 5], ['Zona Rural', 3]];
    for (let i = 0; i < 86; i++) {
      const catId = wpick(catPesos);
      const m = pick(MODELOS[catId]);
      let bairro = wpick(bairroPesos);
      if (catId === 'infraestrutura' && rnd() < 0.35) bairro = 'Centro';
      if (catId === 'saneamento' && rnd() < 0.3) bairro = 'Jardim Paulista';
      const tipo = m[2] || (rnd() < 0.2 ? 'solicitacao' : 'reclamacao');
      const idade = i < 8 ? Math.floor(rnd() * 3) : Math.floor(Math.pow(rnd(), 1.35) * 200);
      const pConc = Math.min(0.9, 0.05 + idade / 140);
      let status;
      if (idade >= 1 && rnd() < pConc) status = 'concluida';
      else if (idade > 20) status = wpick([['andamento', 5], ['analise', 3], ['aberta', 3]]);
      else status = wpick([['aberta', 5], ['analise', 3], ['andamento', 2]]);
      if (idade < 1) status = 'aberta';
      const autorId = pick(cidadaos);
      const nComent = rnd() < 0.4 ? 1 + Math.floor(rnd() * 3) : 0;
      const comentarios = [];
      for (let c = 0; c < nComent; c++) comentarios.push({ usuarioId: pick(cidadaos), texto: pick(COMENTARIOS) });
      const apoiosBase = Math.floor(Math.pow(rnd(), 2) * 28);
      criar({
        tipo, titulo: m[0], descricao: m[1], categoria: catId, bairro,
        endereco: pick(RUAS) + ', ' + (10 + Math.floor(rnd() * 900)),
        status, idade, resolucao: 2 + Math.floor(rnd() * (rnd() < 0.2 ? 45 : 24)),
        autorId, anonima: tipo === 'denuncia' || rnd() < 0.1,
        apoiosBase, apoios: rnd() < 0.3 ? [pick(cidadaos)] : [],
        visualizacoes: apoiosBase * 3 + Math.floor(rnd() * 40),
        anexos: rnd() < 0.25 ? [{ nome: 'foto_1.jpg', tipo: 'image/jpeg', dataUrl: null }] : [],
        comentarios: tipo === 'denuncia' ? [] : comentarios,
      });
    }

    manifs.sort((a, b) => new Date(a.dataCriacao) - new Date(b.dataCriacao));
    let seqCom = 1;
    manifs.forEach((m, i) => {
      m.id = i + 1;
      m.protocolo = 'RA-' + new Date(m.dataCriacao).getFullYear() + '-' + String(i + 1).padStart(5, '0');
      m.comentarios.forEach((c) => { c.id = seqCom++; });
    });

    const joao = manifs.filter((m) => m.autorId === 1);
    const notificacoes = [];
    if (joao.length) {
      const alvo = joao.find((m) => m.status === 'andamento') || joao[0];
      notificacoes.push({ id: 1, usuarioId: 1, texto: 'Sua manifestação "' + alvo.titulo + '" (' + alvo.protocolo + ') foi encaminhada para ' + alvo.orgao + '.', manifestacaoId: alvo.id, data: iso(ago(2)), lida: false });
      notificacoes.push({ id: 2, usuarioId: 1, texto: 'Bem-vindo ao Resolve Aqui. Registre e acompanhe suas manifestações por aqui.', manifestacaoId: null, data: iso(ago(60)), lida: true });
    }

    return {
      v: 1,
      usuarios, manifestacoes: manifs, notificacoes, avaliacoes: [], tokens: [],
      seq: { usuario: 13, manifestacao: manifs.length + 1, comentario: seqCom, notificacao: 3, avaliacao: 1 },
    };
  };
})();
