const express = require('express');
const router = express.Router();
const { authenticateToken, checkRole } = require('../middleware/authMiddleware');
const emailService = require('../services/emailService');

/**
 * POST /api/email/test
 * Envia email de teste (apenas admin).
 */
router.post('/test', authenticateToken, checkRole(['admin']), async (req, res) => {
  try {
    const { to } = req.body;
    if (!to || typeof to !== 'string' || !to.includes('@')) {
      return res.status(400).json({ message: 'Email destinatário inválido' });
    }
    const result = await emailService.sendTestEmail(to);
    if (!result) {
      return res.status(503).json({ 
        message: 'Serviço de email não está configurado ou habilitado. Confira SMTP_ENABLED, SMTP_USER e SMTP_PASS.' 
      });
    }
    res.json({ 
      message: 'Email de teste enviado com sucesso',
      messageId: result.messageId,
      to
    });
  } catch (error) {
    console.error('Erro ao enviar email de teste:', error);
    res.status(500).json({ 
      message: 'Erro ao enviar email de teste',
      error: error.message 
    });
  }
});

module.exports = router;
