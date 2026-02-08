const pool = require('../config/database');

/**
 * Listar todas as tabs de uma página
 */
async function listarTabsPagina(req, res) {
  try {
    const { paginaId } = req.params;

    const result = await pool.query(
      `SELECT 
        id,
        pagina_id,
        nome,
        valor,
        icone,
        ordem,
        visivel_geral,
        visivel_visitantes,
        visivel_lider_ministerio,
        visivel_participa_ministerio,
        ativo,
        criado_em,
        atualizado_em
      FROM paginas_tabs
      WHERE pagina_id = $1
      ORDER BY ordem ASC, nome ASC`,
      [paginaId]
    );

    res.json({
      tabs: result.rows.map(row => ({
        ...row,
        visivel_geral: Boolean(row.visivel_geral),
        visivel_visitantes: Boolean(row.visivel_visitantes),
        visivel_lider_ministerio: Boolean(row.visivel_lider_ministerio),
        visivel_participa_ministerio: Boolean(row.visivel_participa_ministerio),
        ativo: Boolean(row.ativo)
      }))
    });
  } catch (error) {
    console.error('Erro ao listar tabs da página:', error);
    res.status(500).json({
      message: 'Erro ao listar tabs da página',
      error: error.message
    });
  }
}

/**
 * Criar ou atualizar uma tab
 */
async function criarOuAtualizarTab(req, res) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { paginaId, nome, valor, icone, ordem, visivel_geral, visivel_visitantes, visivel_lider_ministerio, visivel_participa_ministerio } = req.body;

    if (!paginaId || !nome || !valor) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'paginaId, nome e valor são obrigatórios' });
    }

    // Verificar se a tab já existe
    const existingTab = await client.query(
      'SELECT id FROM paginas_tabs WHERE pagina_id = $1 AND valor = $2',
      [paginaId, valor]
    );

    let result;
    if (existingTab.rows.length > 0) {
      // Atualizar tab existente
      const updateFields = [];
      const updateValues = [];
      let paramIndex = 1;

      if (nome !== undefined) {
        updateFields.push(`nome = $${paramIndex++}`);
        updateValues.push(nome);
      }
      if (icone !== undefined) {
        updateFields.push(`icone = $${paramIndex++}`);
        updateValues.push(icone);
      }
      if (ordem !== undefined) {
        updateFields.push(`ordem = $${paramIndex++}`);
        updateValues.push(ordem);
      }
      if (visivel_geral !== undefined) {
        updateFields.push(`visivel_geral = $${paramIndex++}`);
        updateValues.push(visivel_geral);
      }
      if (visivel_visitantes !== undefined) {
        updateFields.push(`visivel_visitantes = $${paramIndex++}`);
        updateValues.push(visivel_visitantes);
      }
      if (visivel_lider_ministerio !== undefined) {
        updateFields.push(`visivel_lider_ministerio = $${paramIndex++}`);
        updateValues.push(visivel_lider_ministerio);
      }
      if (visivel_participa_ministerio !== undefined) {
        updateFields.push(`visivel_participa_ministerio = $${paramIndex++}`);
        updateValues.push(visivel_participa_ministerio);
      }

      updateFields.push(`atualizado_em = CURRENT_TIMESTAMP`);
      updateValues.push(existingTab.rows[0].id);

      const updateQuery = `
        UPDATE paginas_tabs
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      result = await client.query(updateQuery, updateValues);
    } else {
      // Criar nova tab
      result = await client.query(
        `INSERT INTO paginas_tabs (
          pagina_id, nome, valor, icone, ordem,
          visivel_geral, visivel_visitantes, visivel_lider_ministerio, visivel_participa_ministerio
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *`,
        [
          paginaId,
          nome,
          valor,
          icone || null,
          ordem || 0,
          visivel_geral !== undefined ? visivel_geral : true,
          visivel_visitantes !== undefined ? visivel_visitantes : false,
          visivel_lider_ministerio !== undefined ? visivel_lider_ministerio : false,
          visivel_participa_ministerio !== undefined ? visivel_participa_ministerio : false
        ]
      );
    }

    await client.query('COMMIT');

    res.json({
      message: existingTab.rows.length > 0 ? 'Tab atualizada com sucesso' : 'Tab criada com sucesso',
      tab: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao criar/atualizar tab:', error);
    res.status(500).json({
      message: 'Erro ao criar/atualizar tab',
      error: error.message
    });
  } finally {
    client.release();
  }
}

/**
 * Atualizar permissões de uma tab
 */
async function atualizarPermissoesTab(req, res) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { visivel_geral, visivel_visitantes, visivel_lider_ministerio, visivel_participa_ministerio } = req.body;

    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    if (visivel_geral !== undefined) {
      updateFields.push(`visivel_geral = $${paramIndex++}`);
      updateValues.push(visivel_geral);
    }
    if (visivel_visitantes !== undefined) {
      updateFields.push(`visivel_visitantes = $${paramIndex++}`);
      updateValues.push(visivel_visitantes);
    }
    if (visivel_lider_ministerio !== undefined) {
      updateFields.push(`visivel_lider_ministerio = $${paramIndex++}`);
      updateValues.push(visivel_lider_ministerio);
    }
    if (visivel_participa_ministerio !== undefined) {
      updateFields.push(`visivel_participa_ministerio = $${paramIndex++}`);
      updateValues.push(visivel_participa_ministerio);
    }

    if (updateFields.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Nenhum campo para atualizar' });
    }

    updateFields.push(`atualizado_em = CURRENT_TIMESTAMP`);
    updateValues.push(id);

    const updateQuery = `
      UPDATE paginas_tabs
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await client.query(updateQuery, updateValues);

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Tab não encontrada' });
    }

    await client.query('COMMIT');

    res.json({
      message: 'Permissões atualizadas com sucesso',
      tab: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao atualizar permissões da tab:', error);
    res.status(500).json({
      message: 'Erro ao atualizar permissões da tab',
      error: error.message
    });
  } finally {
    client.release();
  }
}

/**
 * Sincronizar tabs de uma página (criar tabs baseado na estrutura da página)
 */
async function sincronizarTabsPagina(req, res) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { paginaId } = req.params;
    const { tabs } = req.body; // Array de { nome, valor, icone, ordem }

    if (!Array.isArray(tabs)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Array de tabs é obrigatório' });
    }

    // Deletar tabs que não estão mais na lista
    const valoresAtuais = tabs.map(t => t.valor).filter(Boolean);
    if (valoresAtuais.length > 0) {
      await client.query(
        `DELETE FROM paginas_tabs 
         WHERE pagina_id = $1 AND valor NOT IN (${valoresAtuais.map((_, i) => `$${i + 2}`).join(', ')})`,
        [paginaId, ...valoresAtuais]
      );
    } else {
      // Se não há tabs, deletar todas
      await client.query('DELETE FROM paginas_tabs WHERE pagina_id = $1', [paginaId]);
    }

    // Criar ou atualizar tabs
    for (const tab of tabs) {
      const { nome, valor, icone, ordem } = tab;
      
      await client.query(
        `INSERT INTO paginas_tabs (pagina_id, nome, valor, icone, ordem, visivel_geral)
         VALUES ($1, $2, $3, $4, $5, TRUE)
         ON CONFLICT (pagina_id, valor) 
         DO UPDATE SET 
           nome = EXCLUDED.nome,
           icone = EXCLUDED.icone,
           ordem = EXCLUDED.ordem,
           atualizado_em = CURRENT_TIMESTAMP`,
        [paginaId, nome, valor, icone || null, ordem || 0]
      );
    }

    await client.query('COMMIT');

    res.json({
      message: 'Tabs sincronizadas com sucesso'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao sincronizar tabs da página:', error);
    res.status(500).json({
      message: 'Erro ao sincronizar tabs da página',
      error: error.message
    });
  } finally {
    client.release();
  }
}

/**
 * Obter tabs visíveis de uma página baseado no tipo de usuário
 */
async function obterTabsVisiveis(req, res) {
  try {
    const { paginaId } = req.params;
    const { tipoUsuario, pessoaId } = req.query; // tipoUsuario: 'geral', 'visitante', 'lider_ministerio', 'participa_ministerio'

    // Se pessoaId for fornecido, verificar se é líder de ministério
    let tipoUsuarioFinal = tipoUsuario;
    if (pessoaId && tipoUsuario === 'geral') {
      // Verificar se a pessoa é líder de algum ministério
      const liderCheck = await pool.query(
        `SELECT COUNT(*) as count 
         FROM pessoa_ministerios 
         WHERE pessoa_id = $1 AND e_lider = TRUE AND data_fim IS NULL`,
        [pessoaId]
      );
      
      if (liderCheck.rows[0].count > 0) {
        tipoUsuarioFinal = 'lider_ministerio';
        console.log(`[obterTabsVisiveis] Pessoa ${pessoaId} identificada como líder de ministério`);
      } else {
        // Verificar se é participante
        const participanteCheck = await pool.query(
          `SELECT COUNT(*) as count 
           FROM pessoa_ministerios 
           WHERE pessoa_id = $1 AND e_lider = FALSE AND data_fim IS NULL`,
          [pessoaId]
        );
        
        if (participanteCheck.rows[0].count > 0) {
          tipoUsuarioFinal = 'participa_ministerio';
          console.log(`[obterTabsVisiveis] Pessoa ${pessoaId} identificada como participante de ministério`);
        }
      }
    }

    console.log(`[obterTabsVisiveis] Tipo de usuário final: ${tipoUsuarioFinal}`);

    const result = await pool.query(
      `SELECT 
        id,
        pagina_id,
        nome,
        valor,
        icone,
        ordem,
        visivel_geral,
        visivel_visitantes,
        visivel_lider_ministerio,
        visivel_participa_ministerio,
        ativo
      FROM paginas_tabs
      WHERE pagina_id = $1 AND ativo = TRUE
      ORDER BY ordem ASC, nome ASC`,
      [paginaId]
    );

    // Filtrar tabs baseado no tipo de usuário
    const tabsFiltradas = result.rows
      .map(row => ({
        ...row,
        visivel_geral: Boolean(row.visivel_geral),
        visivel_visitantes: Boolean(row.visivel_visitantes),
        visivel_lider_ministerio: Boolean(row.visivel_lider_ministerio),
        visivel_participa_ministerio: Boolean(row.visivel_participa_ministerio),
        ativo: Boolean(row.ativo)
      }))
      .filter(tab => {
        switch (tipoUsuarioFinal) {
          case 'geral':
            return tab.visivel_geral === true;
          case 'visitante':
            return tab.visivel_visitantes === true;
          case 'lider_ministerio':
            return tab.visivel_lider_ministerio === true;
          case 'participa_ministerio':
            return tab.visivel_participa_ministerio === true;
          default:
            // Se não especificado, retornar todas as tabs com visivel_geral = true
            return tab.visivel_geral === true;
        }
      });

    console.log(`[obterTabsVisiveis] Total de tabs encontradas: ${result.rows.length}, Tabs filtradas: ${tabsFiltradas.length}`);

    res.json({
      tabs: tabsFiltradas
    });
  } catch (error) {
    console.error('Erro ao obter tabs visíveis:', error);
    res.status(500).json({
      message: 'Erro ao obter tabs visíveis',
      error: error.message
    });
  }
}

module.exports = {
  listarTabsPagina,
  criarOuAtualizarTab,
  atualizarPermissoesTab,
  sincronizarTabsPagina,
  obterTabsVisiveis
};
