const express = require('express');
const router = express.Router();
const { body, query } = require('express-validator');
const visitantesController = require('../controllers/visitantesController');
const authMiddleware = require('../middleware/authMiddleware');
const handleValidationErrors = require('../middleware/validationMiddleware');

// Validações para cadastro (schema jornada única - apenas nome e bairro obrigatórios)
const cadastrarValidation = [
  body('nomeCompleto').trim().notEmpty().withMessage('Nome completo é obrigatório'),
  body('dataNascimento')
    .optional({ checkFalsy: true })
    .custom((value) => {
      if (!value || value === '') return true; // Aceita vazio
      // Validar formato de data (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(value)) return false;
      const date = new Date(value);
      return date instanceof Date && !isNaN(date);
    })
    .withMessage('Data de nascimento inválida'),
  body('whatsapp')
    .optional({ checkFalsy: true })
    .trim()
    .isString()
    .withMessage('WhatsApp deve ser uma string'),
  body('email')
    .optional({ checkFalsy: true })
    .custom((value) => {
      if (!value || value === '') return true; // Aceita vazio
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value);
    })
    .withMessage('Email inválido'),
  body('bairro').trim().notEmpty().withMessage('Bairro é obrigatório'),
  body('cidade')
    .optional({ checkFalsy: true })
    .trim()
    .isString()
    .withMessage('Cidade deve ser uma string'),
  body('comoConheceu')
    .optional({ checkFalsy: true })
    .isIn(['familia-amigo', 'google', 'redesocial', 'passei-frente', 'outros'])
    .withMessage('Valor inválido para comoConheceu'),
  body('pedidoOracao')
    .optional({ checkFalsy: true })
    .trim()
    .isString()
    .withMessage('Pedido de oração deve ser uma string'),
];

// Validações para listagem
const listarValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Página deve ser um número inteiro positivo'),
  query('pageSize').optional().isInt({ min: 1, max: 100 }).withMessage('Tamanho da página deve ser entre 1 e 100'),
];

// Todas as rotas de visitantes requerem autenticação
router.use(authMiddleware);

// Rotas
router.post('/', cadastrarValidation, handleValidationErrors, visitantesController.cadastrarVisitante);
router.get('/', listarValidation, handleValidationErrors, visitantesController.listarVisitantes);
router.get('/estatisticas', visitantesController.obterEstatisticas);
router.get('/:id', visitantesController.obterVisitantePorId);

module.exports = router;
