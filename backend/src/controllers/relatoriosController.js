const pool = require('../config/database');

/**
 * Criar novo relatório
 */
async function criarRelatorio(req, res) {
  try {
    const { nomeMinisterio, mesReferencia, conteudo, pastorLiderId } = req.body;
    const userId = req.user.id;

    // Validações básicas (nomeMinisterio é opcional)
    if (!mesReferencia || !conteudo) {
      return res.status(400).json({ 
        message: 'Campos obrigatórios: mesReferencia, conteudo' 
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

    // Buscar ministerio_id pelo nome (ou criar se não existir - opcional)
    let ministerioId = null;
    if (nomeMinisterio) {
      const ministerioResult = await pool.query(
        'SELECT id FROM ministerios WHERE nome ILIKE $1 LIMIT 1',
        [`%${nomeMinisterio}%`]
      );
      if (ministerioResult.rows.length > 0) {
        ministerioId = ministerioResult.rows[0].id;
      }
    }

    // Validar pastor_lider_id se fornecido
    if (pastorLiderId) {
      const pastorCheck = await pool.query(
        'SELECT id, cargo_eclesiastico FROM pessoas WHERE id = $1 AND cargo_eclesiastico = $2',
        [pastorLiderId, 'Pastor lider']
      );
      if (pastorCheck.rows.length === 0) {
        return res.status(400).json({ 
          message: 'A pessoa selecionada não possui o cargo "Pastor lider"' 
        });
      }
    }

    // Verificar se a coluna pastor_lider_id existe
    const colunaExiste = await pool.query(
      `SELECT 1 FROM information_schema.columns 
       WHERE table_name = 'relatorios' AND column_name = 'pastor_lider_id'`
    );
    const temPastorLider = colunaExiste.rows.length > 0;

    // Inserir relatório (schema jornada única: usa titulo e ministerio_id)
    let insertQuery, insertValues;
    if (temPastorLider) {
      insertQuery = `INSERT INTO relatorios (
        titulo, ministerio_id, mes_referencia, ano_referencia, conteudo, pastor_lider_id, criado_por
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, titulo, ministerio_id, mes_referencia, ano_referencia, 
                conteudo, pastor_lider_id, criado_por, criado_em, atualizado_em`;
      insertValues = [
        nomeMinisterio || 'Sem Ministério', // Usado como titulo, permite vazio
        ministerioId,
        mesReferencia.padStart(2, '0'),
        anoReferencia,
        conteudo,
        pastorLiderId || null,
        userId
      ];
    } else {
      insertQuery = `INSERT INTO relatorios (
        titulo, ministerio_id, mes_referencia, ano_referencia, conteudo, criado_por
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, titulo, ministerio_id, mes_referencia, ano_referencia, 
                conteudo, criado_por, criado_em, atualizado_em`;
      insertValues = [
        nomeMinisterio || 'Sem Ministério', // Usado como titulo, permite vazio
        ministerioId,
        mesReferencia.padStart(2, '0'),
        anoReferencia,
        conteudo,
        userId
      ];
    }
    
    const result = await pool.query(insertQuery, insertValues);

    const relatorio = result.rows[0];

    res.status(201).json({
      message: 'Relatório criado com sucesso',
      relatorio: {
        ...relatorio,
        nomeMinisterio: relatorio.titulo // Mantém compatibilidade com frontend
      }
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
    const { nomeMinisterio, mesReferencia, anoReferencia, pastorLiderId, page = 1, pageSize = 10 } = req.query;
    
    const pageNum = parseInt(page);
    const pageSizeNum = parseInt(pageSize);
    const offset = (pageNum - 1) * pageSizeNum;

    // Verificar se a coluna pastor_lider_id existe
    const colunaExiste = await pool.query(
      `SELECT 1 FROM information_schema.columns 
       WHERE table_name = 'relatorios' AND column_name = 'pastor_lider_id'`
    );
    const temPastorLider = colunaExiste.rows.length > 0;

    // Construir query base (schema jornada única - usa titulo e ministerio_id)
    let query = `
      SELECT 
        r.id,
        r.titulo as nome_ministerio,
        COALESCE(m.nome, r.titulo) as nome_ministerio_display,
        r.mes_referencia,
        r.ano_referencia,
        r.arquivo_pdf_path,
        r.tamanho_arquivo,
        `;
    
    if (temPastorLider) {
      query += `r.pastor_lider_id,
        CONCAT(pl.nome, ' ', COALESCE(pl.sobrenome, '')) as pastor_lider_nome,`;
    } else {
      query += `NULL as pastor_lider_id,
        NULL as pastor_lider_nome,`;
    }
    
    query += `
        CONCAT(p.nome, ' ', COALESCE(p.sobrenome, '')) as criado_por_nome,
        r.criado_em,
        r.atualizado_em
      FROM relatorios r
      LEFT JOIN pessoas p ON r.criado_por = p.id
      LEFT JOIN ministerios m ON r.ministerio_id = m.id`;
    
    if (temPastorLider) {
      query += `
      LEFT JOIN pessoas pl ON r.pastor_lider_id = pl.id`;
    }
    
    query += `
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramIndex = 1;

    // Aplicar filtros
    if (nomeMinisterio) {
      query += ` AND (r.titulo ILIKE $${paramIndex} OR m.nome ILIKE $${paramIndex})`;
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

    // Filtro por pastor líder (para tab "Atribuído a Mim")
    if (pastorLiderId && temPastorLider) {
      query += ` AND r.pastor_lider_id = $${paramIndex}`;
      queryParams.push(parseInt(pastorLiderId));
      paramIndex++;
    }

    // Contar total de registros (query separada para garantir correção)
    let countQuery = `
      SELECT COUNT(*) as total
      FROM relatorios r
      LEFT JOIN pessoas p ON r.criado_por = p.id
      LEFT JOIN ministerios m ON r.ministerio_id = m.id
      WHERE 1=1
    `;
    
    // Aplicar os mesmos filtros na query de contagem
    const countParams = [];
    let countParamIndex = 1;
    
    if (nomeMinisterio) {
      countQuery += ` AND (r.titulo ILIKE $${countParamIndex} OR m.nome ILIKE $${countParamIndex})`;
      countParams.push(`%${nomeMinisterio}%`);
      countParamIndex++;
    }
    
    if (mesReferencia) {
      countQuery += ` AND r.mes_referencia = $${countParamIndex}`;
      countParams.push(mesReferencia.padStart(2, '0'));
      countParamIndex++;
    }
    
    if (anoReferencia) {
      countQuery += ` AND r.ano_referencia = $${countParamIndex}`;
      countParams.push(parseInt(anoReferencia));
      countParamIndex++;
    }

    // Aplicar filtro de pastor líder na contagem também
    if (pastorLiderId && temPastorLider) {
      countQuery += ` AND r.pastor_lider_id = $${countParamIndex}`;
      countParams.push(parseInt(pastorLiderId));
      countParamIndex++;
    }
    
    const countResult = await pool.query(countQuery, countParams);
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
      nomeMinisterio: row.nome_ministerio_display || row.nome_ministerio,
      mesReferencia: meses[parseInt(row.mes_referencia) - 1] || row.mes_referencia,
      anoReferencia: row.ano_referencia,
      dataGeracao: new Date(row.criado_em).toLocaleDateString('pt-BR'),
      tamanho: row.tamanho_arquivo || 'N/A',
      criadoPor: row.criado_por_nome,
      arquivoPdfPath: row.arquivo_pdf_path,
      pastorLiderId: row.pastor_lider_id,
      pastorLiderNome: row.pastor_lider_nome
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

    // Verificar se a coluna pastor_lider_id existe
    const colunaExiste = await pool.query(
      `SELECT 1 FROM information_schema.columns 
       WHERE table_name = 'relatorios' AND column_name = 'pastor_lider_id'`
    );
    const temPastorLider = colunaExiste.rows.length > 0;

    let query = `
      SELECT 
        r.id,
        r.titulo as nome_ministerio,
        COALESCE(m.nome, r.titulo) as nome_ministerio_display,
        r.mes_referencia,
        r.ano_referencia,
        r.conteudo,
        r.arquivo_pdf_path,
        r.tamanho_arquivo,
        `;
    
    if (temPastorLider) {
      query += `r.pastor_lider_id,
        CONCAT(pl.nome, ' ', COALESCE(pl.sobrenome, '')) as pastor_lider_nome,`;
    } else {
      query += `NULL as pastor_lider_id,
        NULL as pastor_lider_nome,`;
    }
    
    query += `
        CONCAT(p.nome, ' ', COALESCE(p.sobrenome, '')) as criado_por_nome,
        r.criado_por,
        r.criado_em,
        r.atualizado_em
      FROM relatorios r
      LEFT JOIN pessoas p ON r.criado_por = p.id
      LEFT JOIN ministerios m ON r.ministerio_id = m.id`;
    
    if (temPastorLider) {
      query += `
      LEFT JOIN pessoas pl ON r.pastor_lider_id = pl.id`;
    }
    
    query += `
      WHERE r.id = $1`;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Relatório não encontrado' });
    }

    const relatorio = result.rows[0];
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                   'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

    res.json({
      relatorio: {
        id: relatorio.id,
        nomeMinisterio: relatorio.nome_ministerio_display || relatorio.nome_ministerio,
        mesReferencia: meses[parseInt(relatorio.mes_referencia) - 1] || relatorio.mes_referencia,
        anoReferencia: relatorio.ano_referencia,
        conteudo: relatorio.conteudo,
        arquivoPdfPath: relatorio.arquivo_pdf_path,
        tamanho: relatorio.tamanho_arquivo,
        pastorLiderId: relatorio.pastor_lider_id,
        pastorLiderNome: relatorio.pastor_lider_nome,
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
    const { nomeMinisterio, mesReferencia, conteudo, pastorLiderId } = req.body;
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

    // Validar pastor_lider_id se fornecido
    if (pastorLiderId) {
      const pastorCheck = await pool.query(
        'SELECT id, cargo_eclesiastico FROM pessoas WHERE id = $1 AND cargo_eclesiastico = $2',
        [pastorLiderId, 'Pastor lider']
      );
      if (pastorCheck.rows.length === 0) {
        return res.status(400).json({ 
          message: 'A pessoa selecionada não possui o cargo "Pastor lider"' 
        });
      }
    }

    // Buscar ministerio_id pelo nome (ou criar se não existir - opcional)
    let ministerioId = null;
    if (nomeMinisterio) {
      const ministerioResult = await pool.query(
        'SELECT id FROM ministerios WHERE nome ILIKE $1 LIMIT 1',
        [`%${nomeMinisterio}%`]
      );
      if (ministerioResult.rows.length > 0) {
        ministerioId = ministerioResult.rows[0].id;
      }
    }

    // Verificar se a coluna pastor_lider_id existe
    const colunaExiste = await pool.query(
      `SELECT 1 FROM information_schema.columns 
       WHERE table_name = 'relatorios' AND column_name = 'pastor_lider_id'`
    );
    const temPastorLider = colunaExiste.rows.length > 0;

    // Atualizar relatório (schema jornada única: usa titulo e ministerio_id)
    let updateQuery, updateValues;
    if (temPastorLider) {
      updateQuery = `UPDATE relatorios 
       SET titulo = $1,
           ministerio_id = $2,
           mes_referencia = $3, 
           ano_referencia = $4, 
           conteudo = $5,
           pastor_lider_id = $6,
           atualizado_em = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING id, titulo, ministerio_id, mes_referencia, ano_referencia, 
                 conteudo, pastor_lider_id, criado_por, criado_em, atualizado_em`;
      updateValues = [
        nomeMinisterio, // Usado como titulo
        ministerioId,
        mesReferencia.padStart(2, '0'),
        anoReferencia,
        conteudo,
        pastorLiderId || null,
        id
      ];
    } else {
      updateQuery = `UPDATE relatorios 
       SET titulo = $1,
           ministerio_id = $2,
           mes_referencia = $3, 
           ano_referencia = $4, 
           conteudo = $5,
           atualizado_em = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING id, titulo, ministerio_id, mes_referencia, ano_referencia, 
                 conteudo, criado_por, criado_em, atualizado_em`;
      updateValues = [
        nomeMinisterio, // Usado como titulo
        ministerioId,
        mesReferencia.padStart(2, '0'),
        anoReferencia,
        conteudo,
        id
      ];
    }
    
    const result = await pool.query(updateQuery, updateValues);

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
        r.id,
        r.titulo as nome_ministerio,
        COALESCE(m.nome, r.titulo) as nome_ministerio_display,
        r.mes_referencia,
        r.ano_referencia,
        r.conteudo,
        r.arquivo_pdf_path
      FROM relatorios r
      LEFT JOIN ministerios m ON r.ministerio_id = m.id
      WHERE r.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Relatório não encontrado' });
    }

    const relatorio = result.rows[0];
    const nomeMinisterio = relatorio.nome_ministerio_display || relatorio.nome_ministerio;

    // Se tiver arquivo PDF, redirecionar para ele
    if (relatorio.arquivo_pdf_path) {
      return res.redirect(relatorio.arquivo_pdf_path);
    }

    // Caso contrário, retornar o conteúdo HTML
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="relatorio_${nomeMinisterio}_${relatorio.mes_referencia}_${relatorio.ano_referencia}.html"`
    );
    
    res.send(relatorio.conteudo);
  } catch (error) {
    console.error('Erro ao fazer download do relatório:', error);
    res.status(500).json({ message: 'Erro ao fazer download do relatório', error: error.message });
  }
}

/**
 * Buscar pastores líderes (pessoas com cargo "Pastor lider")
 */
async function buscarPastoresLideres(req, res) {
  try {
    const result = await pool.query(
      `SELECT 
        id,
        nome,
        sobrenome,
        CONCAT(nome, ' ', COALESCE(sobrenome, '')) as nome_completo
      FROM pessoas
      WHERE cargo_eclesiastico = 'Pastor lider'
      ORDER BY nome, sobrenome`
    );

    res.json({
      pastoresLideres: result.rows.map(row => ({
        id: row.id,
        nome: row.nome,
        sobrenome: row.sobrenome || '',
        nomeCompleto: row.nome_completo
      }))
    });
  } catch (error) {
    console.error('Erro ao buscar pastores líderes:', error);
    res.status(500).json({ message: 'Erro ao buscar pastores líderes', error: error.message });
  }
}

module.exports = {
  criarRelatorio,
  listarRelatorios,
  obterRelatorioPorId,
  atualizarRelatorio,
  downloadRelatorio,
  buscarPastoresLideres,
};
