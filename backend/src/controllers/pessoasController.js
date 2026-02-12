const pool = require('../config/database');

// Estágios do schema jornada única (estagio_espiritual_enum)
const ESTAGIOS_VALIDOS = [
  'Visitante', 'Visitante Frequente', 'Novo Convertido', 'Em Batismo', 'Batizado',
  'Em Membresia', 'Membro', 'Participante', 'Líder', 'Obreiro', 'Inativo'
];

// Como conheceu (como_conheceu_enum)
const COMO_CONHECEU_VALIDOS = ['familia-amigo', 'google', 'redesocial', 'passei-frente', 'outros'];

function mapRowToPessoa(row) {
  // Formatar data de nascimento para YYYY-MM-DD se existir
  let dataNascimentoFormatada = null;
  if (row.data_nascimento) {
    if (row.data_nascimento instanceof Date) {
      const year = row.data_nascimento.getFullYear();
      const month = String(row.data_nascimento.getMonth() + 1).padStart(2, '0');
      const day = String(row.data_nascimento.getDate()).padStart(2, '0');
      dataNascimentoFormatada = `${year}-${month}-${day}`;
    } else if (typeof row.data_nascimento === 'string') {
      // Se já for string, verificar se está no formato correto
      if (row.data_nascimento.match(/^\d{4}-\d{2}-\d{2}$/)) {
        dataNascimentoFormatada = row.data_nascimento;
      } else {
        // Tentar converter
        const date = new Date(row.data_nascimento);
        if (!isNaN(date.getTime())) {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          dataNascimentoFormatada = `${year}-${month}-${day}`;
        }
      }
    }
  }

  return {
    id: row.id,
    nome: row.nome,
    sobrenome: row.sobrenome,
    sexo: row.sexo,
    estadoCivil: row.estado_civil,
    dataNascimento: dataNascimentoFormatada,
    telefone: row.telefone,
    email: row.email,
    whatsapp: row.whatsapp,
    cep: row.cep,
    rua: row.rua,
    numero: row.numero,
    complemento: row.complemento,
    bairro: row.bairro,
    cidade: row.cidade,
    estado: row.estado,
    estagioAtual: row.estagio_atual,
    dataPrimeiraVisita: row.data_primeira_visita,
    comoConheceu: row.como_conheceu,
    cargoEclesiastico: row.cargo_eclesiastico,
    dataOrdenacao: row.data_ordenacao,
    ativo: row.ativo,
    fotoPerfil: row.foto_perfil,
    podeIncluirGrupoWhatsapp: row.pode_incluir_grupo_whatsapp ?? null,
    criadoEm: row.criado_em,
    atualizadoEm: row.atualizado_em,
  };
}

/**
 * Criar nova pessoa (schema jornada única)
 * Inclui campos opcionais: estagio_atual (default Visitante), ativo, whatsapp
 */
async function criarPessoa(req, res) {
  try {
    const {
      nome,
      sobrenome,
      sexo,
      estadoCivil,
      dataNascimento,
      telefone,
      email,
      cep,
      rua,
      numero,
      complemento,
      bairro,
      cidade,
      estado,
      whatsapp,
      estagioAtual,
      dataPrimeiraVisita,
      comoConheceu,
    } = req.body;

    if (!nome || !nome.trim()) {
      return res.status(400).json({ message: 'Nome é obrigatório' });
    }
    if (!telefone || !telefone.trim()) {
      return res.status(400).json({ message: 'Telefone é obrigatório' });
    }

    const sexosValidos = ['masculino', 'feminino', 'outro', 'nao-informar'];
    if (sexo && !sexosValidos.includes(sexo)) {
      return res.status(400).json({ message: 'Sexo inválido' });
    }

    const estadosCivisValidos = ['solteiro', 'casado', 'divorciado', 'viuvo', 'uniao-estavel'];
    if (estadoCivil && !estadosCivisValidos.includes(estadoCivil)) {
      return res.status(400).json({ message: 'Estado civil inválido' });
    }

    const estadosValidos = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];
    if (estado && !estadosValidos.includes(estado)) {
      return res.status(400).json({ message: 'Estado inválido' });
    }

    if (estagioAtual && !ESTAGIOS_VALIDOS.includes(estagioAtual)) {
      return res.status(400).json({ message: 'Estágio espiritual inválido' });
    }
    if (comoConheceu && !COMO_CONHECEU_VALIDOS.includes(comoConheceu)) {
      return res.status(400).json({ message: 'Como conheceu inválido' });
    }

    if (email) {
      const emailCheck = await pool.query('SELECT id FROM pessoas WHERE email = $1', [email]);
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ message: 'Email já cadastrado' });
      }
    }

    const result = await pool.query(
      `INSERT INTO pessoas (
        nome, sobrenome, sexo, estado_civil, data_nascimento,
        telefone, email, whatsapp, cep, rua, numero, complemento, bairro, cidade, estado,
        estagio_atual, data_primeira_visita, como_conheceu, ativo
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, TRUE)
      RETURNING id, nome, sobrenome, sexo, estado_civil, data_nascimento,
                telefone, email, whatsapp, cep, rua, numero, complemento, bairro, cidade, estado,
                estagio_atual, data_primeira_visita, como_conheceu, ativo,
                criado_em, atualizado_em`,
      [
        nome.trim(), sobrenome || null, sexo || null, estadoCivil || null, dataNascimento || null, telefone.trim(), email || null,
        whatsapp || null, cep || null, rua || null, numero || null, complemento || null, bairro || null, cidade || null, estado || null,
        estagioAtual || 'Visitante', dataPrimeiraVisita || null, comoConheceu || null
      ]
    );

    res.status(201).json({
      message: 'Pessoa criada com sucesso',
      pessoa: mapRowToPessoa(result.rows[0])
    });
  } catch (error) {
    console.error('Erro ao criar pessoa:', error);
    res.status(500).json({ message: 'Erro ao criar pessoa', error: error.message });
  }
}

/**
 * Listar pessoas com filtros e paginação (schema jornada única)
 * Filtros: search, cidade, estado, sexo, estagioAtual, ativo
 */
async function listarPessoas(req, res) {
  try {
    const { search, cidade, estado, sexo, estagioAtual, ativo, page = 1, pageSize = 10 } = req.query;

    const pageNum = parseInt(page);
    const pageSizeNum = parseInt(pageSize);
    const offset = (pageNum - 1) * pageSizeNum;

    let query = `
      SELECT 
        id, nome, sobrenome, sexo, estado_civil, data_nascimento,
        telefone, email, whatsapp, cep, rua, numero, complemento, bairro, cidade, estado,
        estagio_atual, data_primeira_visita, como_conheceu, cargo_eclesiastico, data_ordenacao, ativo, foto_perfil,
        pode_incluir_grupo_whatsapp,
        criado_em, atualizado_em
      FROM pessoas
      WHERE 1=1
    `;
    const queryParams = [];
    let paramIndex = 1;

    if (search) {
      query += ` AND (
        nome ILIKE $${paramIndex} OR
        sobrenome ILIKE $${paramIndex} OR
        email ILIKE $${paramIndex} OR
        telefone ILIKE $${paramIndex} OR
        COALESCE(whatsapp, '') ILIKE $${paramIndex} OR
        CONCAT(nome, ' ', COALESCE(sobrenome, '')) ILIKE $${paramIndex}
      )`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    if (cidade) {
      query += ` AND cidade ILIKE $${paramIndex}`;
      queryParams.push(`%${cidade}%`);
      paramIndex++;
    }

    if (estado) {
      query += ` AND estado = $${paramIndex}`;
      queryParams.push(estado);
      paramIndex++;
    }

    if (sexo) {
      query += ` AND sexo = $${paramIndex}`;
      queryParams.push(sexo);
      paramIndex++;
    }

    if (estagioAtual) {
      query += ` AND estagio_atual = $${paramIndex}`;
      queryParams.push(estagioAtual);
      paramIndex++;
    }

    if (ativo !== undefined && ativo !== '') {
      const ativoBool = String(ativo).toLowerCase() === 'true';
      query += ` AND ativo = $${paramIndex}`;
      queryParams.push(ativoBool);
      paramIndex++;
    } else {
      query += ` AND ativo = TRUE`;
    }

    const countQuery = query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM');
    const countResult = await pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    query += ` ORDER BY nome, sobrenome LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(pageSizeNum, offset);

    const result = await pool.query(query, queryParams);
    const pessoas = result.rows.map(mapRowToPessoa);

    res.json({
      pessoas,
      pagination: {
        page: pageNum,
        pageSize: pageSizeNum,
        total,
        totalPages: Math.ceil(total / pageSizeNum)
      }
    });
  } catch (error) {
    console.error('Erro ao listar pessoas:', error);
    res.status(500).json({ message: 'Erro ao listar pessoas', error: error.message });
  }
}

/**
 * Buscar pessoas (autocomplete)
 */
async function buscarPessoas(req, res) {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.json({ pessoas: [] });
    }

    const searchTerm = `%${q.trim()}%`;

    const result = await pool.query(
      `SELECT id, nome, sobrenome, email, telefone, estagio_atual
       FROM pessoas
       WHERE ativo = TRUE
         AND (
           nome ILIKE $1 OR sobrenome ILIKE $1 OR email ILIKE $1 OR
           telefone ILIKE $1 OR COALESCE(whatsapp, '') ILIKE $1 OR
           CONCAT(nome, ' ', COALESCE(sobrenome, '')) ILIKE $1
         )
       ORDER BY nome, sobrenome
       LIMIT 10`,
      [searchTerm]
    );

    const pessoas = result.rows.map(row => ({
      id: row.id,
      nome: row.nome,
      sobrenome: row.sobrenome,
      email: row.email,
      telefone: row.telefone,
      nomeCompleto: [row.nome, row.sobrenome].filter(Boolean).join(' '),
      estagioAtual: row.estagio_atual
    }));

    res.json({ pessoas });
  } catch (error) {
    console.error('Erro ao buscar pessoas:', error);
    res.status(500).json({ message: 'Erro ao buscar pessoas', error: error.message });
  }
}

/**
 * Obter pessoa por ID (schema jornada única)
 */
async function obterPessoaPorId(req, res) {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT 
        id, nome, sobrenome, sexo, estado_civil, data_nascimento,
        telefone, email, whatsapp, cep, rua, numero, complemento, bairro, cidade, estado,
        estagio_atual, data_primeira_visita, como_conheceu, cargo_eclesiastico, data_ordenacao, ativo, foto_perfil,
        pode_incluir_grupo_whatsapp,
        criado_em, atualizado_em
       FROM pessoas
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Pessoa não encontrada' });
    }

    res.json({ pessoa: mapRowToPessoa(result.rows[0]) });
  } catch (error) {
    console.error('Erro ao obter pessoa:', error);
    res.status(500).json({ message: 'Erro ao obter pessoa', error: error.message });
  }
}

/**
 * Atualizar pessoa (schema jornada única)
 * Inclui campos: estagio_atual, data_primeira_visita, como_conheceu, cargo_eclesiastico, data_ordenacao, ativo, whatsapp, foto_perfil
 */
async function atualizarPessoa(req, res) {
  try {
    const { id } = req.params;
    const {
      nome, sobrenome, sexo, estadoCivil, dataNascimento, telefone, email,
      cep, rua, numero, complemento, bairro, cidade, estado,
      whatsapp, estagioAtual, dataPrimeiraVisita, comoConheceu,
      cargoEclesiastico, dataOrdenacao, ativo, fotoPerfil
    } = req.body;

    if (!nome || !nome.trim()) {
      return res.status(400).json({ message: 'Nome é obrigatório' });
    }
    if (!telefone || !telefone.trim()) {
      return res.status(400).json({ message: 'Telefone é obrigatório' });
    }

    const sexosValidos = ['masculino', 'feminino', 'outro', 'nao-informar'];
    if (sexo && !sexosValidos.includes(sexo)) {
      return res.status(400).json({ message: 'Sexo inválido' });
    }

    const estadosCivisValidos = ['solteiro', 'casado', 'divorciado', 'viuvo', 'uniao-estavel'];
    if (estadoCivil && !estadosCivisValidos.includes(estadoCivil)) {
      return res.status(400).json({ message: 'Estado civil inválido' });
    }

    const estadosValidos = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];
    if (estado && !estadosValidos.includes(estado)) {
      return res.status(400).json({ message: 'Estado inválido' });
    }

    if (estagioAtual != null && !ESTAGIOS_VALIDOS.includes(estagioAtual)) {
      return res.status(400).json({ message: 'Estágio espiritual inválido' });
    }
    if (comoConheceu != null && !COMO_CONHECEU_VALIDOS.includes(comoConheceu)) {
      return res.status(400).json({ message: 'Como conheceu inválido' });
    }
    const cargosValidos = ['Pastor', 'Evangelista', 'Presbítero', 'Diácono'];
    if (cargoEclesiastico != null && cargoEclesiastico !== '' && !cargosValidos.includes(cargoEclesiastico)) {
      return res.status(400).json({ message: 'Cargo eclesiástico inválido' });
    }

    const pessoaExistente = await pool.query('SELECT id, email FROM pessoas WHERE id = $1', [id]);
    if (pessoaExistente.rows.length === 0) {
      return res.status(404).json({ message: 'Pessoa não encontrada' });
    }

    if (email !== pessoaExistente.rows[0].email) {
      const emailCheck = await pool.query('SELECT id FROM pessoas WHERE email = $1 AND id != $2', [email, id]);
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ message: 'Email já cadastrado para outra pessoa' });
      }
    }

    const emptyToNull = (v) => (v != null && String(v).trim() !== '' ? v : null);
    const result = await pool.query(
      `UPDATE pessoas 
       SET nome = $1, sobrenome = $2, sexo = $3, estado_civil = $4, data_nascimento = $5,
           telefone = $6, email = $7, whatsapp = $8, cep = $9, rua = $10, numero = $11,
           complemento = $12, bairro = $13, cidade = $14, estado = $15,
           estagio_atual = COALESCE($16, estagio_atual),
           data_primeira_visita = $17,
           como_conheceu = $18,
           cargo_eclesiastico = (NULLIF(TRIM($19::text), '')::cargo_eclesiastico_enum),
           data_ordenacao = $20,
           ativo = COALESCE($21, ativo),
           foto_perfil = $22,
           atualizado_em = CURRENT_TIMESTAMP
       WHERE id = $23
       RETURNING id, nome, sobrenome, sexo, estado_civil, data_nascimento,
                 telefone, email, whatsapp, cep, rua, numero, complemento, bairro, cidade, estado,
                 estagio_atual, data_primeira_visita, como_conheceu, cargo_eclesiastico, data_ordenacao, ativo, foto_perfil,
                 criado_em, atualizado_em`,
      [
        nome, emptyToNull(sobrenome), emptyToNull(sexo), emptyToNull(estadoCivil), emptyToNull(dataNascimento), telefone, emptyToNull(email),
        emptyToNull(whatsapp), emptyToNull(cep), emptyToNull(rua), emptyToNull(numero), emptyToNull(complemento), emptyToNull(bairro), emptyToNull(cidade), emptyToNull(estado),
        emptyToNull(estagioAtual), emptyToNull(dataPrimeiraVisita), emptyToNull(comoConheceu),
        emptyToNull(cargoEclesiastico), emptyToNull(dataOrdenacao), ativo !== undefined ? ativo : null, emptyToNull(fotoPerfil),
        id
      ]
    );

    res.json({
      message: 'Pessoa atualizada com sucesso',
      pessoa: mapRowToPessoa(result.rows[0])
    });
  } catch (error) {
    console.error('Erro ao atualizar pessoa:', error);
    res.status(500).json({ message: 'Erro ao atualizar pessoa', error: error.message });
  }
}

/**
 * Atualizar perfil do usuário autenticado (schema jornada única)
 * Usa req.user.id (pessoa_id) para atualizar apenas os próprios dados
 */
async function updateMe(req, res) {
  try {
    const pessoaId = req.user.id;
    const {
      nome, sobrenome, sexo, estadoCivil, dataNascimento, telefone, email,
      cep, rua, numero, complemento, bairro, cidade, estado, fotoPerfil
    } = req.body;

    // Apenas nome e email são obrigatórios na página de configurações
    if (!nome || !nome.trim()) {
      return res.status(400).json({ message: 'Nome é obrigatório' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ message: 'Email é obrigatório' });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Email inválido' });
    }

    const sexosValidos = ['masculino', 'feminino', 'outro', 'nao-informar'];
    if (sexo && !sexosValidos.includes(sexo)) {
      return res.status(400).json({ message: 'Sexo inválido' });
    }

    const estadosCivisValidos = ['solteiro', 'casado', 'divorciado', 'viuvo', 'uniao-estavel'];
    if (estadoCivil && !estadosCivisValidos.includes(estadoCivil)) {
      return res.status(400).json({ message: 'Estado civil inválido' });
    }

    const estadosValidos = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];
    if (estado && !estadosValidos.includes(estado)) {
      return res.status(400).json({ message: 'Estado inválido' });
    }

    const pessoaExistente = await pool.query('SELECT id, email FROM pessoas WHERE id = $1', [pessoaId]);
    if (pessoaExistente.rows.length === 0) {
      return res.status(404).json({ message: 'Pessoa não encontrada' });
    }

    // Se email mudou, verificar se não está em uso
    if (email && email !== pessoaExistente.rows[0].email) {
      const emailCheck = await pool.query('SELECT id FROM pessoas WHERE email = $1 AND id != $2', [email, pessoaId]);
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ message: 'Email já cadastrado para outra pessoa' });
      }
    }

    const emptyToNull = (v) => (v != null && String(v).trim() !== '' ? v : null);
    const result = await pool.query(
      `UPDATE pessoas 
       SET nome = $1, sobrenome = $2, sexo = $3, estado_civil = $4, data_nascimento = $5,
           telefone = $6, email = COALESCE($7, email), cep = $8, rua = $9, numero = $10,
           complemento = $11, bairro = $12, cidade = $13, estado = $14,
           foto_perfil = $15,
           atualizado_em = CURRENT_TIMESTAMP
       WHERE id = $16
       RETURNING id, nome, sobrenome, sexo, estado_civil, data_nascimento,
                 telefone, email, cep, rua, numero, complemento, bairro, cidade, estado,
                 foto_perfil, criado_em, atualizado_em`,
      [
        nome, emptyToNull(sobrenome), emptyToNull(sexo), emptyToNull(estadoCivil), emptyToNull(dataNascimento), 
        telefone, emptyToNull(email),
        emptyToNull(cep), emptyToNull(rua), emptyToNull(numero), emptyToNull(complemento), 
        emptyToNull(bairro), emptyToNull(cidade), emptyToNull(estado),
        emptyToNull(fotoPerfil),
        pessoaId
      ]
    );

    res.json({
      message: 'Perfil atualizado com sucesso',
      pessoa: mapRowToPessoa(result.rows[0])
    });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({ message: 'Erro ao atualizar perfil', error: error.message });
  }
}

/**
 * Deletar pessoa (schema jornada única: soft delete - marca ativo = FALSE)
 */
async function deletarPessoa(req, res) {
  try {
    const { id } = req.params;

    const pessoaExistente = await pool.query('SELECT id FROM pessoas WHERE id = $1', [id]);
    if (pessoaExistente.rows.length === 0) {
      return res.status(404).json({ message: 'Pessoa não encontrada' });
    }

    await pool.query(
      'UPDATE pessoas SET ativo = FALSE, atualizado_em = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );

    res.json({ message: 'Pessoa desativada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar pessoa:', error);
    res.status(500).json({ message: 'Erro ao desativar pessoa', error: error.message });
  }
}

/**
 * Lista aniversariantes do dia (mês e dia = hoje, ativo = true).
 * Retorna id, nome, sobrenome, data_nascimento, foto_perfil, estagio_atual e idade (anos que faz/fez hoje).
 */
async function aniversariantesDoDia(req, res) {
  try {
    const result = await pool.query(
      `SELECT id, nome, sobrenome, data_nascimento, foto_perfil, estagio_atual
       FROM pessoas
       WHERE data_nascimento IS NOT NULL
         AND ativo = TRUE
         AND EXTRACT(MONTH FROM data_nascimento) = EXTRACT(MONTH FROM CURRENT_DATE)
         AND EXTRACT(DAY FROM data_nascimento) = EXTRACT(DAY FROM CURRENT_DATE)
       ORDER BY nome, sobrenome`
    );

    const currentYear = new Date().getFullYear();
    const list = result.rows.map((row) => {
      const dataNasc = row.data_nascimento instanceof Date
        ? row.data_nascimento
        : new Date(row.data_nascimento);
      const year = dataNasc.getFullYear();
      const month = String(dataNasc.getMonth() + 1).padStart(2, '0');
      const day = String(dataNasc.getDate()).padStart(2, '0');
      const idade = currentYear - year;
      return {
        id: row.id,
        nome: row.nome,
        sobrenome: row.sobrenome,
        dataNascimento: `${year}-${month}-${day}`,
        fotoPerfil: row.foto_perfil,
        estagioAtual: row.estagio_atual || null,
        idade,
      };
    });

    res.json({ aniversariantes: list });
  } catch (error) {
    console.error('Erro ao listar aniversariantes do dia:', error);
    res.status(500).json({ message: 'Erro ao listar aniversariantes', error: error.message });
  }
}

module.exports = {
  criarPessoa,
  listarPessoas,
  buscarPessoas,
  obterPessoaPorId,
  atualizarPessoa,
  updateMe,
  deletarPessoa,
  aniversariantesDoDia,
};
