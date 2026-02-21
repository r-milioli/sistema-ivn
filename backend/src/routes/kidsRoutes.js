const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');
const handleValidationErrors = require('../middleware/validationMiddleware');
const { cadastrar, listar, obterEstatisticas, uploadMiddleware } = require('../controllers/kidsController');

const validarCadastro = [
  body('nomeCrianca').trim().notEmpty().withMessage('Nome completo da criança é obrigatório').isLength({ max: 255 }),
  body('dataNascimentoCrianca').trim().notEmpty().withMessage('Data de nascimento da criança é obrigatória'),
  body('nomeResponsavel').trim().notEmpty().withMessage('Nome do responsável é obrigatório').isLength({ max: 255 }),
  body('bairro').trim().notEmpty().withMessage('Bairro é obrigatório').isLength({ max: 255 }),
  body('cidade').trim().notEmpty().withMessage('Cidade é obrigatória').isLength({ max: 255 }),
  body('diaVisita').optional({ checkFalsy: true }),
  body('whatsappResponsavel').optional().trim().isLength({ max: 20 })
];

router.post('/cadastro', authMiddleware, uploadMiddleware, validarCadastro, handleValidationErrors, cadastrar);
router.get('/', authMiddleware, listar);
router.get('/estatisticas', authMiddleware, obterEstatisticas);

module.exports = router;
