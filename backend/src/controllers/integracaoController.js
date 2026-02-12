const pool = require('../config/database');

// Estágios válidos (estagio_espiritual_enum)
const ESTAGIOS_VALIDOS = [
  'Visitante', 'Visitante Frequente', 'Novo Convertido', 'Em Batismo', 'Batizado',
  'Em Membresia', 'Membro', 'Participante', 'Líder', 'Obreiro', 'Inativo'
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
      podeIncluirGrupoWhatsapp,
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

    // Normalizar strings (trim; null/undefined/'' viram null para COALESCE)
    const norm = (v) => {
      if (v === null || v === undefined) return null;
      if (typeof v === 'string') {
        const t = v.trim();
        return t === '' ? null : t;
      }
      return v;
    };

    // Sempre atualizar todos os campos. Opcionais: COALESCE(NULLIF(trim($n), ''), coluna) = só sobrescreve quando vier valor preenchido (não apaga com null)
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    updateFields.push(`nome = $${paramIndex++}`);
    updateValues.push(nome.trim());

    updateFields.push(`sobrenome = $${paramIndex++}`);
    updateValues.push(norm(sobrenome) ?? '');

    updateFields.push(`email = COALESCE(NULLIF(TRIM($${paramIndex++}), ''), email)`);
    updateValues.push(norm(email));

    updateFields.push(`telefone = COALESCE(NULLIF(TRIM($${paramIndex++}), ''), telefone)`);
    updateValues.push(norm(telefone));

    updateFields.push(`data_nascimento = COALESCE($${paramIndex++}, data_nascimento)`);
    updateValues.push(emptyToNull(dataNascimento));

    updateFields.push(`sexo = COALESCE(NULLIF(TRIM($${paramIndex++}), '')::sexo_enum, sexo)`);
    updateValues.push(norm(sexo));

    updateFields.push(`estado_civil = COALESCE(NULLIF(TRIM($${paramIndex++}), '')::estado_civil_enum, estado_civil)`);
    updateValues.push(norm(estadoCivil));

    updateFields.push(`cep = COALESCE(NULLIF(TRIM($${paramIndex++}), ''), cep)`);
    updateValues.push(norm(cep));

    updateFields.push(`rua = COALESCE(NULLIF(TRIM($${paramIndex++}), ''), rua)`);
    updateValues.push(norm(rua));

    updateFields.push(`numero = COALESCE(NULLIF(TRIM($${paramIndex++}), ''), numero)`);
    updateValues.push(norm(numero));

    updateFields.push(`complemento = COALESCE(NULLIF(TRIM($${paramIndex++}), ''), complemento)`);
    updateValues.push(norm(complemento));

    updateFields.push(`bairro = COALESCE(NULLIF(TRIM($${paramIndex++}), ''), bairro)`);
    updateValues.push(norm(bairro));

    updateFields.push(`cidade = COALESCE(NULLIF(TRIM($${paramIndex++}), ''), cidade)`);
    updateValues.push(norm(cidade));

    updateFields.push(`estado = COALESCE(NULLIF(TRIM($${paramIndex++}), '')::estado_brasil_enum, estado)`);
    updateValues.push(norm(estado));
    
    // Foto de perfil - só atualizar se fornecida (pode enviar para S3 se configurado)
    if (fotoPerfil !== undefined && fotoPerfil !== null) {
      const storageService = require('../services/storageService');
      const fotoPerfilToSave = await storageService.prepareFotoPerfilForSave(fotoPerfil, 'fotos-perfil', String(pessoaId));
      updateFields.push(`foto_perfil = $${paramIndex++}`);
      updateValues.push(fotoPerfilToSave);
    }

    // Pode incluir no grupo de WhatsApp (opcional)
    if (podeIncluirGrupoWhatsapp !== undefined) {
      updateFields.push(`pode_incluir_grupo_whatsapp = $${paramIndex++}`);
      updateValues.push(podeIncluirGrupoWhatsapp === true ? true : podeIncluirGrupoWhatsapp === false ? false : null);
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
        p.telefone,
        p.estagio_atual
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

        // Garantir que todos os campos sejam retornados, mesmo se null
        const matriculaData = {
          id: matricula.id,
          pessoa_id: matricula.pessoa_id,
          data_matricula: matricula.data_matricula,
          data_conclusao: matricula.data_conclusao,
          concluido: matricula.concluido,
          nome_completo: matricula.nome_completo || null,
          email: matricula.email || null,
          telefone: matricula.telefone || null,
          estagio_atual: matricula.estagio_atual || null,
          aulas: aulasResult.rows.map(aula => ({
            numero: aula.aula_numero,
            concluida: aula.concluida,
            dataConclusao: aula.data_conclusao,
            observacoes: aula.observacoes
          }))
        };

        return matriculaData;
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
      const id = parseInt(ministerioId, 10);
      if (!isNaN(id)) {
        conditions.push(`pm.ministerio_id = $${queryParams.length + 1}`);
        queryParams.push(id);
      }
    }

    if (pessoaId) {
      const id = parseInt(pessoaId, 10);
      if (!isNaN(id)) {
        conditions.push(`pm.pessoa_id = $${queryParams.length + 1}`);
        queryParams.push(id);
      }
    }

    if (eLider !== undefined) {
      conditions.push(`pm.e_lider = $${queryParams.length + 1}`);
      queryParams.push(eLider === 'true');
    }

    if (conditions.length > 0) {
      query += ' AND ' + conditions.join(' AND ');
    }

    // Líderes primeiro, depois nome (útil para dropdown de acompanhantes)
    query += ' ORDER BY pm.e_lider DESC, p.nome, p.sobrenome';

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
    const { search, dataVisita, page = 1, pageSize = 10, somenteMeus } = req.query;

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
        p.pode_incluir_grupo_whatsapp,
        c.data_conversao,
        c.local_conversao,
        c.acompanhado_por as acompanhado_por_id,
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

    if (somenteMeus === 'true' && req.user?.id) {
      query += ` AND c.acompanhado_por = $${paramIndex}`;
      queryParams.push(req.user.id);
      paramIndex++;
    }

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
      podeIncluirGrupoWhatsapp: row.pode_incluir_grupo_whatsapp,
      dataConversao: row.data_conversao,
      localConversao: row.local_conversao,
      acompanhadoPorId: row.acompanhado_por_id ?? null,
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

/**
 * Obter estatísticas de analytics
 * Retorna estatísticas sobre novos convertidos, alunos de membresia, aulas, etc.
 */
async function obterEstatisticasAnalytics(req, res) {
  try {
    const { dataInicio, dataFim } = req.query;

    // Valores padrão: mês atual
    const hoje = new Date();
    const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const ultimoDiaMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

    const inicio = dataInicio ? new Date(dataInicio) : primeiroDiaMes;
    const fim = dataFim ? new Date(dataFim) : ultimoDiaMes;
    
    // Ajustar para incluir o dia inteiro
    fim.setHours(23, 59, 59, 999);

    // 1. Total de novos convertidos no período
    const novosConvertidosQuery = await pool.query(
      `SELECT COUNT(*) as total
       FROM conversoes c
       INNER JOIN pessoas p ON c.pessoa_id = p.id
       WHERE DATE(c.data_conversao) >= $1 AND DATE(c.data_conversao) <= $2
         AND p.ativo = TRUE`,
      [inicio.toISOString().split('T')[0], fim.toISOString().split('T')[0]]
    );
    const totalNovosConvertidos = parseInt(novosConvertidosQuery.rows[0].total);

    // 2. Total de alunos de membresia no período
    const alunosMembresiaQuery = await pool.query(
      `SELECT COUNT(*) as total
       FROM matriculas_membresia m
       INNER JOIN pessoas p ON m.pessoa_id = p.id
       WHERE DATE(m.data_matricula) >= $1 AND DATE(m.data_matricula) <= $2
         AND p.ativo = TRUE`,
      [inicio.toISOString().split('T')[0], fim.toISOString().split('T')[0]]
    );
    const totalAlunosMembresia = parseInt(alunosMembresiaQuery.rows[0].total);

    // 3. Estatísticas de aulas
    // Total de aulas concluídas e não concluídas
    const aulasTotaisQuery = await pool.query(
      `SELECT 
         COUNT(CASE WHEN a.concluida = TRUE THEN 1 END) as total_aulas_concluidas,
         COUNT(CASE WHEN a.concluida = FALSE THEN 1 END) as total_aulas_nao_concluidas
       FROM matriculas_membresia m
       INNER JOIN pessoas p ON m.pessoa_id = p.id
       INNER JOIN aulas_membresia a ON m.id = a.matricula_id
       WHERE DATE(m.data_matricula) >= $1 AND DATE(m.data_matricula) <= $2
         AND p.ativo = TRUE`,
      [inicio.toISOString().split('T')[0], fim.toISOString().split('T')[0]]
    );

    const totalAulasConcluidas = parseInt(aulasTotaisQuery.rows[0].total_aulas_concluidas) || 0;
    const totalAulasNaoConcluidas = parseInt(aulasTotaisQuery.rows[0].total_aulas_nao_concluidas) || 0;

    // Alunos com todas as aulas concluídas
    const todasAulasQuery = await pool.query(
      `SELECT COUNT(DISTINCT m.id) as total
       FROM matriculas_membresia m
       INNER JOIN pessoas p ON m.pessoa_id = p.id
       WHERE DATE(m.data_matricula) >= $1 AND DATE(m.data_matricula) <= $2
         AND p.ativo = TRUE
         AND (
           SELECT COUNT(*) 
           FROM aulas_membresia a 
           WHERE a.matricula_id = m.id AND a.concluida = TRUE
         ) = 5`,
      [inicio.toISOString().split('T')[0], fim.toISOString().split('T')[0]]
    );
    const alunosComTodasAulas = parseInt(todasAulasQuery.rows[0].total) || 0;

    // Alunos com alguma aula concluída
    const algumaAulaQuery = await pool.query(
      `SELECT COUNT(DISTINCT m.id) as total
       FROM matriculas_membresia m
       INNER JOIN pessoas p ON m.pessoa_id = p.id
       WHERE DATE(m.data_matricula) >= $1 AND DATE(m.data_matricula) <= $2
         AND p.ativo = TRUE
         AND EXISTS (
           SELECT 1 
           FROM aulas_membresia a 
           WHERE a.matricula_id = m.id AND a.concluida = TRUE
         )`,
      [inicio.toISOString().split('T')[0], fim.toISOString().split('T')[0]]
    );
    const alunosComAlgumaAula = parseInt(algumaAulaQuery.rows[0].total) || 0;

    // Alunos sem aulas concluídas
    const semAulasQuery = await pool.query(
      `SELECT COUNT(DISTINCT m.id) as total
       FROM matriculas_membresia m
       INNER JOIN pessoas p ON m.pessoa_id = p.id
       WHERE DATE(m.data_matricula) >= $1 AND DATE(m.data_matricula) <= $2
         AND p.ativo = TRUE
         AND NOT EXISTS (
           SELECT 1 
           FROM aulas_membresia a 
           WHERE a.matricula_id = m.id AND a.concluida = TRUE
         )`,
      [inicio.toISOString().split('T')[0], fim.toISOString().split('T')[0]]
    );
    const alunosSemAulas = parseInt(semAulasQuery.rows[0].total) || 0;

    // Taxa de conclusão
    const totalAulasPossiveis = totalAlunosMembresia * 5;
    const taxaConclusao = totalAulasPossiveis > 0 
      ? ((totalAulasConcluidas / totalAulasPossiveis) * 100).toFixed(1)
      : '0.0';

    // 4. Estatísticas por bairro (top 5)
    const bairrosQuery = await pool.query(
      `SELECT 
         p.bairro,
         COUNT(DISTINCT m.id) as quantidade
       FROM matriculas_membresia m
       INNER JOIN pessoas p ON m.pessoa_id = p.id
       WHERE DATE(m.data_matricula) >= $1 AND DATE(m.data_matricula) <= $2
         AND p.ativo = TRUE
         AND p.bairro IS NOT NULL
         AND p.bairro != ''
       GROUP BY p.bairro
       ORDER BY quantidade DESC
       LIMIT 5`,
      [inicio.toISOString().split('T')[0], fim.toISOString().split('T')[0]]
    );
    const topBairros = bairrosQuery.rows.map(row => ({
      bairro: row.bairro,
      quantidade: parseInt(row.quantidade)
    }));

    // 5. Estatísticas por mês (últimos 6 meses)
    const porMes = [];
    for (let i = 5; i >= 0; i--) {
      const data = new Date();
      data.setMonth(data.getMonth() - i);
      const inicioMes = new Date(data.getFullYear(), data.getMonth(), 1);
      const fimMes = new Date(data.getFullYear(), data.getMonth() + 1, 0);
      
      const mesQuery = await pool.query(
        `SELECT COUNT(*) as quantidade
         FROM matriculas_membresia m
         INNER JOIN pessoas p ON m.pessoa_id = p.id
         WHERE DATE(m.data_matricula) >= $1 AND DATE(m.data_matricula) <= $2
           AND p.ativo = TRUE`,
        [inicioMes.toISOString().split('T')[0], fimMes.toISOString().split('T')[0]]
      );

      const mesNome = data.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
      porMes.push({
        mes: mesNome,
        quantidade: parseInt(mesQuery.rows[0].quantidade)
      });
    }

    // 6. Alunos por progresso
    const alunosPorProgresso = {
      completo: alunosComTodasAulas,
      parcial: alunosComAlgumaAula - alunosComTodasAulas,
      nenhum: alunosSemAulas
    };

    // 7. Estatísticas de Batismo (tabelas matriculas_batismo e aulas_batismo podem não existir em bancos antigos)
    let totalAlunosBatismo = 0;
    let totalAulasBatismoConcluidas = 0;
    let alunosBatismoCompletos = 0;
    let alunosBatismoAlgumaAula = 0;
    let alunosBatismoSemAulas = 0;
    let taxaConclusaoBatismo = '0.0';
    let porMesBatismo = [];
    let alunosBatismoPorProgresso = { completo: 0, parcial: 0, nenhum: 0 };

    try {
      const totalAlunosBatismoQuery = await pool.query(
        `SELECT COUNT(*) as total
         FROM matriculas_batismo m
         INNER JOIN pessoas p ON m.pessoa_id = p.id
         WHERE DATE(m.data_matricula) >= $1 AND DATE(m.data_matricula) <= $2
           AND p.ativo = TRUE`,
        [inicio.toISOString().split('T')[0], fim.toISOString().split('T')[0]]
      );
      totalAlunosBatismo = parseInt(totalAlunosBatismoQuery.rows[0].total) || 0;

      const aulasBatismoQuery = await pool.query(
        `SELECT 
           COUNT(CASE WHEN a.concluida = TRUE THEN 1 END) as total_aulas_concluidas,
           COUNT(CASE WHEN a.concluida = FALSE THEN 1 END) as total_aulas_nao_concluidas
         FROM matriculas_batismo m
         INNER JOIN pessoas p ON m.pessoa_id = p.id
         INNER JOIN aulas_batismo a ON m.id = a.matricula_id
         WHERE DATE(m.data_matricula) >= $1 AND DATE(m.data_matricula) <= $2
           AND p.ativo = TRUE`,
        [inicio.toISOString().split('T')[0], fim.toISOString().split('T')[0]]
      );
      totalAulasBatismoConcluidas = parseInt(aulasBatismoQuery.rows[0].total_aulas_concluidas) || 0;

      const alunosBatismoCompletosQuery = await pool.query(
        `SELECT COUNT(DISTINCT m.id) as total
         FROM matriculas_batismo m
         INNER JOIN pessoas p ON m.pessoa_id = p.id
         WHERE DATE(m.data_matricula) >= $1 AND DATE(m.data_matricula) <= $2
           AND p.ativo = TRUE
           AND (
             SELECT COUNT(*) 
             FROM aulas_batismo a 
             WHERE a.matricula_id = m.id AND a.concluida = TRUE
           ) = 5`,
        [inicio.toISOString().split('T')[0], fim.toISOString().split('T')[0]]
      );
      alunosBatismoCompletos = parseInt(alunosBatismoCompletosQuery.rows[0].total) || 0;

      const alunosBatismoAlgumaAulaQuery = await pool.query(
        `SELECT COUNT(DISTINCT m.id) as total
         FROM matriculas_batismo m
         INNER JOIN pessoas p ON m.pessoa_id = p.id
         WHERE DATE(m.data_matricula) >= $1 AND DATE(m.data_matricula) <= $2
           AND p.ativo = TRUE
           AND EXISTS (
             SELECT 1 
             FROM aulas_batismo a 
             WHERE a.matricula_id = m.id AND a.concluida = TRUE
           )`,
        [inicio.toISOString().split('T')[0], fim.toISOString().split('T')[0]]
      );
      alunosBatismoAlgumaAula = parseInt(alunosBatismoAlgumaAulaQuery.rows[0].total) || 0;

      const alunosBatismoSemAulasQuery = await pool.query(
        `SELECT COUNT(DISTINCT m.id) as total
         FROM matriculas_batismo m
         INNER JOIN pessoas p ON m.pessoa_id = p.id
         WHERE DATE(m.data_matricula) >= $1 AND DATE(m.data_matricula) <= $2
           AND p.ativo = TRUE
           AND NOT EXISTS (
             SELECT 1 
             FROM aulas_batismo a 
             WHERE a.matricula_id = m.id AND a.concluida = TRUE
           )`,
        [inicio.toISOString().split('T')[0], fim.toISOString().split('T')[0]]
      );
      alunosBatismoSemAulas = parseInt(alunosBatismoSemAulasQuery.rows[0].total) || 0;

      const totalAulasBatismoPossiveis = totalAlunosBatismo * 5;
      taxaConclusaoBatismo = totalAulasBatismoPossiveis > 0
        ? ((totalAulasBatismoConcluidas / totalAulasBatismoPossiveis) * 100).toFixed(1)
        : '0.0';

      for (let i = 5; i >= 0; i--) {
        const data = new Date();
        data.setMonth(data.getMonth() - i);
        const inicioMes = new Date(data.getFullYear(), data.getMonth(), 1);
        const fimMes = new Date(data.getFullYear(), data.getMonth() + 1, 0);

        const mesBatismoQuery = await pool.query(
          `SELECT COUNT(*) as quantidade
           FROM matriculas_batismo m
           INNER JOIN pessoas p ON m.pessoa_id = p.id
           WHERE DATE(m.data_matricula) >= $1 AND DATE(m.data_matricula) <= $2
             AND p.ativo = TRUE`,
          [inicioMes.toISOString().split('T')[0], fimMes.toISOString().split('T')[0]]
        );

        const mesNome = data.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
        porMesBatismo.push({
          mes: mesNome,
          quantidade: parseInt(mesBatismoQuery.rows[0].quantidade)
        });
      }

      alunosBatismoPorProgresso = {
        completo: alunosBatismoCompletos,
        parcial: alunosBatismoAlgumaAula - alunosBatismoCompletos,
        nenhum: alunosBatismoSemAulas
      };
    } catch (err) {
      if (err.code === '42P01') {
        console.warn('Tabelas matriculas_batismo/aulas_batismo não existem. Estatísticas de batismo retornadas como zero.');
      } else {
        throw err;
      }
    }

    res.json({
      totalNovosConvertidos,
      totalAlunosMembresia,
      alunosComTodasAulas,
      alunosComAlgumaAula,
      alunosSemAulas,
      totalAulasConcluidas,
      totalAulasNaoConcluidas,
      taxaConclusao: parseFloat(taxaConclusao),
      topBairros,
      alunosPorProgresso,
      porMes,
      totalAlunosBatismo,
      totalAulasBatismoConcluidas,
      alunosBatismoCompletos,
      alunosBatismoAlgumaAula,
      alunosBatismoSemAulas,
      taxaConclusaoBatismo: parseFloat(taxaConclusaoBatismo),
      porMesBatismo,
      alunosBatismoPorProgresso,
      periodo: {
        dataInicio: inicio.toISOString().split('T')[0],
        dataFim: fim.toISOString().split('T')[0]
      }
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas de analytics:', error);
    res.status(500).json({
      message: 'Erro ao obter estatísticas',
      error: error.message
    });
  }
}

/**
 * Buscar pessoas com ficha cadastral (para matrícula no curso de batismo)
 * Somente quem tem ficha cadastral pode fazer o curso de batismo
 */
async function buscarPessoasComFicha(req, res) {
  try {
    const { search, page = 1, pageSize = 20 } = req.query;

    if (!search || search.trim().length < 2) {
      return res.json({ pessoas: [], pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 } });
    }

    const searchTerm = `%${search.trim()}%`;
    const pageNum = parseInt(page);
    const pageSizeNum = Math.min(parseInt(pageSize) || 20, 50);
    const offset = (pageNum - 1) * pageSizeNum;

    const result = await pool.query(
      `SELECT 
        p.id,
        p.nome,
        p.sobrenome,
        p.email,
        p.telefone,
        p.whatsapp,
        p.data_nascimento,
        p.estagio_atual,
        fc.id as ficha_id
       FROM pessoas p
       INNER JOIN ficha_cadastral fc ON fc.pessoa_id = p.id
       WHERE p.ativo = TRUE
         AND (
           p.nome ILIKE $1 OR
           p.sobrenome ILIKE $1 OR
           p.email ILIKE $1 OR
           p.telefone ILIKE $1 OR
           COALESCE(p.whatsapp, '') ILIKE $1 OR
           fc.cpf ILIKE $1 OR
           fc.numero_registro ILIKE $1 OR
           CONCAT(p.nome, ' ', COALESCE(p.sobrenome, '')) ILIKE $1
         )
       ORDER BY p.nome, p.sobrenome
       LIMIT $2 OFFSET $3`,
      [searchTerm, pageSizeNum, offset]
    );

    const countResult = await pool.query(
      `SELECT COUNT(*) as total
       FROM pessoas p
       INNER JOIN ficha_cadastral fc ON fc.pessoa_id = p.id
       WHERE p.ativo = TRUE
         AND (
           p.nome ILIKE $1 OR
           p.sobrenome ILIKE $1 OR
           p.email ILIKE $1 OR
           p.telefone ILIKE $1 OR
           COALESCE(p.whatsapp, '') ILIKE $1 OR
           fc.cpf ILIKE $1 OR
           fc.numero_registro ILIKE $1 OR
           CONCAT(p.nome, ' ', COALESCE(p.sobrenome, '')) ILIKE $1
         )`,
      [searchTerm]
    );

    const total = parseInt(countResult.rows[0].total);
    const pessoas = result.rows.map(row => ({
      id: row.id,
      nome: row.nome,
      sobrenome: row.sobrenome,
      nomeCompleto: `${row.nome || ''} ${row.sobrenome || ''}`.trim(),
      email: row.email,
      telefone: row.telefone,
      whatsapp: row.whatsapp,
      dataNascimento: row.data_nascimento ? row.data_nascimento.toISOString().split('T')[0] : null,
      estagioAtual: row.estagio_atual
    }));

    res.json({
      pessoas,
      pagination: {
        page: pageNum,
        pageSize: pageSizeNum,
        total,
        totalPages: Math.ceil(total / pageSizeNum) || 1
      }
    });
  } catch (error) {
    console.error('Erro ao buscar pessoas com ficha:', error);
    res.status(500).json({
      message: 'Erro ao buscar pessoas com ficha cadastral',
      error: error.message
    });
  }
}

/**
 * Matricular no curso de batismo
 * Somente pessoas com ficha cadastral podem ser matriculadas
 */
async function matricularBatismo(req, res) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { pessoaId, dataMatricula, observacoes } = req.body;

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

    // Verificar se pessoa possui ficha cadastral
    const fichaCheck = await client.query(
      'SELECT id FROM ficha_cadastral WHERE pessoa_id = $1',
      [pessoaId]
    );

    if (fichaCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        message: 'Somente pessoas com ficha cadastral podem ser matriculadas no curso de batismo'
      });
    }

    // Verificar se já tem matrícula ativa (não concluída)
    const matriculaExistente = await client.query(
      'SELECT id FROM matriculas_batismo WHERE pessoa_id = $1 AND concluido = FALSE',
      [pessoaId]
    );

    if (matriculaExistente.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        message: 'Esta pessoa já possui uma matrícula de batismo em andamento'
      });
    }

    // Criar matrícula (o trigger no banco atualiza estágio apenas se for "Novo Convertido")
    const matriculaResult = await client.query(
      `INSERT INTO matriculas_batismo (pessoa_id, data_matricula, observacoes)
       VALUES ($1, $2, $3)
       RETURNING id, pessoa_id, data_matricula, concluido`,
      [pessoaId, dataMatricula, observacoes || null]
    );

    const matriculaId = matriculaResult.rows[0].id;

    // Criar as 5 aulas
    for (let aulaNumero = 1; aulaNumero <= 5; aulaNumero++) {
      await client.query(
        `INSERT INTO aulas_batismo (matricula_id, aula_numero)
         VALUES ($1, $2)`,
        [matriculaId, aulaNumero]
      );
    }

    // Atualizar estágio para "Em Batismo" (o trigger do banco só faz para "Novo Convertido")
    const estagioAtual = pessoaCheck.rows[0].estagio_atual;
    if (estagioAtual !== 'Novo Convertido' && estagioAtual !== 'Em Batismo') {
      await registrarMudancaEstagio(
        client,
        pessoaId,
        'Em Batismo',
        'Matriculado no curso de batismo',
        req.user.id
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Matrícula de batismo realizada com sucesso',
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
    console.error('Erro ao matricular em batismo:', error);
    res.status(500).json({
      message: 'Erro ao matricular em batismo',
      error: error.message
    });
  } finally {
    client.release();
  }
}

/**
 * Listar matrículas de batismo
 */
async function listarMatriculasBatismo(req, res) {
  try {
    const { page = 1, pageSize = 10, concluido, search } = req.query;
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
        p.telefone,
        p.whatsapp,
        p.estagio_atual
      FROM matriculas_batismo m
      INNER JOIN pessoas p ON m.pessoa_id = p.id
    `;

    const queryParams = [];
    const conditions = [];
    let paramIndex = 1;

    if (concluido !== undefined && concluido !== '') {
      conditions.push(`m.concluido = $${paramIndex}`);
      queryParams.push(concluido === 'true');
      paramIndex++;
    }

    if (search && search.trim()) {
      conditions.push(`(
        p.nome ILIKE $${paramIndex} OR
        p.sobrenome ILIKE $${paramIndex} OR
        p.email ILIKE $${paramIndex} OR
        p.telefone ILIKE $${paramIndex} OR
        COALESCE(p.whatsapp, '') ILIKE $${paramIndex} OR
        CONCAT(p.nome, ' ', COALESCE(p.sobrenome, '')) ILIKE $${paramIndex}
      )`);
      queryParams.push(`%${search.trim()}%`);
      paramIndex++;
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY m.data_matricula DESC';

    const countQuery = `
      SELECT COUNT(*) as total
      FROM matriculas_batismo m
      INNER JOIN pessoas p ON m.pessoa_id = p.id
      ${conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''}
    `;

    const [result, countResult] = await Promise.all([
      pool.query(query + ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`, [
        ...queryParams,
        parseInt(pageSize),
        offset
      ]),
      pool.query(countQuery, queryParams)
    ]);

    const total = parseInt(countResult.rows[0].total);

    const matriculas = await Promise.all(
      result.rows.map(async (matricula) => {
        const aulasResult = await pool.query(
          `SELECT aula_numero, concluida, data_conclusao, observacoes
           FROM aulas_batismo
           WHERE matricula_id = $1
           ORDER BY aula_numero`,
          [matricula.id]
        );

        return {
          id: matricula.id,
          pessoaId: matricula.pessoa_id,
          nomeCompleto: matricula.nome_completo || null,
          email: matricula.email || null,
          telefone: matricula.telefone || matricula.whatsapp || null,
          estagioAtual: matricula.estagio_atual || null,
          dataMatricula: matricula.data_matricula,
          dataConclusao: matricula.data_conclusao,
          concluido: matricula.concluido,
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
        totalPages: Math.ceil(total / parseInt(pageSize)) || 1
      }
    });
  } catch (error) {
    console.error('Erro ao listar matrículas de batismo:', error);
    res.status(500).json({
      message: 'Erro ao listar matrículas de batismo',
      error: error.message
    });
  }
}

/**
 * Atualizar status de aula de batismo
 */
async function atualizarStatusAulaBatismo(req, res) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { matriculaId, aulaNumero } = req.params;
    const { concluida, observacoes } = req.body;

    const matriculaCheck = await client.query(
      'SELECT id, pessoa_id, concluido FROM matriculas_batismo WHERE id = $1',
      [matriculaId]
    );

    if (matriculaCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Matrícula não encontrada' });
    }

    const aulaCheck = await client.query(
      'SELECT id, concluida FROM aulas_batismo WHERE matricula_id = $1 AND aula_numero = $2',
      [matriculaId, aulaNumero]
    );

    if (aulaCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Aula não encontrada' });
    }

    const dataConclusao = concluida ? new Date().toISOString().split('T')[0] : null;

    await client.query(
      `UPDATE aulas_batismo
       SET concluida = $1, data_conclusao = $2, observacoes = COALESCE($3, observacoes), atualizado_em = CURRENT_TIMESTAMP
       WHERE matricula_id = $4 AND aula_numero = $5`,
      [concluida, dataConclusao, observacoes || null, matriculaId, aulaNumero]
    );

    // Se desmarcou, reverter matrícula concluída se necessário
    if (!concluida) {
      await client.query(
        `UPDATE matriculas_batismo
         SET concluido = FALSE, data_conclusao = NULL, atualizado_em = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [matriculaId]
      );
    }

    await client.query('COMMIT');

    res.json({ message: 'Status da aula atualizado com sucesso' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao atualizar status da aula de batismo:', error);
    res.status(500).json({
      message: 'Erro ao atualizar status da aula',
      error: error.message
    });
  } finally {
    client.release();
  }
}

/**
 * Atualizar acompanhante de um novo convertido (conversão)
 * PUT /integracao/conversoes/:pessoaId/acompanhante { acompanhanteId: number | null }
 */
async function atualizarAcompanhanteConversao(req, res) {
  try {
    const { pessoaId } = req.params;
    const { acompanhanteId } = req.body;

    const idPessoa = parseInt(pessoaId);
    if (isNaN(idPessoa)) {
      return res.status(400).json({ message: 'pessoaId inválido' });
    }

    const acompanhanteIdNum = acompanhanteId === null || acompanhanteId === undefined || acompanhanteId === ''
      ? null
      : parseInt(acompanhanteId);
    if (acompanhanteIdNum !== null && isNaN(acompanhanteIdNum)) {
      return res.status(400).json({ message: 'acompanhanteId inválido' });
    }

    let result = await pool.query(
      `UPDATE conversoes SET acompanhado_por = $1, atualizado_em = CURRENT_TIMESTAMP WHERE pessoa_id = $2 RETURNING id`,
      [acompanhanteIdNum, idPessoa]
    );

    // Se não existe registro de conversão, criar um (pessoa pode estar como Novo Convertido sem registro em conversoes)
    if (result.rows.length === 0) {
      if (acompanhanteIdNum === null) {
        return res.status(404).json({
          message: 'Conversão não encontrada para esta pessoa. Registre a conversão antes de remover o acompanhante.'
        });
      }
      await pool.query(
        `INSERT INTO conversoes (pessoa_id, data_conversao, local_conversao, acompanhado_por)
         VALUES ($1, CURRENT_TIMESTAMP, 'Não informado', $2)
         ON CONFLICT (pessoa_id) DO UPDATE SET acompanhado_por = EXCLUDED.acompanhado_por, atualizado_em = CURRENT_TIMESTAMP`,
        [idPessoa, acompanhanteIdNum]
      );
    }

    res.json({ message: 'Acompanhante atualizado com sucesso', acompanhado_por: acompanhanteIdNum });
  } catch (error) {
    console.error('Erro ao atualizar acompanhante:', error);
    res.status(500).json({
      message: 'Erro ao atualizar acompanhante',
      error: error.message
    });
  }
}

/**
 * Ranking de integrantes do ministério Integração por quantidade de novos convertidos acompanhados
 * GET /integracao/acompanhamento/ranking
 * Retorna: { top10: [...], todos: [...] } com pessoa_id, nome_completo, total_acompanhados
 */
async function obterRankingAcompanhantes(req, res) {
  try {
    const query = `
      SELECT
        p.id as pessoa_id,
        p.nome,
        p.sobrenome,
        (p.nome || ' ' || COALESCE(p.sobrenome, '')) AS nome_completo,
        COUNT(c.pessoa_id)::INTEGER AS total_acompanhados
      FROM pessoa_ministerios pm
      INNER JOIN pessoas p ON pm.pessoa_id = p.id
      INNER JOIN ministerios m ON pm.ministerio_id = m.id
      LEFT JOIN conversoes c ON c.acompanhado_por = p.id
      WHERE pm.data_fim IS NULL
        AND (m.nome ILIKE 'Integração' OR m.nome ILIKE 'Integracao' OR m.nome ILIKE 'integração')
      GROUP BY p.id, p.nome, p.sobrenome
      ORDER BY total_acompanhados DESC, p.nome, p.sobrenome
    `;
    const result = await pool.query(query);
    const todos = result.rows.map(row => ({
      pessoaId: row.pessoa_id,
      nomeCompleto: row.nome_completo,
      totalAcompanhados: row.total_acompanhados
    }));
    const top10 = todos.slice(0, 10);

    res.json({ top10, todos });
  } catch (error) {
    console.error('Erro ao obter ranking de acompanhantes:', error);
    res.status(500).json({
      message: 'Erro ao obter ranking de acompanhantes',
      error: error.message
    });
  }
}

/**
 * Listar comentários do acompanhante sobre um novo convertido
 * GET /integracao/conversoes/:pessoaId/comentarios
 * Retorna apenas comentários do usuário logado (autor_pessoa_id = req.user.id)
 */
async function listarComentariosConversao(req, res) {
  try {
    const { pessoaId } = req.params;
    const autorId = req.user?.id;
    if (!autorId) {
      return res.status(401).json({ message: 'Usuário não autenticado' });
    }
    const idPessoa = parseInt(pessoaId, 10);
    if (isNaN(idPessoa)) {
      return res.status(400).json({ message: 'pessoaId inválido' });
    }
    const result = await pool.query(
      `SELECT id, comentario, criado_em
       FROM comentarios_acompanhamento
       WHERE pessoa_id = $1 AND autor_pessoa_id = $2
       ORDER BY criado_em ASC`,
      [idPessoa, autorId]
    );
    const comentarios = result.rows.map(row => ({
      id: row.id,
      comentario: row.comentario,
      criadoEm: row.criado_em,
    }));
    res.json({ comentarios });
  } catch (error) {
    console.error('Erro ao listar comentários:', error);
    res.status(500).json({
      message: 'Erro ao listar comentários',
      error: error.message
    });
  }
}

/**
 * Adicionar comentário do acompanhante sobre um novo convertido
 * POST /integracao/conversoes/:pessoaId/comentarios { comentario: string }
 */
async function criarComentarioConversao(req, res) {
  try {
    const { pessoaId } = req.params;
    const { comentario } = req.body;
    const autorId = req.user?.id;
    if (!autorId) {
      return res.status(401).json({ message: 'Usuário não autenticado' });
    }
    const idPessoa = parseInt(pessoaId, 10);
    if (isNaN(idPessoa)) {
      return res.status(400).json({ message: 'pessoaId inválido' });
    }
    const texto = typeof comentario === 'string' ? comentario.trim() : '';
    if (!texto) {
      return res.status(400).json({ message: 'Comentário é obrigatório' });
    }
    const result = await pool.query(
      `INSERT INTO comentarios_acompanhamento (pessoa_id, autor_pessoa_id, comentario)
       VALUES ($1, $2, $3)
       RETURNING id, comentario, criado_em`,
      [idPessoa, autorId, texto]
    );
    const row = result.rows[0];
    res.status(201).json({
      comentario: {
        id: row.id,
        comentario: row.comentario,
        criadoEm: row.criado_em,
      }
    });
  } catch (error) {
    console.error('Erro ao criar comentário:', error);
    res.status(500).json({
      message: 'Erro ao salvar comentário',
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
  listarNovosConvertidos,
  atualizarAcompanhanteConversao,
  listarComentariosConversao,
  criarComentarioConversao,
  obterEstatisticasAnalytics,
  obterRankingAcompanhantes,
  buscarPessoasComFicha,
  matricularBatismo,
  listarMatriculasBatismo,
  atualizarStatusAulaBatismo
};
