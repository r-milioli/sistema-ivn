/**
 * Configuração de email SMTP.
 * Variáveis de ambiente:
 *   SMTP_HOST - Host do servidor SMTP (ex: smtp.gmail.com)
 *   SMTP_PORT - Porta (587 para TLS, 465 para SSL, 25 sem criptografia)
 *   SMTP_SECURE - true para SSL (porta 465), false para TLS/STARTTLS
 *   SMTP_USER - Usuário/email para autenticação
 *   SMTP_PASS - Senha ou app password
 *   SMTP_FROM - Email remetente (ex: "Sistema IVN <noreply@igreja.com>")
 */
require('dotenv').config();

const config = {
  enabled: process.env.SMTP_ENABLED === 'true',
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_SECURE === 'true', // true para porta 465, false para 587
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || ''
  },
  from: process.env.SMTP_FROM || '"Sistema IVN" <noreply@exemplo.com>'
};

module.exports = config;
