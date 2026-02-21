const pool = require('../config/database');

/**
 * Obter métricas financeiras (analytics)
 */
async function obterMetricas(req, res) {
  try {
    const { dataInicio, dataFim } = req.query;

    // Construir filtros de data
    let dataFilterEntradas = '';
    let dataFilterSaidas = '';
    const params = [];
    let paramIndex = 1;

    if (dataInicio) {
      dataFilterEntradas = ` AND e.data_entrada >= $${paramIndex}`;
      dataFilterSaidas = ` AND s.data_saida >= $${paramIndex}`;
      params.push(dataInicio);
      paramIndex++;
    }

    if (dataFim) {
      dataFilterEntradas += ` AND e.data_entrada <= $${paramIndex}`;
      dataFilterSaidas += ` AND s.data_saida <= $${paramIndex}`;
      params.push(dataFim);
      paramIndex++;
    }

    // Total de entradas
    const totalEntradasResult = await pool.query(
      `SELECT COALESCE(SUM(valor), 0) as total FROM entradas_financeiras WHERE 1=1 ${dataFilterEntradas}`,
      params
    );
    const totalEntradas = parseFloat(totalEntradasResult.rows[0].total);

    // Total de saídas
    const totalSaidasResult = await pool.query(
      `SELECT COALESCE(SUM(valor), 0) as total FROM saidas_financeiras WHERE 1=1 ${dataFilterSaidas}`,
      params
    );
    const totalSaidas = parseFloat(totalSaidasResult.rows[0].total);

    // Saldo
    const saldo = totalEntradas - totalSaidas;

    // Dízimos
    const dizimosResult = await pool.query(
      `SELECT COALESCE(SUM(valor), 0) as total FROM entradas_financeiras WHERE categoria = 'Dízimos' ${dataFilterEntradas}`,
      params
    );
    const dizimos = parseFloat(dizimosResult.rows[0].total);

    // Ofertas
    const ofertasResult = await pool.query(
      `SELECT COALESCE(SUM(valor), 0) as total FROM entradas_financeiras WHERE categoria = 'Ofertas' ${dataFilterEntradas}`,
      params
    );
    const ofertas = parseFloat(ofertasResult.rows[0].total);

    // Outras receitas (Cantina + Outros)
    const outrasReceitasResult = await pool.query(
      `SELECT COALESCE(SUM(valor), 0) as total FROM entradas_financeiras WHERE categoria IN ('Cantina', 'Outros') ${dataFilterEntradas}`,
      params
    );
    const outrasReceitas = parseFloat(outrasReceitasResult.rows[0].total);

    // Total de transações
    const totalTransacoesResult = await pool.query(
      `SELECT 
        (SELECT COUNT(*) FROM entradas_financeiras WHERE 1=1 ${dataFilterEntradas}) +
        (SELECT COUNT(*) FROM saidas_financeiras WHERE 1=1 ${dataFilterSaidas}) as total`,
      params
    );
    const totalTransacoes = parseInt(totalTransacoesResult.rows[0].total) || 0;

    // Média por transação
    const mediaTransacao = totalTransacoes > 0 ? (totalEntradas + totalSaidas) / totalTransacoes : 0;

    res.json({
      totalEntradas,
      totalSaidas,
      saldo,
      dizimos,
      ofertas,
      outrasReceitas,
      totalTransacoes,
      mediaTransacao: parseFloat(mediaTransacao.toFixed(2))
    });
  } catch (error) {
    console.error('Erro ao obter métricas financeiras:', error);
    res.status(500).json({ message: 'Erro ao obter métricas financeiras', error: error.message });
  }
}

/**
 * Obter relatório financeiro consolidado (entradas + saídas)
 */
async function obterRelatorioFinanceiro(req, res) {
  try {
    const { tipo, dataInicio, dataFim, categoria, search, page = 1, pageSize = 10 } = req.query;
    
    const pageNum = parseInt(page);
    const pageSizeNum = parseInt(pageSize);
    const offset = (pageNum - 1) * pageSizeNum;

    // Construir query para entradas
    let queryEntradas = `
      SELECT 
        'ENTRADA' as tipo,
        e.id,
        e.categoria::text as categoria,
        e.valor,
        e.data_entrada as data,
        e.turno::text as turno,
        e.tipo_pagamento::text as tipo_pagamento,
        e.criado_em,
        COALESCE(
          NULLIF(string_agg(DISTINCT p.nome || ' ' || COALESCE(p.sobrenome, ''), ', '), ''),
          'N/A'
        ) as descricao,
        NULL::text as ministerio_nome,
        NULL::text as comprovante_nome
      FROM entradas_financeiras e
      LEFT JOIN entrada_doadores ed ON e.id = ed.entrada_id
      LEFT JOIN pessoas p ON ed.pessoa_id = p.id
      WHERE 1=1
    `;
    
    // Construir query para saídas
    let querySaidas = `
      SELECT 
        'SAIDA' as tipo,
        s.id,
        'Saída'::text as categoria,
        s.valor,
        s.data_saida as data,
        NULL::text as turno,
        NULL::text as tipo_pagamento,
        s.criado_em,
        COALESCE(s.motivo, 'N/A') as descricao,
        m.nome as ministerio_nome,
        s.comprovante_nome
      FROM saidas_financeiras s
      JOIN ministerios m ON s.ministerio_id = m.id
      WHERE 1=1
    `;

    const paramsEntradas = [];
    const paramsSaidas = [];
    let paramIndexEntradas = 1;
    let paramIndexSaidas = 1;

    // Aplicar filtros para entradas
    if (tipo && tipo !== 'ENTRADA') {
      // Se tipo for SAIDA, não incluir entradas
      queryEntradas = null;
    } else {
      if (dataInicio) {
        queryEntradas += ` AND e.data_entrada >= $${paramIndexEntradas}`;
        paramsEntradas.push(dataInicio);
        paramIndexEntradas++;
      }

      if (dataFim) {
        queryEntradas += ` AND e.data_entrada <= $${paramIndexEntradas}`;
        paramsEntradas.push(dataFim);
        paramIndexEntradas++;
      }

      if (categoria) {
        queryEntradas += ` AND e.categoria = $${paramIndexEntradas}`;
        paramsEntradas.push(categoria);
        paramIndexEntradas++;
      }

      if (search) {
        queryEntradas += ` AND (
          e.categoria ILIKE $${paramIndexEntradas} OR
          e.valor::text ILIKE $${paramIndexEntradas} OR
          p.nome ILIKE $${paramIndexEntradas} OR
          p.sobrenome ILIKE $${paramIndexEntradas}
        )`;
        paramsEntradas.push(`%${search}%`);
        paramIndexEntradas++;
      }

      queryEntradas += ` GROUP BY e.id, e.categoria, e.valor, e.data_entrada, e.turno, e.tipo_pagamento, e.criado_em`;
    }

    // Aplicar filtros para saídas
    if (tipo && tipo !== 'SAIDA') {
      // Se tipo for ENTRADA, não incluir saídas
      querySaidas = null;
    } else {
      if (dataInicio) {
        querySaidas += ` AND s.data_saida >= $${paramIndexSaidas}`;
        paramsSaidas.push(dataInicio);
        paramIndexSaidas++;
      }

      if (dataFim) {
        querySaidas += ` AND s.data_saida <= $${paramIndexSaidas}`;
        paramsSaidas.push(dataFim);
        paramIndexSaidas++;
      }

      if (search) {
        querySaidas += ` AND (
          s.motivo ILIKE $${paramIndexSaidas} OR
          s.valor::text ILIKE $${paramIndexSaidas} OR
          m.nome ILIKE $${paramIndexSaidas}
        )`;
        paramsSaidas.push(`%${search}%`);
        paramIndexSaidas++;
      }
    }

    // Combinar queries
    let combinedQuery = '';
    const combinedParams = [];

    if (queryEntradas && querySaidas) {
      // Ajustar placeholders da segunda query para evitar conflitos
      let adjustedQuerySaidas = querySaidas;
      let paramOffset = paramsEntradas.length;
      
      // Substituir placeholders da query de saídas
      adjustedQuerySaidas = adjustedQuerySaidas.replace(/\$(\d+)/g, (match, num) => {
        const newNum = parseInt(num) + paramOffset;
        return `$${newNum}`;
      });
      
      combinedQuery = `(${queryEntradas}) UNION ALL (${adjustedQuerySaidas})`;
      combinedParams.push(...paramsEntradas, ...paramsSaidas);
    } else if (queryEntradas) {
      combinedQuery = queryEntradas;
      combinedParams.push(...paramsEntradas);
    } else if (querySaidas) {
      combinedQuery = querySaidas;
      combinedParams.push(...paramsSaidas);
    } else {
      return res.json({
        relatorio: [],
        pagination: {
          page: pageNum,
          pageSize: pageSizeNum,
          total: 0,
          totalPages: 0
        }
      });
    }


    // Contar total
    let total = 0;
    try {
      const countQuery = `SELECT COUNT(*) as total FROM (${combinedQuery}) as combined`;
      const countResult = await pool.query(countQuery, combinedParams);
      total = parseInt(countResult.rows[0].total) || 0;
    } catch (countError) {
      console.error('Erro ao contar registros:', countError);
      console.error('Query de contagem:', `SELECT COUNT(*) as total FROM (${combinedQuery}) as combined`);
      console.error('Parâmetros de contagem:', combinedParams);
      throw countError;
    }

    // Adicionar ordenação e paginação
    const finalParams = [...combinedParams, pageSizeNum, offset];
    const finalQuery = `
      SELECT * FROM (${combinedQuery}) as combined
      ORDER BY criado_em DESC, data DESC
      LIMIT $${combinedParams.length + 1} OFFSET $${combinedParams.length + 2}
    `;

    // Executar query
    let result;
    try {
      result = await pool.query(finalQuery, finalParams);
    } catch (queryError) {
      console.error('Erro ao executar query final:', queryError);
      console.error('Query final:', finalQuery);
      console.error('Parâmetros finais:', finalParams);
      throw queryError;
    }

    const relatorio = result.rows.map(row => ({
      id: `${row.tipo.toLowerCase()}-${row.id}`,
      tipo: row.tipo,
      valor: parseFloat(row.valor),
      data: row.data,
      categoria: row.categoria,
      descricao: row.descricao,
      turno: row.turno,
      tipoPagamento: row.tipo_pagamento,
      ministerio: row.ministerio_nome,
      comprovante: row.comprovante_nome,
      dataCriacao: row.criado_em
    }));

    res.json({
      relatorio,
      pagination: {
        page: pageNum,
        pageSize: pageSizeNum,
        total,
        totalPages: Math.ceil(total / pageSizeNum)
      }
    });
  } catch (error) {
    console.error('Erro ao obter relatório financeiro:', error);
    res.status(500).json({ message: 'Erro ao obter relatório financeiro', error: error.message });
  }
}

/**
 * Listar tipos de banco (para dropdown: apenas ativos; para tab Config: todos)
 */
async function listarTiposBanco(req, res) {
  try {
    const { apenasAtivos } = req.query;
    const whereAtivo = apenasAtivos === 'false' ? '' : 'WHERE ativo = TRUE';
    const result = await pool.query(
      `SELECT id, nome, ativo, criado_em, atualizado_em FROM tipos_banco ${whereAtivo} ORDER BY nome`,
      []
    );
    res.json({
      tiposBanco: result.rows.map(row => ({
        id: row.id,
        nome: row.nome,
        ativo: row.ativo,
        criadoEm: row.criado_em,
        atualizadoEm: row.atualizado_em
      }))
    });
  } catch (error) {
    console.error('Erro ao listar tipos de banco:', error);
    res.status(500).json({ message: 'Erro ao listar tipos de banco', error: error.message });
  }
}

/**
 * Criar tipo de banco
 */
async function criarTipoBanco(req, res) {
  try {
    const { nome } = req.body;
    if (!nome || !String(nome).trim()) {
      return res.status(400).json({ message: 'Nome é obrigatório' });
    }
    const nomeTrim = String(nome).trim();
    const existente = await pool.query('SELECT id FROM tipos_banco WHERE LOWER(nome) = LOWER($1)', [nomeTrim]);
    if (existente.rows.length > 0) {
      return res.status(400).json({ message: 'Já existe um tipo de banco com este nome' });
    }
    const result = await pool.query(
      `INSERT INTO tipos_banco (nome) VALUES ($1) RETURNING id, nome, ativo, criado_em, atualizado_em`,
      [nomeTrim]
    );
    const row = result.rows[0];
    res.status(201).json({
      message: 'Tipo de banco criado com sucesso',
      tipoBanco: {
        id: row.id,
        nome: row.nome,
        ativo: row.ativo,
        criadoEm: row.criado_em,
        atualizadoEm: row.atualizado_em
      }
    });
  } catch (error) {
    console.error('Erro ao criar tipo de banco:', error);
    res.status(500).json({ message: 'Erro ao criar tipo de banco', error: error.message });
  }
}

/**
 * Atualizar tipo de banco
 */
async function atualizarTipoBanco(req, res) {
  try {
    const { id } = req.params;
    const { nome, ativo } = req.body;
    const existente = await pool.query('SELECT id FROM tipos_banco WHERE id = $1', [id]);
    if (existente.rows.length === 0) {
      return res.status(404).json({ message: 'Tipo de banco não encontrado' });
    }
    const updates = [];
    const values = [];
    let paramIndex = 1;
    if (nome !== undefined) {
      const nomeTrim = String(nome).trim();
      if (nomeTrim === '') {
        return res.status(400).json({ message: 'Nome não pode ser vazio' });
      }
      const dup = await pool.query('SELECT id FROM tipos_banco WHERE LOWER(nome) = LOWER($1) AND id != $2', [nomeTrim, id]);
      if (dup.rows.length > 0) {
        return res.status(400).json({ message: 'Já existe um tipo de banco com este nome' });
      }
      updates.push(`nome = $${paramIndex++}`);
      values.push(nomeTrim);
    }
    if (ativo !== undefined) {
      updates.push(`ativo = $${paramIndex++}`);
      values.push(ativo === true || ativo === 'true');
    }
    if (updates.length === 0) {
      const r = await pool.query('SELECT id, nome, ativo, criado_em, atualizado_em FROM tipos_banco WHERE id = $1', [id]);
      const row = r.rows[0];
      return res.json({
        message: 'Tipo de banco atualizado',
        tipoBanco: { id: row.id, nome: row.nome, ativo: row.ativo, criadoEm: row.criado_em, atualizadoEm: row.atualizado_em }
      });
    }
    values.push(id);
    const result = await pool.query(
      `UPDATE tipos_banco SET ${updates.join(', ')}, atualizado_em = CURRENT_TIMESTAMP WHERE id = $${paramIndex} RETURNING id, nome, ativo, criado_em, atualizado_em`,
      values
    );
    const row = result.rows[0];
    res.json({
      message: 'Tipo de banco atualizado com sucesso',
      tipoBanco: { id: row.id, nome: row.nome, ativo: row.ativo, criadoEm: row.criado_em, atualizadoEm: row.atualizado_em }
    });
  } catch (error) {
    console.error('Erro ao atualizar tipo de banco:', error);
    res.status(500).json({ message: 'Erro ao atualizar tipo de banco', error: error.message });
  }
}

/**
 * Deletar tipo de banco (entradas/saídas com tipo_banco_id apontando para este id terão tipo_banco_id = NULL por ON DELETE SET NULL)
 */
async function deletarTipoBanco(req, res) {
  try {
    const { id } = req.params;
    const existente = await pool.query('SELECT id FROM tipos_banco WHERE id = $1', [id]);
    if (existente.rows.length === 0) {
      return res.status(404).json({ message: 'Tipo de banco não encontrado' });
    }
    await pool.query('DELETE FROM tipos_banco WHERE id = $1', [id]);
    res.json({ message: 'Tipo de banco excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar tipo de banco:', error);
    res.status(500).json({ message: 'Erro ao deletar tipo de banco', error: error.message });
  }
}

module.exports = {
  obterMetricas,
  obterRelatorioFinanceiro,
  listarTiposBanco,
  criarTipoBanco,
  atualizarTipoBanco,
  deletarTipoBanco,
};
