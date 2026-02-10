const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const integracaoController = require('../controllers/integracaoController');
const authMiddleware = require('../middleware/authMiddleware');
const handleValidationErrors = require('../middleware/validationMiddleware');

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// Validações para integrar visitante
const integrarVisitanteValidation = [
  body('pessoaId').isInt({ min: 1 }).withMessage('pessoaId deve ser um número inteiro positivo'),
  body('novoEstagio')
    .isIn(['Visitante', 'Visitante Frequente', 'Novo Convertido', 'Em Batismo', 'Batizado', 'Em Membresia', 'Membro', 'Participante', 'Líder', 'Obreiro', 'Inativo'])
    .withMessage('Estágio inválido'),
  body('nome').trim().notEmpty().withMessage('Nome é obrigatório'),
  body('sobrenome').trim().notEmpty().withMessage('Sobrenome é obrigatório'),
  body('observacoes').optional({ checkFalsy: true }).isString().withMessage('Observações deve ser uma string'),
  // Campos opcionais para atualização da pessoa
  body('email')
    .optional({ checkFalsy: true })
    .custom((value) => {
      if (!value || value === '') return true; // Aceita vazio
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value);
    })
    .withMessage('Email inválido'),
  body('telefone').optional({ checkFalsy: true }).trim().isString().withMessage('Telefone deve ser uma string'),
  body('dataNascimento')
    .optional({ checkFalsy: true })
    .custom((value) => {
      if (!value || value === '') return true; // Aceita vazio
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(value)) return false;
      const date = new Date(value);
      return date instanceof Date && !isNaN(date);
    })
    .withMessage('Data de nascimento inválida'),
  body('sexo')
    .optional({ checkFalsy: true })
    .isIn(['masculino', 'feminino', 'outro', 'nao-informar'])
    .withMessage('Sexo inválido'),
  body('estadoCivil')
    .optional({ checkFalsy: true })
    .isIn(['solteiro', 'casado', 'divorciado', 'viuvo', 'uniao-estavel'])
    .withMessage('Estado civil inválido'),
  body('cep').optional({ checkFalsy: true }).trim().isString().withMessage('CEP deve ser uma string'),
  body('rua').optional({ checkFalsy: true }).trim().isString().withMessage('Rua deve ser uma string'),
  body('numero').optional({ checkFalsy: true }).trim().isString().withMessage('Número deve ser uma string'),
  body('complemento').optional({ checkFalsy: true }).trim().isString().withMessage('Complemento deve ser uma string'),
  body('bairro').optional({ checkFalsy: true }).trim().isString().withMessage('Bairro deve ser uma string'),
  body('cidade').optional({ checkFalsy: true }).trim().isString().withMessage('Cidade deve ser uma string'),
  body('estado')
    .optional({ checkFalsy: true })
    .isIn(['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'])
    .withMessage('Estado inválido'),
  body('fotoPerfil').optional({ checkFalsy: true }).isString().withMessage('Foto de perfil deve ser uma string (base64)'),
  body('podeIncluirGrupoWhatsapp').optional({ checkFalsy: true }).isBoolean().withMessage('podeIncluirGrupoWhatsapp deve ser true ou false')
];

// Validações para registrar conversão
const registrarConversaoValidation = [
  body('pessoaId').isInt({ min: 1 }).withMessage('pessoaId deve ser um número inteiro positivo'),
  body('dataConversao').isISO8601().withMessage('dataConversao deve ser uma data válida (ISO 8601)'),
  body('localConversao').trim().notEmpty().withMessage('localConversao é obrigatório'),
  body('testemunho').optional().isString().withMessage('testemunho deve ser uma string')
];

// Validações para matricular em membresia
const matricularMembresiaValidation = [
  body('pessoaId').isInt({ min: 1 }).withMessage('pessoaId deve ser um número inteiro positivo'),
  body('dataMatricula').isISO8601().withMessage('dataMatricula deve ser uma data válida (ISO 8601)')
];

// Validações para listar matrículas
const listarMatriculasValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Página deve ser um número inteiro positivo'),
  query('pageSize').optional().isInt({ min: 1, max: 100 }).withMessage('Tamanho da página deve ser entre 1 e 100'),
  query('concluido').optional().isIn(['true', 'false']).withMessage('concluido deve ser true ou false')
];

// Validações para atualizar status de aula
const atualizarStatusAulaValidation = [
  param('matriculaId').isInt({ min: 1 }).withMessage('matriculaId deve ser um número inteiro positivo'),
  param('aulaNumero').isInt({ min: 1, max: 5 }).withMessage('aulaNumero deve ser entre 1 e 5'),
  body('concluida').isBoolean().withMessage('concluida deve ser um booleano'),
  body('observacoes').optional().isString().withMessage('observacoes deve ser uma string')
];

// Validações para adicionar pessoa a ministério
const adicionarPessoaMinisterioValidation = [
  body('pessoaId').isInt({ min: 1 }).withMessage('pessoaId deve ser um número inteiro positivo'),
  body('ministerioId').isInt({ min: 1 }).withMessage('ministerioId deve ser um número inteiro positivo'),
  body('dataInicio').isISO8601().withMessage('dataInicio deve ser uma data válida (ISO 8601)'),
  body('eLider').optional().isBoolean().withMessage('eLider deve ser um booleano'),
  body('observacoes').optional().isString().withMessage('observacoes deve ser uma string')
];

// Rotas
router.post('/integrar-visitante', integrarVisitanteValidation, handleValidationErrors, integracaoController.integrarVisitante);
router.post('/conversoes', registrarConversaoValidation, handleValidationErrors, integracaoController.registrarConversao);
router.post('/membresia/matricular', matricularMembresiaValidation, handleValidationErrors, integracaoController.matricularMembresia);
router.get('/membresia/matriculas', listarMatriculasValidation, handleValidationErrors, integracaoController.listarMatriculasMembresia);
router.get('/membresia/matriculas/:id', integracaoController.obterMatriculaPorId);
router.put('/membresia/matriculas/:matriculaId/aulas/:aulaNumero', atualizarStatusAulaValidation, handleValidationErrors, integracaoController.atualizarStatusAula);
router.post('/ministerios/adicionar', adicionarPessoaMinisterioValidation, handleValidationErrors, integracaoController.adicionarPessoaMinisterio);
router.get('/ministerios/pessoas', integracaoController.listarPessoasMinisterios);

// Validações para listar novos convertidos
const listarNovosConvertidosValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Página deve ser um número inteiro positivo'),
  query('pageSize').optional().isInt({ min: 1, max: 500 }).withMessage('Tamanho da página deve ser entre 1 e 500'),
  query('search').optional().trim().isString().withMessage('Busca deve ser uma string'),
  query('dataVisita')
    .optional()
    .custom((value) => {
      if (!value || value === '') return true; // Aceita vazio
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      return dateRegex.test(value);
    })
    .withMessage('Data da visita deve estar no formato YYYY-MM-DD')
];

router.get('/novos-convertidos', listarNovosConvertidosValidation, handleValidationErrors, integracaoController.listarNovosConvertidos);

const atualizarAcompanhanteValidation = [
  param('pessoaId').isInt({ min: 1 }).withMessage('pessoaId inválido'),
  body('acompanhanteId')
    .optional({ values: 'null', checkFalsy: true })
    .custom((val) => val === null || val === '' || val === undefined || (Number.isInteger(Number(val)) && Number(val) >= 1))
    .withMessage('acompanhanteId deve ser um número inteiro positivo ou vazio para remover')
];
router.put('/conversoes/:pessoaId/acompanhante', atualizarAcompanhanteValidation, handleValidationErrors, integracaoController.atualizarAcompanhanteConversao);

// Validações para analytics
const analyticsValidation = [
  query('dataInicio')
    .optional()
    .custom((value) => {
      if (!value || value === '') return true;
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      return dateRegex.test(value);
    })
    .withMessage('Data de início deve estar no formato YYYY-MM-DD'),
  query('dataFim')
    .optional()
    .custom((value) => {
      if (!value || value === '') return true;
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      return dateRegex.test(value);
    })
    .withMessage('Data de fim deve estar no formato YYYY-MM-DD')
];

router.get('/analytics', analyticsValidation, handleValidationErrors, integracaoController.obterEstatisticasAnalytics);

// ==================== BATISMO ====================
// Busca pessoas com ficha cadastral (somente quem tem ficha pode fazer curso de batismo)
const buscarBatismoValidation = [
  query('search').optional().trim().isString(),
  query('page').optional().isInt({ min: 1 }),
  query('pageSize').optional().isInt({ min: 1, max: 50 })
];
router.get('/batismo/buscar', buscarBatismoValidation, handleValidationErrors, integracaoController.buscarPessoasComFicha);

// Matricular no curso de batismo
const matricularBatismoValidation = [
  body('pessoaId').isInt({ min: 1 }).withMessage('pessoaId deve ser um número inteiro positivo'),
  body('dataMatricula').isISO8601().withMessage('dataMatricula deve ser uma data válida (ISO 8601)'),
  body('observacoes').optional().trim().isString()
];
router.post('/batismo/matricular', matricularBatismoValidation, handleValidationErrors, integracaoController.matricularBatismo);

// Listar matrículas de batismo
const listarBatismoValidation = [
  query('page').optional().isInt({ min: 1 }),
  query('pageSize').optional().isInt({ min: 1, max: 100 }),
  query('concluido').optional().isIn(['true', 'false']),
  query('search').optional().trim().isString()
];
router.get('/batismo/matriculas', listarBatismoValidation, handleValidationErrors, integracaoController.listarMatriculasBatismo);

// Atualizar status de aula de batismo
const atualizarAulaBatismoValidation = [
  param('matriculaId').isInt({ min: 1 }).withMessage('matriculaId deve ser um número inteiro positivo'),
  param('aulaNumero').isInt({ min: 1, max: 5 }).withMessage('aulaNumero deve ser entre 1 e 5'),
  body('concluida').isBoolean().withMessage('concluida deve ser um booleano'),
  body('observacoes').optional().trim().isString()
];
router.put('/batismo/matriculas/:matriculaId/aulas/:aulaNumero', atualizarAulaBatismoValidation, handleValidationErrors, integracaoController.atualizarStatusAulaBatismo);

module.exports = router;
