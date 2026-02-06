const pool = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuração do multer para upload de arquivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/comprovantes');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `comprovante-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido. Apenas imagens, PDF e documentos são aceitos.'));
    }
  }
});

// Middleware de upload (será usado nas rotas)
const uploadMiddleware = upload.single('comprovante');

/**
 * Criar nova saída financeira
 */
async function criarSaida(req, res) {
  try {
    const { valor, dataSaida, motivo, ministerio } = req.body;
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

    // Processar arquivo se houver
    let comprovanteNome = null;
    let comprovantePath = null;

    if (req.file) {
      comprovanteNome = req.file.originalname;
      comprovantePath = `/uploads/comprovantes/${req.file.filename}`;
    }

    // Inserir saída financeira (schema jornada única: registrado_por referencia pessoas)
    const result = await pool.query(
      `INSERT INTO saidas_financeiras (
        valor, data_saida, motivo, ministerio_id, comprovante_nome, comprovante_path, registrado_por
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, valor, data_saida, motivo, ministerio_id, comprovante_nome, comprovante_path, registrado_por, criado_em, atualizado_em`,
      [valorNum, dataSaida, motivo.trim(), parseInt(ministerio), comprovanteNome, comprovantePath, userId]
    );

    const saida = result.rows[0];

    // Buscar nome do ministério
    const ministerioNome = await pool.query(
      'SELECT nome FROM ministerios WHERE id = $1',
      [saida.ministerio_id]
    );

    res.status(201).json({
      message: 'Saída financeira criada com sucesso',
      saida: {
        id: saida.id,
        valor: parseFloat(saida.valor),
        dataSaida: saida.data_saida,
        motivo: saida.motivo,
        ministerio: ministerioNome.rows[0].nome,
        ministerioId: saida.ministerio_id,
        comprovanteNome: saida.comprovante_nome,
        comprovantePath: saida.comprovante_path,
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
        s.comprovante_nome,
        s.comprovante_path,
        s.registrado_por,
        s.criado_em,
        s.atualizado_em,
        m.nome as ministerio_nome
      FROM saidas_financeiras s
      JOIN ministerios m ON s.ministerio_id = m.id
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
      comprovanteNome: row.comprovante_nome,
      comprovantePath: row.comprovante_path,
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
        s.comprovante_nome,
        s.comprovante_path,
        s.registrado_por,
        s.criado_em,
        s.atualizado_em,
        m.nome as ministerio_nome
      FROM saidas_financeiras s
      JOIN ministerios m ON s.ministerio_id = m.id
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
        comprovanteNome: saida.comprovante_nome,
        comprovantePath: saida.comprovante_path,
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
    const { valor, dataSaida, motivo, ministerio } = req.body;
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
      'SELECT registrado_por, comprovante_path FROM saidas_financeiras WHERE id = $1',
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

    // Processar novo arquivo se houver
    let comprovanteNome = saidaExistente.rows[0].comprovante_path ? 
      saidaExistente.rows[0].comprovante_path.split('/').pop() : null;
    let comprovantePath = saidaExistente.rows[0].comprovante_path;

    if (req.file) {
      // Deletar arquivo antigo se existir
      if (comprovantePath) {
        const oldFilePath = path.join(__dirname, '../../', comprovantePath);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }

      comprovanteNome = req.file.originalname;
      comprovantePath = `/uploads/comprovantes/${req.file.filename}`;
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
           atualizado_em = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING id, valor, data_saida, motivo, ministerio_id, comprovante_nome, comprovante_path, registrado_por, criado_em, atualizado_em`,
      [valorNum, dataSaida, motivo.trim(), parseInt(ministerio), comprovanteNome, comprovantePath, id]
    );

    // Buscar nome do ministério
    const ministerioNome = await pool.query(
      'SELECT nome FROM ministerios WHERE id = $1',
      [result.rows[0].ministerio_id]
    );

    res.json({
      message: 'Saída financeira atualizada com sucesso',
      saida: {
        ...result.rows[0],
        valor: parseFloat(result.rows[0].valor),
        ministerio: ministerioNome.rows[0].nome
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

    // Deletar arquivo de comprovante se existir
    if (saidaExistente.rows[0].comprovante_path) {
      const filePath = path.join(__dirname, '../../', saidaExistente.rows[0].comprovante_path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
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
