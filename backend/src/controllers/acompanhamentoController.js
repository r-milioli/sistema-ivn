const pool = require('../config/database');

/**
 * Criar acompanhamento: pessoa_id + listas de acompanhantes e visibilidade.
 * Retorna 400 se a pessoa já tiver acompanhamento (UNIQUE).
 */
async function criar(req, res) {
  try {
    const { pessoaId, acompanhantesIds = [], visibilidadeIds = [] } = req.body;

    if (!pessoaId) {
      return res.status(400).json({ message: 'pessoaId é obrigatório' });
    }

    const pessoaIdNum = parseInt(pessoaId, 10);
    if (Number.isNaN(pessoaIdNum)) {
      return res.status(400).json({ message: 'pessoaId inválido' });
    }

    const acompanhantes = Array.isArray(acompanhantesIds)
      ? acompanhantesIds.map((id) => parseInt(id, 10)).filter((id) => !Number.isNaN(id))
      : [];
    const visibilidade = Array.isArray(visibilidadeIds)
      ? visibilidadeIds.map((id) => parseInt(id, 10)).filter((id) => !Number.isNaN(id))
      : [];

    const existePessoa = await pool.query('SELECT id FROM pessoas WHERE id = $1', [pessoaIdNum]);
    if (existePessoa.rows.length === 0) {
      return res.status(404).json({ message: 'Pessoa não encontrada' });
    }

    const jaExiste = await pool.query(
      'SELECT id FROM acompanhamento WHERE pessoa_id = $1',
      [pessoaIdNum]
    );
    if (jaExiste.rows.length > 0) {
      return res.status(400).json({
        message: 'Esta pessoa já possui um acompanhamento. Edite o existente para alterar acompanhantes ou visibilidade.'
      });
    }

    const client = await pool.connect();
    try {
      const insertAcomp = await client.query(
        'INSERT INTO acompanhamento (pessoa_id) VALUES ($1) RETURNING id, pessoa_id, criado_em',
        [pessoaIdNum]
      );
      const acompanhamentoId = insertAcomp.rows[0].id;

      for (const pId of acompanhantes) {
        await client.query(
          'INSERT INTO acompanhamento_acompanhantes (acompanhamento_id, pessoa_id) VALUES ($1, $2)',
          [acompanhamentoId, pId]
        );
      }
      for (const pId of visibilidade) {
        await client.query(
          'INSERT INTO acompanhamento_visibilidade (acompanhamento_id, pessoa_id) VALUES ($1, $2)',
          [acompanhamentoId, pId]
        );
      }

      const row = insertAcomp.rows[0];
      return res.status(201).json({
        id: row.id,
        pessoaId: row.pessoa_id,
        criadoEm: row.criado_em
      });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Erro ao criar acompanhamento:', err);
    return res.status(500).json({
      message: err.message || 'Erro ao criar acompanhamento'
    });
  }
}

/**
 * Listar acompanhamentos com paginação. Por padrão exclui arquivados.
 * Query: page (default 1), limit (default 10, max 100), arquivados (true para listar só arquivados).
 */
async function listar(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const offset = (page - 1) * limit;
    const incluirArquivados = req.query.arquivados === 'true';

    const whereArquivado = incluirArquivados ? 'WHERE a.arquivado = TRUE' : 'WHERE (a.arquivado = FALSE OR a.arquivado IS NULL)';

    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total FROM acompanhamento a ${whereArquivado}`
    );
    const total = countResult.rows[0].total;

    const result = await pool.query(
      `SELECT a.id, a.pessoa_id, a.criado_em, a.arquivado,
              TRIM(p.nome || ' ' || COALESCE(p.sobrenome, '')) AS nome_pessoa
       FROM acompanhamento a
       JOIN pessoas p ON a.pessoa_id = p.id
       ${whereArquivado}
       ORDER BY a.criado_em DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const list = result.rows.map((row) => ({
      id: row.id,
      pessoaId: row.pessoa_id,
      criadoEm: row.criado_em,
      arquivado: !!row.arquivado,
      nomePessoa: row.nome_pessoa
    }));

    return res.json({
      acompanhamentos: list,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    console.error('Erro ao listar acompanhamentos:', err);
    return res.status(500).json({
      message: err.message || 'Erro ao listar acompanhamentos'
    });
  }
}

/**
 * Obter um acompanhamento por id com listas de acompanhantes e visibilidade (nomes e ids).
 */
async function obterPorId(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    const acomp = await pool.query(
      `SELECT a.id, a.pessoa_id, a.criado_em,
              TRIM(p.nome || ' ' || COALESCE(p.sobrenome, '')) AS nome_pessoa
       FROM acompanhamento a
       JOIN pessoas p ON a.pessoa_id = p.id
       WHERE a.id = $1`,
      [id]
    );

    if (acomp.rows.length === 0) {
      return res.status(404).json({ message: 'Acompanhamento não encontrado' });
    }

    const acompanhantes = await pool.query(
      `SELECT p.id, TRIM(p.nome || ' ' || COALESCE(p.sobrenome, '')) AS nome
       FROM acompanhamento_acompanhantes aa
       JOIN pessoas p ON aa.pessoa_id = p.id
       WHERE aa.acompanhamento_id = $1
       ORDER BY p.nome`,
      [id]
    );

    const visibilidade = await pool.query(
      `SELECT p.id, TRIM(p.nome || ' ' || COALESCE(p.sobrenome, '')) AS nome
       FROM acompanhamento_visibilidade av
       JOIN pessoas p ON av.pessoa_id = p.id
       WHERE av.acompanhamento_id = $1
       ORDER BY p.nome`,
      [id]
    );

    const row = acomp.rows[0];
    return res.json({
      id: row.id,
      pessoaId: row.pessoa_id,
      nomePessoa: row.nome_pessoa,
      criadoEm: row.criado_em,
      acompanhantes: acompanhantes.rows.map((r) => ({ id: r.id, nome: r.nome })),
      visibilidade: visibilidade.rows.map((r) => ({ id: r.id, nome: r.nome }))
    });
  } catch (err) {
    console.error('Erro ao obter acompanhamento:', err);
    return res.status(500).json({
      message: err.message || 'Erro ao obter acompanhamento'
    });
  }
}

/**
 * Atualizar acompanhantes e visibilidade de um acompanhamento.
 * Body: { acompanhantesIds: [], visibilidadeIds: [] }
 */
async function atualizar(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    const { acompanhantesIds = [], visibilidadeIds = [] } = req.body;

    const acompanhantes = Array.isArray(acompanhantesIds)
      ? acompanhantesIds.map((i) => parseInt(i, 10)).filter((i) => !Number.isNaN(i))
      : [];
    const visibilidade = Array.isArray(visibilidadeIds)
      ? visibilidadeIds.map((i) => parseInt(i, 10)).filter((i) => !Number.isNaN(i))
      : [];

    const existe = await pool.query('SELECT id FROM acompanhamento WHERE id = $1', [id]);
    if (existe.rows.length === 0) {
      return res.status(404).json({ message: 'Acompanhamento não encontrado' });
    }

    const client = await pool.connect();
    try {
      await client.query('DELETE FROM acompanhamento_acompanhantes WHERE acompanhamento_id = $1', [id]);
      await client.query('DELETE FROM acompanhamento_visibilidade WHERE acompanhamento_id = $1', [id]);

      for (const pId of acompanhantes) {
        await client.query(
          'INSERT INTO acompanhamento_acompanhantes (acompanhamento_id, pessoa_id) VALUES ($1, $2)',
          [id, pId]
        );
      }
      for (const pId of visibilidade) {
        await client.query(
          'INSERT INTO acompanhamento_visibilidade (acompanhamento_id, pessoa_id) VALUES ($1, $2)',
          [id, pId]
        );
      }
    } finally {
      client.release();
    }

    return res.json({ message: 'Acompanhamento atualizado' });
  } catch (err) {
    console.error('Erro ao atualizar acompanhamento:', err);
    return res.status(500).json({
      message: err.message || 'Erro ao atualizar acompanhamento'
    });
  }
}

/**
 * Arquivar acompanhamento (soft delete).
 */
async function arquivar(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    const result = await pool.query(
      'UPDATE acompanhamento SET arquivado = TRUE WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Acompanhamento não encontrado' });
    }

    return res.json({ message: 'Acompanhamento arquivado' });
  } catch (err) {
    console.error('Erro ao arquivar acompanhamento:', err);
    return res.status(500).json({
      message: err.message || 'Erro ao arquivar acompanhamento'
    });
  }
}

/**
 * Excluir acompanhamento permanentemente (cascade nas tabelas N:N).
 */
async function deletar(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    const result = await pool.query('DELETE FROM acompanhamento WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Acompanhamento não encontrado' });
    }

    return res.json({ message: 'Acompanhamento excluído' });
  } catch (err) {
    console.error('Erro ao excluir acompanhamento:', err);
    return res.status(500).json({
      message: err.message || 'Erro ao excluir acompanhamento'
    });
  }
}

module.exports = {
  criar,
  listar,
  obterPorId,
  atualizar,
  arquivar,
  deletar
};
