const pool = require('../config/database');

/**
 * Mapear linha do banco para objeto de ficha cadastral
 */
function mapRowToFichaCadastral(row) {
  return {
    id: row.id,
    pessoaId: row.pessoa_id,
    // Identificação
    numeroRegistro: row.numero_registro,
    dataRegistro: row.data_registro,
    cpf: row.cpf,
    conhecidoPor: row.conhecido_por,
    // Contato Adicional
    telefoneComercial: row.telefone_comercial,
    telefone2: row.telefone_2,
    // Dados Pessoais Adicionais
    naturalidade: row.naturalidade,
    naturalidadeUf: row.naturalidade_uf,
    nacionalidade: row.nacionalidade,
    rgNumero: row.rg_numero,
    rgDataEmissao: row.rg_data_emissao,
    rgOrgaoEmissor: row.rg_orgao_emissor,
    escolaridade: row.escolaridade,
    profissao: row.profissao,
    tipoSanguineo: row.tipo_sanguineo,
    // Informações Familiares
    nomePai: row.nome_pai,
    nomeMae: row.nome_mae,
    nomeConjuge: row.nome_conjuge,
    dataCasamento: row.data_casamento,
    quantidadeFilhos: row.quantidade_filhos,
    quantidadeFilhosMaiores: row.quantidade_filhos_maiores,
    quantidadeFilhosMenores: row.quantidade_filhos_menores,
    foiCasadoAnteriormente: row.foi_casado_anteriormente,
    // Informações Eclesiásticas - Batismo
    dataBatismo: row.data_batismo,
    localBatismo: row.local_batismo,
    igrejaOndeFoiBatizado: row.igreja_onde_foi_batizado,
    // Informações Eclesiásticas - Admissão Ministerial
    dataAdmissaoMinisterial: row.data_admissao_ministerial,
    tipoAdmissaoMinisterial: row.tipo_admissao_ministerial,
    igrejaOuMinisterioAnterior: row.igreja_ou_ministerio_anterior,
    // Informações Eclesiásticas - Consagração
    dataConsagracao: row.data_consagracao,
    consagracaoMinisterial: row.consagracao_ministerial,
    localConsagracao: row.local_consagracao,
    consagradoPor: row.consagrado_por,
    // Função Ministerial
    funcaoMinisterial: row.funcao_ministerial,
    ministerioIntegracao: row.ministerio_integracao,
    // Observações
    observacoes: row.observacoes,
    // Metadados
    criadoEm: row.criado_em,
    atualizadoEm: row.atualizado_em,
  };
}

/**
 * Criar ou atualizar ficha cadastral do usuário logado
 * Cada usuário possui apenas uma ficha cadastral (sua própria)
 * req.user.id é o pessoa_id
 */
async function criarOuAtualizarFichaCadastral(req, res) {
  try {
    const pessoaId = req.user.id;
    const {
      // Dados da pessoa (para atualização)
      nome,
      sobrenome,
      email,
      telefone,
      whatsapp,
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
      // Dados da ficha cadastral
      numeroRegistro,
      dataRegistro,
      cpf,
      conhecidoPor,
      telefoneComercial,
      telefone2,
      naturalidade,
      naturalidadeUf,
      nacionalidade,
      rgNumero,
      rgDataEmissao,
      rgOrgaoEmissor,
      escolaridade,
      profissao,
      tipoSanguineo,
      nomePai,
      nomeMae,
      nomeConjuge,
      dataCasamento,
      quantidadeFilhos,
      quantidadeFilhosMaiores,
      quantidadeFilhosMenores,
      foiCasadoAnteriormente,
      dataBatismo,
      localBatismo,
      igrejaOndeFoiBatizado,
      dataAdmissaoMinisterial,
      tipoAdmissaoMinisterial,
      igrejaOuMinisterioAnterior,
      dataConsagracao,
      consagracaoMinisterial,
      localConsagracao,
      consagradoPor,
      funcaoMinisterial,
      ministerioIntegracao,
      observacoes,
    } = req.body;

    // Validar formato de email se fornecido
    if (email && email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Email inválido' });
      }
    }

    // Validar enums se fornecidos
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

    if (naturalidadeUf && !estadosValidos.includes(naturalidadeUf)) {
      return res.status(400).json({ message: 'Naturalidade UF inválida' });
    }

    // Função helper para converter vazio em null
    const emptyToNull = (v) => (v != null && String(v).trim() !== '' ? v : null);
    const emptyToNullInt = (v) => {
      if (v == null || v === '') return null;
      const num = parseInt(v);
      return isNaN(num) ? null : num;
    };
    const emptyToNullBool = (v) => {
      if (v == null || v === '') return null;
      if (typeof v === 'boolean') return v;
      if (typeof v === 'string') {
        const lower = v.toLowerCase();
        return lower === 'true' || lower === 'sim' || lower === '1';
      }
      return Boolean(v);
    };

    // Atualizar dados da pessoa (usuário logado) - usa COALESCE para manter valores existentes
    const pessoaAtual = await pool.query(
      'SELECT nome, sobrenome, email FROM pessoas WHERE id = $1',
      [pessoaId]
    );
    if (pessoaAtual.rows.length === 0) {
      return res.status(404).json({ message: 'Pessoa não encontrada' });
    }
    const p = pessoaAtual.rows[0];
    const nomeAtual = (nome && nome.trim()) ? nome.trim() : p.nome;
    const emailAtual = (email && email.trim()) ? email.trim() : p.email;
    if (!nomeAtual) {
      return res.status(400).json({ message: 'Nome é obrigatório' });
    }
    if (!emailAtual) {
      return res.status(400).json({ message: 'Email é obrigatório' });
    }

    await pool.query(
      `UPDATE pessoas 
       SET nome = $1, sobrenome = $2, email = $3, telefone = $4, whatsapp = $5,
           data_nascimento = $6, sexo = $7, estado_civil = $8,
           cep = $9, rua = $10, numero = $11, complemento = $12,
           bairro = $13, cidade = $14, estado = $15,
           atualizado_em = CURRENT_TIMESTAMP
       WHERE id = $16`,
      [
        nomeAtual,
        emptyToNull(sobrenome ?? p.sobrenome),
        emailAtual,
        emptyToNull(telefone),
        emptyToNull(whatsapp),
        emptyToNull(dataNascimento),
        emptyToNull(sexo),
        emptyToNull(estadoCivil),
        emptyToNull(cep),
        emptyToNull(rua),
        emptyToNull(numero),
        emptyToNull(complemento),
        emptyToNull(bairro),
        emptyToNull(cidade),
        emptyToNull(estado),
        pessoaId
      ]
    );

    // Verificar se ficha cadastral já existe
    const fichaExistente = await pool.query(
      'SELECT id FROM ficha_cadastral WHERE pessoa_id = $1',
      [pessoaId]
    );

    if (fichaExistente.rows.length > 0) {
      // Atualizar ficha existente
      const result = await pool.query(
        `UPDATE ficha_cadastral 
         SET 
           numero_registro = $1,
           data_registro = $2,
           cpf = $3,
           conhecido_por = $4,
           telefone_comercial = $5,
           telefone_2 = $6,
           naturalidade = $7,
           naturalidade_uf = $8,
           nacionalidade = $9,
           rg_numero = $10,
           rg_data_emissao = $11,
           rg_orgao_emissor = $12,
           escolaridade = $13,
           profissao = $14,
           tipo_sanguineo = $15,
           nome_pai = $16,
           nome_mae = $17,
           nome_conjuge = $18,
           data_casamento = $19,
           quantidade_filhos = $20,
           quantidade_filhos_maiores = $21,
           quantidade_filhos_menores = $22,
           foi_casado_anteriormente = $23,
           data_batismo = $24,
           local_batismo = $25,
           igreja_onde_foi_batizado = $26,
           data_admissao_ministerial = $27,
           tipo_admissao_ministerial = $28,
           igreja_ou_ministerio_anterior = $29,
           data_consagracao = $30,
           consagracao_ministerial = $31,
           local_consagracao = $32,
           consagrado_por = $33,
           funcao_ministerial = $34,
           ministerio_integracao = $35,
           observacoes = $36,
           atualizado_em = CURRENT_TIMESTAMP
         WHERE pessoa_id = $37
         RETURNING *`,
        [
          emptyToNull(numeroRegistro),
          emptyToNull(dataRegistro),
          emptyToNull(cpf),
          emptyToNull(conhecidoPor),
          emptyToNull(telefoneComercial),
          emptyToNull(telefone2),
          emptyToNull(naturalidade),
          emptyToNull(naturalidadeUf),
          emptyToNull(nacionalidade) || 'Brasileira',
          emptyToNull(rgNumero),
          emptyToNull(rgDataEmissao),
          emptyToNull(rgOrgaoEmissor),
          emptyToNull(escolaridade),
          emptyToNull(profissao),
          emptyToNull(tipoSanguineo),
          emptyToNull(nomePai),
          emptyToNull(nomeMae),
          emptyToNull(nomeConjuge),
          emptyToNull(dataCasamento),
          emptyToNullInt(quantidadeFilhos),
          emptyToNullInt(quantidadeFilhosMaiores),
          emptyToNullInt(quantidadeFilhosMenores),
          emptyToNullBool(foiCasadoAnteriormente),
          emptyToNull(dataBatismo),
          emptyToNull(localBatismo),
          emptyToNull(igrejaOndeFoiBatizado),
          emptyToNull(dataAdmissaoMinisterial),
          emptyToNull(tipoAdmissaoMinisterial),
          emptyToNull(igrejaOuMinisterioAnterior),
          emptyToNull(dataConsagracao),
          emptyToNull(consagracaoMinisterial),
          emptyToNull(localConsagracao),
          emptyToNull(consagradoPor),
          emptyToNull(funcaoMinisterial),
          emptyToNull(ministerioIntegracao),
          emptyToNull(observacoes),
          pessoaId
        ]
      );

      return res.json({
        message: 'Ficha cadastral atualizada com sucesso',
        ficha: mapRowToFichaCadastral(result.rows[0]),
        pessoaId: pessoaId
      });
    } else {
      // Criar nova ficha
      const result = await pool.query(
        `INSERT INTO ficha_cadastral (
          pessoa_id, numero_registro, data_registro, cpf, conhecido_por,
          telefone_comercial, telefone_2, naturalidade, naturalidade_uf, nacionalidade,
          rg_numero, rg_data_emissao, rg_orgao_emissor, escolaridade, profissao, tipo_sanguineo,
          nome_pai, nome_mae, nome_conjuge, data_casamento,
          quantidade_filhos, quantidade_filhos_maiores, quantidade_filhos_menores,
          foi_casado_anteriormente,
          data_batismo, local_batismo, igreja_onde_foi_batizado,
          data_admissao_ministerial, tipo_admissao_ministerial, igreja_ou_ministerio_anterior,
          data_consagracao, consagracao_ministerial, local_consagracao, consagrado_por,
          funcao_ministerial, ministerio_integracao, observacoes
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
          $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
          $31, $32, $33, $34, $35, $36, $37
        )
        RETURNING *`,
        [
          pessoaId,
          emptyToNull(numeroRegistro),
          emptyToNull(dataRegistro),
          emptyToNull(cpf),
          emptyToNull(conhecidoPor),
          emptyToNull(telefoneComercial),
          emptyToNull(telefone2),
          emptyToNull(naturalidade),
          emptyToNull(naturalidadeUf),
          emptyToNull(nacionalidade) || 'Brasileira',
          emptyToNull(rgNumero),
          emptyToNull(rgDataEmissao),
          emptyToNull(rgOrgaoEmissor),
          emptyToNull(escolaridade),
          emptyToNull(profissao),
          emptyToNull(tipoSanguineo),
          emptyToNull(nomePai),
          emptyToNull(nomeMae),
          emptyToNull(nomeConjuge),
          emptyToNull(dataCasamento),
          emptyToNullInt(quantidadeFilhos),
          emptyToNullInt(quantidadeFilhosMaiores),
          emptyToNullInt(quantidadeFilhosMenores),
          emptyToNullBool(foiCasadoAnteriormente),
          emptyToNull(dataBatismo),
          emptyToNull(localBatismo),
          emptyToNull(igrejaOndeFoiBatizado),
          emptyToNull(dataAdmissaoMinisterial),
          emptyToNull(tipoAdmissaoMinisterial),
          emptyToNull(igrejaOuMinisterioAnterior),
          emptyToNull(dataConsagracao),
          emptyToNull(consagracaoMinisterial),
          emptyToNull(localConsagracao),
          emptyToNull(consagradoPor),
          emptyToNull(funcaoMinisterial),
          emptyToNull(ministerioIntegracao),
          emptyToNull(observacoes)
        ]
      );

      return res.status(201).json({
        message: 'Ficha cadastral criada com sucesso',
        ficha: mapRowToFichaCadastral(result.rows[0]),
        pessoaId: pessoaId
      });
    }
  } catch (error) {
    console.error('Erro ao criar/atualizar ficha cadastral:', error);
    res.status(500).json({ 
      message: 'Erro ao salvar ficha cadastral', 
      error: error.message 
    });
  }
}

/**
 * Obter ficha cadastral do usuário logado (sua própria ficha)
 */
async function obterMinhaFichaCadastral(req, res) {
  try {
    const pessoaId = req.user.id;

    const result = await pool.query(
      `SELECT fc.*, 
              p.nome, p.sobrenome, p.email, p.telefone, p.whatsapp,
              p.data_nascimento, p.sexo, p.estado_civil,
              p.cep, p.rua, p.numero, p.complemento, p.bairro, p.cidade, p.estado,
              p.foto_perfil
       FROM ficha_cadastral fc
       INNER JOIN pessoas p ON fc.pessoa_id = p.id
       WHERE fc.pessoa_id = $1`,
      [pessoaId]
    );

    if (result.rows.length === 0) {
      return res.json({ ficha: null });
    }

    const row = result.rows[0];
    const ficha = mapRowToFichaCadastral(row);
    ficha.pessoa = {
      nome: row.nome,
      sobrenome: row.sobrenome,
      email: row.email,
      telefone: row.telefone,
      whatsapp: row.whatsapp,
      dataNascimento: row.data_nascimento,
      sexo: row.sexo,
      estadoCivil: row.estado_civil,
      cep: row.cep,
      rua: row.rua,
      numero: row.numero,
      complemento: row.complemento,
      bairro: row.bairro,
      cidade: row.cidade,
      estado: row.estado,
      fotoPerfil: row.foto_perfil || null
    };

    res.json({ ficha });
  } catch (error) {
    console.error('Erro ao obter ficha cadastral:', error);
    res.status(500).json({ 
      message: 'Erro ao obter ficha cadastral', 
      error: error.message 
    });
  }
}

/**
 * Obter ficha cadastral por pessoa_id (para admins/outros usos)
 */
async function obterFichaCadastral(req, res) {
  try {
    const { pessoaId } = req.params;

    const result = await pool.query(
      `SELECT fc.*, 
              p.nome, p.sobrenome, p.email, p.telefone, p.whatsapp,
              p.data_nascimento, p.sexo, p.estado_civil,
              p.cep, p.rua, p.numero, p.complemento, p.bairro, p.cidade, p.estado,
              p.foto_perfil
       FROM ficha_cadastral fc
       INNER JOIN pessoas p ON fc.pessoa_id = p.id
       WHERE fc.pessoa_id = $1`,
      [pessoaId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Ficha cadastral não encontrada' });
    }

    const row = result.rows[0];
    const ficha = mapRowToFichaCadastral(row);
    
    // Adicionar dados da pessoa
    ficha.pessoa = {
      nome: row.nome,
      sobrenome: row.sobrenome,
      email: row.email,
      telefone: row.telefone,
      whatsapp: row.whatsapp,
      dataNascimento: row.data_nascimento,
      sexo: row.sexo,
      estadoCivil: row.estado_civil,
      cep: row.cep,
      rua: row.rua,
      numero: row.numero,
      complemento: row.complemento,
      bairro: row.bairro,
      cidade: row.cidade,
      estado: row.estado,
      fotoPerfil: row.foto_perfil || null
    };

    res.json({ ficha });
  } catch (error) {
    console.error('Erro ao obter ficha cadastral:', error);
    res.status(500).json({ 
      message: 'Erro ao obter ficha cadastral', 
      error: error.message 
    });
  }
}

/**
 * Listar fichas cadastrais com filtros e paginação
 */
async function listarFichasCadastrais(req, res) {
  try {
    const { search, page = 1, pageSize = 10 } = req.query;

    const pageNum = parseInt(page);
    const pageSizeNum = parseInt(pageSize);
    const offset = (pageNum - 1) * pageSizeNum;

    let query = `
      SELECT fc.*, 
             p.nome, p.sobrenome, p.email, p.telefone, p.cidade
      FROM ficha_cadastral fc
      INNER JOIN pessoas p ON fc.pessoa_id = p.id
      WHERE 1=1
    `;
    const queryParams = [];
    let paramIndex = 1;

    if (search) {
      query += ` AND (
        p.nome ILIKE $${paramIndex} OR
        p.sobrenome ILIKE $${paramIndex} OR
        p.email ILIKE $${paramIndex} OR
        fc.cpf ILIKE $${paramIndex} OR
        fc.numero_registro ILIKE $${paramIndex} OR
        CONCAT(p.nome, ' ', COALESCE(p.sobrenome, '')) ILIKE $${paramIndex}
      )`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    const countQuery = query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM');
    const countResult = await pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    query += ` ORDER BY p.nome, p.sobrenome LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(pageSizeNum, offset);

    const result = await pool.query(query, queryParams);
    const fichas = result.rows.map(row => {
      const ficha = mapRowToFichaCadastral(row);
      ficha.pessoaNome = `${row.nome} ${row.sobrenome || ''}`.trim();
      ficha.pessoaEmail = row.email;
      ficha.pessoaTelefone = row.telefone;
      ficha.pessoaCidade = row.cidade;
      return ficha;
    });

    res.json({
      fichas,
      pagination: {
        page: pageNum,
        pageSize: pageSizeNum,
        total,
        totalPages: Math.ceil(total / pageSizeNum)
      }
    });
  } catch (error) {
    console.error('Erro ao listar fichas cadastrais:', error);
    res.status(500).json({ 
      message: 'Erro ao listar fichas cadastrais', 
      error: error.message 
    });
  }
}

module.exports = {
  criarOuAtualizarFichaCadastral,
  obterMinhaFichaCadastral,
  obterFichaCadastral,
  listarFichasCadastrais,
};
