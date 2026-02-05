const express = require('express');
const router = express.Router();
const { body, query } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');
const { criarPessoa, listarPessoas, buscarPessoas, obterPessoaPorId, atualizarPessoa, deletarPessoa } = require('../controllers/pessoasController');
const { criarOuAtualizarAtribuicao, obterAtribuicao, listarMinisterios } = require('../controllers/atribuicoesController');

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

const validarAtribuicao = [
  body('estagiosUsuario').isArray({ min: 1 }).withMessage('É necessário informar pelo menos um estágio'),
  body('tipoUsuario').isIn(['Sem Acesso', 'Usuario', 'Lider', 'Admin', 'SuperAdmin']).withMessage('Tipo de acesso inválido'),
  body('cargoEclesiastico').optional().isIn(['Pastor', 'Evangelista', 'Presbítero', 'Diácono']).withMessage('Cargo eclesiástico inválido'),
  body('ministeriosLider').optional().isArray(),
  body('ministeriosParticipante').optional().isArray()
];

// Rotas de Pessoas
router.post('/pessoas', authMiddleware, validarPessoa, criarPessoa);
router.get('/pessoas', authMiddleware, listarPessoas);
router.get('/pessoas/buscar', authMiddleware, buscarPessoas);
router.get('/pessoas/:id', authMiddleware, obterPessoaPorId);
router.put('/pessoas/:id', authMiddleware, validarPessoa, atualizarPessoa);
router.delete('/pessoas/:id', authMiddleware, deletarPessoa);

// Rotas de Atribuições
router.post('/pessoas/:pessoaId/atribuicoes', authMiddleware, validarAtribuicao, criarOuAtualizarAtribuicao);
router.get('/pessoas/:pessoaId/atribuicoes', authMiddleware, obterAtribuicao);
router.get('/ministerios', authMiddleware, listarMinisterios);

module.exports = router;
