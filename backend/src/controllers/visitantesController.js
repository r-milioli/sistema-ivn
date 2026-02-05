const pool = require('../config/database');

/**
 * Cadastrar novo visitante
 */
async function cadastrarVisitante(req, res) {
  try {
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

    // Validações básicas
    if (!nomeCompleto || !dataNascimento || !whatsapp || !email || !bairro || !cidade || !comoConheceu) {
      return res.status(400).json({ 
        message: 'Campos obrigatórios: nomeCompleto, dataNascimento, whatsapp, email, bairro, cidade, comoConheceu' 
      });
    }

    // Validar enum comoConheceu
    const comoConheceuValidos = ['familia-amigo', 'google', 'redesocial', 'passei-frente'];
    if (!comoConheceuValidos.includes(comoConheceu)) {
      return res.status(400).json({ 
        message: 'Valor inválido para comoConheceu. Valores válidos: familia-amigo, google, redesocial, passei-frente' 
      });
    }

    // Buscar ID do usuário que recepcionou (se fornecido)
    let recepcionadoPorId = null;
    if (recepcionadoPor) {
      const userResult = await pool.query(
        'SELECT id FROM usuarios WHERE nome = $1 OR email = $1 LIMIT 1',
        [recepcionadoPor]
      );
      if (userResult.rows.length > 0) {
        recepcionadoPorId = userResult.rows[0].id;
      }
    }

    // Inserir visitante
    const result = await pool.query(
      `INSERT INTO visitantes (
        recepcionado_por, dia_visita, nome_completo, data_nascimento, 
        whatsapp, email, bairro, cidade, como_conheceu, pedido_oracao
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id, recepcionado_por, dia_visita, nome_completo, data_nascimento, 
                whatsapp, email, bairro, cidade, como_conheceu, pedido_oracao, criado_em`,
      [
        recepcionadoPorId,
        diaVisita || new Date(),
        nomeCompleto,
        dataNascimento,
        whatsapp,
        email,
        bairro,
        cidade,
        comoConheceu,
        pedidoOracao || null
      ]
    );

    const visitante = result.rows[0];

    res.status(201).json({
      message: 'Visitante cadastrado com sucesso',
      visitante
    });
  } catch (error) {
    console.error('Erro ao cadastrar visitante:', error);
    res.status(500).json({ message: 'Erro ao cadastrar visitante', error: error.message });
  }
}

/**
 * Listar visitantes com filtros e paginação
 */
async function listarVisitantes(req, res) {
  try {
    const { search, dataVisita, page = 1, pageSize = 10 } = req.query;
    
    const pageNum = parseInt(page);
    const pageSizeNum = parseInt(pageSize);
    const offset = (pageNum - 1) * pageSizeNum;

    // Construir query base
    let query = `
      SELECT 
        v.id,
        u.nome as recepcionado_por,
        v.dia_visita,
        v.nome_completo,
        v.data_nascimento,
        v.whatsapp,
        v.email,
        v.bairro,
        v.cidade,
        v.como_conheceu,
        v.pedido_oracao,
        v.criado_em
      FROM visitantes v
      LEFT JOIN usuarios u ON v.recepcionado_por = u.id
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramIndex = 1;

    // Aplicar filtros
    if (search) {
      query += ` AND (
        v.nome_completo ILIKE $${paramIndex} OR 
        v.email ILIKE $${paramIndex} OR 
        v.whatsapp ILIKE $${paramIndex}
      )`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    if (dataVisita) {
      query += ` AND DATE(v.dia_visita) = $${paramIndex}`;
      queryParams.push(dataVisita);
      paramIndex++;
    }

    // Contar total de registros
    const countQuery = query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM');
    const countResult = await pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Adicionar ordenação e paginação
    query += ` ORDER BY v.dia_visita DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
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
 * Obter estatísticas de visitantes
 */
async function obterEstatisticas(req, res) {
  try {
    const { periodo } = req.query; // 'dia', 'mes', 'ano', 'bairro', 'sexo', 'diaSemana'

    const estatisticas = {};

    // Estatísticas por dia (últimos 7 dias)
    const porDia = await pool.query(`
      SELECT 
        DATE(dia_visita) as data,
        COUNT(*) as quantidade
      FROM visitantes
      WHERE dia_visita >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY DATE(dia_visita)
      ORDER BY data ASC
    `);
    estatisticas.porDia = porDia.rows.map(row => ({
      data: new Date(row.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      quantidade: parseInt(row.quantidade)
    }));

    // Estatísticas por mês (últimos 12 meses)
    const porMes = await pool.query(`
      SELECT 
        TO_CHAR(dia_visita, 'Mon') as mes,
        TO_CHAR(dia_visita, 'MM') as mes_numero,
        COUNT(*) as quantidade
      FROM visitantes
      WHERE dia_visita >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY TO_CHAR(dia_visita, 'Mon'), TO_CHAR(dia_visita, 'MM')
      ORDER BY mes_numero ASC
    `);
    estatisticas.porMes = porMes.rows.map(row => ({
      mes: row.mes,
      quantidade: parseInt(row.quantidade)
    }));

    // Estatísticas por ano (últimos 5 anos)
    const porAno = await pool.query(`
      SELECT 
        EXTRACT(YEAR FROM dia_visita) as ano,
        COUNT(*) as quantidade
      FROM visitantes
      WHERE dia_visita >= CURRENT_DATE - INTERVAL '5 years'
      GROUP BY EXTRACT(YEAR FROM dia_visita)
      ORDER BY ano ASC
    `);
    estatisticas.porAno = porAno.rows.map(row => ({
      ano: row.ano.toString(),
      quantidade: parseInt(row.quantidade)
    }));

    // Estatísticas por bairro
    const porBairro = await pool.query(`
      SELECT 
        bairro,
        COUNT(*) as quantidade
      FROM visitantes
      GROUP BY bairro
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
        TO_CHAR(dia_visita, 'Day') as dia,
        EXTRACT(DOW FROM dia_visita) as ordem,
        COUNT(*) as quantidade
      FROM visitantes
      GROUP BY TO_CHAR(dia_visita, 'Day'), EXTRACT(DOW FROM dia_visita)
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
        COUNT(*) FILTER (WHERE DATE(dia_visita) = CURRENT_DATE) as hoje,
        COUNT(*) FILTER (WHERE EXTRACT(MONTH FROM dia_visita) = EXTRACT(MONTH FROM CURRENT_DATE)
                         AND EXTRACT(YEAR FROM dia_visita) = EXTRACT(YEAR FROM CURRENT_DATE)) as mes_atual,
        COUNT(*) FILTER (WHERE EXTRACT(YEAR FROM dia_visita) = EXTRACT(YEAR FROM CURRENT_DATE)) as ano_atual,
        COUNT(*) as total
      FROM visitantes
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
 * Obter visitante por ID
 */
async function obterVisitantePorId(req, res) {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT 
        v.id,
        u.nome as recepcionado_por,
        v.dia_visita,
        v.nome_completo,
        v.data_nascimento,
        v.whatsapp,
        v.email,
        v.bairro,
        v.cidade,
        v.como_conheceu,
        v.pedido_oracao,
        v.criado_em,
        v.atualizado_em
      FROM visitantes v
      LEFT JOIN usuarios u ON v.recepcionado_por = u.id
      WHERE v.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Visitante não encontrado' });
    }

    res.json({ visitante: result.rows[0] });
  } catch (error) {
    console.error('Erro ao obter visitante:', error);
    res.status(500).json({ message: 'Erro ao obter visitante', error: error.message });
  }
}

module.exports = {
  cadastrarVisitante,
  listarVisitantes,
  obterEstatisticas,
  obterVisitantePorId,
};
