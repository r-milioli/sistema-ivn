const pool = require('../config/database');

/**
 * Listar todas as configurações de páginas
 */
async function listarPaginasConfig(req, res) {
  try {
    const result = await pool.query(
      `SELECT 
        id,
        rota,
        nome,
        icone,
        ministerio_id,
        COALESCE(pagina_visivel, true) as pagina_visivel,
        COALESCE(card_visivel, true) as card_visivel,
        ordem,
        COALESCE(ativo, true) as ativo,
        criado_em,
        atualizado_em
      FROM paginas_config
      ORDER BY ordem ASC, nome ASC`
    );

    // Garantir que os valores booleanos sejam booleanos JavaScript
    const paginas = result.rows.map(row => ({
      ...row,
      pagina_visivel: Boolean(row.pagina_visivel),
      card_visivel: Boolean(row.card_visivel),
      ativo: Boolean(row.ativo)
    }));

    res.json({
      paginas
    });
  } catch (error) {
    console.error('Erro ao listar configurações de páginas:', error);
    res.status(500).json({
      message: 'Erro ao listar configurações de páginas',
      error: error.message
    });
  }
}

/**
 * Atualizar configuração de uma página
 */
async function atualizarPaginaConfig(req, res) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { pagina_visivel, card_visivel, ordem, ministerio_id } = req.body;

    // Verificar se a página existe
    const paginaCheck = await client.query(
      'SELECT id FROM paginas_config WHERE id = $1',
      [id]
    );

    if (paginaCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Página não encontrada' });
    }

    // Construir query de atualização dinamicamente
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    if (pagina_visivel !== undefined) {
      updateFields.push(`pagina_visivel = $${paramIndex++}`);
      updateValues.push(pagina_visivel);
    }

    if (card_visivel !== undefined) {
      updateFields.push(`card_visivel = $${paramIndex++}`);
      updateValues.push(card_visivel);
    }

    if (ordem !== undefined) {
      updateFields.push(`ordem = $${paramIndex++}`);
      updateValues.push(ordem);
    }

    if (ministerio_id !== undefined) {
      updateFields.push(`ministerio_id = $${paramIndex++}`);
      updateValues.push(ministerio_id === null || ministerio_id === '' ? null : ministerio_id);
    }

    if (updateFields.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Nenhum campo para atualizar' });
    }

    updateFields.push(`atualizado_em = CURRENT_TIMESTAMP`);
    updateValues.push(id);

    const updateQuery = `
      UPDATE paginas_config
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, rota, nome, icone, ministerio_id, pagina_visivel, card_visivel, ordem, ativo, atualizado_em
    `;

    const result = await client.query(updateQuery, updateValues);

    await client.query('COMMIT');

    res.json({
      message: 'Configuração de página atualizada com sucesso',
      pagina: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao atualizar configuração de página:', error);
    res.status(500).json({
      message: 'Erro ao atualizar configuração de página',
      error: error.message
    });
  } finally {
    client.release();
  }
}

/**
 * Obter configurações de páginas visíveis no dashboard
 */
async function obterPaginasVisiveis(req, res) {
  try {
    const result = await pool.query(
      `SELECT 
        rota,
        nome,
        icone,
        ordem
      FROM paginas_config
      WHERE ativo = TRUE 
        AND card_visivel = TRUE
      ORDER BY ordem ASC, nome ASC`
    );

    res.json({
      paginas: result.rows
    });
  } catch (error) {
    console.error('Erro ao obter páginas visíveis:', error);
    res.status(500).json({
      message: 'Erro ao obter páginas visíveis',
      error: error.message
    });
  }
}

/**
 * Verificar se uma página específica está visível pela rota
 */
async function verificarVisibilidadePagina(req, res) {
  try {
    const { rota } = req.query;

    if (!rota) {
      return res.status(400).json({
        message: 'Parâmetro "rota" é obrigatório'
      });
    }

    const result = await pool.query(
      `SELECT 
        id,
        rota,
        nome,
        pagina_visivel,
        ativo
      FROM paginas_config
      WHERE rota = $1`,
      [rota]
    );

    if (result.rows.length === 0) {
      // Se a página não estiver na tabela, permitir acesso (compatibilidade com páginas antigas)
      return res.json({
        visivel: true,
        pagina: null
      });
    }

    const pagina = result.rows[0];
    const visivel = Boolean(pagina.ativo && pagina.pagina_visivel);

    res.json({
      visivel,
      pagina: {
        id: pagina.id,
        rota: pagina.rota,
        nome: pagina.nome
      }
    });
  } catch (error) {
    console.error('Erro ao verificar visibilidade da página:', error);
    res.status(500).json({
      message: 'Erro ao verificar visibilidade da página',
      error: error.message
    });
  }
}

/**
 * Atualizar múltiplas páginas de uma vez
 */
async function atualizarMultiplasPaginas(req, res) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { paginas } = req.body; // Array de { id, pagina_visivel?, card_visivel?, ordem? }

    if (!Array.isArray(paginas) || paginas.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Array de páginas é obrigatório' });
    }

    const atualizadas = [];

    for (const pagina of paginas) {
      const { id, pagina_visivel, card_visivel, ordem } = pagina;

      if (!id) {
        continue;
      }

      const updateFields = [];
      const updateValues = [];
      let paramIndex = 1;

      if (pagina_visivel !== undefined) {
        updateFields.push(`pagina_visivel = $${paramIndex++}`);
        updateValues.push(pagina_visivel);
      }

      if (card_visivel !== undefined) {
        updateFields.push(`card_visivel = $${paramIndex++}`);
        updateValues.push(card_visivel);
      }

      if (ordem !== undefined) {
        updateFields.push(`ordem = $${paramIndex++}`);
        updateValues.push(ordem);
      }

      if (updateFields.length > 0) {
        updateFields.push(`atualizado_em = CURRENT_TIMESTAMP`);
        updateValues.push(id);

        const updateQuery = `
          UPDATE paginas_config
          SET ${updateFields.join(', ')}
          WHERE id = $${paramIndex}
          RETURNING id, rota, nome, pagina_visivel, card_visivel, ordem
        `;

        const result = await client.query(updateQuery, updateValues);
        if (result.rows.length > 0) {
          atualizadas.push(result.rows[0]);
        }
      }
    }

    await client.query('COMMIT');

    res.json({
      message: `${atualizadas.length} página(s) atualizada(s) com sucesso`,
      paginas: atualizadas
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao atualizar múltiplas páginas:', error);
    res.status(500).json({
      message: 'Erro ao atualizar múltiplas páginas',
      error: error.message
    });
  } finally {
    client.release();
  }
}

module.exports = {
  listarPaginasConfig,
  atualizarPaginaConfig,
  obterPaginasVisiveis,
  atualizarMultiplasPaginas,
  verificarVisibilidadePagina
};
