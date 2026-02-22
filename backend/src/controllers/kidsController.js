const pool = require('../config/database');
const multer = require('multer');
const path = require('path');
const storageService = require('../services/storageService');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = /^image\/(jpeg|jpg|png)$/.test(file.mimetype);
    if (mimetype && extname) return cb(null, true);
    cb(new Error('Apenas imagens (JPEG, PNG) são permitidas.'));
  }
});

const uploadMiddleware = upload.fields([
  { name: 'fotoCrianca', maxCount: 1 },
  { name: 'fotoResponsavel', maxCount: 1 }
]);

function keyFoto(prefix) {
  return `kids/${prefix}-${Date.now()}-${Math.round(Math.random() * 1E9)}`;
}

/**
 * Calcula idade em "X anos e Y meses" a partir da data de nascimento
 */
function idadeEmTexto(dataNascimento) {
  if (!dataNascimento) return '';
  const nasc = new Date(dataNascimento);
  const hoje = new Date();
  let anos = hoje.getFullYear() - nasc.getFullYear();
  let meses = hoje.getMonth() - nasc.getMonth();
  if (meses < 0) {
    anos--;
    meses += 12;
  }
  if (hoje.getDate() < nasc.getDate()) meses--;
  if (meses < 0) {
    anos--;
    meses += 12;
  }
  if (anos === 0) return `${meses} ${meses === 1 ? 'mês' : 'meses'}`;
  return `${anos} ${anos === 1 ? 'ano' : 'anos'}${meses > 0 ? ` e ${meses} ${meses === 1 ? 'mês' : 'meses'}` : ''}`;
}

function rowToKid(row) {
  const idade = idadeEmTexto(row.data_nascimento_crianca);
  return {
    id: row.id,
    recepcionadoPor: row.recepcionado_por,
    dataVisita: row.data_visita,
    fotoCrianca: row.foto_crianca ? storageService.toPublicPath(row.foto_crianca) : null,
    nomeCrianca: row.nome_crianca,
    dataNascimentoCrianca: row.data_nascimento_crianca,
    idadeAtual: idade,
    fotoResponsavel: row.foto_responsavel ? storageService.toPublicPath(row.foto_responsavel) : null,
    nomeResponsavel: row.nome_responsavel,
    whatsappResponsavel: row.whatsapp_responsavel,
    bairro: row.bairro,
    cidade: row.cidade,
    criadoEm: row.criado_em,
    atualizadoEm: row.atualizado_em
  };
}

/**
 * Busca kid existente por nome da criança, data de nascimento e nome do responsável (normalizado).
 */
async function findKidExistente(nomeCrianca, dataNascimentoCrianca, nomeResponsavel) {
  const nc = String(nomeCrianca).trim().toLowerCase();
  const nr = String(nomeResponsavel).trim().toLowerCase();
  const result = await pool.query(
    `SELECT id, recepcionado_por, data_visita, foto_crianca, nome_crianca, data_nascimento_crianca,
            foto_responsavel, nome_responsavel, whatsapp_responsavel, bairro, cidade, criado_em, atualizado_em
     FROM kids_cadastro
     WHERE LOWER(TRIM(nome_crianca)) = $1 AND data_nascimento_crianca = $2 AND LOWER(TRIM(nome_responsavel)) = $3
     LIMIT 1`,
    [nc, dataNascimentoCrianca, nr]
  );
  return result.rows[0] || null;
}

/**
 * Cadastrar criança ou apenas adicionar frequência (tab Cadastro Kids).
 * Se o kid já existir (mesmo nome criança + data nasc. + nome responsável), só registra frequência naquele dia.
 */
async function cadastrar(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Usuário não autenticado' });
    }

    const {
      diaVisita,
      nomeCrianca,
      dataNascimentoCrianca,
      nomeResponsavel,
      whatsappResponsavel,
      bairro,
      cidade
    } = req.body;

    if (!nomeCrianca || !String(nomeCrianca).trim()) {
      return res.status(400).json({ message: 'Nome completo da criança é obrigatório' });
    }
    if (!dataNascimentoCrianca || !String(dataNascimentoCrianca).trim()) {
      return res.status(400).json({ message: 'Data de nascimento da criança é obrigatória' });
    }
    if (!nomeResponsavel || !String(nomeResponsavel).trim()) {
      return res.status(400).json({ message: 'Nome do responsável é obrigatório' });
    }
    if (!bairro || !String(bairro).trim()) {
      return res.status(400).json({ message: 'Bairro é obrigatório' });
    }
    if (!cidade || !String(cidade).trim()) {
      return res.status(400).json({ message: 'Cidade é obrigatória' });
    }

    const dataVisita = diaVisita ? new Date(diaVisita) : new Date();
    if (isNaN(dataVisita.getTime())) {
      return res.status(400).json({ message: 'Data da visita inválida' });
    }

    const existente = await findKidExistente(nomeCrianca, dataNascimentoCrianca, nomeResponsavel);
    if (existente) {
      await pool.query(
        `INSERT INTO kids_frequencia (kid_id, data_visita, recepcionado_por) VALUES ($1, $2, $3)`,
        [existente.id, dataVisita, userId]
      );
      const nomeRecep = await pool.query(
        `SELECT nome, sobrenome FROM pessoas WHERE id = $1`,
        [userId]
      ).then(r => r.rows[0] ? [r.rows[0].nome, r.rows[0].sobrenome].filter(Boolean).join(' ') : null);
      const rowComFrequencia = {
        ...existente,
        data_visita: dataVisita,
        recepcionado_por: nomeRecep || userId
      };
      return res.status(201).json({
        ...rowToKid(rowComFrequencia),
        message: 'Frequência adicionada para o dia (kid já cadastrado).'
      });
    }

    let fotoCriancaPath = null;
    let fotoResponsavelPath = null;

    if (req.files) {
      if (req.files.fotoCrianca && req.files.fotoCrianca[0]) {
        const file = req.files.fotoCrianca[0];
        const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
        const key = keyFoto('foto-crianca') + ext;
        fotoCriancaPath = await storageService.upload(key, file.buffer, file.mimetype);
      }
      if (req.files.fotoResponsavel && req.files.fotoResponsavel[0]) {
        const file = req.files.fotoResponsavel[0];
        const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
        const key = keyFoto('foto-responsavel') + ext;
        fotoResponsavelPath = await storageService.upload(key, file.buffer, file.mimetype);
      }
    }

    const result = await pool.query(
      `INSERT INTO kids_cadastro (
        recepcionado_por, data_visita, foto_crianca, nome_crianca, data_nascimento_crianca,
        foto_responsavel, nome_responsavel, whatsapp_responsavel, bairro, cidade
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id, recepcionado_por, data_visita, foto_crianca, nome_crianca, data_nascimento_crianca,
        foto_responsavel, nome_responsavel, whatsapp_responsavel, bairro, cidade, criado_em, atualizado_em`,
      [
        userId,
        dataVisita,
        fotoCriancaPath,
        String(nomeCrianca).trim(),
        dataNascimentoCrianca,
        fotoResponsavelPath,
        String(nomeResponsavel).trim(),
        whatsappResponsavel ? String(whatsappResponsavel).trim() : null,
        String(bairro).trim(),
        String(cidade).trim()
      ]
    );

    const row = result.rows[0];
    return res.status(201).json(rowToKid(row));
  } catch (err) {
    console.error('Erro ao cadastrar kid:', err);
    return res.status(500).json({
      message: err.message || 'Erro ao cadastrar criança'
    });
  }
}

/**
 * Listar Kids: dois modos
 * - Com dataVisita (tab Listar): retorna visitas (cadastro + frequências), uma linha por presença naquele dia.
 * - Sem dataVisita (tab Buscar): retorna apenas kids únicos da tabela kids_cadastro, um resultado por criança.
 * recepcionado_por na resposta é o nome da pessoa (JOIN com pessoas).
 */
async function listar(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;
    const busca = req.query.busca ? String(req.query.busca).trim() : '';
    const dataVisita = req.query.dataVisita ? String(req.query.dataVisita).trim() : '';

    const conditions = [];
    const params = [];
    let idx = 1;

    if (busca) {
      params.push(`%${busca}%`);
      idx++;
    }

    if (!dataVisita) {
      if (busca) {
        conditions.push(`(k.nome_crianca ILIKE $1 OR k.nome_responsavel ILIKE $1 OR k.bairro ILIKE $1 OR k.cidade ILIKE $1)`);
      }
      // Busca: apenas kids únicos da tabela kids_cadastro (um resultado por criança)
      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
      const countResult = await pool.query(
        `SELECT COUNT(*)::int AS total FROM kids_cadastro k ${where}`,
        params
      );
      const total = countResult.rows[0].total;

      const listParams = [...params, limit, offset];
      const limitNum = params.length + 1;
      const offsetNum = params.length + 2;
      const listResult = await pool.query(
        `SELECT k.id,
                COALESCE(TRIM(recep.nome || ' ' || COALESCE(recep.sobrenome, '')), '-') AS recepcionado_por,
                k.data_visita, k.foto_crianca, k.nome_crianca, k.data_nascimento_crianca,
                k.foto_responsavel, k.nome_responsavel, k.whatsapp_responsavel, k.bairro, k.cidade, k.criado_em, k.atualizado_em
         FROM kids_cadastro k
         LEFT JOIN pessoas recep ON k.recepcionado_por = recep.id
         ${where}
         ORDER BY k.criado_em DESC
         LIMIT $${limitNum} OFFSET $${offsetNum}`,
        listParams
      );
      const list = listResult.rows.map(rowToKid);
      return res.json({
        kids: list,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      });
    }

    // Listar por data: visitas (cadastro + frequências), uma linha por presença naquele dia
    params.push(dataVisita);
    const dataVisitaParamIdx = idx;
    idx++;
    const conditionsVisita = [];
    if (busca) {
      conditionsVisita.push(`(v.nome_crianca ILIKE $1 OR v.nome_responsavel ILIKE $1 OR v.bairro ILIKE $1 OR v.cidade ILIKE $1)`);
    }
    conditionsVisita.push(`(v.data_visita::date = $${dataVisitaParamIdx})`);
    const where = `WHERE ${conditionsVisita.join(' AND ')}`;

    const countSql = `
      WITH all_visits AS (
        SELECT k.id, k.foto_crianca, k.nome_crianca, k.data_nascimento_crianca, k.foto_responsavel,
               k.nome_responsavel, k.whatsapp_responsavel, k.bairro, k.cidade, k.criado_em, k.atualizado_em,
               k.data_visita, k.recepcionado_por
        FROM kids_cadastro k
        UNION ALL
        SELECT k.id, k.foto_crianca, k.nome_crianca, k.data_nascimento_crianca, k.foto_responsavel,
               k.nome_responsavel, k.whatsapp_responsavel, k.bairro, k.cidade, k.criado_em, k.atualizado_em,
               f.data_visita, f.recepcionado_por
        FROM kids_frequencia f
        JOIN kids_cadastro k ON f.kid_id = k.id
      )
      SELECT COUNT(*)::int AS total FROM all_visits v ${where}`;

    const countResult = await pool.query(countSql, params);
    const total = countResult.rows[0].total;

    const listParams = [...params, limit, offset];
    const limitNum = params.length + 1;
    const offsetNum = params.length + 2;
    const listSql = `
      WITH all_visits AS (
        SELECT k.id, k.foto_crianca, k.nome_crianca, k.data_nascimento_crianca, k.foto_responsavel,
               k.nome_responsavel, k.whatsapp_responsavel, k.bairro, k.cidade, k.criado_em, k.atualizado_em,
               k.data_visita, k.recepcionado_por
        FROM kids_cadastro k
        UNION ALL
        SELECT k.id, k.foto_crianca, k.nome_crianca, k.data_nascimento_crianca, k.foto_responsavel,
               k.nome_responsavel, k.whatsapp_responsavel, k.bairro, k.cidade, k.criado_em, k.atualizado_em,
               f.data_visita, f.recepcionado_por
        FROM kids_frequencia f
        JOIN kids_cadastro k ON f.kid_id = k.id
      )
      SELECT v.id,
             COALESCE(TRIM(recep.nome || ' ' || COALESCE(recep.sobrenome, '')), '-') AS recepcionado_por,
             v.data_visita, v.foto_crianca, v.nome_crianca, v.data_nascimento_crianca,
             v.foto_responsavel, v.nome_responsavel, v.whatsapp_responsavel, v.bairro, v.cidade, v.criado_em, v.atualizado_em
      FROM all_visits v
      LEFT JOIN pessoas recep ON v.recepcionado_por = recep.id
      ${where}
      ORDER BY v.data_visita DESC
      LIMIT $${limitNum} OFFSET $${offsetNum}`;

    const listResult = await pool.query(listSql, listParams);
    const list = listResult.rows.map(rowToKid);
    return res.json({
      kids: list,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    console.error('Erro ao listar kids:', err);
    return res.status(500).json({
      message: err.message || 'Erro ao listar cadastros'
    });
  }
}

/**
 * Estatísticas de Kids (por dia, mês, ano, bairro, dia da semana).
 * Conta visitas de kids_cadastro + kids_frequencia.
 */
async function obterEstatisticas(req, res) {
  try {
    const estatisticas = {};

    const visitasFrom = `(SELECT data_visita FROM kids_cadastro UNION ALL SELECT data_visita FROM kids_frequencia) v`;

    const porDia = await pool.query(`
      SELECT DATE(v.data_visita) AS data, COUNT(*)::int AS quantidade
      FROM ${visitasFrom}
      WHERE v.data_visita >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY DATE(v.data_visita)
      ORDER BY data ASC
    `);
    estatisticas.porDia = porDia.rows.map(row => ({
      data: new Date(row.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      quantidade: row.quantidade
    }));

    const porMes = await pool.query(`
      SELECT TO_CHAR(v.data_visita, 'Mon') AS mes, TO_CHAR(v.data_visita, 'MM') AS mes_numero, COUNT(*)::int AS quantidade
      FROM ${visitasFrom}
      WHERE v.data_visita >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY TO_CHAR(v.data_visita, 'Mon'), TO_CHAR(v.data_visita, 'MM')
      ORDER BY mes_numero ASC
    `);
    estatisticas.porMes = porMes.rows.map(row => ({
      mes: row.mes,
      quantidade: row.quantidade
    }));

    const porAno = await pool.query(`
      SELECT EXTRACT(YEAR FROM v.data_visita)::text AS ano, COUNT(*)::int AS quantidade
      FROM ${visitasFrom}
      WHERE v.data_visita >= CURRENT_DATE - INTERVAL '5 years'
      GROUP BY EXTRACT(YEAR FROM v.data_visita)
      ORDER BY ano ASC
    `);
    estatisticas.porAno = porAno.rows.map(row => ({
      ano: row.ano,
      quantidade: row.quantidade
    }));

    const porBairro = await pool.query(`
      SELECT k.bairro, COUNT(*)::int AS quantidade
      FROM (SELECT id AS kid_id, data_visita FROM kids_cadastro
            UNION ALL SELECT kid_id, data_visita FROM kids_frequencia) t
      JOIN kids_cadastro k ON k.id = t.kid_id
      WHERE k.bairro IS NOT NULL AND k.bairro != ''
      GROUP BY k.bairro
      ORDER BY quantidade DESC
      LIMIT 10
    `);
    const totalBairros = porBairro.rows.reduce((s, b) => s + b.quantidade, 0);
    estatisticas.porBairro = porBairro.rows.map(row => ({
      bairro: row.bairro,
      quantidade: row.quantidade,
      percentual: totalBairros > 0 ? ((row.quantidade / totalBairros) * 100).toFixed(1) : '0'
    }));

    const porDiaSemana = await pool.query(`
      SELECT TRIM(TO_CHAR(v.data_visita, 'Day')) AS dia, EXTRACT(DOW FROM v.data_visita)::int AS ordem, COUNT(*)::int AS quantidade
      FROM ${visitasFrom}
      GROUP BY TO_CHAR(v.data_visita, 'Day'), EXTRACT(DOW FROM v.data_visita)
      ORDER BY ordem ASC
    `);
    estatisticas.porDiaSemana = porDiaSemana.rows.map(row => ({
      dia: row.dia,
      quantidade: row.quantidade,
      ordem: row.ordem
    }));

    const resumo = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE DATE(v.data_visita) = CURRENT_DATE)::int AS hoje,
        COUNT(*) FILTER (WHERE date_trunc('month', v.data_visita) = date_trunc('month', CURRENT_DATE))::int AS mes_atual,
        COUNT(*) FILTER (WHERE EXTRACT(YEAR FROM v.data_visita) = EXTRACT(YEAR FROM CURRENT_DATE))::int AS ano_atual,
        COUNT(*)::int AS total
      FROM ${visitasFrom}
    `);
    const r = resumo.rows[0];
    estatisticas.resumo = {
      hoje: r.hoje || 0,
      mesAtual: r.mes_atual || 0,
      anoAtual: r.ano_atual || 0,
      total: r.total || 0
    };

    return res.json(estatisticas);
  } catch (err) {
    console.error('Erro ao obter estatísticas kids:', err);
    return res.status(500).json({ message: err.message || 'Erro ao obter estatísticas' });
  }
}

module.exports = {
  cadastrar,
  listar,
  obterEstatisticas,
  uploadMiddleware
};
