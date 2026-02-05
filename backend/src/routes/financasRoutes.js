const express = require('express');
const router = express.Router();
const { body, query } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');
const { criarEntrada, listarEntradas, obterEntradaPorId, atualizarEntrada, deletarEntrada } = require('../controllers/entradasFinanceirasController');
const { criarSaida, listarSaidas, obterSaidaPorId, atualizarSaida, deletarSaida, uploadMiddleware } = require('../controllers/saidasFinanceirasController');
const { obterMetricas, obterRelatorioFinanceiro } = require('../controllers/financasController');

// Middleware de validação
const validarEntrada = [
  body('categoria').isIn(['Dízimos', 'Ofertas', 'Cantina', 'Outros']).withMessage('Categoria inválida'),
  body('autores').optional().isArray().withMessage('Autores deve ser um array'),
  body('valor').isFloat({ min: 0.01 }).withMessage('Valor deve ser um número positivo'),
  body('dataEntrada').isISO8601().withMessage('Data inválida'),
  body('turno').isIn(['Dia', 'Tarde', 'Noite']).withMessage('Turno inválido'),
  body('tipoPagamento').isIn(['Dinheiro', 'Pix', 'Cartão', 'Outros']).withMessage('Tipo de pagamento inválido'),
  // Validação customizada: autor obrigatório apenas para Dízimos
  body('autores').custom((value, { req }) => {
    if (req.body.categoria === 'Dízimos') {
      if (!Array.isArray(value) || value.length === 0) {
        throw new Error('É necessário informar pelo menos um autor para a categoria Dízimos');
      }
    }
    return true;
  })
];

const validarSaida = [
  body('valor').isFloat({ min: 0.01 }).withMessage('Valor deve ser um número positivo'),
  body('dataSaida').isISO8601().withMessage('Data inválida'),
  body('motivo').trim().notEmpty().withMessage('Motivo é obrigatório'),
  body('ministerio').isInt().withMessage('Ministério inválido')
];

// Rotas de Entradas Financeiras
router.post('/entradas', authMiddleware, validarEntrada, criarEntrada);
router.get('/entradas', authMiddleware, listarEntradas);
router.get('/entradas/:id', authMiddleware, obterEntradaPorId);
router.put('/entradas/:id', authMiddleware, validarEntrada, atualizarEntrada);
router.delete('/entradas/:id', authMiddleware, deletarEntrada);

// Rotas de Saídas Financeiras
router.post('/saidas', authMiddleware, uploadMiddleware, validarSaida, criarSaida);
router.get('/saidas', authMiddleware, listarSaidas);
router.get('/saidas/:id', authMiddleware, obterSaidaPorId);
router.put('/saidas/:id', authMiddleware, uploadMiddleware, validarSaida, atualizarSaida);
router.delete('/saidas/:id', authMiddleware, deletarSaida);

// Rotas de Analytics e Relatórios
router.get('/metricas', authMiddleware, obterMetricas);
router.get('/relatorio', authMiddleware, obterRelatorioFinanceiro);

module.exports = router;
