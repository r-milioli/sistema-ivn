const pool = require('../config/database');
const multer = require('multer');
const path = require('path');
const storageService = require('../services/storageService');

// Multer em memória para permitir upload direto para S3 ou gravar em disco via storageService
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) return cb(null, true);
    cb(new Error('Tipo de arquivo não permitido. Apenas imagens, PDF e documentos são aceitos.'));
  }
});

const uploadMiddleware = upload.single('comprovante');

function comprovanteKey() {
  return `comprovantes/comprovante-${Date.now()}-${Math.round(Math.random() * 1E9)}`;
}

/**
 * Criar nova saída financeira
 */
async function criarSaida(req, res) {
  try {
    const { valor, dataSaida, motivo, ministerio, tipoBancoId } = req.body;
    const userId = req.user.id;

    // Validações básicas
    if (!valor || !dataSaida || !motivo || !ministerio) {
      return res.status(400).json({ 
        message: 'Campos obrigatórios: valor, dataSaida, motivo, ministerio' 
      });
    }

    const valorNum = parseFloat(valor);
    if (isNaN(valorNum) || valorNum <= 0) {
      return res.status(400).json({ 
        message: 'Valor deve ser um número positivo' 
      });
    }

    // Verificar se o ministério existe
    const ministerioCheck = await pool.query(
      'SELECT id FROM ministerios WHERE id = $1',
      [parseInt(ministerio)]
    );

    if (ministerioCheck.rows.length === 0) {
      return res.status(400).json({ 
        message: 'Ministério não encontrado' 
      });
    }

    let comprovanteNome = null;
    let comprovantePath = null;

    if (req.file) {
      comprovanteNome = req.file.originalname;
      const ext = path.extname(req.file.originalname).toLowerCase() || '';
      const key = comprovanteKey() + ext;
      comprovantePath = await storageService.upload(key, req.file.buffer, req.file.mimetype);
    }

    let tipoBancoIdNum = null;
    if (tipoBancoId != null && tipoBancoId !== '') {
      tipoBancoIdNum = parseInt(tipoBancoId, 10);
      if (isNaN(tipoBancoIdNum) || tipoBancoIdNum < 1) tipoBancoIdNum = null;
      else {
        const tbCheck = await pool.query('SELECT id FROM tipos_banco WHERE id = $1 AND ativo = TRUE', [tipoBancoIdNum]);
        if (tbCheck.rows.length === 0) tipoBancoIdNum = null;
      }
    }

    // Inserir saída financeira (schema jornada única: registrado_por referencia pessoas)
    const result = await pool.query(
      `INSERT INTO saidas_financeiras (
        valor, data_saida, motivo, ministerio_id, comprovante_nome, comprovante_path, registrado_por, tipo_banco_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, valor, data_saida, motivo, ministerio_id, comprovante_nome, comprovante_path, registrado_por, tipo_banco_id, criado_em, atualizado_em`,
      [valorNum, dataSaida, motivo.trim(), parseInt(ministerio), comprovanteNome, comprovantePath, userId, tipoBancoIdNum]
    );

    const saida = result.rows[0];

    // Buscar nome do ministério
    const ministerioNome = await pool.query(
      'SELECT nome FROM ministerios WHERE id = $1',
      [saida.ministerio_id]
    );
    let tipoBanco = null;
    if (saida.tipo_banco_id) {
      const tb = await pool.query('SELECT id, nome FROM tipos_banco WHERE id = $1', [saida.tipo_banco_id]);
      if (tb.rows.length > 0) tipoBanco = { id: tb.rows[0].id, nome: tb.rows[0].nome };
    }

    res.status(201).json({
      message: 'Saída financeira criada com sucesso',
      saida: {
        id: saida.id,
        valor: parseFloat(saida.valor),
        dataSaida: saida.data_saida,
        motivo: saida.motivo,
        ministerio: ministerioNome.rows[0].nome,
        ministerioId: saida.ministerio_id,
        tipoBancoId: saida.tipo_banco_id,
        tipoBanco,
        comprovanteNome: saida.comprovante_nome,
        comprovantePath: storageService.toPublicPath(saida.comprovante_path),
        criadoPor: saida.criado_por,
        criadoEm: saida.criado_em,
        atualizadoEm: saida.atualizado_em
      }
    });
  } catch (error) {
    console.error('Erro ao criar saída financeira:', error);
    res.status(500).json({ message: 'Erro ao criar saída financeira', error: error.message });
  }
}

/**
 * Listar saídas financeiras com filtros e paginação
 */
async function listarSaidas(req, res) {
  try {
    const { ministerio, dataInicio, dataFim, page = 1, pageSize = 10 } = req.query;
    
    const pageNum = parseInt(page);
    const pageSizeNum = parseInt(pageSize);
    const offset = (pageNum - 1) * pageSizeNum;

    // Construir query base
    let query = `
      SELECT 
        s.id,
        s.valor,
        s.data_saida,
        s.motivo,
        s.ministerio_id,
        s.tipo_banco_id,
        tb.nome as tipo_banco_nome,
        s.comprovante_nome,
        s.comprovante_path,
        s.registrado_por,
        s.criado_em,
        s.atualizado_em,
        m.nome as ministerio_nome
      FROM saidas_financeiras s
      JOIN ministerios m ON s.ministerio_id = m.id
      LEFT JOIN tipos_banco tb ON s.tipo_banco_id = tb.id
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramIndex = 1;

    // Aplicar filtros
    if (ministerio) {
      query += ` AND s.ministerio_id = $${paramIndex}`;
      queryParams.push(parseInt(ministerio));
      paramIndex++;
    }

    if (dataInicio) {
      query += ` AND s.data_saida >= $${paramIndex}`;
      queryParams.push(dataInicio);
      paramIndex++;
    }

    if (dataFim) {
      query += ` AND s.data_saida <= $${paramIndex}`;
      queryParams.push(dataFim);
      paramIndex++;
    }

    // Contar total de registros
    const countQuery = query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM');
    const countResult = await pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Adicionar ordenação e paginação
    query += ` ORDER BY s.data_saida DESC, s.criado_em DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(pageSizeNum, offset);

    // Executar query
    const result = await pool.query(query, queryParams);

    const saidas = result.rows.map(row => ({
      id: row.id,
      valor: parseFloat(row.valor),
      dataSaida: row.data_saida,
      motivo: row.motivo,
      ministerio: row.ministerio_nome,
      ministerioId: row.ministerio_id,
      tipoBancoId: row.tipo_banco_id,
      tipoBanco: row.tipo_banco_id ? { id: row.tipo_banco_id, nome: row.tipo_banco_nome } : null,
      comprovanteNome: row.comprovante_nome,
      comprovantePath: storageService.toPublicPath(row.comprovante_path),
      registradoPor: row.registrado_por,
      criadoEm: row.criado_em,
      atualizadoEm: row.atualizado_em
    }));

    res.json({
      saidas,
      pagination: {
        page: pageNum,
        pageSize: pageSizeNum,
        total,
        totalPages: Math.ceil(total / pageSizeNum)
      }
    });
  } catch (error) {
    console.error('Erro ao listar saídas financeiras:', error);
    res.status(500).json({ message: 'Erro ao listar saídas financeiras', error: error.message });
  }
}

/**
 * Obter saída financeira por ID
 */
async function obterSaidaPorId(req, res) {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT 
        s.id,
        s.valor,
        s.data_saida,
        s.motivo,
        s.ministerio_id,
        s.tipo_banco_id,
        tb.nome as tipo_banco_nome,
        s.comprovante_nome,
        s.comprovante_path,
        s.registrado_por,
        s.criado_em,
        s.atualizado_em,
        m.nome as ministerio_nome
      FROM saidas_financeiras s
      JOIN ministerios m ON s.ministerio_id = m.id
      LEFT JOIN tipos_banco tb ON s.tipo_banco_id = tb.id
      WHERE s.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Saída financeira não encontrada' });
    }

    const saida = result.rows[0];

    res.json({
      saida: {
        id: saida.id,
        valor: parseFloat(saida.valor),
        dataSaida: saida.data_saida,
        motivo: saida.motivo,
        ministerio: saida.ministerio_nome,
        ministerioId: saida.ministerio_id,
        tipoBancoId: saida.tipo_banco_id,
        tipoBanco: saida.tipo_banco_id ? { id: saida.tipo_banco_id, nome: saida.tipo_banco_nome } : null,
        comprovanteNome: saida.comprovante_nome,
        comprovantePath: storageService.toPublicPath(saida.comprovante_path),
        criadoPor: saida.criado_por,
        criadoEm: saida.criado_em,
        atualizadoEm: saida.atualizado_em
      }
    });
  } catch (error) {
    console.error('Erro ao obter saída financeira:', error);
    res.status(500).json({ message: 'Erro ao obter saída financeira', error: error.message });
  }
}

/**
 * Atualizar saída financeira
 */
async function atualizarSaida(req, res) {
  try {
    const { id } = req.params;
    const { valor, dataSaida, motivo, ministerio, tipoBancoId } = req.body;
    const userId = req.user.id;

    // Validações básicas
    if (!valor || !dataSaida || !motivo || !ministerio) {
      return res.status(400).json({ 
        message: 'Campos obrigatórios: valor, dataSaida, motivo, ministerio' 
      });
    }

    const valorNum = parseFloat(valor);
    if (isNaN(valorNum) || valorNum <= 0) {
      return res.status(400).json({ 
        message: 'Valor deve ser um número positivo' 
      });
    }

    // Verificar se a saída existe e se o usuário tem permissão
    const saidaExistente = await pool.query(
      'SELECT registrado_por, comprovante_nome, comprovante_path FROM saidas_financeiras WHERE id = $1',
      [id]
    );

    if (saidaExistente.rows.length === 0) {
      return res.status(404).json({ message: 'Saída financeira não encontrada' });
    }

    // Verificar se o usuário é o criador
    if (saidaExistente.rows[0].registrado_por !== userId) {
      return res.status(403).json({
        message: 'Você não tem permissão para editar esta saída'
      });
    }

    // Verificar se o ministério existe
    const ministerioCheck = await pool.query(
      'SELECT id FROM ministerios WHERE id = $1',
      [parseInt(ministerio)]
    );

    if (ministerioCheck.rows.length === 0) {
      return res.status(400).json({ 
        message: 'Ministério não encontrado' 
      });
    }

    let comprovanteNome = saidaExistente.rows[0].comprovante_nome;
    let comprovantePath = saidaExistente.rows[0].comprovante_path;

    if (req.file) {
      if (comprovantePath) {
        await storageService.deleteFile(comprovantePath);
      }
      comprovanteNome = req.file.originalname;
      const ext = path.extname(req.file.originalname).toLowerCase() || '';
      comprovantePath = await storageService.upload(comprovanteKey() + ext, req.file.buffer, req.file.mimetype);
    }

    let tipoBancoIdNum = null;
    if (tipoBancoId != null && tipoBancoId !== '') {
      tipoBancoIdNum = parseInt(tipoBancoId, 10);
      if (!isNaN(tipoBancoIdNum) && tipoBancoIdNum >= 1) {
        const tbCheck = await pool.query('SELECT id FROM tipos_banco WHERE id = $1 AND ativo = TRUE', [tipoBancoIdNum]);
        if (tbCheck.rows.length === 0) tipoBancoIdNum = null;
      } else tipoBancoIdNum = null;
    }

    // Atualizar saída
    const result = await pool.query(
      `UPDATE saidas_financeiras 
       SET valor = $1, 
           data_saida = $2, 
           motivo = $3, 
           ministerio_id = $4,
           comprovante_nome = $5,
           comprovante_path = $6,
           tipo_banco_id = $7,
           atualizado_em = CURRENT_TIMESTAMP
       WHERE id = $8
       RETURNING id, valor, data_saida, motivo, ministerio_id, tipo_banco_id, comprovante_nome, comprovante_path, registrado_por, criado_em, atualizado_em`,
      [valorNum, dataSaida, motivo.trim(), parseInt(ministerio), comprovanteNome, comprovantePath, tipoBancoIdNum, id]
    );

    // Buscar nome do ministério
    const ministerioNome = await pool.query(
      'SELECT nome FROM ministerios WHERE id = $1',
      [result.rows[0].ministerio_id]
    );
    let tipoBanco = null;
    if (result.rows[0].tipo_banco_id) {
      const tb = await pool.query('SELECT id, nome FROM tipos_banco WHERE id = $1', [result.rows[0].tipo_banco_id]);
      if (tb.rows.length > 0) tipoBanco = { id: tb.rows[0].id, nome: tb.rows[0].nome };
    }

    const row = result.rows[0];
    res.json({
      message: 'Saída financeira atualizada com sucesso',
      saida: {
        id: row.id,
        valor: parseFloat(row.valor),
        dataSaida: row.data_saida,
        motivo: row.motivo,
        ministerio: ministerioNome.rows[0].nome,
        ministerioId: row.ministerio_id,
        tipoBancoId: row.tipo_banco_id,
        tipoBanco,
        comprovanteNome: row.comprovante_nome,
        comprovantePath: storageService.toPublicPath(row.comprovante_path),
        criadoEm: row.criado_em,
        atualizadoEm: row.atualizado_em
      }
    });
  } catch (error) {
    console.error('Erro ao atualizar saída financeira:', error);
    res.status(500).json({ message: 'Erro ao atualizar saída financeira', error: error.message });
  }
}

/**
 * Deletar saída financeira
 */
async function deletarSaida(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verificar se a saída existe e se o usuário tem permissão
    const saidaExistente = await pool.query(
      'SELECT registrado_por, comprovante_path FROM saidas_financeiras WHERE id = $1',
      [id]
    );

    if (saidaExistente.rows.length === 0) {
      return res.status(404).json({ message: 'Saída financeira não encontrada' });
    }

    // Verificar se o usuário é o criador
    if (saidaExistente.rows[0].registrado_por !== userId) {
      return res.status(403).json({ 
        message: 'Você não tem permissão para deletar esta saída' 
      });
    }

    if (saidaExistente.rows[0].comprovante_path) {
      await storageService.deleteFile(saidaExistente.rows[0].comprovante_path);
    }

    // Deletar saída
    await pool.query('DELETE FROM saidas_financeiras WHERE id = $1', [id]);

    res.json({ message: 'Saída financeira deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar saída financeira:', error);
    res.status(500).json({ message: 'Erro ao deletar saída financeira', error: error.message });
  }
}

module.exports = {
  criarSaida,
  listarSaidas,
  obterSaidaPorId,
  atualizarSaida,
  deletarSaida,
  uploadMiddleware,
};
