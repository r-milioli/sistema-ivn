const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');
const handleValidationErrors = require('../middleware/validationMiddleware');
const { criar, listar, obterPorId, atualizar, arquivar, deletar } = require('../controllers/acompanhamentoController');

const validarCriar = [
  body('pessoaId').notEmpty().withMessage('pessoaId é obrigatório'),
  body('acompanhantesIds').optional().isArray(),
  body('visibilidadeIds').optional().isArray()
];

const validarAtualizar = [
  body('acompanhantesIds').optional().isArray(),
  body('visibilidadeIds').optional().isArray()
];

router.post('/', authMiddleware, validarCriar, handleValidationErrors, criar);
router.get('/', authMiddleware, listar);
router.get('/:id', authMiddleware, obterPorId);
router.put('/:id', authMiddleware, validarAtualizar, handleValidationErrors, atualizar);
router.patch('/:id/arquivar', authMiddleware, arquivar);
router.delete('/:id', authMiddleware, deletar);

module.exports = router;
