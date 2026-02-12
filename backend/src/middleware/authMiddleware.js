const { verifyToken } = require('../utils/jwt');
const pool = require('../config/database');

/**
 * Middleware de autenticação (schema jornada única)
 * JWT contém id = pessoa_id. Carrega pessoa em pessoas e opcionalmente tipo_acesso em credenciais_acesso.
 * req.user = { id (pessoa_id), nome, email, tipoAcesso }
 */
async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token não fornecido' });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    // decoded.id é pessoa_id no schema jornada única
    const result = await pool.query(
      `SELECT p.id, p.nome, p.sobrenome, p.email, p.ativo, ca.tipo_acesso
       FROM pessoas p
       LEFT JOIN credenciais_acesso ca ON ca.pessoa_id = p.id
       WHERE p.id = $1`,
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Usuário não encontrado' });
    }

    const row = result.rows[0];

    if (!row.ativo) {
      return res.status(401).json({ message: 'Usuário inativo' });
    }

    // Quem tem token deve ter credenciais (segurança)
    if (!row.tipo_acesso) {
      return res.status(401).json({ message: 'Acesso revogado' });
    }

    const nomeCompleto = [row.nome, row.sobrenome].filter(Boolean).join(' ');

    req.user = {
      id: row.id,
      nome: nomeCompleto,
      email: row.email,
      tipoAcesso: row.tipo_acesso,
    };

    next();
  } catch (error) {
    return res.status(401).json({ message: error.message || 'Token inválido' });
  }
}

/**
 * Middleware para verificar role/tipo de acesso
 * @param {Array<string>} rolesPermitidas - Ex: ['admin', 'Pastor']
 */
function checkRole(rolesPermitidas) {
  return (req, res, next) => {
    if (!req.user || !req.user.tipoAcesso) {
      return res.status(403).json({ message: 'Acesso negado: tipo de acesso não identificado' });
    }
    
    const tipoAcessoLower = (req.user.tipoAcesso || '').toLowerCase();
    const rolesLower = rolesPermitidas.map(r => r.toLowerCase());
    
    if (!rolesLower.includes(tipoAcessoLower)) {
      return res.status(403).json({ 
        message: `Acesso negado: requer permissão de ${rolesPermitidas.join(' ou ')}` 
      });
    }
    
    next();
  };
}

module.exports = authMiddleware;
module.exports.authenticateToken = authMiddleware; // alias
module.exports.checkRole = checkRole;
