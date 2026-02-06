const pool = require('../config/database');

/**
 * Criar novo evento (schema jornada única)
 */
async function criarEvento(req, res) {
  try {
    const { titulo, descricao, tipo, data, hora, local } = req.body;
    const pessoaId = req.user.id; // req.user.id é pessoa_id no schema jornada única

    // Validações básicas
    if (!titulo || !titulo.trim()) {
      return res.status(400).json({ message: 'Título é obrigatório' });
    }

    if (!tipo) {
      return res.status(400).json({ message: 'Tipo é obrigatório' });
    }

    const tiposValidos = ['Culto', 'Reunião', 'Ensino', 'Evento Especial', 'Treinamento', 'Outro'];
    if (!tiposValidos.includes(tipo)) {
      return res.status(400).json({ message: 'Tipo de evento inválido' });
    }

    if (!data) {
      return res.status(400).json({ message: 'Data é obrigatória' });
    }

    if (!hora) {
      return res.status(400).json({ message: 'Hora é obrigatória' });
    }

    if (!local || !local.trim()) {
      return res.status(400).json({ message: 'Local é obrigatório' });
    }

    // Inserir evento
    const result = await pool.query(
      `INSERT INTO eventos (titulo, descricao, tipo, data, hora, local, criado_por)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, titulo, descricao, tipo, data, hora, local, criado_por, criado_em, atualizado_em`,
      [titulo.trim(), descricao || null, tipo, data, hora, local.trim(), pessoaId]
    );

    const evento = result.rows[0];

    res.status(201).json({
      message: 'Evento criado com sucesso',
      evento: {
        id: evento.id,
        titulo: evento.titulo,
        descricao: evento.descricao,
        tipo: evento.tipo,
        data: evento.data,
        hora: evento.hora,
        local: evento.local,
        criadoPor: evento.criado_por,
        criadoEm: evento.criado_em,
        atualizadoEm: evento.atualizado_em
      }
    });
  } catch (error) {
    console.error('Erro ao criar evento:', error);
    res.status(500).json({ message: 'Erro ao criar evento', error: error.message });
  }
}

/**
 * Listar eventos com filtros e paginação
 */
async function listarEventos(req, res) {
  try {
    const { tipo, dataInicio, dataFim, page = 1, pageSize = 10 } = req.query;
    
    const pageNum = parseInt(page);
    const pageSizeNum = parseInt(pageSize);
    const offset = (pageNum - 1) * pageSizeNum;

    // Construir query base
    let query = `
      SELECT 
        e.id,
        e.titulo,
        e.descricao,
        e.tipo,
        e.data,
        e.hora,
        e.local,
        e.criado_por,
        e.criado_em,
        e.atualizado_em,
        CONCAT(p.nome, ' ', COALESCE(p.sobrenome, '')) as criado_por_nome
      FROM eventos e
      LEFT JOIN pessoas p ON e.criado_por = p.id
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramIndex = 1;

    // Aplicar filtros
    if (tipo) {
      query += ` AND e.tipo = $${paramIndex}`;
      queryParams.push(tipo);
      paramIndex++;
    }

    if (dataInicio) {
      query += ` AND e.data >= $${paramIndex}`;
      queryParams.push(dataInicio);
      paramIndex++;
    }

    if (dataFim) {
      query += ` AND e.data <= $${paramIndex}`;
      queryParams.push(dataFim);
      paramIndex++;
    }

    // Contar total de registros
    const countQuery = query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM');
    const countResult = await pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Adicionar ordenação e paginação
    query += ` ORDER BY e.data ASC, e.hora ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(pageSizeNum, offset);

    // Executar query
    const result = await pool.query(query, queryParams);

    const eventos = result.rows.map(row => ({
      id: row.id,
      titulo: row.titulo,
      descricao: row.descricao,
      tipo: row.tipo,
      data: row.data,
      hora: row.hora,
      local: row.local,
      criadoPor: row.criado_por,
      criadoPorNome: row.criado_por_nome,
      criadoEm: row.criado_em,
      atualizadoEm: row.atualizado_em
    }));

    res.json({
      eventos,
      pagination: {
        page: pageNum,
        pageSize: pageSizeNum,
        total,
        totalPages: Math.ceil(total / pageSizeNum)
      }
    });
  } catch (error) {
    console.error('Erro ao listar eventos:', error);
    res.status(500).json({ message: 'Erro ao listar eventos', error: error.message });
  }
}

/**
 * Obter evento por ID
 */
async function obterEventoPorId(req, res) {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT 
        e.id,
        e.titulo,
        e.descricao,
        e.tipo,
        e.data,
        e.hora,
        e.local,
        e.criado_por,
        e.criado_em,
        e.atualizado_em,
        CONCAT(p.nome, ' ', COALESCE(p.sobrenome, '')) as criado_por_nome
      FROM eventos e
      LEFT JOIN pessoas p ON e.criado_por = p.id
      WHERE e.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Evento não encontrado' });
    }

    const evento = result.rows[0];

    // Buscar participantes do evento
    const participantesResult = await pool.query(
      `SELECT 
        ep.id,
        ep.pessoa_id,
        ep.confirmado,
        ep.compareceu,
        ep.criado_em,
        CONCAT(p.nome, ' ', COALESCE(p.sobrenome, '')) as nome_completo
      FROM evento_participantes ep
      JOIN pessoas p ON ep.pessoa_id = p.id
      WHERE ep.evento_id = $1
      ORDER BY ep.criado_em DESC`,
      [id]
    );

    res.json({
      evento: {
        id: evento.id,
        titulo: evento.titulo,
        descricao: evento.descricao,
        tipo: evento.tipo,
        data: evento.data,
        hora: evento.hora,
        local: evento.local,
        criadoPor: evento.criado_por,
        criadoPorNome: evento.criado_por_nome,
        criadoEm: evento.criado_em,
        atualizadoEm: evento.atualizado_em,
        participantes: participantesResult.rows.map(p => ({
          id: p.id,
          pessoaId: p.pessoa_id,
          nomeCompleto: p.nome_completo,
          confirmado: p.confirmado,
          compareceu: p.compareceu,
          criadoEm: p.criado_em
        }))
      }
    });
  } catch (error) {
    console.error('Erro ao obter evento:', error);
    res.status(500).json({ message: 'Erro ao obter evento', error: error.message });
  }
}

/**
 * Atualizar evento
 */
async function atualizarEvento(req, res) {
  try {
    const { id } = req.params;
    const { titulo, descricao, tipo, data, hora, local } = req.body;
    const pessoaId = req.user.id;

    // Validações básicas
    if (!titulo || !titulo.trim()) {
      return res.status(400).json({ message: 'Título é obrigatório' });
    }

    if (!tipo) {
      return res.status(400).json({ message: 'Tipo é obrigatório' });
    }

    const tiposValidos = ['Culto', 'Reunião', 'Ensino', 'Evento Especial', 'Treinamento', 'Outro'];
    if (!tiposValidos.includes(tipo)) {
      return res.status(400).json({ message: 'Tipo de evento inválido' });
    }

    if (!data) {
      return res.status(400).json({ message: 'Data é obrigatória' });
    }

    if (!hora) {
      return res.status(400).json({ message: 'Hora é obrigatória' });
    }

    if (!local || !local.trim()) {
      return res.status(400).json({ message: 'Local é obrigatório' });
    }

    // Verificar se o evento existe
    const eventoExistente = await pool.query(
      'SELECT criado_por FROM eventos WHERE id = $1',
      [id]
    );

    if (eventoExistente.rows.length === 0) {
      return res.status(404).json({ message: 'Evento não encontrado' });
    }

    // Verificar se o usuário é o criador (ou admin - pode ser implementado depois)
    if (eventoExistente.rows[0].criado_por !== pessoaId) {
      return res.status(403).json({ 
        message: 'Você não tem permissão para editar este evento' 
      });
    }

    // Atualizar evento
    const result = await pool.query(
      `UPDATE eventos 
       SET titulo = $1, 
           descricao = $2, 
           tipo = $3, 
           data = $4, 
           hora = $5, 
           local = $6,
           atualizado_em = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING id, titulo, descricao, tipo, data, hora, local, criado_por, criado_em, atualizado_em`,
      [titulo.trim(), descricao || null, tipo, data, hora, local.trim(), id]
    );

    res.json({
      message: 'Evento atualizado com sucesso',
      evento: {
        id: result.rows[0].id,
        titulo: result.rows[0].titulo,
        descricao: result.rows[0].descricao,
        tipo: result.rows[0].tipo,
        data: result.rows[0].data,
        hora: result.rows[0].hora,
        local: result.rows[0].local,
        criadoPor: result.rows[0].criado_por,
        criadoEm: result.rows[0].criado_em,
        atualizadoEm: result.rows[0].atualizado_em
      }
    });
  } catch (error) {
    console.error('Erro ao atualizar evento:', error);
    res.status(500).json({ message: 'Erro ao atualizar evento', error: error.message });
  }
}

/**
 * Deletar evento
 */
async function deletarEvento(req, res) {
  try {
    const { id } = req.params;
    const pessoaId = req.user.id;

    // Verificar se o evento existe
    const eventoExistente = await pool.query(
      'SELECT criado_por FROM eventos WHERE id = $1',
      [id]
    );

    if (eventoExistente.rows.length === 0) {
      return res.status(404).json({ message: 'Evento não encontrado' });
    }

    // Verificar se o usuário é o criador (ou admin)
    if (eventoExistente.rows[0].criado_por !== pessoaId) {
      return res.status(403).json({ 
        message: 'Você não tem permissão para deletar este evento' 
      });
    }

    // Deletar (CASCADE vai remover os participantes automaticamente)
    await pool.query('DELETE FROM eventos WHERE id = $1', [id]);

    res.json({ message: 'Evento deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar evento:', error);
    res.status(500).json({ message: 'Erro ao deletar evento', error: error.message });
  }
}

/**
 * Adicionar participante ao evento
 */
async function adicionarParticipante(req, res) {
  try {
    const { id } = req.params; // evento_id
    const { pessoaId } = req.body;

    if (!pessoaId) {
      return res.status(400).json({ message: 'ID da pessoa é obrigatório' });
    }

    // Verificar se o evento existe
    const eventoCheck = await pool.query('SELECT id FROM eventos WHERE id = $1', [id]);
    if (eventoCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Evento não encontrado' });
    }

    // Verificar se a pessoa existe
    const pessoaCheck = await pool.query('SELECT id FROM pessoas WHERE id = $1', [pessoaId]);
    if (pessoaCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Pessoa não encontrada' });
    }

    // Verificar se já é participante
    const participanteExistente = await pool.query(
      'SELECT id FROM evento_participantes WHERE evento_id = $1 AND pessoa_id = $2',
      [id, pessoaId]
    );

    if (participanteExistente.rows.length > 0) {
      return res.status(400).json({ message: 'Pessoa já é participante deste evento' });
    }

    // Adicionar participante
    const result = await pool.query(
      `INSERT INTO evento_participantes (evento_id, pessoa_id, confirmado)
       VALUES ($1, $2, FALSE)
       RETURNING id, evento_id, pessoa_id, confirmado, compareceu, criado_em`,
      [id, pessoaId]
    );

    // Buscar nome da pessoa
    const pessoaNome = await pool.query(
      `SELECT CONCAT(nome, ' ', COALESCE(sobrenome, '')) as nome_completo
       FROM pessoas WHERE id = $1`,
      [pessoaId]
    );

    res.status(201).json({
      message: 'Participante adicionado com sucesso',
      participante: {
        id: result.rows[0].id,
        eventoId: result.rows[0].evento_id,
        pessoaId: result.rows[0].pessoa_id,
        nomeCompleto: pessoaNome.rows[0].nome_completo,
        confirmado: result.rows[0].confirmado,
        compareceu: result.rows[0].compareceu,
        criadoEm: result.rows[0].criado_em
      }
    });
  } catch (error) {
    console.error('Erro ao adicionar participante:', error);
    res.status(500).json({ message: 'Erro ao adicionar participante', error: error.message });
  }
}

/**
 * Remover participante do evento
 */
async function removerParticipante(req, res) {
  try {
    const { id, participanteId } = req.params; // id = evento_id, participanteId = participante_id

    // Verificar se o participante existe
    const participanteCheck = await pool.query(
      'SELECT id FROM evento_participantes WHERE id = $1 AND evento_id = $2',
      [participanteId, id]
    );

    if (participanteCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Participante não encontrado neste evento' });
    }

    // Remover participante
    await pool.query('DELETE FROM evento_participantes WHERE id = $1', [participanteId]);

    res.json({ message: 'Participante removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover participante:', error);
    res.status(500).json({ message: 'Erro ao remover participante', error: error.message });
  }
}

/**
 * Atualizar status de participante (confirmado/compareceu)
 */
async function atualizarStatusParticipante(req, res) {
  try {
    const { id, participanteId } = req.params; // id = evento_id, participanteId = participante_id
    const { confirmado, compareceu } = req.body;

    // Verificar se o participante existe
    const participanteCheck = await pool.query(
      'SELECT id FROM evento_participantes WHERE id = $1 AND evento_id = $2',
      [participanteId, id]
    );

    if (participanteCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Participante não encontrado neste evento' });
    }

    // Atualizar status
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    if (confirmado !== undefined) {
      updateFields.push(`confirmado = $${paramIndex}`);
      updateValues.push(confirmado);
      paramIndex++;
    }

    if (compareceu !== undefined) {
      updateFields.push(`compareceu = $${paramIndex}`);
      updateValues.push(compareceu);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'Nenhum campo para atualizar' });
    }

    updateValues.push(participanteId);

    const result = await pool.query(
      `UPDATE evento_participantes 
       SET ${updateFields.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING id, evento_id, pessoa_id, confirmado, compareceu`,
      updateValues
    );

    res.json({
      message: 'Status do participante atualizado com sucesso',
      participante: {
        id: result.rows[0].id,
        eventoId: result.rows[0].evento_id,
        pessoaId: result.rows[0].pessoa_id,
        confirmado: result.rows[0].confirmado,
        compareceu: result.rows[0].compareceu
      }
    });
  } catch (error) {
    console.error('Erro ao atualizar status do participante:', error);
    res.status(500).json({ message: 'Erro ao atualizar status do participante', error: error.message });
  }
}

module.exports = {
  criarEvento,
  listarEventos,
  obterEventoPorId,
  atualizarEvento,
  deletarEvento,
  adicionarParticipante,
  removerParticipante,
  atualizarStatusParticipante,
};
