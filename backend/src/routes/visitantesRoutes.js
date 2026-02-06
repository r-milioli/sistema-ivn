const express = require('express');
const router = express.Router();
const { body, query } = require('express-validator');
const visitantesController = require('../controllers/visitantesController');
const authMiddleware = require('../middleware/authMiddleware');
const handleValidationErrors = require('../middleware/validationMiddleware');

// Validações para cadastro (schema jornada única - campos opcionais ajustados)
const cadastrarValidation = [
  body('nomeCompleto').trim().notEmpty().withMessage('Nome completo é obrigatório'),
  body('dataNascimento')
    .optional({ values: 'falsy' })
    .custom((value) => {
      if (!value || value === '') return true; // Aceita vazio
      // Validar formato de data (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(value)) return false;
      const date = new Date(value);
      return date instanceof Date && !isNaN(date);
    })
    .withMessage('Data de nascimento inválida'),
  body('whatsapp').trim().notEmpty().withMessage('WhatsApp é obrigatório'),
  body('email')
    .optional({ values: 'falsy' })
    .custom((value) => {
      if (!value || value === '') return true; // Aceita vazio
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value);
    })
    .withMessage('Email inválido'),
  body('bairro').trim().notEmpty().withMessage('Bairro é obrigatório'),
  body('cidade').trim().notEmpty().withMessage('Cidade é obrigatória'),
  body('comoConheceu').isIn(['familia-amigo', 'google', 'redesocial', 'passei-frente', 'outros'])
    .withMessage('Valor inválido para comoConheceu'),
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
