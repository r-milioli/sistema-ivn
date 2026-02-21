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
 * Cadastrar criança (tab Cadastro Kids)
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
 * Listar cadastros Kids (para tabs Listar/Buscar)
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
      conditions.push(`(k.nome_crianca ILIKE $${idx} OR k.nome_responsavel ILIKE $${idx} OR k.bairro ILIKE $${idx} OR k.cidade ILIKE $${idx})`);
      params.push(`%${busca}%`);
      idx++;
    }
    if (dataVisita) {
      conditions.push(`(k.data_visita::date = $${idx})`);
      params.push(dataVisita);
      idx++;
    }
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
       ORDER BY k.data_visita DESC
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
  } catch (err) {
    console.error('Erro ao listar kids:', err);
    return res.status(500).json({
      message: err.message || 'Erro ao listar cadastros'
    });
  }
}

module.exports = {
  cadastrar,
  listar,
  uploadMiddleware
};
