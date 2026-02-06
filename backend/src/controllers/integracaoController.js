const pool = require('../config/database');

// Estágios válidos (estagio_espiritual_enum)
const ESTAGIOS_VALIDOS = [
  'Visitante', 'Visitante Frequente', 'Novo Convertido', 'Em Membresia',
  'Membro', 'Participante', 'Líder', 'Obreiro', 'Inativo'
];

/**
 * Função helper para registrar mudança de estágio na jornada espiritual
 */
async function registrarMudancaEstagio(client, pessoaId, estagioNovo, observacoes, registradoPor) {
  // Buscar estágio atual
  const pessoaResult = await client.query(
    'SELECT estagio_atual FROM pessoas WHERE id = $1',
    [pessoaId]
  );

  if (pessoaResult.rows.length === 0) {
    throw new Error('Pessoa não encontrada');
  }

  const estagioAnterior = pessoaResult.rows[0].estagio_atual;

  // Registrar na jornada espiritual
  await client.query(
    `INSERT INTO jornada_espiritual (pessoa_id, estagio_anterior, estagio_novo, observacoes, registrado_por)
     VALUES ($1, $2, $3, $4, $5)`,
    [pessoaId, estagioAnterior, estagioNovo, observacoes || null, registradoPor || null]
  );

  // O trigger atualizará automaticamente o estagio_atual em pessoas
}

/**
 * Integrar visitante (mudar estágio)
 * Atualiza o estágio de uma pessoa e registra na jornada espiritual
 */
async function integrarVisitante(req, res) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { 
      pessoaId, 
      novoEstagio, 
      observacoes,
      // Dados da pessoa para atualizar
      nome,
      sobrenome,
      email,
      telefone,
      dataNascimento,
      sexo,
      estadoCivil,
      cep,
      rua,
      numero,
      complemento,
      bairro,
      cidade,
      estado,
      fotoPerfil
    } = req.body;
    const userId = req.user.id;

    // Validações
    if (!pessoaId || !novoEstagio) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        message: 'pessoaId e novoEstagio são obrigatórios'
      });
    }

    if (!nome || !nome.trim()) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        message: 'Nome é obrigatório'
      });
    }

    if (!sobrenome || !sobrenome.trim()) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        message: 'Sobrenome é obrigatório'
      });
    }

    if (!ESTAGIOS_VALIDOS.includes(novoEstagio)) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        message: `Estágio inválido. Estágios válidos: ${ESTAGIOS_VALIDOS.join(', ')}`
      });
    }

    // Verificar se pessoa existe
    const pessoaCheck = await client.query(
      'SELECT id, estagio_atual FROM pessoas WHERE id = $1',
      [pessoaId]
    );

    if (pessoaCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Pessoa não encontrada' });
    }

    const estagioAtual = pessoaCheck.rows[0].estagio_atual;

    // Função helper para converter valores vazios em null
    const emptyToNull = (v) => {
      if (v === null || v === undefined) return null;
      if (typeof v === 'string' && v.trim() === '') return null;
      // Para datas, garantir que seja uma string válida ou null
      if (typeof v === 'string' && v.length > 0) {
        // Se for uma data válida (formato YYYY-MM-DD), retornar como está
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (dateRegex.test(v.trim())) {
          return v.trim();
        }
        // Se não for formato válido, retornar null
        return null;
      }
      return v;
    };

    // Sempre atualizar dados da pessoa (nome e sobrenome são obrigatórios, demais opcionais)
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    // Nome e sobrenome são obrigatórios
    updateFields.push(`nome = $${paramIndex++}`);
    updateValues.push(nome.trim());
    
    updateFields.push(`sobrenome = $${paramIndex++}`);
    updateValues.push(emptyToNull(sobrenome));

    // Demais campos são opcionais - sempre atualizar se vierem no body (mesmo que null)
    // O frontend sempre envia todos os campos, então vamos atualizar todos
    updateFields.push(`email = $${paramIndex++}`);
    updateValues.push(emptyToNull(email));
    
    updateFields.push(`telefone = $${paramIndex++}`);
    updateValues.push(emptyToNull(telefone));
    
    updateFields.push(`data_nascimento = $${paramIndex++}`);
    updateValues.push(emptyToNull(dataNascimento));
    
    updateFields.push(`sexo = $${paramIndex++}`);
    updateValues.push(emptyToNull(sexo));
    
    updateFields.push(`estado_civil = $${paramIndex++}`);
    updateValues.push(emptyToNull(estadoCivil));
    
    updateFields.push(`cep = $${paramIndex++}`);
    updateValues.push(emptyToNull(cep));
    
    updateFields.push(`rua = $${paramIndex++}`);
    updateValues.push(emptyToNull(rua));
    
    updateFields.push(`numero = $${paramIndex++}`);
    updateValues.push(emptyToNull(numero));
    
    updateFields.push(`complemento = $${paramIndex++}`);
    updateValues.push(emptyToNull(complemento));
    
    updateFields.push(`bairro = $${paramIndex++}`);
    updateValues.push(emptyToNull(bairro));
    
    updateFields.push(`cidade = $${paramIndex++}`);
    updateValues.push(emptyToNull(cidade));
    
    updateFields.push(`estado = $${paramIndex++}`);
    updateValues.push(emptyToNull(estado));
    
    // Foto de perfil - só atualizar se fornecida
    if (fotoPerfil !== undefined && fotoPerfil !== null) {
      updateFields.push(`foto_perfil = $${paramIndex++}`);
      updateValues.push(fotoPerfil);
    }

    // Adicionar atualizado_em
    updateFields.push(`atualizado_em = CURRENT_TIMESTAMP`);

    // Adicionar pessoaId como último parâmetro
    updateValues.push(pessoaId);

    const updateQuery = `
      UPDATE pessoas 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
    `;

    await client.query(updateQuery, updateValues);

    // Registrar mudança de estágio
    await registrarMudancaEstagio(
      client,
      pessoaId,
      novoEstagio,
      observacoes || `Mudança de estágio: ${estagioAtual} → ${novoEstagio}`,
      userId
    );

    await client.query('COMMIT');

    res.json({
      message: 'Visitante integrado com sucesso',
      pessoaId,
      estagioAnterior: estagioAtual,
      estagioNovo: novoEstagio
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao integrar visitante:', error);
    res.status(500).json({
      message: 'Erro ao integrar visitante',
      error: error.message
    });
  } finally {
    client.release();
  }
}

/**
 * Registrar conversão
 * Cria registro em conversoes e atualiza estágio para "Novo Convertido"
 */
async function registrarConversao(req, res) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const {
      pessoaId,
      dataConversao,
      localConversao,
      testemunho
    } = req.body;
    const userId = req.user.id;

    // Validações
    if (!pessoaId || !dataConversao || !localConversao) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        message: 'pessoaId, dataConversao e localConversao são obrigatórios'
      });
    }

    // Verificar se pessoa existe
    const pessoaCheck = await client.query(
      'SELECT id, estagio_atual FROM pessoas WHERE id = $1',
      [pessoaId]
    );

    if (pessoaCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Pessoa não encontrada' });
    }

    // Verificar se já tem conversão registrada
    const conversaoExistente = await client.query(
      'SELECT id FROM conversoes WHERE pessoa_id = $1',
      [pessoaId]
    );

    if (conversaoExistente.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        message: 'Esta pessoa já possui uma conversão registrada'
      });
    }

    // Registrar conversão
    const conversaoResult = await client.query(
      `INSERT INTO conversoes (pessoa_id, data_conversao, local_conversao, acompanhado_por, testemunho)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, pessoa_id, data_conversao, local_conversao, testemunho`,
      [pessoaId, dataConversao, localConversao, userId, testemunho || null]
    );

    // Registrar mudança de estágio para "Novo Convertido"
    await registrarMudancaEstagio(
      client,
      pessoaId,
      'Novo Convertido',
      `Converteu-se em ${localConversao}`,
      userId
    );

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Conversão registrada com sucesso',
      conversao: conversaoResult.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao registrar conversão:', error);
    res.status(500).json({
      message: 'Erro ao registrar conversão',
      error: error.message
    });
  } finally {
    client.release();
  }
}

/**
 * Matricular em membresia
 * Cria matrícula e as 5 aulas iniciais
 */
async function matricularMembresia(req, res) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { pessoaId, dataMatricula } = req.body;
    const userId = req.user.id;

    // Validações
    if (!pessoaId || !dataMatricula) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        message: 'pessoaId e dataMatricula são obrigatórios'
      });
    }

    // Verificar se pessoa existe
    const pessoaCheck = await client.query(
      'SELECT id, estagio_atual FROM pessoas WHERE id = $1',
      [pessoaId]
    );

    if (pessoaCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Pessoa não encontrada' });
    }

    // Verificar se já tem matrícula ativa (não concluída)
    const matriculaExistente = await client.query(
      'SELECT id FROM matriculas_membresia WHERE pessoa_id = $1 AND concluido = FALSE',
      [pessoaId]
    );

    if (matriculaExistente.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        message: 'Esta pessoa já possui uma matrícula em andamento'
      });
    }

    // Criar matrícula
    const matriculaResult = await client.query(
      `INSERT INTO matriculas_membresia (pessoa_id, data_matricula)
       VALUES ($1, $2)
       RETURNING id, pessoa_id, data_matricula, concluido`,
      [pessoaId, dataMatricula]
    );

    const matriculaId = matriculaResult.rows[0].id;

    // Criar as 5 aulas
    for (let aulaNumero = 1; aulaNumero <= 5; aulaNumero++) {
      await client.query(
        `INSERT INTO aulas_membresia (matricula_id, aula_numero)
         VALUES ($1, $2)`,
        [matriculaId, aulaNumero]
      );
    }

    // Registrar mudança de estágio para "Em Membresia"
    await registrarMudancaEstagio(
      client,
      pessoaId,
      'Em Membresia',
      'Iniciou curso de membresia',
      userId
    );

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Matrícula realizada com sucesso',
      matricula: {
        ...matriculaResult.rows[0],
        aulas: [1, 2, 3, 4, 5].map(num => ({
          numero: num,
          concluida: false,
          dataConclusao: null
        }))
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao matricular em membresia:', error);
    res.status(500).json({
      message: 'Erro ao matricular em membresia',
      error: error.message
    });
  } finally {
    client.release();
  }
}

/**
 * Listar matrículas de membresia
 */
async function listarMatriculasMembresia(req, res) {
  try {
    const { page = 1, pageSize = 10, concluido } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);

    let query = `
      SELECT 
        m.id,
        m.pessoa_id,
        m.data_matricula,
        m.data_conclusao,
        m.concluido,
        CONCAT(p.nome, ' ', COALESCE(p.sobrenome, '')) as nome_completo,
        p.email,
        p.telefone
      FROM matriculas_membresia m
      INNER JOIN pessoas p ON m.pessoa_id = p.id
    `;

    const queryParams = [];
    const conditions = [];

    if (concluido !== undefined) {
      conditions.push(`m.concluido = $${queryParams.length + 1}`);
      queryParams.push(concluido === 'true');
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY m.data_matricula DESC';

    // Contar total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM matriculas_membresia m
      ${conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''}
    `;

    const [result, countResult] = await Promise.all([
      pool.query(query + ` LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`, [
        ...queryParams,
        parseInt(pageSize),
        offset
      ]),
      pool.query(countQuery, queryParams)
    ]);

    const total = parseInt(countResult.rows[0].total);

    // Buscar aulas de cada matrícula
    const matriculas = await Promise.all(
      result.rows.map(async (matricula) => {
        const aulasResult = await pool.query(
          `SELECT aula_numero, concluida, data_conclusao, observacoes
           FROM aulas_membresia
           WHERE matricula_id = $1
           ORDER BY aula_numero`,
          [matricula.id]
        );

        return {
          ...matricula,
          aulas: aulasResult.rows.map(aula => ({
            numero: aula.aula_numero,
            concluida: aula.concluida,
            dataConclusao: aula.data_conclusao,
            observacoes: aula.observacoes
          }))
        };
      })
    );

    res.json({
      matriculas,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total,
        totalPages: Math.ceil(total / parseInt(pageSize))
      }
    });
  } catch (error) {
    console.error('Erro ao listar matrículas:', error);
    res.status(500).json({
      message: 'Erro ao listar matrículas',
      error: error.message
    });
  }
}

/**
 * Obter matrícula por ID
 */
async function obterMatriculaPorId(req, res) {
  try {
    const { id } = req.params;

    const matriculaResult = await pool.query(
      `SELECT 
        m.id,
        m.pessoa_id,
        m.data_matricula,
        m.data_conclusao,
        m.concluido,
        CONCAT(p.nome, ' ', COALESCE(p.sobrenome, '')) as nome_completo,
        p.email,
        p.telefone,
        p.data_nascimento
      FROM matriculas_membresia m
      INNER JOIN pessoas p ON m.pessoa_id = p.id
      WHERE m.id = $1`,
      [id]
    );

    if (matriculaResult.rows.length === 0) {
      return res.status(404).json({ message: 'Matrícula não encontrada' });
    }

    const matricula = matriculaResult.rows[0];

    // Buscar aulas
    const aulasResult = await pool.query(
      `SELECT aula_numero, concluida, data_conclusao, observacoes
       FROM aulas_membresia
       WHERE matricula_id = $1
       ORDER BY aula_numero`,
      [id]
    );

    res.json({
      matricula: {
        ...matricula,
        aulas: aulasResult.rows.map(aula => ({
          numero: aula.aula_numero,
          concluida: aula.concluida,
          dataConclusao: aula.data_conclusao,
          observacoes: aula.observacoes
        }))
      }
    });
  } catch (error) {
    console.error('Erro ao obter matrícula:', error);
    res.status(500).json({
      message: 'Erro ao obter matrícula',
      error: error.message
    });
  }
}

/**
 * Atualizar status de aula
 */
async function atualizarStatusAula(req, res) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { matriculaId, aulaNumero } = req.params;
    const { concluida, observacoes } = req.body;

    // Verificar se matrícula existe
    const matriculaCheck = await client.query(
      'SELECT id, pessoa_id, concluido FROM matriculas_membresia WHERE id = $1',
      [matriculaId]
    );

    if (matriculaCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Matrícula não encontrada' });
    }

    // Verificar se aula existe
    const aulaCheck = await client.query(
      'SELECT id, concluida FROM aulas_membresia WHERE matricula_id = $1 AND aula_numero = $2',
      [matriculaId, aulaNumero]
    );

    if (aulaCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Aula não encontrada' });
    }

    // Atualizar aula
    const dataConclusao = concluida ? new Date().toISOString().split('T')[0] : null;

    await client.query(
      `UPDATE aulas_membresia
       SET concluida = $1, data_conclusao = $2, observacoes = $3, atualizado_em = CURRENT_TIMESTAMP
       WHERE matricula_id = $4 AND aula_numero = $5`,
      [concluida, dataConclusao, observacoes || null, matriculaId, aulaNumero]
    );

    // Se todas as aulas foram concluídas, o trigger marcará a matrícula como concluída
    // Verificar se todas estão concluídas e atualizar estágio para "Membro"
    if (concluida) {
      const todasAulasResult = await client.query(
        'SELECT COUNT(*) as total, SUM(CASE WHEN concluida THEN 1 ELSE 0 END) as concluidas FROM aulas_membresia WHERE matricula_id = $1',
        [matriculaId]
      );

      const { total, concluidas } = todasAulasResult.rows[0];
      if (parseInt(concluidas) === parseInt(total) && parseInt(total) === 5) {
        // Todas as 5 aulas concluídas - atualizar estágio para "Membro"
        const pessoaId = matriculaCheck.rows[0].pessoa_id;
        await registrarMudancaEstagio(
          client,
          pessoaId,
          'Membro',
          'Concluiu curso de membresia',
          req.user.id
        );
      }
    }

    await client.query('COMMIT');

    res.json({
      message: 'Status da aula atualizado com sucesso'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao atualizar status da aula:', error);
    res.status(500).json({
      message: 'Erro ao atualizar status da aula',
      error: error.message
    });
  } finally {
    client.release();
  }
}

/**
 * Adicionar pessoa a ministério
 */
async function adicionarPessoaMinisterio(req, res) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { pessoaId, ministerioId, eLider, dataInicio, observacoes } = req.body;
    const userId = req.user.id;

    // Validações
    if (!pessoaId || !ministerioId || !dataInicio) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        message: 'pessoaId, ministerioId e dataInicio são obrigatórios'
      });
    }

    // Verificar se pessoa existe
    const pessoaCheck = await client.query(
      'SELECT id, estagio_atual FROM pessoas WHERE id = $1',
      [pessoaId]
    );

    if (pessoaCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Pessoa não encontrada' });
    }

    // Verificar se ministério existe
    const ministerioCheck = await client.query(
      'SELECT id, nome FROM ministerios WHERE id = $1',
      [ministerioId]
    );

    if (ministerioCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Ministério não encontrado' });
    }

    // Verificar se já está no ministério (sem data_fim)
    const participacaoExistente = await client.query(
      'SELECT id FROM pessoa_ministerios WHERE pessoa_id = $1 AND ministerio_id = $2 AND data_fim IS NULL',
      [pessoaId, ministerioId]
    );

    if (participacaoExistente.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        message: 'Esta pessoa já está participando deste ministério'
      });
    }

    // Adicionar ao ministério
    const participacaoResult = await client.query(
      `INSERT INTO pessoa_ministerios (pessoa_id, ministerio_id, e_lider, data_inicio, observacoes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, pessoa_id, ministerio_id, e_lider, data_inicio, observacoes`,
      [pessoaId, ministerioId, eLider || false, dataInicio, observacoes || null]
    );

    // Atualizar estágio
    const novoEstagio = eLider ? 'Líder' : 'Participante';
    const estagioAtual = pessoaCheck.rows[0].estagio_atual;

    // Só atualizar se o estágio atual não for mais avançado
    if (estagioAtual !== 'Líder' && estagioAtual !== 'Obreiro') {
      await registrarMudancaEstagio(
        client,
        pessoaId,
        novoEstagio,
        `${eLider ? 'Assumiu liderança' : 'Começou a participar'} do ministério ${ministerioCheck.rows[0].nome}`,
        userId
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Pessoa adicionada ao ministério com sucesso',
      participacao: participacaoResult.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao adicionar pessoa ao ministério:', error);
    res.status(500).json({
      message: 'Erro ao adicionar pessoa ao ministério',
      error: error.message
    });
  } finally {
    client.release();
  }
}

/**
 * Listar pessoas em ministérios
 */
async function listarPessoasMinisterios(req, res) {
  try {
    const { ministerioId, pessoaId, eLider } = req.query;

    let query = `
      SELECT 
        pm.id,
        pm.pessoa_id,
        pm.ministerio_id,
        pm.e_lider,
        pm.data_inicio,
        pm.data_fim,
        pm.observacoes,
        CONCAT(p.nome, ' ', COALESCE(p.sobrenome, '')) as nome_completo,
        p.email,
        p.telefone,
        m.nome as ministerio_nome
      FROM pessoa_ministerios pm
      INNER JOIN pessoas p ON pm.pessoa_id = p.id
      INNER JOIN ministerios m ON pm.ministerio_id = m.id
      WHERE pm.data_fim IS NULL
    `;

    const queryParams = [];
    const conditions = [];

    if (ministerioId) {
      conditions.push(`pm.ministerio_id = $${queryParams.length + 1}`);
      queryParams.push(ministerioId);
    }

    if (pessoaId) {
      conditions.push(`pm.pessoa_id = $${queryParams.length + 1}`);
      queryParams.push(pessoaId);
    }

    if (eLider !== undefined) {
      conditions.push(`pm.e_lider = $${queryParams.length + 1}`);
      queryParams.push(eLider === 'true');
    }

    if (conditions.length > 0) {
      query += ' AND ' + conditions.join(' AND ');
    }

    query += ' ORDER BY m.nome, p.nome';

    const result = await pool.query(query, queryParams);

    res.json({
      participacoes: result.rows
    });
  } catch (error) {
    console.error('Erro ao listar pessoas em ministérios:', error);
    res.status(500).json({
      message: 'Erro ao listar pessoas em ministérios',
      error: error.message
    });
  }
}

/**
 * Listar novos convertidos com informações de conversão e primeira visita
 */
async function listarNovosConvertidos(req, res) {
  try {
    const { search, dataVisita, page = 1, pageSize = 10 } = req.query;

    const pageNum = parseInt(page);
    const pageSizeNum = parseInt(pageSize);
    const offset = (pageNum - 1) * pageSizeNum;

    let query = `
      SELECT 
        p.id,
        p.nome,
        p.sobrenome,
        p.data_nascimento,
        p.telefone,
        p.whatsapp,
        p.email,
        p.bairro,
        p.cidade,
        p.como_conheceu,
        c.data_conversao,
        c.local_conversao,
        acompanhado.nome || ' ' || COALESCE(acompanhado.sobrenome, '') as acompanhado_por,
        primeira_visita.data_visita as primeira_visita,
        recepcionado.nome || ' ' || COALESCE(recepcionado.sobrenome, '') as recepcionado_por,
        primeira_visita.pedido_oracao
      FROM pessoas p
      LEFT JOIN conversoes c ON p.id = c.pessoa_id
      LEFT JOIN pessoas acompanhado ON c.acompanhado_por = acompanhado.id
      LEFT JOIN (
        SELECT v1.pessoa_id, v1.data_visita, v1.recepcionado_por, v1.pedido_oracao
        FROM visitas v1
        INNER JOIN (
          SELECT pessoa_id, MIN(data_visita) as primeira_data
          FROM visitas
          GROUP BY pessoa_id
        ) v2 ON v1.pessoa_id = v2.pessoa_id AND v1.data_visita = v2.primeira_data
      ) primeira_visita ON primeira_visita.pessoa_id = p.id
      LEFT JOIN pessoas recepcionado ON primeira_visita.recepcionado_por = recepcionado.id
      WHERE p.estagio_atual = 'Novo Convertido'
        AND p.ativo = TRUE
    `;

    const queryParams = [];
    let paramIndex = 1;

    if (search) {
      query += ` AND (
        p.nome ILIKE $${paramIndex} OR
        p.sobrenome ILIKE $${paramIndex} OR
        p.email ILIKE $${paramIndex} OR
        p.telefone ILIKE $${paramIndex} OR
        COALESCE(p.whatsapp, '') ILIKE $${paramIndex} OR
        CONCAT(p.nome, ' ', COALESCE(p.sobrenome, '')) ILIKE $${paramIndex}
      )`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    if (dataVisita) {
      // Filtrar por data da primeira visita
      query += ` AND EXISTS (
        SELECT 1 FROM visitas v
        WHERE v.pessoa_id = p.id
        AND DATE(v.data_visita) = $${paramIndex}
        AND v.data_visita = (
          SELECT MIN(data_visita) FROM visitas WHERE pessoa_id = p.id
        )
      )`;
      queryParams.push(dataVisita);
      paramIndex++;
    }

    // Contar total
    const countQuery = query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(DISTINCT p.id) as total FROM');
    const countResult = await pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Adicionar ordenação e paginação
    query += ` ORDER BY c.data_conversao DESC NULLS LAST, p.nome, p.sobrenome LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(pageSizeNum, offset);

    const result = await pool.query(query, queryParams);

    const novosConvertidos = result.rows.map(row => ({
      id: row.id,
      nome: row.nome,
      sobrenome: row.sobrenome,
      nomeCompleto: `${row.nome} ${row.sobrenome || ''}`.trim(),
      dataNascimento: row.data_nascimento ? row.data_nascimento.toISOString().split('T')[0] : null,
      telefone: row.telefone,
      whatsapp: row.whatsapp,
      email: row.email,
      bairro: row.bairro,
      cidade: row.cidade,
      comoConheceu: row.como_conheceu,
      dataConversao: row.data_conversao,
      localConversao: row.local_conversao,
      acompanhadoPor: row.acompanhado_por,
      primeiraVisita: row.primeira_visita,
      recepcionadoPor: row.recepcionado_por,
      pedidoOracao: row.pedido_oracao
    }));

    res.json({
      novosConvertidos,
      pagination: {
        page: pageNum,
        pageSize: pageSizeNum,
        total,
        totalPages: Math.ceil(total / pageSizeNum)
      }
    });
  } catch (error) {
    console.error('Erro ao listar novos convertidos:', error);
    res.status(500).json({
      message: 'Erro ao listar novos convertidos',
      error: error.message
    });
  }
}

module.exports = {
  integrarVisitante,
  registrarConversao,
  matricularMembresia,
  listarMatriculasMembresia,
  obterMatriculaPorId,
  atualizarStatusAula,
  adicionarPessoaMinisterio,
  listarPessoasMinisterios,
  listarNovosConvertidos
};
