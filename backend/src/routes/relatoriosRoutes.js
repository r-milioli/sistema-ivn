const express = require('express');
const router = express.Router();
const { body, query } = require('express-validator');
const relatoriosController = require('../controllers/relatoriosController');
const authMiddleware = require('../middleware/authMiddleware');
const handleValidationErrors = require('../middleware/validationMiddleware');

// Validações para criação e atualização (nomeMinisterio é opcional)
const criarValidation = [
  body('nomeMinisterio').optional().trim(),
  body('mesReferencia').isIn(['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'])
    .withMessage('Mês de referência inválido (deve ser entre 01 e 12)'),
  body('conteudo').trim().notEmpty().withMessage('Conteúdo do relatório é obrigatório'),
];

const atualizarValidation = [
  body('nomeMinisterio').optional().trim(),
  body('mesReferencia').isIn(['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'])
    .withMessage('Mês de referência inválido (deve ser entre 01 e 12)'),
  body('conteudo').trim().notEmpty().withMessage('Conteúdo do relatório é obrigatório'),
];

// Validações para listagem
const listarValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Página deve ser um número inteiro positivo'),
  query('pageSize').optional().isInt({ min: 1, max: 100 }).withMessage('Tamanho da página deve ser entre 1 e 100'),
  query('mesReferencia').optional().isIn(['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'])
    .withMessage('Mês de referência inválido'),
  query('anoReferencia').optional().isInt({ min: 2000, max: 2100 }).withMessage('Ano de referência inválido'),
];

// Todas as rotas de relatórios requerem autenticação
router.use(authMiddleware);

// Rotas
router.post('/', criarValidation, handleValidationErrors, relatoriosController.criarRelatorio);
router.get('/', listarValidation, handleValidationErrors, relatoriosController.listarRelatorios);
router.get('/pastores-lideres', relatoriosController.buscarPastoresLideres);
router.get('/:id', relatoriosController.obterRelatorioPorId);
router.put('/:id', atualizarValidation, handleValidationErrors, relatoriosController.atualizarRelatorio);
router.get('/:id/download', relatoriosController.downloadRelatorio);

module.exports = router;
