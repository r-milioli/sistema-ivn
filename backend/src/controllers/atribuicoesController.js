const pool = require('../config/database');
const crypto = require('crypto');
const { hashPassword } = require('../utils/password');

// Schema jornada única: um estágio por pessoa (estagio_espiritual_enum)
const ESTAGIOS_VALIDOS = [
  'Visitante', 'Visitante Frequente', 'Novo Convertido', 'Em Batismo', 'Batizado',
  'Em Membresia', 'Membro', 'Participante', 'Líder', 'Obreiro', 'Inativo'
];

// Frontend pode enviar "Participante de Ministério" -> mapear para enum
const MAP_ESTAGIO_FRONT = { 'Participante de Ministério': 'Participante' };

function normalizarEstagio(estagio) {
  return MAP_ESTAGIO_FRONT[estagio] || estagio;
}

// tipo_acesso_enum no schema
const TIPOS_ACESSO_VALIDOS = ['Sem Acesso', 'Usuario', 'Lider', 'Admin', 'SuperAdmin'];

/**
 * Buscar valores do enum cargo_eclesiastico_enum do banco de dados
 */
async function obterCargosEclesiasticos() {
  try {
    const result = await pool.query(
      `SELECT enumlabel as valor 
       FROM pg_enum 
       WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'cargo_eclesiastico_enum')
       ORDER BY enumsortorder`
    );
    return result.rows.map(row => row.valor);
  } catch (error) {
    console.error('Erro ao buscar cargos eclesiásticos:', error);
    return ['Pastor', 'Evangelista', 'Presbítero', 'Diácono', 'Pastor lider'];
  }
}

/**
 * Buscar valores do enum estagio_espiritual_enum do banco de dados
 */
async function obterEstagiosEspirituais() {
  try {
    const result = await pool.query(
      `SELECT enumlabel as valor 
       FROM pg_enum 
       WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'estagio_espiritual_enum')
       ORDER BY enumsortorder`
    );
    return result.rows.map(row => row.valor);
  } catch (error) {
    console.error('Erro ao buscar estágios espirituais:', error);
    return ESTAGIOS_VALIDOS;
  }
}

/**
 * Buscar valores do enum tipo_acesso_enum do banco de dados
 */
async function obterTiposAcesso() {
  try {
    const result = await pool.query(
      `SELECT enumlabel as valor 
       FROM pg_enum 
       WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'tipo_acesso_enum')
       ORDER BY enumsortorder`
    );
    return result.rows.map(row => row.valor);
  } catch (error) {
    console.error('Erro ao buscar tipos de acesso:', error);
    return TIPOS_ACESSO_VALIDOS;
  }
}

/**
 * Criar ou atualizar atribuições (schema jornada única)
 * - Estágio único em pessoas.estagio_atual + registro em jornada_espiritual
 * - Cargo em pessoas (cargo_eclesiastico, data_ordenacao)
 * - Tipo de acesso em credenciais_acesso (cria/atualiza linha se necessário)
 * - Ministérios em pessoa_ministerios (e_lider, data_inicio, data_fim)
 */
async function criarOuAtualizarAtribuicao(req, res) {
  try {
    const { pessoaId } = req.params;
    const {
      cargoEclesiastico,
      estagiosUsuario,
      ministeriosLider,
      ministeriosParticipante,
      tipoUsuario
    } = req.body;
    
    // Garantir que ministeriosLider e ministeriosParticipante sejam arrays
    // Normalizar: converter para array, garantir que todos os valores sejam números
    let ministeriosLiderArray = [];
    if (ministeriosLider) {
      if (Array.isArray(ministeriosLider)) {
        ministeriosLiderArray = ministeriosLider.map(id => Number(id)).filter(id => !isNaN(id));
      } else {
        const id = Number(ministeriosLider);
        if (!isNaN(id)) {
          ministeriosLiderArray = [id];
        }
      }
    }
    
    let ministeriosParticipanteArray = [];
    if (ministeriosParticipante) {
      if (Array.isArray(ministeriosParticipante)) {
        ministeriosParticipanteArray = ministeriosParticipante.map(id => Number(id)).filter(id => !isNaN(id));
      } else {
        const id = Number(ministeriosParticipante);
        if (!isNaN(id)) {
          ministeriosParticipanteArray = [id];
        }
      }
    }
    
    const registradoPor = req.user?.id;

    if (!pessoaId) {
      return res.status(400).json({ message: 'ID da pessoa é obrigatório' });
    }

    const pessoaCheck = await pool.query('SELECT id, estagio_atual FROM pessoas WHERE id = $1', [pessoaId]);
    if (pessoaCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Pessoa não encontrada' });
    }

    if (!Array.isArray(estagiosUsuario) || estagiosUsuario.length === 0) {
      return res.status(400).json({ message: 'É necessário informar pelo menos um estágio de usuário' });
    }

    const estagioNovo = normalizarEstagio(estagiosUsuario[0]);
    if (!ESTAGIOS_VALIDOS.includes(estagioNovo)) {
      return res.status(400).json({ message: `Estágio inválido: ${estagiosUsuario[0]}` });
    }

    if (cargoEclesiastico) {
      const cargosValidos = await obterCargosEclesiasticos();
      // Normalizar comparação (trim e case-insensitive)
      const cargoNormalizado = cargoEclesiastico.trim();
      const cargoEncontrado = cargosValidos.find(c => c.trim().toLowerCase() === cargoNormalizado.toLowerCase());
      
      if (!cargoEncontrado) {
        console.error('Cargo inválido:', {
          recebido: cargoEclesiastico,
          cargosValidos: cargosValidos
        });
        return res.status(400).json({ 
          message: `Cargo eclesiástico inválido. Cargos válidos: ${cargosValidos.join(', ')}. Recebido: "${cargoEclesiastico}"` 
        });
      }
      
      // Usar o valor exato do banco (pode ter diferenças de case)
      req.body.cargoEclesiastico = cargoEncontrado;
    }

    if (!tipoUsuario || !TIPOS_ACESSO_VALIDOS.includes(tipoUsuario)) {
      return res.status(400).json({ message: 'Tipo de acesso inválido' });
    }

    // Validar ministérios se fornecidos (não é obrigatório ter estágio para ter ministérios)
    if (ministeriosLiderArray.length > 0) {
      const ministeriosCheck = await pool.query('SELECT id FROM ministerios WHERE id = ANY($1::int[])', [ministeriosLiderArray]);
      if (ministeriosCheck.rows.length !== ministeriosLiderArray.length) {
        return res.status(400).json({ message: 'Um ou mais ministérios de líder não foram encontrados' });
      }
    }

    if (ministeriosParticipanteArray.length > 0) {
      const ministeriosCheck = await pool.query('SELECT id FROM ministerios WHERE id = ANY($1::int[])', [ministeriosParticipanteArray]);
      if (ministeriosCheck.rows.length !== ministeriosParticipanteArray.length) {
        return res.status(400).json({ message: 'Um ou mais ministérios de participante não foram encontrados' });
      }
    }

    await pool.query('BEGIN');

    try {
      const estagioAtualAnterior = pessoaCheck.rows[0].estagio_atual;

      // 1) Registrar mudança de estágio na jornada_espiritual (trigger atualiza pessoas.estagio_atual)
      if (estagioNovo !== estagioAtualAnterior) {
        await pool.query(
          `INSERT INTO jornada_espiritual (pessoa_id, estagio_anterior, estagio_novo, observacoes, registrado_por)
           VALUES ($1, $2, $3, $4, $5)`,
          [pessoaId, estagioAtualAnterior, estagioNovo, 'Atualizado pela gestão de pessoas', registradoPor || null]
        );
      }

      // 2) Cargo eclesiástico e data_ordenacao em pessoas
      await pool.query(
        `UPDATE pessoas 
         SET cargo_eclesiastico = $1, data_ordenacao = $2, atualizado_em = CURRENT_TIMESTAMP 
         WHERE id = $3`,
        [cargoEclesiastico || null, req.body.dataOrdenacao || null, pessoaId]
      );

      // 3) Credenciais de acesso (tipo_acesso)
      const credExistente = await pool.query('SELECT id FROM credenciais_acesso WHERE pessoa_id = $1', [pessoaId]);
      if (tipoUsuario === 'Sem Acesso') {
        await pool.query('DELETE FROM credenciais_acesso WHERE pessoa_id = $1', [pessoaId]);
      } else {
        if (credExistente.rows.length > 0) {
          await pool.query(
            'UPDATE credenciais_acesso SET tipo_acesso = $1, atualizado_em = CURRENT_TIMESTAMP WHERE pessoa_id = $2',
            [tipoUsuario, pessoaId]
          );
        } else {
          const placeholderHash = await hashPassword(crypto.randomBytes(24).toString('hex'));
          await pool.query(
            `INSERT INTO credenciais_acesso (pessoa_id, senha_hash, tipo_acesso)
             VALUES ($1, $2, $3)`,
            [pessoaId, placeholderHash, tipoUsuario]
          );
        }
      }

      // 4) Ministérios: encerrar participações atuais (data_fim = hoje) e inserir novas
      // Primeiro, encerrar todas as participações atuais
      await pool.query(
        `UPDATE pessoa_ministerios SET data_fim = CURRENT_DATE, atualizado_em = CURRENT_TIMESTAMP 
         WHERE pessoa_id = $1 AND data_fim IS NULL`,
        [pessoaId]
      );

      const hoje = new Date().toISOString().slice(0, 10);
      
      if (ministeriosLiderArray.length > 0) {
        for (const ministerioId of ministeriosLiderArray) {
          const ministerioIdNum = Number(ministerioId);
          await pool.query(
            `INSERT INTO pessoa_ministerios (pessoa_id, ministerio_id, e_lider, data_inicio)
             VALUES ($1, $2, TRUE, $3)
             ON CONFLICT (pessoa_id, ministerio_id, data_inicio) 
             DO UPDATE SET 
               e_lider = TRUE, 
               data_fim = NULL, 
               atualizado_em = CURRENT_TIMESTAMP`,
            [pessoaId, ministerioIdNum, hoje]
          );
        }
      }

      if (ministeriosParticipanteArray.length > 0) {
        for (const ministerioId of ministeriosParticipanteArray) {
          // Não permitir que seja líder e participante do mesmo ministério
          if (ministeriosLiderArray.includes(Number(ministerioId))) {
            continue;
          }
          
          const ministerioIdNum = Number(ministerioId);
          await pool.query(
            `INSERT INTO pessoa_ministerios (pessoa_id, ministerio_id, e_lider, data_inicio)
             VALUES ($1, $2, FALSE, $3)
             ON CONFLICT (pessoa_id, ministerio_id, data_inicio) 
             DO UPDATE SET 
               e_lider = FALSE, 
               data_fim = NULL, 
               atualizado_em = CURRENT_TIMESTAMP`,
            [pessoaId, ministerioIdNum, hoje]
          );
        }
      }

      await pool.query('COMMIT');

      const atribuicao = await obterAtribuicaoCompleta(pessoaId);
      res.json({ message: 'Atribuições salvas com sucesso', atribuicao });
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Erro ao criar/atualizar atribuição:', error);
    res.status(500).json({ message: 'Erro ao salvar atribuições', error: error.message });
  }
}

/**
 * Obter atribuições de uma pessoa (schema jornada única)
 */
async function obterAtribuicao(req, res) {
  try {
    const { pessoaId } = req.params;

    const pessoaCheck = await pool.query('SELECT id FROM pessoas WHERE id = $1', [pessoaId]);
    if (pessoaCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Pessoa não encontrada' });
    }

    const atribuicao = await obterAtribuicaoCompleta(pessoaId);
    res.json({ atribuicao });
  } catch (error) {
    console.error('Erro ao obter atribuição:', error);
    res.status(500).json({ message: 'Erro ao obter atribuições', error: error.message });
  }
}

/**
 * Monta atribuições a partir de pessoas, credenciais_acesso e pessoa_ministerios
 */
async function obterAtribuicaoCompleta(pessoaId) {
  const pessoaResult = await pool.query(
    'SELECT estagio_atual, cargo_eclesiastico, data_ordenacao FROM pessoas WHERE id = $1',
    [pessoaId]
  );
  const p = pessoaResult.rows[0];
  if (!p) return null;

  const credResult = await pool.query(
    'SELECT tipo_acesso FROM credenciais_acesso WHERE pessoa_id = $1',
    [pessoaId]
  );
  const tipoAcesso = credResult.rows[0]?.tipo_acesso || 'Sem Acesso';

  const ministeriosResult = await pool.query(
    `SELECT pm.ministerio_id, m.nome, pm.e_lider
     FROM pessoa_ministerios pm
     JOIN ministerios m ON pm.ministerio_id = m.id
     WHERE pm.pessoa_id = $1 AND pm.data_fim IS NULL`,
    [pessoaId]
  );

  // Filtrar ministérios: garantir que a comparação funcione independente do tipo retornado pelo PostgreSQL
  const ministeriosLider = ministeriosResult.rows
    .filter(r => {
      // Aceitar true, 't', 1, ou qualquer valor truthy que represente true
      const eLider = r.e_lider;
      if (eLider === true || eLider === 't' || eLider === 1 || eLider === 'true') {
        return true;
      }
      if (typeof eLider === 'boolean') {
        return eLider === true;
      }
      return false;
    })
    .map(r => ({ id: Number(r.ministerio_id), nome: r.nome }));
  
  const ministeriosParticipante = ministeriosResult.rows
    .filter(r => {
      // Aceitar false, 'f', 0, ou qualquer valor falsy que represente false
      const eLider = r.e_lider;
      if (eLider === false || eLider === 'f' || eLider === 0 || eLider === 'false') {
        return true;
      }
      if (typeof eLider === 'boolean') {
        return eLider === false;
      }
      return false;
    })
    .map(r => ({ id: Number(r.ministerio_id), nome: r.nome }));

  // Frontend usa "Participante de Ministério"; no schema o enum é "Participante"
  const estagioParaFront = p.estagio_atual === 'Participante' ? 'Participante de Ministério' : p.estagio_atual;

  // Garantir que sempre retorne arrays, mesmo que vazios
  const ministeriosLiderFinal = Array.isArray(ministeriosLider) && ministeriosLider.length > 0 
    ? ministeriosLider 
    : [];
  const ministeriosParticipanteFinal = Array.isArray(ministeriosParticipante) && ministeriosParticipante.length > 0
    ? ministeriosParticipante
    : [];

  return {
    pessoaId: parseInt(pessoaId),
    cargoEclesiastico: p.cargo_eclesiastico || null,
    tipoUsuario: tipoAcesso,
    estagiosUsuario: [estagioParaFront],
    ministeriosLider: ministeriosLiderFinal,
    ministeriosParticipante: ministeriosParticipanteFinal
  };
}

/**
 * Listar ministérios
 */
async function listarMinisterios(req, res) {
  try {
    const result = await pool.query(
      'SELECT id, nome, descricao, ativo FROM ministerios WHERE ativo = true ORDER BY nome'
    );

    res.json({
      ministerios: result.rows.map(row => ({
        id: row.id,
        nome: row.nome,
        descricao: row.descricao,
        ativo: row.ativo
      }))
    });
  } catch (error) {
    console.error('Erro ao listar ministérios:', error);
    res.status(500).json({ message: 'Erro ao listar ministérios', error: error.message });
  }
}

/**
 * Obter valores do enum cargo_eclesiastico_enum (para dropdown)
 */
async function obterCargosEclesiasticosEndpoint(req, res) {
  try {
    const cargos = await obterCargosEclesiasticos();
    res.json({ cargos });
  } catch (error) {
    console.error('Erro ao obter cargos eclesiásticos:', error);
    res.status(500).json({ message: 'Erro ao obter cargos eclesiásticos', error: error.message });
  }
}

/**
 * Obter valores do enum estagio_espiritual_enum (para dropdown)
 */
async function obterEstagiosEspirituaisEndpoint(req, res) {
  try {
    const estagios = await obterEstagiosEspirituais();
    res.json({ estagios });
  } catch (error) {
    console.error('Erro ao obter estágios espirituais:', error);
    res.status(500).json({ message: 'Erro ao obter estágios espirituais', error: error.message });
  }
}

/**
 * Obter valores do enum tipo_acesso_enum (para dropdown)
 */
async function obterTiposAcessoEndpoint(req, res) {
  try {
    const tipos = await obterTiposAcesso();
    res.json({ tipos });
  } catch (error) {
    console.error('Erro ao obter tipos de acesso:', error);
    res.status(500).json({ message: 'Erro ao obter tipos de acesso', error: error.message });
  }
}

module.exports = {
  criarOuAtualizarAtribuicao,
  obterAtribuicao,
  listarMinisterios,
  obterCargosEclesiasticosEndpoint,
  obterEstagiosEspirituaisEndpoint,
  obterTiposAcessoEndpoint,
};
