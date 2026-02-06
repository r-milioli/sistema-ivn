const express = require('express');
const router = express.Router();
const { body, query } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');
const handleValidationErrors = require('../middleware/validationMiddleware');
const {
  criarEvento,
  listarEventos,
  obterEventoPorId,
  atualizarEvento,
  deletarEvento,
  adicionarParticipante,
  removerParticipante,
  atualizarStatusParticipante
} = require('../controllers/eventosController');

// Validações para criar/atualizar evento
const validarEvento = [
  body('titulo').trim().notEmpty().withMessage('Título é obrigatório'),
  body('tipo').isIn(['Culto', 'Reunião', 'Ensino', 'Evento Especial', 'Treinamento', 'Outro']).withMessage('Tipo de evento inválido'),
  body('data').isISO8601().withMessage('Data inválida'),
  body('hora').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Hora inválida (formato: HH:MM)'),
  body('local').trim().notEmpty().withMessage('Local é obrigatório'),
  body('descricao').optional().trim()
];

// Validações para listagem
const validarListagem = [
  query('page').optional().isInt({ min: 1 }).withMessage('Página deve ser um número inteiro positivo'),
  query('pageSize').optional().isInt({ min: 1, max: 100 }).withMessage('Tamanho da página deve ser entre 1 e 100'),
  query('tipo').optional().isIn(['Culto', 'Reunião', 'Ensino', 'Evento Especial', 'Treinamento', 'Outro']).withMessage('Tipo inválido'),
  query('dataInicio').optional().isISO8601().withMessage('Data de início inválida'),
  query('dataFim').optional().isISO8601().withMessage('Data de fim inválida')
];

// Validação para adicionar participante
const validarParticipante = [
  body('pessoaId').isInt({ min: 1 }).withMessage('ID da pessoa é obrigatório e deve ser um número válido')
];

// Validação para atualizar status do participante
const validarStatusParticipante = [
  body('confirmado').optional().isBoolean().withMessage('Confirmado deve ser um booleano'),
  body('compareceu').optional().isBoolean().withMessage('Compareceu deve ser um booleano')
];

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// Rotas de Eventos
router.post('/', validarEvento, handleValidationErrors, criarEvento);
router.get('/', validarListagem, handleValidationErrors, listarEventos);
router.get('/:id', obterEventoPorId);
router.put('/:id', validarEvento, handleValidationErrors, atualizarEvento);
router.delete('/:id', deletarEvento);

// Rotas de Participantes
router.post('/:id/participantes', validarParticipante, handleValidationErrors, adicionarParticipante);
router.delete('/:id/participantes/:participanteId', removerParticipante);
router.put('/:id/participantes/:participanteId/status', validarStatusParticipante, handleValidationErrors, atualizarStatusParticipante);

module.exports = router;
