const bcrypt = require('bcryptjs');

/**
 * Gera hash da senha usando bcrypt
 * @param {String} password - Senha em texto plano
 * @returns {Promise<String>} Hash da senha
 */
async function hashPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Compara senha em texto plano com hash
 * @param {String} password - Senha em texto plano
 * @param {String} hash - Hash da senha armazenado
 * @returns {Promise<Boolean>} True se a senha corresponder ao hash
 */
async function comparePassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

module.exports = {
  hashPassword,
  comparePassword,
};
