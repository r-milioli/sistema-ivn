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
        COALESCE(card_visivel, true) as card_visivel,
        COALESCE(pagina_visivel_geral, true) as pagina_visivel_geral,
        COALESCE(pagina_visivel_visitantes, false) as pagina_visivel_visitantes,
        COALESCE(pagina_visivel_lider_ministerio, false) as pagina_visivel_lider_ministerio,
        COALESCE(pagina_visivel_participa_ministerio, false) as pagina_visivel_participa_ministerio,
        COALESCE(pagina_visivel_user, false) as pagina_visivel_user,
        COALESCE(pagina_visivel_admin, false) as pagina_visivel_admin,
        COALESCE(pagina_visivel_superadmin, false) as pagina_visivel_superadmin,
        ordem,
        criado_em,
        atualizado_em
      FROM paginas_config
      ORDER BY ordem ASC, nome ASC`
    );

    // Garantir que os valores booleanos sejam booleanos JavaScript
    const paginas = result.rows.map(row => ({
      ...row,
      card_visivel: Boolean(row.card_visivel),
      pagina_visivel_geral: Boolean(row.pagina_visivel_geral),
      pagina_visivel_visitantes: Boolean(row.pagina_visivel_visitantes),
      pagina_visivel_lider_ministerio: Boolean(row.pagina_visivel_lider_ministerio),
      pagina_visivel_participa_ministerio: Boolean(row.pagina_visivel_participa_ministerio),
      pagina_visivel_user: Boolean(row.pagina_visivel_user),
      pagina_visivel_admin: Boolean(row.pagina_visivel_admin),
      pagina_visivel_superadmin: Boolean(row.pagina_visivel_superadmin)
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
    const { 
      card_visivel, ordem, ministerio_id,
      pagina_visivel_geral, pagina_visivel_visitantes,
      pagina_visivel_lider_ministerio, pagina_visivel_participa_ministerio,
      pagina_visivel_user, pagina_visivel_admin, pagina_visivel_superadmin
    } = req.body;

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

    if (pagina_visivel_geral !== undefined) {
      updateFields.push(`pagina_visivel_geral = $${paramIndex++}`);
      updateValues.push(pagina_visivel_geral);
    }

    if (pagina_visivel_visitantes !== undefined) {
      updateFields.push(`pagina_visivel_visitantes = $${paramIndex++}`);
      updateValues.push(pagina_visivel_visitantes);
    }

    if (pagina_visivel_lider_ministerio !== undefined) {
      updateFields.push(`pagina_visivel_lider_ministerio = $${paramIndex++}`);
      updateValues.push(pagina_visivel_lider_ministerio);
    }

    if (pagina_visivel_participa_ministerio !== undefined) {
      updateFields.push(`pagina_visivel_participa_ministerio = $${paramIndex++}`);
      updateValues.push(pagina_visivel_participa_ministerio);
    }

    if (pagina_visivel_user !== undefined) {
      updateFields.push(`pagina_visivel_user = $${paramIndex++}`);
      updateValues.push(pagina_visivel_user);
    }

    if (pagina_visivel_admin !== undefined) {
      updateFields.push(`pagina_visivel_admin = $${paramIndex++}`);
      updateValues.push(pagina_visivel_admin);
    }

    if (pagina_visivel_superadmin !== undefined) {
      updateFields.push(`pagina_visivel_superadmin = $${paramIndex++}`);
      updateValues.push(pagina_visivel_superadmin);
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
      RETURNING id, rota, nome, icone, ministerio_id, card_visivel, 
                pagina_visivel_geral, pagina_visivel_visitantes, 
                pagina_visivel_lider_ministerio, pagina_visivel_participa_ministerio,
                pagina_visivel_user, pagina_visivel_admin, pagina_visivel_superadmin,
                ordem, atualizado_em
    `;

    const result = await client.query(updateQuery, updateValues);

    await client.query('COMMIT');

    // Garantir que os valores booleanos sejam booleanos JavaScript
    const paginaAtualizada = {
      ...result.rows[0],
      card_visivel: Boolean(result.rows[0].card_visivel),
      pagina_visivel_geral: Boolean(result.rows[0].pagina_visivel_geral),
      pagina_visivel_visitantes: Boolean(result.rows[0].pagina_visivel_visitantes),
      pagina_visivel_lider_ministerio: Boolean(result.rows[0].pagina_visivel_lider_ministerio),
      pagina_visivel_participa_ministerio: Boolean(result.rows[0].pagina_visivel_participa_ministerio),
      pagina_visivel_user: Boolean(result.rows[0].pagina_visivel_user),
      pagina_visivel_admin: Boolean(result.rows[0].pagina_visivel_admin),
      pagina_visivel_superadmin: Boolean(result.rows[0].pagina_visivel_superadmin)
    };

    res.json({
      message: 'Configuração de página atualizada com sucesso',
      pagina: paginaAtualizada
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
 * Obter páginas visíveis no dashboard para o usuário atual
 * Considera card_visivel E as flags de visibilidade da página
 */
async function obterPaginasVisiveis(req, res) {
  try {
    const { pessoaId, tipoAcesso, estagioAtual } = req.query;

    const result = await pool.query(
      `SELECT 
        id,
        rota,
        nome,
        icone,
        ministerio_id,
        ordem,
        card_visivel,
        pagina_visivel_geral,
        pagina_visivel_visitantes,
        pagina_visivel_lider_ministerio,
        pagina_visivel_participa_ministerio,
        pagina_visivel_user,
        pagina_visivel_admin,
        pagina_visivel_superadmin
      FROM paginas_config
      WHERE card_visivel = TRUE
      ORDER BY ordem ASC, nome ASC`
    );

    // Filtrar páginas baseado nas permissões do usuário
    const paginasFiltradas = [];
    
    for (const pagina of result.rows) {
      let podeVer = false;

      // Geral: todos podem ver
      if (pagina.pagina_visivel_geral) {
        podeVer = true;
      }

      // Visitante
      if (!podeVer && pagina.pagina_visivel_visitantes && estagioAtual) {
        const estagio = String(estagioAtual).toLowerCase();
        if (estagio.includes('visitante')) {
          podeVer = true;
        }
      }

      // User, Admin, SuperAdmin (baseado em tipoAcesso)
      if (!podeVer && tipoAcesso) {
        const tipo = String(tipoAcesso).toLowerCase();
        if ((tipo === 'usuario' || tipo === 'user') && pagina.pagina_visivel_user) {
          podeVer = true;
        }
        if (tipo === 'admin' && pagina.pagina_visivel_admin) {
          podeVer = true;
        }
        if (tipo === 'superadmin' && pagina.pagina_visivel_superadmin) {
          podeVer = true;
        }
      }

      // Líder/Participante do ministério DESTA página
      if (!podeVer && pessoaId && pagina.ministerio_id) {
        const pm = await pool.query(
          `SELECT e_lider FROM pessoa_ministerios 
           WHERE pessoa_id = $1 AND ministerio_id = $2 AND data_fim IS NULL`,
          [pessoaId, pagina.ministerio_id]
        );
        
        if (pm.rows.length > 0) {
          const isLider = pm.rows[0].e_lider === true;
          const isParticipante = pm.rows[0].e_lider === false;
          
          if (isLider && pagina.pagina_visivel_lider_ministerio) {
            podeVer = true;
          }
          if (isParticipante && pagina.pagina_visivel_participa_ministerio) {
            podeVer = true;
          }
        }
      }

      if (podeVer) {
        paginasFiltradas.push({
          rota: pagina.rota,
          nome: pagina.nome,
          icone: pagina.icone,
          ordem: pagina.ordem
        });
      }
    }

    res.json({
      paginas: paginasFiltradas
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
 * Verificar se o usuário pode acessar uma página específica
 * Baseado nas flags de visibilidade e no perfil do usuário
 */
async function verificarVisibilidadePagina(req, res) {
  try {
    const { rota } = req.query;
    const { pessoaId, tipoAcesso, estagioAtual } = req.query; // tipoAcesso: Usuario, Lider, Admin, SuperAdmin

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
        ministerio_id,
        pagina_visivel_geral,
        pagina_visivel_visitantes,
        pagina_visivel_lider_ministerio,
        pagina_visivel_participa_ministerio,
        pagina_visivel_user,
        pagina_visivel_admin,
        pagina_visivel_superadmin
      FROM paginas_config
      WHERE rota = $1`,
      [rota]
    );

    if (result.rows.length === 0) {
      // Se a página não estiver na tabela, permitir acesso (compatibilidade)
      return res.json({
        visivel: true,
        pagina: null
      });
    }

    const pagina = result.rows[0];

    // Determinar se o usuário pode ver a página
    let podeVer = false;

    // Geral: todos podem ver
    if (pagina.pagina_visivel_geral) {
      podeVer = true;
    }

    // Visitante: apenas se estagioAtual contém "visitante"
    if (!podeVer && pagina.pagina_visivel_visitantes && estagioAtual) {
      const estagio = String(estagioAtual).toLowerCase();
      if (estagio.includes('visitante')) {
        podeVer = true;
      }
    }

    // User, Admin, SuperAdmin: baseado em tipoAcesso
    if (!podeVer && tipoAcesso) {
      const tipo = String(tipoAcesso).toLowerCase();
      if (tipo === 'usuario' || tipo === 'user') {
        podeVer = podeVer || pagina.pagina_visivel_user;
      }
      if (tipo === 'admin') {
        podeVer = podeVer || pagina.pagina_visivel_admin;
      }
      if (tipo === 'superadmin') {
        podeVer = podeVer || pagina.pagina_visivel_superadmin;
      }
    }

    // Líder/Participante do ministério DESTA página
    if (!podeVer && pessoaId && pagina.ministerio_id) {
      const pm = await pool.query(
        `SELECT e_lider FROM pessoa_ministerios 
         WHERE pessoa_id = $1 AND ministerio_id = $2 AND data_fim IS NULL`,
        [pessoaId, pagina.ministerio_id]
      );
      if (pm.rows.length > 0) {
        const isLider = pm.rows[0].e_lider === true;
        const isParticipante = pm.rows[0].e_lider === false;
        if (isLider && pagina.pagina_visivel_lider_ministerio) {
          podeVer = true;
        }
        if (isParticipante && pagina.pagina_visivel_participa_ministerio) {
          podeVer = true;
        }
      }
    }

    res.json({
      visivel: podeVer,
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
