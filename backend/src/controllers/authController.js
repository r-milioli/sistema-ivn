const pool = require('../config/database');
const { hashPassword, comparePassword } = require('../utils/password');
const { generateToken } = require('../utils/jwt');
const crypto = require('crypto');

/**
 * Registrar novo usuário
 */
async function register(req, res) {
  try {
    const { nome, email, senha } = req.body;

    // Validações básicas
    if (!nome || !email || !senha) {
      return res.status(400).json({ message: 'Nome, email e senha são obrigatórios' });
    }

    if (senha.length < 6) {
      return res.status(400).json({ message: 'A senha deve ter no mínimo 6 caracteres' });
    }

    // Verificar se email já existe
    const emailCheck = await pool.query('SELECT id FROM usuarios WHERE email = $1', [email]);
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Email já cadastrado' });
    }

    // Hash da senha
    const senhaHash = await hashPassword(senha);

    // Inserir usuário
    const result = await pool.query(
      `INSERT INTO usuarios (nome, email, senha_hash, ativo, email_verificado)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, nome, email, data_cadastro`,
      [nome, email, senhaHash, true, false]
    );

    const user = result.rows[0];

    // Gerar token JWT
    const token = generateToken({ id: user.id, email: user.email });

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      token,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    res.status(500).json({ message: 'Erro ao criar conta' });
  }
}

/**
 * Login do usuário
 */
async function login(req, res) {
  try {
    const { email, senha } = req.body;

    // Validações básicas
    if (!email || !senha) {
      return res.status(400).json({ message: 'Email e senha são obrigatórios' });
    }

    // Buscar usuário
    const result = await pool.query(
      'SELECT id, nome, email, senha_hash, ativo FROM usuarios WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Email ou senha incorretos' });
    }

    const user = result.rows[0];

    // Verificar se usuário está ativo
    if (!user.ativo) {
      return res.status(401).json({ message: 'Usuário inativo' });
    }

    // Verificar senha
    if (!user.senha_hash) {
      return res.status(401).json({ message: 'Senha não configurada. Use recuperação de senha.' });
    }

    const senhaValida = await comparePassword(senha, user.senha_hash);

    if (!senhaValida) {
      return res.status(401).json({ message: 'Email ou senha incorretos' });
    }

    // Gerar token JWT
    const token = generateToken({ id: user.id, email: user.email });

    res.json({
      message: 'Login realizado com sucesso',
      token,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    res.status(500).json({ message: 'Erro ao fazer login' });
  }
}

/**
 * Solicitar recuperação de senha
 */
async function forgotPassword(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email é obrigatório' });
    }

    // Buscar usuário
    const result = await pool.query('SELECT id, nome FROM usuarios WHERE email = $1', [email]);

    // Por segurança, sempre retornar sucesso mesmo se email não existir
    if (result.rows.length === 0) {
      return res.json({
        message: 'Se o email existir, você receberá instruções para recuperar sua senha',
      });
    }

    // Gerar token de recuperação
    const tokenRecuperacao = crypto.randomBytes(32).toString('hex');
    const tokenExpira = new Date();
    tokenExpira.setHours(tokenExpira.getHours() + 1); // Token expira em 1 hora

    // Salvar token no banco
    await pool.query(
      'UPDATE usuarios SET token_recuperacao = $1, token_recuperacao_expira = $2 WHERE email = $3',
      [tokenRecuperacao, tokenExpira, email]
    );

    // Em produção, aqui você enviaria um email com o token
    // Por enquanto, retornamos o token (apenas para desenvolvimento)
    console.log(`Token de recuperação para ${email}: ${tokenRecuperacao}`);

    res.json({
      message: 'Se o email existir, você receberá instruções para recuperar sua senha',
      // Em desenvolvimento, retornar token (remover em produção)
      ...(process.env.NODE_ENV === 'development' && { token: tokenRecuperacao }),
    });
  } catch (error) {
    console.error('Erro ao solicitar recuperação de senha:', error);
    res.status(500).json({ message: 'Erro ao processar solicitação' });
  }
}

/**
 * Redefinir senha com token
 */
async function resetPassword(req, res) {
  try {
    const { token, senha } = req.body;

    if (!token || !senha) {
      return res.status(400).json({ message: 'Token e senha são obrigatórios' });
    }

    if (senha.length < 6) {
      return res.status(400).json({ message: 'A senha deve ter no mínimo 6 caracteres' });
    }

    // Buscar usuário pelo token
    const result = await pool.query(
      `SELECT id, token_recuperacao_expira 
       FROM usuarios 
       WHERE token_recuperacao = $1`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Token inválido' });
    }

    const user = result.rows[0];

    // Verificar se token não expirou
    if (new Date() > new Date(user.token_recuperacao_expira)) {
      return res.status(400).json({ message: 'Token expirado. Solicite uma nova recuperação.' });
    }

    // Hash da nova senha
    const senhaHash = await hashPassword(senha);

    // Atualizar senha e limpar token
    await pool.query(
      `UPDATE usuarios 
       SET senha_hash = $1, 
           token_recuperacao = NULL, 
           token_recuperacao_expira = NULL 
       WHERE id = $2`,
      [senhaHash, user.id]
    );

    res.json({ message: 'Senha redefinida com sucesso' });
  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
    res.status(500).json({ message: 'Erro ao redefinir senha' });
  }
}

/**
 * Obter dados do usuário autenticado
 */
async function getMe(req, res) {
  try {
    const result = await pool.query(
      'SELECT id, nome, email, data_cadastro FROM usuarios WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({ message: 'Erro ao buscar dados do usuário' });
  }
}

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
  getMe,
};
