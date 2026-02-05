const pool = require('../config/database');

/**
 * Criar nova entrada financeira
 */
async function criarEntrada(req, res) {
  try {
    const { categoria, autores, valor, dataEntrada, turno, tipoPagamento } = req.body;
    const userId = req.user.id;

    // Validações básicas
    if (!categoria || !valor || !dataEntrada || !turno || !tipoPagamento) {
      return res.status(400).json({ 
        message: 'Campos obrigatórios: categoria, valor, dataEntrada, turno, tipoPagamento' 
      });
    }

    const valorNum = parseFloat(valor);
    if (isNaN(valorNum) || valorNum <= 0) {
      return res.status(400).json({ 
        message: 'Valor deve ser um número positivo' 
      });
    }

    // Validar enum categoria
    const categoriasValidas = ['Dízimos', 'Ofertas', 'Cantina', 'Outros'];
    if (!categoriasValidas.includes(categoria)) {
      return res.status(400).json({ 
        message: 'Categoria inválida' 
      });
    }

    // Autor é obrigatório apenas para Dízimos
    if (categoria === 'Dízimos') {
      if (!Array.isArray(autores) || autores.length === 0) {
        return res.status(400).json({ 
          message: 'É necessário informar pelo menos um autor para a categoria Dízimos' 
        });
      }
    }

    // Validar enum turno
    const turnosValidos = ['Dia', 'Tarde', 'Noite'];
    if (!turnosValidos.includes(turno)) {
      return res.status(400).json({ 
        message: 'Turno inválido' 
      });
    }

    // Validar enum tipoPagamento
    const tiposPagamentoValidos = ['Dinheiro', 'Pix', 'Cartão', 'Outros'];
    if (!tiposPagamentoValidos.includes(tipoPagamento)) {
      return res.status(400).json({ 
        message: 'Tipo de pagamento inválido' 
      });
    }

    // Processar autores (se houver)
    const autoresIds = autores && Array.isArray(autores) ? autores.map(id => parseInt(id)).filter(id => !isNaN(id)) : [];

    // Inserir entrada financeira
    const entradaResult = await pool.query(
      `INSERT INTO entradas_financeiras (
        categoria, valor, data_entrada, turno, tipo_pagamento, criado_por
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, categoria, valor, data_entrada, turno, tipo_pagamento, criado_por, criado_em`,
      [categoria, valorNum, dataEntrada, turno, tipoPagamento, userId]
    );

    const entrada = entradaResult.rows[0];

    // Inserir autores da entrada (apenas se houver autores)
    let autoresNomes = { rows: [] };
    if (autoresIds && autoresIds.length > 0) {
      // Verificar se os autores (usuários) existem
      const usuariosCheck = await pool.query(
        'SELECT id FROM usuarios WHERE id = ANY($1::int[])',
        [autoresIds]
      );

      if (usuariosCheck.rows.length !== autoresIds.length) {
        return res.status(400).json({ 
          message: 'Um ou mais autores não foram encontrados' 
        });
      }

      // Inserir autores da entrada
      for (const autorId of autoresIds) {
        await pool.query(
          'INSERT INTO entrada_autores (entrada_id, usuario_id) VALUES ($1, $2)',
          [entrada.id, autorId]
        );
      }

      // Buscar nomes dos autores para retornar
      autoresNomes = await pool.query(
        `SELECT u.id, u.nome || ' ' || COALESCE(u.sobrenome, '') as nome_completo
         FROM usuarios u
         WHERE u.id = ANY($1::int[])`,
        [autoresIds]
      );
    }

    res.status(201).json({
      message: 'Entrada financeira criada com sucesso',
      entrada: {
        ...entrada,
        autores: autoresNomes.rows.map(a => ({ id: a.id, nome: a.nome_completo }))
      }
    });
  } catch (error) {
    console.error('Erro ao criar entrada financeira:', error);
    res.status(500).json({ message: 'Erro ao criar entrada financeira', error: error.message });
  }
}

/**
 * Listar entradas financeiras com filtros e paginação
 */
async function listarEntradas(req, res) {
  try {
    const { categoria, dataInicio, dataFim, page = 1, pageSize = 10 } = req.query;
    
    const pageNum = parseInt(page);
    const pageSizeNum = parseInt(pageSize);
    const offset = (pageNum - 1) * pageSizeNum;

    // Construir query base
    let query = `
      SELECT 
        e.id,
        e.categoria,
        e.valor,
        e.data_entrada,
        e.turno,
        e.tipo_pagamento,
        e.criado_por,
        e.criado_em,
        e.atualizado_em
      FROM entradas_financeiras e
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramIndex = 1;

    // Aplicar filtros
    if (categoria) {
      query += ` AND e.categoria = $${paramIndex}`;
      queryParams.push(categoria);
      paramIndex++;
    }

    if (dataInicio) {
      query += ` AND e.data_entrada >= $${paramIndex}`;
      queryParams.push(dataInicio);
      paramIndex++;
    }

    if (dataFim) {
      query += ` AND e.data_entrada <= $${paramIndex}`;
      queryParams.push(dataFim);
      paramIndex++;
    }

    // Contar total de registros
    const countQuery = query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM');
    const countResult = await pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Adicionar ordenação e paginação
    query += ` ORDER BY e.data_entrada DESC, e.criado_em DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(pageSizeNum, offset);

    // Executar query
    const result = await pool.query(query, queryParams);

    // Buscar autores para cada entrada
    const entradasComAutores = await Promise.all(
      result.rows.map(async (entrada) => {
        const autoresResult = await pool.query(
          `SELECT u.id, u.nome || ' ' || COALESCE(u.sobrenome, '') as nome_completo
           FROM entrada_autores ea
           JOIN usuarios u ON ea.usuario_id = u.id
           WHERE ea.entrada_id = $1`,
          [entrada.id]
        );

        return {
          id: entrada.id,
          categoria: entrada.categoria,
          valor: parseFloat(entrada.valor),
          dataEntrada: entrada.data_entrada,
          turno: entrada.turno,
          tipoPagamento: entrada.tipo_pagamento,
          criadoPor: entrada.criado_por,
          criadoEm: entrada.criado_em,
          atualizadoEm: entrada.atualizado_em,
          autores: autoresResult.rows.map(a => ({ id: a.id, nome: a.nome_completo })),
          autoresNomes: autoresResult.rows.map(a => a.nome_completo).join(', ')
        };
      })
    );

    res.json({
      entradas: entradasComAutores,
      pagination: {
        page: pageNum,
        pageSize: pageSizeNum,
        total,
        totalPages: Math.ceil(total / pageSizeNum)
      }
    });
  } catch (error) {
    console.error('Erro ao listar entradas financeiras:', error);
    res.status(500).json({ message: 'Erro ao listar entradas financeiras', error: error.message });
  }
}

/**
 * Obter entrada financeira por ID
 */
async function obterEntradaPorId(req, res) {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT 
        e.id,
        e.categoria,
        e.valor,
        e.data_entrada,
        e.turno,
        e.tipo_pagamento,
        e.criado_por,
        e.criado_em,
        e.atualizado_em
      FROM entradas_financeiras e
      WHERE e.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Entrada financeira não encontrada' });
    }

    const entrada = result.rows[0];

    // Buscar autores
    const autoresResult = await pool.query(
      `SELECT u.id, u.nome || ' ' || COALESCE(u.sobrenome, '') as nome_completo
       FROM entrada_autores ea
       JOIN usuarios u ON ea.usuario_id = u.id
       WHERE ea.entrada_id = $1`,
      [id]
    );

    res.json({
      entrada: {
        ...entrada,
        valor: parseFloat(entrada.valor),
        autores: autoresResult.rows.map(a => ({ id: a.id, nome: a.nome_completo }))
      }
    });
  } catch (error) {
    console.error('Erro ao obter entrada financeira:', error);
    res.status(500).json({ message: 'Erro ao obter entrada financeira', error: error.message });
  }
}

/**
 * Atualizar entrada financeira
 */
async function atualizarEntrada(req, res) {
  try {
    const { id } = req.params;
    const { categoria, autores, valor, dataEntrada, turno, tipoPagamento } = req.body;
    const userId = req.user.id;

    // Validações básicas
    if (!categoria || !valor || !dataEntrada || !turno || !tipoPagamento) {
      return res.status(400).json({ 
        message: 'Campos obrigatórios: categoria, valor, dataEntrada, turno, tipoPagamento' 
      });
    }

    const valorNum = parseFloat(valor);
    if (isNaN(valorNum) || valorNum <= 0) {
      return res.status(400).json({ 
        message: 'Valor deve ser um número positivo' 
      });
    }

    // Validar enum categoria
    const categoriasValidas = ['Dízimos', 'Ofertas', 'Cantina', 'Outros'];
    if (!categoriasValidas.includes(categoria)) {
      return res.status(400).json({ 
        message: 'Categoria inválida' 
      });
    }

    // Autor é obrigatório apenas para Dízimos
    if (categoria === 'Dízimos') {
      if (!Array.isArray(autores) || autores.length === 0) {
        return res.status(400).json({ 
          message: 'É necessário informar pelo menos um autor para a categoria Dízimos' 
        });
      }
    }

    // Verificar se a entrada existe e se o usuário tem permissão
    const entradaExistente = await pool.query(
      'SELECT criado_por FROM entradas_financeiras WHERE id = $1',
      [id]
    );

    if (entradaExistente.rows.length === 0) {
      return res.status(404).json({ message: 'Entrada financeira não encontrada' });
    }

    // Verificar se o usuário é o criador (ou admin - pode ser implementado depois)
    if (entradaExistente.rows[0].criado_por !== userId) {
      return res.status(403).json({ 
        message: 'Você não tem permissão para editar esta entrada' 
      });
    }

    // Processar autores (se houver)
    const autoresIds = autores && Array.isArray(autores) ? autores.map(id => parseInt(id)).filter(id => !isNaN(id)) : [];
    
    // Verificar se os autores existem (apenas se houver autores)
    if (autoresIds.length > 0) {
      const usuariosCheck = await pool.query(
        'SELECT id FROM usuarios WHERE id = ANY($1::int[])',
        [autoresIds]
      );

      if (usuariosCheck.rows.length !== autoresIds.length) {
        return res.status(400).json({ 
          message: 'Um ou mais autores não foram encontrados' 
        });
      }
    }

    // Atualizar entrada
    const result = await pool.query(
      `UPDATE entradas_financeiras 
       SET categoria = $1, 
           valor = $2, 
           data_entrada = $3, 
           turno = $4, 
           tipo_pagamento = $5,
           atualizado_em = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING id, categoria, valor, data_entrada, turno, tipo_pagamento, criado_por, criado_em, atualizado_em`,
      [categoria, valorNum, dataEntrada, turno, tipoPagamento, id]
    );

    // Remover autores antigos e adicionar novos
    await pool.query('DELETE FROM entrada_autores WHERE entrada_id = $1', [id]);
    
    // Inserir novos autores (apenas se houver)
    let autoresNomes = { rows: [] };
    if (autoresIds.length > 0) {
      for (const autorId of autoresIds) {
        await pool.query(
          'INSERT INTO entrada_autores (entrada_id, usuario_id) VALUES ($1, $2)',
          [id, autorId]
        );
      }

      // Buscar nomes dos autores
      autoresNomes = await pool.query(
        `SELECT u.id, u.nome || ' ' || COALESCE(u.sobrenome, '') as nome_completo
         FROM usuarios u
         WHERE u.id = ANY($1::int[])`,
        [autoresIds]
      );
    }

    res.json({
      message: 'Entrada financeira atualizada com sucesso',
      entrada: {
        ...result.rows[0],
        valor: parseFloat(result.rows[0].valor),
        autores: autoresNomes.rows.map(a => ({ id: a.id, nome: a.nome_completo }))
      }
    });
  } catch (error) {
    console.error('Erro ao atualizar entrada financeira:', error);
    res.status(500).json({ message: 'Erro ao atualizar entrada financeira', error: error.message });
  }
}

/**
 * Deletar entrada financeira
 */
async function deletarEntrada(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verificar se a entrada existe e se o usuário tem permissão
    const entradaExistente = await pool.query(
      'SELECT criado_por FROM entradas_financeiras WHERE id = $1',
      [id]
    );

    if (entradaExistente.rows.length === 0) {
      return res.status(404).json({ message: 'Entrada financeira não encontrada' });
    }

    // Verificar se o usuário é o criador (ou admin)
    if (entradaExistente.rows[0].criado_por !== userId) {
      return res.status(403).json({ 
        message: 'Você não tem permissão para deletar esta entrada' 
      });
    }

    // Deletar (CASCADE vai remover os autores automaticamente)
    await pool.query('DELETE FROM entradas_financeiras WHERE id = $1', [id]);

    res.json({ message: 'Entrada financeira deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar entrada financeira:', error);
    res.status(500).json({ message: 'Erro ao deletar entrada financeira', error: error.message });
  }
}

module.exports = {
  criarEntrada,
  listarEntradas,
  obterEntradaPorId,
  atualizarEntrada,
  deletarEntrada,
};
