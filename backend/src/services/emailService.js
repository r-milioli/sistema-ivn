/**
 * Serviço de envio de emails via SMTP.
 */
const nodemailer = require('nodemailer');
const config = require('../config/email');

let transporter = null;

/**
 * Cria o transporter do Nodemailer (lazy init).
 */
function getTransporter() {
  if (transporter) return transporter;
  if (!config.enabled) {
    console.log('[Email] SMTP desabilitado (SMTP_ENABLED não é true)');
    return null;
  }
  if (!config.auth.user || !config.auth.pass) {
    console.warn('[Email] SMTP_USER ou SMTP_PASS não configurados');
    return null;
  }
  try {
    transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth
    });
    console.log(`[Email] Transporter configurado: ${config.host}:${config.port} (secure: ${config.secure})`);
    return transporter;
  } catch (e) {
    console.error('[Email] Erro ao criar transporter:', e.message);
    return null;
  }
}

/**
 * Envia um email.
 * @param {Object} options - { to, subject, text, html }
 * @returns {Promise<Object|null>} - Info do envio ou null se falhar
 */
async function sendEmail({ to, subject, text, html }) {
  const transport = getTransporter();
  if (!transport) {
    console.warn('[Email] Envio cancelado: transporter não disponível');
    return null;
  }
  try {
    const info = await transport.sendMail({
      from: config.from,
      to,
      subject,
      text,
      html: html || text
    });
    console.log(`[Email] Enviado para ${to}: ${subject} - MessageId: ${info.messageId}`);
    return info;
  } catch (e) {
    console.error(`[Email] Erro ao enviar para ${to}:`, e.message);
    throw e;
  }
}

/**
 * Envia email de teste.
 * @param {string} to - Email destinatário
 */
async function sendTestEmail(to) {
  return sendEmail({
    to,
    subject: 'Teste de Email - Sistema IVN',
    text: 'Este é um email de teste do Sistema IVN.',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Teste de Email</h2>
        <p>Este é um email de teste do <strong>Sistema IVN</strong>.</p>
        <p>Se você recebeu esta mensagem, a configuração SMTP está funcionando corretamente.</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="color: #888; font-size: 12px;">Sistema de Gestão de Igreja - IVN</p>
      </div>
    `
  });
}

/**
 * Envia email de notificação (exemplo genérico).
 * @param {string} to - Email destinatário
 * @param {string} nome - Nome da pessoa
 * @param {string} mensagem - Mensagem personalizada
 */
async function sendNotification(to, nome, mensagem) {
  return sendEmail({
    to,
    subject: 'Notificação - Sistema IVN',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Olá, ${nome}!</h2>
        <p>${mensagem}</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="color: #888; font-size: 12px;">Sistema de Gestão de Igreja - IVN</p>
      </div>
    `
  });
}

/**
 * Envia email de redefinição de senha.
 * @param {string} to - Email destinatário
 * @param {string} nome - Nome da pessoa
 * @param {string} resetUrl - URL completa para redefinir senha (com token)
 */
async function sendPasswordResetEmail(to, nome, resetUrl) {
  return sendEmail({
    to,
    subject: 'Redefinição de Senha - Sistema IVN',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-top: 0;">Redefinir Senha</h2>
          <p style="color: #555; line-height: 1.6;">Olá, <strong>${nome}</strong>!</p>
          <p style="color: #555; line-height: 1.6;">
            Você solicitou a redefinição de senha para sua conta no Sistema IVN.
            Clique no botão abaixo para criar uma nova senha:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Redefinir Senha
            </a>
          </div>
          <p style="color: #888; font-size: 13px; line-height: 1.6;">
            Ou copie e cole este link no navegador:<br>
            <a href="${resetUrl}" style="color: #4CAF50; word-break: break-all;">${resetUrl}</a>
          </p>
          <p style="color: #888; font-size: 13px; line-height: 1.6;">
            <strong>Este link expira em 1 hora.</strong>
          </p>
          <p style="color: #888; font-size: 13px; line-height: 1.6;">
            Se você não solicitou esta redefinição, ignore este email. Sua senha permanecerá inalterada.
          </p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="color: #888; font-size: 12px; text-align: center;">
            Sistema de Gestão de Igreja - IVN
          </p>
        </div>
      </div>
    `
  });
}

module.exports = {
  sendEmail,
  sendTestEmail,
  sendNotification,
  sendPasswordResetEmail
};
