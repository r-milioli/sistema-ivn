const pool = require('../config/database');

/**
 * Criar novo relatório
 */
async function criarRelatorio(req, res) {
  try {
    const { nomeMinisterio, mesReferencia, conteudo } = req.body;
    const userId = req.user.id;

    // Validações básicas
    if (!nomeMinisterio || !mesReferencia || !conteudo) {
      return res.status(400).json({ 
        message: 'Campos obrigatórios: nomeMinisterio, mesReferencia, conteudo' 
      });
    }

    // Validar mês (01-12)
    const mesNum = parseInt(mesReferencia);
    if (isNaN(mesNum) || mesNum < 1 || mesNum > 12) {
      return res.status(400).json({ 
        message: 'mesReferencia deve ser um valor entre 01 e 12' 
      });
    }

    // Obter ano atual
    const anoReferencia = new Date().getFullYear();

    // Inserir relatório
    const result = await pool.query(
      `INSERT INTO relatorios (
        nome_ministerio, mes_referencia, ano_referencia, conteudo, criado_por
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, nome_ministerio, mes_referencia, ano_referencia, 
                conteudo, criado_por, criado_em, atualizado_em`,
      [
        nomeMinisterio,
        mesReferencia.padStart(2, '0'),
        anoReferencia,
        conteudo,
        userId
      ]
    );

    const relatorio = result.rows[0];

    res.status(201).json({
      message: 'Relatório criado com sucesso',
      relatorio
    });
  } catch (error) {
    console.error('Erro ao criar relatório:', error);
    res.status(500).json({ message: 'Erro ao criar relatório', error: error.message });
  }
}

/**
 * Listar relatórios com filtros
 */
async function listarRelatorios(req, res) {
  try {
    const { nomeMinisterio, mesReferencia, anoReferencia, page = 1, pageSize = 10 } = req.query;
    
    const pageNum = parseInt(page);
    const pageSizeNum = parseInt(pageSize);
    const offset = (pageNum - 1) * pageSizeNum;

    // Construir query base
    let query = `
      SELECT 
        r.id,
        r.nome_ministerio,
        r.mes_referencia,
        r.ano_referencia,
        r.arquivo_pdf_path,
        r.tamanho_arquivo,
        u.nome as criado_por_nome,
        r.criado_em,
        r.atualizado_em
      FROM relatorios r
      LEFT JOIN usuarios u ON r.criado_por = u.id
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramIndex = 1;

    // Aplicar filtros
    if (nomeMinisterio) {
      query += ` AND r.nome_ministerio ILIKE $${paramIndex}`;
      queryParams.push(`%${nomeMinisterio}%`);
      paramIndex++;
    }

    if (mesReferencia) {
      query += ` AND r.mes_referencia = $${paramIndex}`;
      queryParams.push(mesReferencia.padStart(2, '0'));
      paramIndex++;
    }

    if (anoReferencia) {
      query += ` AND r.ano_referencia = $${paramIndex}`;
      queryParams.push(parseInt(anoReferencia));
      paramIndex++;
    }

    // Contar total de registros
    const countQuery = query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM');
    const countResult = await pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Adicionar ordenação e paginação
    query += ` ORDER BY r.ano_referencia DESC, r.mes_referencia DESC, r.criado_em DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(pageSizeNum, offset);

    // Executar query
    const result = await pool.query(query, queryParams);

    // Formatar dados para o frontend
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                   'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    
    const relatorios = result.rows.map(row => ({
      id: row.id,
      nomeMinisterio: row.nome_ministerio,
      mesReferencia: meses[parseInt(row.mes_referencia) - 1] || row.mes_referencia,
      anoReferencia: row.ano_referencia,
      dataGeracao: new Date(row.criado_em).toLocaleDateString('pt-BR'),
      tamanho: row.tamanho_arquivo || 'N/A',
      criadoPor: row.criado_por_nome,
      arquivoPdfPath: row.arquivo_pdf_path
    }));

    res.json({
      relatorios,
      pagination: {
        page: pageNum,
        pageSize: pageSizeNum,
        total,
        totalPages: Math.ceil(total / pageSizeNum)
      }
    });
  } catch (error) {
    console.error('Erro ao listar relatórios:', error);
    res.status(500).json({ message: 'Erro ao listar relatórios', error: error.message });
  }
}

/**
 * Obter relatório por ID
 */
async function obterRelatorioPorId(req, res) {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT 
        r.id,
        r.nome_ministerio,
        r.mes_referencia,
        r.ano_referencia,
        r.conteudo,
        r.arquivo_pdf_path,
        r.tamanho_arquivo,
        u.nome as criado_por_nome,
        r.criado_por,
        r.criado_em,
        r.atualizado_em
      FROM relatorios r
      LEFT JOIN usuarios u ON r.criado_por = u.id
      WHERE r.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Relatório não encontrado' });
    }

    const relatorio = result.rows[0];
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                   'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

    res.json({
      relatorio: {
        id: relatorio.id,
        nomeMinisterio: relatorio.nome_ministerio,
        mesReferencia: meses[parseInt(relatorio.mes_referencia) - 1] || relatorio.mes_referencia,
        anoReferencia: relatorio.ano_referencia,
        conteudo: relatorio.conteudo,
        arquivoPdfPath: relatorio.arquivo_pdf_path,
        tamanho: relatorio.tamanho_arquivo,
        criadoPor: relatorio.criado_por_nome,
        criadoEm: relatorio.criado_em,
        atualizadoEm: relatorio.atualizado_em
      }
    });
  } catch (error) {
    console.error('Erro ao obter relatório:', error);
    res.status(500).json({ message: 'Erro ao obter relatório', error: error.message });
  }
}

/**
 * Atualizar relatório existente
 */
async function atualizarRelatorio(req, res) {
  try {
    const { id } = req.params;
    const { nomeMinisterio, mesReferencia, conteudo } = req.body;
    const userId = req.user.id;

    // Validações básicas
    if (!nomeMinisterio || !mesReferencia || !conteudo) {
      return res.status(400).json({ 
        message: 'Campos obrigatórios: nomeMinisterio, mesReferencia, conteudo' 
      });
    }

    // Validar mês (01-12)
    const mesNum = parseInt(mesReferencia);
    if (isNaN(mesNum) || mesNum < 1 || mesNum > 12) {
      return res.status(400).json({ 
        message: 'mesReferencia deve ser um valor entre 01 e 12' 
      });
    }

    // Verificar se o relatório existe e se o usuário tem permissão (criador ou admin)
    const relatorioExistente = await pool.query(
      'SELECT criado_por FROM relatorios WHERE id = $1',
      [id]
    );

    if (relatorioExistente.rows.length === 0) {
      return res.status(404).json({ message: 'Relatório não encontrado' });
    }

    // Verificar se o usuário é o criador do relatório (ou admin - pode ser implementado depois)
    if (relatorioExistente.rows[0].criado_por !== userId) {
      return res.status(403).json({ 
        message: 'Você não tem permissão para editar este relatório' 
      });
    }

    // Obter ano atual
    const anoReferencia = new Date().getFullYear();

    // Atualizar relatório
    const result = await pool.query(
      `UPDATE relatorios 
       SET nome_ministerio = $1, 
           mes_referencia = $2, 
           ano_referencia = $3, 
           conteudo = $4,
           atualizado_em = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING id, nome_ministerio, mes_referencia, ano_referencia, 
                 conteudo, criado_por, criado_em, atualizado_em`,
      [
        nomeMinisterio,
        mesReferencia.padStart(2, '0'),
        anoReferencia,
        conteudo,
        id
      ]
    );

    const relatorio = result.rows[0];

    res.json({
      message: 'Relatório atualizado com sucesso',
      relatorio
    });
  } catch (error) {
    console.error('Erro ao atualizar relatório:', error);
    res.status(500).json({ message: 'Erro ao atualizar relatório', error: error.message });
  }
}

/**
 * Download de relatório (retorna o conteúdo HTML ou redireciona para PDF)
 */
async function downloadRelatorio(req, res) {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT 
        id,
        nome_ministerio,
        mes_referencia,
        ano_referencia,
        conteudo,
        arquivo_pdf_path
      FROM relatorios
      WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Relatório não encontrado' });
    }

    const relatorio = result.rows[0];

    // Se tiver arquivo PDF, redirecionar para ele
    if (relatorio.arquivo_pdf_path) {
      return res.redirect(relatorio.arquivo_pdf_path);
    }

    // Caso contrário, retornar o conteúdo HTML
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="relatorio_${relatorio.nome_ministerio}_${relatorio.mes_referencia}_${relatorio.ano_referencia}.html"`
    );
    
    res.send(relatorio.conteudo);
  } catch (error) {
    console.error('Erro ao fazer download do relatório:', error);
    res.status(500).json({ message: 'Erro ao fazer download do relatório', error: error.message });
  }
}

module.exports = {
  criarRelatorio,
  listarRelatorios,
  obterRelatorioPorId,
  atualizarRelatorio,
  downloadRelatorio,
};
