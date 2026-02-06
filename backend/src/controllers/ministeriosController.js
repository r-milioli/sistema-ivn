const pool = require('../config/database');

/**
 * Criar novo ministério
 */
async function criarMinisterio(req, res) {
  try {
    const { nome, descricao } = req.body;

    // Validações
    if (!nome || !nome.trim()) {
      return res.status(400).json({ 
        message: 'Nome do ministério é obrigatório' 
      });
    }

    // Verificar se já existe ministério com o mesmo nome
    const existeResult = await pool.query(
      'SELECT id FROM ministerios WHERE LOWER(nome) = LOWER($1)',
      [nome.trim()]
    );

    if (existeResult.rows.length > 0) {
      return res.status(400).json({ 
        message: 'Já existe um ministério com este nome' 
      });
    }

    // Inserir novo ministério
    const result = await pool.query(
      `INSERT INTO ministerios (nome, descricao, ativo) 
       VALUES ($1, $2, true) 
       RETURNING id, nome, descricao, ativo, criado_em, atualizado_em`,
      [nome.trim(), descricao?.trim() || null]
    );

    res.status(201).json({
      message: 'Ministério criado com sucesso',
      ministerio: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao criar ministério:', error);
    res.status(500).json({ 
      message: 'Erro ao criar ministério', 
      error: error.message 
    });
  }
}

/**
 * Listar todos os ministérios (incluindo inativos)
 */
async function listarMinisterios(req, res) {
  try {
    const { incluirInativos = false } = req.query;
    
    let query = 'SELECT id, nome, descricao, ativo, criado_em, atualizado_em FROM ministerios';
    const params = [];

    if (incluirInativos !== 'true') {
      query += ' WHERE ativo = true';
    }

    query += ' ORDER BY nome';

    const result = await pool.query(query, params);

    res.json({
      ministerios: result.rows
    });
  } catch (error) {
    console.error('Erro ao listar ministérios:', error);
    res.status(500).json({ 
      message: 'Erro ao listar ministérios', 
      error: error.message 
    });
  }
}

/**
 * Obter ministério por ID
 */
async function obterMinisterioPorId(req, res) {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT id, nome, descricao, ativo, criado_em, atualizado_em FROM ministerios WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Ministério não encontrado' });
    }

    res.json({
      ministerio: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao obter ministério:', error);
    res.status(500).json({ 
      message: 'Erro ao obter ministério', 
      error: error.message 
    });
  }
}

/**
 * Atualizar ministério
 */
async function atualizarMinisterio(req, res) {
  try {
    const { id } = req.params;
    const { nome, descricao, ativo } = req.body;

    // Validações
    if (!nome || !nome.trim()) {
      return res.status(400).json({ 
        message: 'Nome do ministério é obrigatório' 
      });
    }

    // Verificar se o ministério existe
    const existeResult = await pool.query(
      'SELECT id FROM ministerios WHERE id = $1',
      [id]
    );

    if (existeResult.rows.length === 0) {
      return res.status(404).json({ message: 'Ministério não encontrado' });
    }

    // Verificar se já existe outro ministério com o mesmo nome
    const nomeExisteResult = await pool.query(
      'SELECT id FROM ministerios WHERE LOWER(nome) = LOWER($1) AND id != $2',
      [nome.trim(), id]
    );

    if (nomeExisteResult.rows.length > 0) {
      return res.status(400).json({ 
        message: 'Já existe outro ministério com este nome' 
      });
    }

    // Atualizar ministério
    const result = await pool.query(
      `UPDATE ministerios 
       SET nome = $1, descricao = $2, ativo = COALESCE($3, ativo), 
           atualizado_em = CURRENT_TIMESTAMP 
       WHERE id = $4 
       RETURNING id, nome, descricao, ativo, criado_em, atualizado_em`,
      [nome.trim(), descricao?.trim() || null, ativo !== undefined ? ativo : null, id]
    );

    res.json({
      message: 'Ministério atualizado com sucesso',
      ministerio: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao atualizar ministério:', error);
    res.status(500).json({ 
      message: 'Erro ao atualizar ministério', 
      error: error.message 
    });
  }
}

/**
 * Deletar ministério (soft delete - marca como inativo)
 */
async function deletarMinisterio(req, res) {
  try {
    const { id } = req.params;

    // Verificar se o ministério existe
    const existeResult = await pool.query(
      'SELECT id FROM ministerios WHERE id = $1',
      [id]
    );

    if (existeResult.rows.length === 0) {
      return res.status(404).json({ message: 'Ministério não encontrado' });
    }

    // Soft delete - marca como inativo
    await pool.query(
      'UPDATE ministerios SET ativo = false, atualizado_em = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );

    res.json({
      message: 'Ministério deletado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao deletar ministério:', error);
    res.status(500).json({ 
      message: 'Erro ao deletar ministério', 
      error: error.message 
    });
  }
}

module.exports = {
  criarMinisterio,
  listarMinisterios,
  obterMinisterioPorId,
  atualizarMinisterio,
  deletarMinisterio
};
