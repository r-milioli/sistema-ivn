const { verifyToken } = require('../utils/jwt');
const pool = require('../config/database');

/**
 * Middleware para verificar autenticação JWT
 * Adiciona req.user com os dados do usuário autenticado
 */
async function authMiddleware(req, res, next) {
  try {
    // Obter token do header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token não fornecido' });
    }

    const token = authHeader.substring(7); // Remove "Bearer "

    // Verificar e decodificar token
    const decoded = verifyToken(token);

    // Buscar usuário no banco de dados
    const result = await pool.query(
      'SELECT id, nome, email, ativo FROM usuarios WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Usuário não encontrado' });
    }

    const user = result.rows[0];

    if (!user.ativo) {
      return res.status(401).json({ message: 'Usuário inativo' });
    }

    // Adicionar dados do usuário à requisição
    req.user = {
      id: user.id,
      nome: user.nome,
      email: user.email,
    };

    next();
  } catch (error) {
    return res.status(401).json({ message: error.message || 'Token inválido' });
  }
}

module.exports = authMiddleware;
