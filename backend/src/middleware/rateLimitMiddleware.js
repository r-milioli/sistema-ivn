/**
 * Rate Limiting - Proteção contra força bruta e spam
 */
const rateLimit = require('express-rate-limit');

// Rate limit geral para todas as rotas da API
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 60, // 60 requisições por minuto por IP
  message: { message: 'Muitas requisições. Tente novamente mais tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const clientIP = req.ip || req.headers['x-forwarded-for'] || 'IP desconhecido';
    console.warn(`[RATE LIMIT] Limite excedido - IP: ${clientIP} | Rota: ${req.method} ${req.originalUrl} | User-Agent: ${req.headers['user-agent'] || 'N/A'}`);
    res.status(429).json({ 
      message: 'Muitas requisições. Tente novamente mais tarde.',
      retryAfter: '1 minuto'
    });
  },
});

// Rate limit ESTRITO para login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Apenas 5 tentativas de login
  skipSuccessfulRequests: true, // Não conta login bem-sucedido
  message: { message: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const clientIP = req.ip || req.headers['x-forwarded-for'] || 'IP desconhecido';
    const email = req.body?.email || 'Email não fornecido';
    console.warn(`[RATE LIMIT - LOGIN] Limite excedido (5 tentativas) - IP: ${clientIP} | Email: ${email} | User-Agent: ${req.headers['user-agent'] || 'N/A'}`);
    res.status(429).json({ 
      message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
      retryAfter: '15 minutos'
    });
  },
});

// Rate limit para recuperação de senha (evita spam de emails)
const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // Apenas 3 solicitações por hora
  message: { message: 'Muitas solicitações de recuperação. Tente novamente em 1 hora.' },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const clientIP = req.ip || req.headers['x-forwarded-for'] || 'IP desconhecido';
    const email = req.body?.email || 'Email não fornecido';
    console.warn(`[RATE LIMIT - RECUPERAÇÃO] Limite excedido (3 tentativas) - IP: ${clientIP} | Email: ${email} | User-Agent: ${req.headers['user-agent'] || 'N/A'}`);
    res.status(429).json({ 
      message: 'Muitas solicitações de recuperação. Tente novamente em 1 hora.',
      retryAfter: '1 hora'
    });
  },
});

// Rate limit para registro (evita criação em massa)
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // Apenas 3 registros por hora por IP
  message: { message: 'Muitos registros. Tente novamente em 1 hora.' },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const clientIP = req.ip || req.headers['x-forwarded-for'] || 'IP desconhecido';
    const email = req.body?.email || 'Email não fornecido';
    console.warn(`[RATE LIMIT - REGISTRO] Limite excedido (3 tentativas) - IP: ${clientIP} | Email: ${email} | User-Agent: ${req.headers['user-agent'] || 'N/A'}`);
    res.status(429).json({ 
      message: 'Muitos registros. Tente novamente em 1 hora.',
      retryAfter: '1 hora'
    });
  },
});

module.exports = {
  apiLimiter,
  loginLimiter,
  forgotPasswordLimiter,
  registerLimiter
};
