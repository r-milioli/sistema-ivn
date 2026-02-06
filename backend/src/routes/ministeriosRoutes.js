const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const ministeriosController = require('../controllers/ministeriosController');
const authMiddleware = require('../middleware/authMiddleware');
const handleValidationErrors = require('../middleware/validationMiddleware');

// Validações
const criarValidation = [
  body('nome').trim().notEmpty().withMessage('Nome do ministério é obrigatório'),
  body('descricao').optional().trim(),
];

const atualizarValidation = [
  body('nome').trim().notEmpty().withMessage('Nome do ministério é obrigatório'),
  body('descricao').optional().trim(),
  body('ativo').optional().isBoolean().withMessage('Ativo deve ser um valor booleano'),
];

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// Rotas
router.post('/', criarValidation, handleValidationErrors, ministeriosController.criarMinisterio);
router.get('/', ministeriosController.listarMinisterios);
router.get('/:id', ministeriosController.obterMinisterioPorId);
router.put('/:id', atualizarValidation, handleValidationErrors, ministeriosController.atualizarMinisterio);
router.delete('/:id', ministeriosController.deletarMinisterio);

module.exports = router;
