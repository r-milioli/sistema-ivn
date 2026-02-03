const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'seu_jwt_secret_aqui_mude_em_producao';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Gera um token JWT para o usuário
 * @param {Object} payload - Dados do usuário (id, email, etc)
 * @returns {String} Token JWT
 */
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

/**
 * Verifica e decodifica um token JWT
 * @param {String} token - Token JWT
 * @returns {Object} Dados decodificados do token
 * @throws {Error} Se o token for inválido ou expirado
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Token inválido ou expirado');
  }
}

module.exports = {
  generateToken,
  verifyToken,
};
