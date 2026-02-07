const pool = require('../config/database');

// Estágios do schema jornada única (estagio_espiritual_enum)
const ESTAGIOS_VALIDOS = [
  'Visitante', 'Visitante Frequente', 'Novo Convertido', 'Em Batismo', 'Batizado',
  'Em Membresia', 'Membro', 'Participante', 'Líder', 'Obreiro', 'Inativo'
];

// Como conheceu (como_conheceu_enum)
const COMO_CONHECEU_VALIDOS = ['familia-amigo', 'google', 'redesocial', 'passei-frente', 'outros'];

/**
 * Cadastrar novo visitante (schema jornada única)
 * - Cadastra em pessoas com estagio_atual = 'Visitante'
 * - Registra em visitas
 * - Registra em jornada_espiritual (primeira visita)
 */
async function cadastrarVisitante(req, res) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const {
      recepcionadoPor,
      diaVisita,
      nomeCompleto,
      dataNascimento,
      whatsapp,
      email,
      bairro,
      cidade,
      comoConheceu,
      pedidoOracao
    } = req.body;

    // Validações básicas - apenas nome e bairro são obrigatórios
    if (!nomeCompleto || !nomeCompleto.trim()) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        message: 'Nome completo é obrigatório' 
      });
    }

    if (!bairro || !bairro.trim()) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        message: 'Bairro é obrigatório' 
      });
    }

    // Validar enum comoConheceu apenas se fornecido
    if (comoConheceu && comoConheceu.trim() && !COMO_CONHECEU_VALIDOS.includes(comoConheceu)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        message: 'Valor inválido para comoConheceu. Valores válidos: familia-amigo, google, redesocial, passei-frente, outros' 
      });
    }

    // Função helper para converter valores vazios em null
    const emptyToNull = (v) => {
      if (v === null || v === undefined) return null;
      if (typeof v === 'string' && v.trim() === '') return null;
      return v;
    };

    // Separar nome e sobrenome
    const nomeParts = nomeCompleto.trim().split(' ');
    const nome = nomeParts[0] || '';
    const sobrenome = nomeParts.slice(1).join(' ') || null;

    // Verificar se pessoa já existe (por email ou telefone)
    let pessoaId = null;
    if (email) {
      const pessoaCheck = await client.query(
        'SELECT id FROM pessoas WHERE email = $1',
        [email]
      );
      if (pessoaCheck.rows.length > 0) {
        pessoaId = pessoaCheck.rows[0].id;
      }
    }

    if (!pessoaId && whatsapp && whatsapp.trim()) {
      const pessoaCheck = await client.query(
        'SELECT id FROM pessoas WHERE telefone = $1 OR whatsapp = $1',
        [whatsapp]
      );
      if (pessoaCheck.rows.length > 0) {
        pessoaId = pessoaCheck.rows[0].id;
      }
    }

    // Buscar ID do usuário que recepcionou
    // No novo schema, usar o ID do usuário logado (req.user.id) que é mais confiável
    let recepcionadoPorId = null;
    if (req.user && req.user.id) {
      // Usar o ID do usuário logado diretamente (mais confiável)
      recepcionadoPorId = req.user.id;
    } else if (recepcionadoPor) {
      // Fallback: buscar por nome se não tiver ID do usuário
      const userResult = await client.query(
        `SELECT p.id 
         FROM pessoas p
         LEFT JOIN credenciais_acesso ca ON p.id = ca.pessoa_id
         WHERE p.nome ILIKE $1 OR p.email = $1
         LIMIT 1`,
        [`%${recepcionadoPor}%`]
      );
      if (userResult.rows.length > 0) {
        recepcionadoPorId = userResult.rows[0].id;
      }
    }

    const dataVisita = diaVisita ? new Date(diaVisita) : new Date();

    // Se pessoa não existe, criar nova
    if (!pessoaId) {
      const pessoaResult = await client.query(
        `INSERT INTO pessoas (
          nome, sobrenome, data_nascimento, telefone, whatsapp, email,
          bairro, cidade, estagio_atual, data_primeira_visita, como_conheceu, ativo
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, TRUE)
        RETURNING id`,
        [
          nome,
          sobrenome,
          emptyToNull(dataNascimento),
          emptyToNull(whatsapp),
          emptyToNull(whatsapp),
          emptyToNull(email),
          bairro,
          emptyToNull(cidade),
          'Visitante',
          dataVisita,
          emptyToNull(comoConheceu)
        ]
      );
      pessoaId = pessoaResult.rows[0].id;

      // Registrar na jornada espiritual (primeira visita)
      await client.query(
        `INSERT INTO jornada_espiritual (pessoa_id, estagio_anterior, estagio_novo, observacoes, registrado_por)
         VALUES ($1, NULL, 'Visitante', $2, $3)`,
        [
          pessoaId,
          `Primeira visita${comoConheceu ? ` - conheceu por: ${comoConheceu}` : ''}`,
          recepcionadoPorId
        ]
      );
    } else {
      // Pessoa já existe - verificar se é primeira visita
      const pessoaCheck = await client.query(
        'SELECT data_primeira_visita, estagio_atual FROM pessoas WHERE id = $1',
        [pessoaId]
      );
      
      if (!pessoaCheck.rows[0].data_primeira_visita) {
        // Atualizar data_primeira_visita se não tiver
        await client.query(
          'UPDATE pessoas SET data_primeira_visita = $1 WHERE id = $2',
          [dataVisita, pessoaId]
        );
      }

      // Se não for visitante, pode ser visitante frequente
      const estagioAtual = pessoaCheck.rows[0].estagio_atual;
      if (estagioAtual !== 'Visitante' && estagioAtual !== 'Visitante Frequente') {
        // Não alterar estágio se já for convertido/membro/etc
      } else if (estagioAtual === 'Visitante') {
        // Verificar se já visitou antes
        const visitasCount = await client.query(
          'SELECT COUNT(*) as total FROM visitas WHERE pessoa_id = $1',
          [pessoaId]
        );
        
        if (parseInt(visitasCount.rows[0].total) > 0) {
          // Já visitou antes, mudar para Visitante Frequente
          await client.query(
            `INSERT INTO jornada_espiritual (pessoa_id, estagio_anterior, estagio_novo, observacoes, registrado_por)
             VALUES ($1, 'Visitante', 'Visitante Frequente', 'Voltou a visitar', $2)`,
            [pessoaId, recepcionadoPorId]
          );
        }
      }
    }

    // Registrar a visita
    const visitaResult = await client.query(
      `INSERT INTO visitas (pessoa_id, data_visita, recepcionado_por, pedido_oracao)
       VALUES ($1, $2, $3, $4)
       RETURNING id, pessoa_id, data_visita, recepcionado_por, pedido_oracao`,
      [
        pessoaId,
        dataVisita,
        recepcionadoPorId,
        pedidoOracao || null
      ]
    );

    // Buscar dados completos da pessoa
    const pessoaResult = await client.query(
      `SELECT id, nome, sobrenome, data_nascimento, telefone, whatsapp, email,
              bairro, cidade, estagio_atual, data_primeira_visita, como_conheceu
       FROM pessoas WHERE id = $1`,
      [pessoaId]
    );

    await client.query('COMMIT');

    const pessoa = pessoaResult.rows[0];
    const visita = visitaResult.rows[0];

    res.status(201).json({
      message: 'Visitante cadastrado com sucesso',
      visitante: {
        id: visita.id,
        pessoa_id: pessoa.id,
        recepcionado_por: recepcionadoPor,
        dia_visita: visita.data_visita,
        nome_completo: `${pessoa.nome} ${pessoa.sobrenome || ''}`.trim(),
        data_nascimento: pessoa.data_nascimento,
        whatsapp: pessoa.whatsapp || pessoa.telefone,
        email: pessoa.email,
        bairro: pessoa.bairro,
        cidade: pessoa.cidade,
        como_conheceu: pessoa.como_conheceu,
        pedido_oracao: visita.pedido_oracao,
        estagio_atual: pessoa.estagio_atual
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao cadastrar visitante:', error);
    res.status(500).json({ message: 'Erro ao cadastrar visitante', error: error.message });
  } finally {
    client.release();
  }
}

/**
 * Listar visitantes com filtros e paginação (schema jornada única)
 * Lista visitas de pessoas com estágio Visitante ou Visitante Frequente
 */
async function listarVisitantes(req, res) {
  try {
    const { search, dataVisita, page = 1, pageSize = 10 } = req.query;
    
    const pageNum = parseInt(page);
    const pageSizeNum = parseInt(pageSize);
    const offset = (pageNum - 1) * pageSizeNum;

    // Construir query base usando visitas + pessoas
    let query = `
      SELECT 
        v.id,
        p.id as pessoa_id,
        recep.nome as recepcionado_por,
        v.data_visita as dia_visita,
        CONCAT(p.nome, ' ', COALESCE(p.sobrenome, '')) as nome_completo,
        p.data_nascimento,
        COALESCE(p.whatsapp, p.telefone) as whatsapp,
        p.email,
        p.bairro,
        p.cidade,
        p.como_conheceu,
        v.pedido_oracao,
        p.estagio_atual,
        v.criado_em
      FROM visitas v
      INNER JOIN pessoas p ON v.pessoa_id = p.id
      LEFT JOIN pessoas recep ON v.recepcionado_por = recep.id
      WHERE p.estagio_atual IN ('Visitante', 'Visitante Frequente')
    `;
    
    const queryParams = [];
    let paramIndex = 1;

    // Aplicar filtros
    if (search) {
      query += ` AND (
        p.nome ILIKE $${paramIndex} OR 
        p.sobrenome ILIKE $${paramIndex} OR
        p.email ILIKE $${paramIndex} OR 
        p.telefone ILIKE $${paramIndex} OR
        p.whatsapp ILIKE $${paramIndex}
      )`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    if (dataVisita) {
      query += ` AND DATE(v.data_visita) = $${paramIndex}`;
      queryParams.push(dataVisita);
      paramIndex++;
    }

    // Contar total de registros
    const countQuery = query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM');
    const countResult = await pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Adicionar ordenação e paginação
    query += ` ORDER BY v.data_visita DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(pageSizeNum, offset);

    // Executar query
    const result = await pool.query(query, queryParams);

    res.json({
      visitantes: result.rows,
      pagination: {
        page: pageNum,
        pageSize: pageSizeNum,
        total,
        totalPages: Math.ceil(total / pageSizeNum)
      }
    });
  } catch (error) {
    console.error('Erro ao listar visitantes:', error);
    res.status(500).json({ message: 'Erro ao listar visitantes', error: error.message });
  }
}

/**
 * Obter estatísticas de visitantes (schema jornada única)
 * Usa tabela visitas + pessoas
 */
async function obterEstatisticas(req, res) {
  try {
    const estatisticas = {};

    // Estatísticas por dia (últimos 7 dias)
    const porDia = await pool.query(`
      SELECT 
        DATE(v.data_visita) as data,
        COUNT(*) as quantidade
      FROM visitas v
      INNER JOIN pessoas p ON v.pessoa_id = p.id
      WHERE v.data_visita >= CURRENT_DATE - INTERVAL '7 days'
        AND p.estagio_atual IN ('Visitante', 'Visitante Frequente')
      GROUP BY DATE(v.data_visita)
      ORDER BY data ASC
    `);
    estatisticas.porDia = porDia.rows.map(row => ({
      data: new Date(row.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      quantidade: parseInt(row.quantidade)
    }));

    // Estatísticas por mês (últimos 12 meses)
    const porMes = await pool.query(`
      SELECT 
        TO_CHAR(v.data_visita, 'Mon') as mes,
        TO_CHAR(v.data_visita, 'MM') as mes_numero,
        COUNT(*) as quantidade
      FROM visitas v
      INNER JOIN pessoas p ON v.pessoa_id = p.id
      WHERE v.data_visita >= CURRENT_DATE - INTERVAL '12 months'
        AND p.estagio_atual IN ('Visitante', 'Visitante Frequente')
      GROUP BY TO_CHAR(v.data_visita, 'Mon'), TO_CHAR(v.data_visita, 'MM')
      ORDER BY mes_numero ASC
    `);
    estatisticas.porMes = porMes.rows.map(row => ({
      mes: row.mes,
      quantidade: parseInt(row.quantidade)
    }));

    // Estatísticas por ano (últimos 5 anos)
    const porAno = await pool.query(`
      SELECT 
        EXTRACT(YEAR FROM v.data_visita) as ano,
        COUNT(*) as quantidade
      FROM visitas v
      INNER JOIN pessoas p ON v.pessoa_id = p.id
      WHERE v.data_visita >= CURRENT_DATE - INTERVAL '5 years'
        AND p.estagio_atual IN ('Visitante', 'Visitante Frequente')
      GROUP BY EXTRACT(YEAR FROM v.data_visita)
      ORDER BY ano ASC
    `);
    estatisticas.porAno = porAno.rows.map(row => ({
      ano: row.ano.toString(),
      quantidade: parseInt(row.quantidade)
    }));

    // Estatísticas por bairro
    const porBairro = await pool.query(`
      SELECT 
        p.bairro,
        COUNT(DISTINCT v.pessoa_id) as quantidade
      FROM visitas v
      INNER JOIN pessoas p ON v.pessoa_id = p.id
      WHERE p.estagio_atual IN ('Visitante', 'Visitante Frequente')
        AND p.bairro IS NOT NULL
      GROUP BY p.bairro
      ORDER BY quantidade DESC
      LIMIT 10
    `);
    const totalBairros = porBairro.rows.reduce((sum, b) => sum + parseInt(b.quantidade), 0);
    estatisticas.porBairro = porBairro.rows.map(row => ({
      bairro: row.bairro,
      quantidade: parseInt(row.quantidade),
      percentual: totalBairros > 0 ? ((parseInt(row.quantidade) / totalBairros) * 100).toFixed(1) : '0'
    }));

    // Estatísticas por dia da semana
    const porDiaSemana = await pool.query(`
      SELECT 
        TO_CHAR(v.data_visita, 'Day') as dia,
        EXTRACT(DOW FROM v.data_visita) as ordem,
        COUNT(*) as quantidade
      FROM visitas v
      INNER JOIN pessoas p ON v.pessoa_id = p.id
      WHERE p.estagio_atual IN ('Visitante', 'Visitante Frequente')
      GROUP BY TO_CHAR(v.data_visita, 'Day'), EXTRACT(DOW FROM v.data_visita)
      ORDER BY ordem ASC
    `);
    estatisticas.porDiaSemana = porDiaSemana.rows.map(row => ({
      dia: row.dia.trim(),
      quantidade: parseInt(row.quantidade),
      ordem: parseInt(row.ordem)
    }));

    // Resumo geral
    const resumo = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE DATE(v.data_visita) = CURRENT_DATE) as hoje,
        COUNT(*) FILTER (WHERE EXTRACT(MONTH FROM v.data_visita) = EXTRACT(MONTH FROM CURRENT_DATE)
                         AND EXTRACT(YEAR FROM v.data_visita) = EXTRACT(YEAR FROM CURRENT_DATE)) as mes_atual,
        COUNT(*) FILTER (WHERE EXTRACT(YEAR FROM v.data_visita) = EXTRACT(YEAR FROM CURRENT_DATE)) as ano_atual,
        COUNT(*) as total
      FROM visitas v
      INNER JOIN pessoas p ON v.pessoa_id = p.id
      WHERE p.estagio_atual IN ('Visitante', 'Visitante Frequente')
    `);
    estatisticas.resumo = {
      hoje: parseInt(resumo.rows[0].hoje) || 0,
      mesAtual: parseInt(resumo.rows[0].mes_atual) || 0,
      anoAtual: parseInt(resumo.rows[0].ano_atual) || 0,
      total: parseInt(resumo.rows[0].total) || 0
    };

    res.json(estatisticas);
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    res.status(500).json({ message: 'Erro ao obter estatísticas', error: error.message });
  }
}

/**
 * Obter visita por ID (schema jornada única)
 */
async function obterVisitantePorId(req, res) {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT 
        v.id,
        p.id as pessoa_id,
        recep.nome as recepcionado_por,
        v.data_visita as dia_visita,
        CONCAT(p.nome, ' ', COALESCE(p.sobrenome, '')) as nome_completo,
        p.data_nascimento,
        COALESCE(p.whatsapp, p.telefone) as whatsapp,
        p.email,
        p.bairro,
        p.cidade,
        p.como_conheceu,
        v.pedido_oracao,
        p.estagio_atual,
        v.criado_em
      FROM visitas v
      INNER JOIN pessoas p ON v.pessoa_id = p.id
      LEFT JOIN pessoas recep ON v.recepcionado_por = recep.id
      WHERE v.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Visita não encontrada' });
    }

    res.json({ visitante: result.rows[0] });
  } catch (error) {
    console.error('Erro ao obter visita:', error);
    res.status(500).json({ message: 'Erro ao obter visita', error: error.message });
  }
}

module.exports = {
  cadastrarVisitante,
  listarVisitantes,
  obterEstatisticas,
  obterVisitantePorId,
};
