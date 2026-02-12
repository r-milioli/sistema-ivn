const pool = require('../config/database');
const storageService = require('../services/storageService');
const { hashPassword, comparePassword } = require('../utils/password');
const { generateToken } = require('../utils/jwt');
const crypto = require('crypto');
const emailService = require('../services/emailService');

/**
 * Registrar novo usuário (schema jornada única)
 * Cria pessoa em `pessoas` (ou usa existente) e credenciais em `credenciais_acesso`
 */
async function register(req, res) {
  try {
    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
      return res.status(400).json({ message: 'Nome, email e senha são obrigatórios' });
    }

    if (senha.length < 6) {
      return res.status(400).json({ message: 'A senha deve ter no mínimo 6 caracteres' });
    }

    // Reaproveitar pessoa existente: por email OU por nome+sobrenome sem email (evita duplicata ao criar conta)
    const pessoaPorEmail = await pool.query(
      'SELECT id, nome FROM pessoas WHERE email = $1',
      [email]
    );

    let pessoaId;

    if (pessoaPorEmail.rows.length > 0) {
      pessoaId = pessoaPorEmail.rows[0].id;
    } else {
      // Não achou por email: tentar pessoa com mesmo nome/sobrenome e sem email (ex.: visitante só com telefone)
      const nomePartes = (nome || '').trim().split(/\s+/);
      const nomePrincipal = nomePartes[0] || nome;
      const sobrenome = nomePartes.length > 1 ? nomePartes.slice(1).join(' ') : null;

      const pessoaPorNomeSemEmail = await pool.query(
        `SELECT id FROM pessoas
         WHERE LOWER(TRIM(nome)) = LOWER(TRIM($1))
           AND (sobrenome IS NOT DISTINCT FROM $2 OR sobrenome IS NULL)
           AND (email IS NULL OR TRIM(email) = '')
           AND ativo = TRUE`,
        [nomePrincipal, sobrenome]
      );

      if (pessoaPorNomeSemEmail.rows.length === 1) {
        // Uma única pessoa com esse nome sem email: reaproveitar e atualizar email (e sobrenome se veio preenchido)
        pessoaId = pessoaPorNomeSemEmail.rows[0].id;
        await pool.query(
          `UPDATE pessoas SET email = $1, sobrenome = COALESCE(NULLIF(TRIM($2), ''), sobrenome), atualizado_em = NOW() WHERE id = $3`,
          [email, sobrenome, pessoaId]
        );
      } else {
        // Nenhuma ou mais de uma: criar nova pessoa para não errar o merge
        const resultPessoa = await pool.query(
          `INSERT INTO pessoas (nome, sobrenome, email, ativo)
           VALUES ($1, $2, $3, TRUE)
           RETURNING id`,
          [nomePrincipal, sobrenome, email]
        );
        pessoaId = resultPessoa.rows[0].id;
      }
    }

    // Verificar se já tem credenciais (evitar duas contas para a mesma pessoa)
    const credencialExistente = await pool.query(
      'SELECT id FROM credenciais_acesso WHERE pessoa_id = $1',
      [pessoaId]
    );
    if (credencialExistente.rows.length > 0) {
      return res.status(400).json({ message: 'Email já cadastrado' });
    }

    const senhaHash = await hashPassword(senha);

    // Criar credenciais de acesso
    await pool.query(
      `INSERT INTO credenciais_acesso (pessoa_id, senha_hash, tipo_acesso, email_verificado)
       VALUES ($1, $2, 'Usuario', FALSE)`,
      [pessoaId, senhaHash]
    );

    // Buscar nome completo para resposta
    const pessoa = await pool.query(
      'SELECT id, nome, sobrenome, email FROM pessoas WHERE id = $1',
      [pessoaId]
    );
    const p = pessoa.rows[0];
    const nomeCompleto = [p.nome, p.sobrenome].filter(Boolean).join(' ');

    const token = generateToken({ id: pessoaId, email });

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      token,
      user: {
        id: pessoaId,
        nome: nomeCompleto,
        email: p.email,
      },
    });
  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    res.status(500).json({ message: 'Erro ao criar conta' });
  }
}

/**
 * Login (schema jornada única)
 * Busca pessoa por email, valida senha em credenciais_acesso
 */
async function login(req, res) {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ message: 'Email e senha são obrigatórios' });
    }

    // Buscar pessoa por email (inclui foto_perfil para exibir no header)
    const resultPessoa = await pool.query(
      'SELECT id, nome, sobrenome, email, ativo, foto_perfil FROM pessoas WHERE email = $1',
      [email]
    );

    if (resultPessoa.rows.length === 0) {
      return res.status(401).json({ message: 'Email ou senha incorretos' });
    }

    const pessoa = resultPessoa.rows[0];

    if (!pessoa.ativo) {
      return res.status(401).json({ message: 'Usuário inativo' });
    }

    // Buscar credenciais de acesso
    const resultCred = await pool.query(
      `SELECT senha_hash, tipo_acesso, bloqueado_ate, tentativas_login_falhas, ultimo_login
       FROM credenciais_acesso WHERE pessoa_id = $1`,
      [pessoa.id]
    );

    if (resultCred.rows.length === 0) {
      return res.status(401).json({
        message: 'Esta conta não possui acesso ao sistema. Entre em contato com a administração.',
      });
    }

    const cred = resultCred.rows[0];

    // Verificar se conta está bloqueada
    if (cred.bloqueado_ate && new Date() < new Date(cred.bloqueado_ate)) {
      const minutosRestantes = Math.ceil((new Date(cred.bloqueado_ate) - new Date()) / 60000);
      return res.status(401).json({ 
        message: `Conta temporariamente bloqueada. Tente novamente em ${minutosRestantes} minuto(s).` 
      });
    }

    if (!cred.senha_hash) {
      return res.status(401).json({ message: 'Senha não configurada. Use recuperação de senha.' });
    }

    const senhaValida = await comparePassword(senha, cred.senha_hash);
    if (!senhaValida) {
      // Incrementar tentativas de login falhadas
      const novasTentativas = (cred.tentativas_login_falhas || 0) + 1;
      const MAX_TENTATIVAS = 5;
      const BLOQUEIO_MINUTOS = 15;

      if (novasTentativas >= MAX_TENTATIVAS) {
        // Bloquear conta por 15 minutos
        const bloqueadoAte = new Date();
        bloqueadoAte.setMinutes(bloqueadoAte.getMinutes() + BLOQUEIO_MINUTOS);

        await pool.query(
          `UPDATE credenciais_acesso 
           SET tentativas_login_falhas = $1, bloqueado_ate = $2 
           WHERE pessoa_id = $3`,
          [novasTentativas, bloqueadoAte, pessoa.id]
        );

        return res.status(401).json({ 
          message: `Conta bloqueada por ${BLOQUEIO_MINUTOS} minutos após ${MAX_TENTATIVAS} tentativas falhadas.` 
        });
      } else {
        // Apenas incrementar contador
        await pool.query(
          'UPDATE credenciais_acesso SET tentativas_login_falhas = $1 WHERE pessoa_id = $2',
          [novasTentativas, pessoa.id]
        );

        const tentativasRestantes = MAX_TENTATIVAS - novasTentativas;
        return res.status(401).json({ 
          message: `Email ou senha incorretos. ${tentativasRestantes} tentativa(s) restante(s).` 
        });
      }
    }

    // Login bem-sucedido: resetar tentativas e atualizar último login
    pool.query(
      `UPDATE credenciais_acesso 
       SET ultimo_login = CURRENT_TIMESTAMP, tentativas_login_falhas = 0, bloqueado_ate = NULL 
       WHERE pessoa_id = $1`,
      [pessoa.id]
    ).catch(() => {});

    const nomeCompleto = [pessoa.nome, pessoa.sobrenome].filter(Boolean).join(' ');
    const token = generateToken({ id: pessoa.id, email: pessoa.email });

    res.json({
      message: 'Login realizado com sucesso',
      token,
      user: {
        id: pessoa.id,
        nome: nomeCompleto,
        email: pessoa.email,
        tipo_acesso: cred.tipo_acesso || null,
        fotoPerfil: storageService.resolveFotoPerfil(pessoa.foto_perfil) || null,
      },
    });
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    res.status(500).json({ message: 'Erro ao fazer login' });
  }
}

/**
 * Solicitar recuperação de senha (schema jornada única)
 * Token salvo em credenciais_acesso
 */
async function forgotPassword(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email é obrigatório' });
    }

    const resultPessoa = await pool.query('SELECT id, nome FROM pessoas WHERE email = $1', [email]);
    if (resultPessoa.rows.length === 0) {
      return res.json({
        message: 'Se o email existir, você receberá instruções para recuperar sua senha',
      });
    }

    const pessoaId = resultPessoa.rows[0].id;
    const nome = resultPessoa.rows[0].nome;

    // Só gera token se a pessoa tiver credenciais de acesso
    const resultCred = await pool.query(
      'SELECT id FROM credenciais_acesso WHERE pessoa_id = $1',
      [pessoaId]
    );
    if (resultCred.rows.length === 0) {
      return res.json({
        message: 'Se o email existir, você receberá instruções para recuperar sua senha',
      });
    }

    const tokenRecuperacao = crypto.randomBytes(32).toString('hex');
    const tokenExpira = new Date();
    tokenExpira.setHours(tokenExpira.getHours() + 1);

    await pool.query(
      `UPDATE credenciais_acesso
       SET token_recuperacao = $1, token_recuperacao_expira = $2
       WHERE pessoa_id = $3`,
      [tokenRecuperacao, tokenExpira, pessoaId]
    );

    // Enviar email com link de redefinição
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password?token=${tokenRecuperacao}`;
    
    try {
      await emailService.sendPasswordResetEmail(email, nome, resetUrl);
      console.log(`[Auth] Email de redefinição enviado para ${email}`);
    } catch (emailError) {
      console.error('[Auth] Erro ao enviar email de redefinição:', emailError.message);
      // Não falha a requisição se email falhar; token fica salvo no banco
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Dev] Token de recuperação para ${email}: ${tokenRecuperacao}`);
      console.log(`[Dev] Link: ${resetUrl}`);
    }

    res.json({
      message: 'Se o email existir, você receberá instruções para recuperar sua senha',
      ...(process.env.NODE_ENV === 'development' && { token: tokenRecuperacao, resetUrl }),
    });
  } catch (error) {
    console.error('Erro ao solicitar recuperação de senha:', error);
    res.status(500).json({ message: 'Erro ao processar solicitação' });
  }
}

/**
 * Redefinir senha com token (schema jornada única)
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

    const result = await pool.query(
      `SELECT pessoa_id, token_recuperacao_expira
       FROM credenciais_acesso
       WHERE token_recuperacao = $1`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Token inválido' });
    }

    const row = result.rows[0];

    if (new Date() > new Date(row.token_recuperacao_expira)) {
      return res.status(400).json({ message: 'Token expirado. Solicite uma nova recuperação.' });
    }

    const senhaHash = await hashPassword(senha);

    await pool.query(
      `UPDATE credenciais_acesso
       SET senha_hash = $1, token_recuperacao = NULL, token_recuperacao_expira = NULL
       WHERE pessoa_id = $2`,
      [senhaHash, row.pessoa_id]
    );

    res.json({ message: 'Senha redefinida com sucesso' });
  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
    res.status(500).json({ message: 'Erro ao redefinir senha' });
  }
}

/**
 * Obter dados do usuário autenticado (schema jornada única)
 * req.user.id é pessoa_id
 */
async function getMe(req, res) {
  try {
    const pessoaId = req.user.id;

    const result = await pool.query(
      `SELECT p.id, p.nome, p.sobrenome, p.email, p.telefone, p.data_nascimento, 
              p.sexo, p.estado_civil, p.cep, p.rua, p.numero, p.complemento, 
              p.bairro, p.cidade, p.estado, p.foto_perfil, p.criado_em,
              ca.tipo_acesso
       FROM pessoas p
       LEFT JOIN credenciais_acesso ca ON ca.pessoa_id = p.id
       WHERE p.id = $1`,
      [pessoaId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    const row = result.rows[0];
    const user = {
      id: row.id,
      nome: row.nome,
      sobrenome: row.sobrenome || '',
      email: row.email,
      telefone: row.telefone || '',
      dataNascimento: row.data_nascimento ? row.data_nascimento.toISOString().split('T')[0] : '',
      sexo: row.sexo || '',
      estadoCivil: row.estado_civil || '',
      cep: row.cep || '',
      rua: row.rua || '',
      numero: row.numero || '',
      complemento: row.complemento || '',
      bairro: row.bairro || '',
      cidade: row.cidade || '',
      estado: row.estado || '',
      fotoPerfil: storageService.resolveFotoPerfil(row.foto_perfil) || null,
      criado_em: row.criado_em,
      tipo_acesso: row.tipo_acesso || null,
    };

    res.json({ user });
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({ message: 'Erro ao buscar dados do usuário' });
  }
}

/**
 * Atualizar senha do usuário autenticado (schema jornada única)
 */
async function updatePassword(req, res) {
  try {
    const pessoaId = req.user.id;
    const { senhaAtual, novaSenha } = req.body;

    if (!senhaAtual || !novaSenha) {
      return res.status(400).json({ message: 'Senha atual e nova senha são obrigatórias' });
    }

    if (novaSenha.length < 6) {
      return res.status(400).json({ message: 'A nova senha deve ter no mínimo 6 caracteres' });
    }

    // Buscar credenciais
    const resultCred = await pool.query(
      'SELECT senha_hash FROM credenciais_acesso WHERE pessoa_id = $1',
      [pessoaId]
    );

    if (resultCred.rows.length === 0) {
      return res.status(404).json({ message: 'Credenciais não encontradas' });
    }

    // Verificar senha atual
    const senhaValida = await comparePassword(senhaAtual, resultCred.rows[0].senha_hash);
    if (!senhaValida) {
      return res.status(401).json({ message: 'Senha atual incorreta' });
    }

    // Atualizar senha
    const novaSenhaHash = await hashPassword(novaSenha);
    await pool.query(
      'UPDATE credenciais_acesso SET senha_hash = $1 WHERE pessoa_id = $2',
      [novaSenhaHash, pessoaId]
    );

    res.json({ message: 'Senha atualizada com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar senha:', error);
    res.status(500).json({ message: 'Erro ao atualizar senha' });
  }
}

/**
 * Atualizar email do usuário autenticado (schema jornada única)
 * Atualiza tanto em pessoas quanto em credenciais_acesso se necessário
 */
async function updateEmail(req, res) {
  try {
    const pessoaId = req.user.id;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email é obrigatório' });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Email inválido' });
    }

    // Verificar se email já está em uso por outra pessoa
    const emailCheck = await pool.query(
      'SELECT id FROM pessoas WHERE email = $1 AND id != $2',
      [email, pessoaId]
    );

    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Email já cadastrado para outra pessoa' });
    }

    // Atualizar email em pessoas
    await pool.query(
      'UPDATE pessoas SET email = $1, atualizado_em = CURRENT_TIMESTAMP WHERE id = $2',
      [email, pessoaId]
    );

    res.json({ message: 'Email atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar email:', error);
    res.status(500).json({ message: 'Erro ao atualizar email' });
  }
}

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
  getMe,
  updatePassword,
  updateEmail,
};
