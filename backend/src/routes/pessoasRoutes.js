const express = require('express');
const router = express.Router();
const { body, query } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');
const { criarPessoa, listarPessoas, buscarPessoas, obterPessoaPorId, atualizarPessoa, updateMe, deletarPessoa, aniversariantesDoDia } = require('../controllers/pessoasController');
const handleValidationErrors = require('../middleware/validationMiddleware');
const { criarOuAtualizarAtribuicao, obterAtribuicao, listarMinisterios, obterCargosEclesiasticosEndpoint, obterEstagiosEspirituaisEndpoint, obterTiposAcessoEndpoint } = require('../controllers/atribuicoesController');

// Middleware de validação: apenas nome e telefone obrigatórios
const validarPessoa = [
  body('nome').trim().notEmpty().withMessage('Nome é obrigatório'),
  body('telefone').trim().notEmpty().withMessage('Telefone é obrigatório'),
  body('sobrenome').optional().trim(),
  body('sexo').optional().isIn(['masculino', 'feminino', 'outro', 'nao-informar']).withMessage('Sexo inválido'),
  body('estadoCivil').optional().isIn(['solteiro', 'casado', 'divorciado', 'viuvo', 'uniao-estavel']).withMessage('Estado civil inválido'),
  body('dataNascimento').optional({ values: 'falsy' }).isISO8601().withMessage('Data de nascimento inválida'),
  body('email').optional({ values: 'falsy' }).isEmail().withMessage('Email inválido'),
  body('cep').optional().trim(),
  body('rua').optional().trim(),
  body('numero').optional().trim(),
  body('bairro').optional().trim(),
  body('cidade').optional().trim(),
  body('estado').optional().isIn(['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO']).withMessage('Estado inválido')
];

// Validação específica para atualização de perfil (apenas nome e email obrigatórios)
const validarPerfil = [
  body('nome').trim().notEmpty().withMessage('Nome é obrigatório'),
  body('email').trim().notEmpty().withMessage('Email é obrigatório').isEmail().withMessage('Email inválido'),
  body('sobrenome').optional({ values: 'falsy' }).trim(),
  body('telefone').optional({ values: 'falsy' }).trim(),
  body('sexo')
    .optional({ values: 'falsy' })
    .custom((value) => {
      if (!value || value === '') return true; // Aceita vazio
      return ['masculino', 'feminino', 'outro', 'nao-informar'].includes(value);
    })
    .withMessage('Sexo inválido'),
  body('estadoCivil')
    .optional({ values: 'falsy' })
    .custom((value) => {
      if (!value || value === '') return true; // Aceita vazio
      return ['solteiro', 'casado', 'divorciado', 'viuvo', 'uniao-estavel'].includes(value);
    })
    .withMessage('Estado civil inválido'),
  body('dataNascimento').optional({ values: 'falsy' }).isISO8601().withMessage('Data de nascimento inválida'),
  body('cep').optional({ values: 'falsy' }).trim(),
  body('rua').optional({ values: 'falsy' }).trim(),
  body('numero').optional({ values: 'falsy' }).trim(),
  body('bairro').optional({ values: 'falsy' }).trim(),
  body('cidade').optional({ values: 'falsy' }).trim(),
  body('estado')
    .optional({ values: 'falsy' })
    .custom((value) => {
      if (!value || value === '') return true; // Aceita vazio
      return ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'].includes(value);
    })
    .withMessage('Estado inválido'),
  body('fotoPerfil').optional({ values: 'falsy' })
];

const validarAtribuicao = [
  body('estagiosUsuario').isArray({ min: 1 }).withMessage('É necessário informar pelo menos um estágio'),
  body('tipoUsuario').isIn(['Sem Acesso', 'Usuario', 'Lider', 'Admin', 'SuperAdmin']).withMessage('Tipo de acesso inválido'),
  body('cargoEclesiastico').optional().trim(),
  body('ministeriosLider').optional().isArray(),
  body('ministeriosParticipante').optional().isArray()
];

// Rotas de Pessoas
// IMPORTANTE: Rotas específicas (como /me e /buscar) devem vir ANTES de rotas com parâmetros (/:id)
router.post('/pessoas', authMiddleware, validarPessoa, criarPessoa);
router.get('/pessoas', authMiddleware, listarPessoas);
router.get('/pessoas/buscar', authMiddleware, buscarPessoas);
// Rota em /api/aniversariantes-do-dia para não ser confundida com GET /pessoas/:id
router.get('/aniversariantes-do-dia', authMiddleware, aniversariantesDoDia);
// Rota para atualizar perfil do usuário logado (deve vir antes de /:id)
// Usa validação específica que só exige nome e email
router.put('/pessoas/me', authMiddleware, validarPerfil, handleValidationErrors, updateMe);
router.get('/pessoas/:id', authMiddleware, obterPessoaPorId);
router.put('/pessoas/:id', authMiddleware, validarPessoa, atualizarPessoa);
router.delete('/pessoas/:id', authMiddleware, deletarPessoa);

// Rotas de Atribuições
router.post('/pessoas/:pessoaId/atribuicoes', authMiddleware, validarAtribuicao, criarOuAtualizarAtribuicao);
router.get('/pessoas/:pessoaId/atribuicoes', authMiddleware, obterAtribuicao);
router.get('/ministerios', authMiddleware, listarMinisterios);
router.get('/cargos-eclesiasticos', authMiddleware, obterCargosEclesiasticosEndpoint);
router.get('/estagios-espirituais', authMiddleware, obterEstagiosEspirituaisEndpoint);
router.get('/tipos-acesso', authMiddleware, obterTiposAcessoEndpoint);

module.exports = router;
