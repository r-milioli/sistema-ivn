const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');
const handleValidationErrors = require('../middleware/validationMiddleware');
const {
  criarOuAtualizarFichaCadastral,
  obterMinhaFichaCadastral,
  obterFichaCadastral,
  listarFichasCadastrais,
} = require('../controllers/fichaCadastralController');

// Validação: nome e email opcionais (quando já existe ficha); backend usa dados da pessoa se não enviados
const validarFichaCadastral = [
  body('nome').optional({ values: 'falsy' }).trim(),
  body('email').optional({ values: 'falsy' }).trim().isEmail().withMessage('Email inválido'),
  
  // Campos opcionais da pessoa
  body('sobrenome').optional({ values: 'falsy' }).trim(),
  body('telefone').optional({ values: 'falsy' }).trim(),
  body('whatsapp').optional({ values: 'falsy' }).trim(),
  body('dataNascimento').optional({ values: 'falsy' }).isISO8601().withMessage('Data de nascimento inválida'),
  body('sexo').optional({ values: 'falsy' }).isIn(['masculino', 'feminino', 'outro', 'nao-informar']).withMessage('Sexo inválido'),
  body('estadoCivil').optional({ values: 'falsy' }).isIn(['solteiro', 'casado', 'divorciado', 'viuvo', 'uniao-estavel']).withMessage('Estado civil inválido'),
  body('cep').optional({ values: 'falsy' }).trim(),
  body('rua').optional({ values: 'falsy' }).trim(),
  body('numero').optional({ values: 'falsy' }).trim(),
  body('complemento').optional({ values: 'falsy' }).trim(),
  body('bairro').optional({ values: 'falsy' }).trim(),
  body('cidade').optional({ values: 'falsy' }).trim(),
  body('estado').optional({ values: 'falsy' }).isIn(['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO']).withMessage('Estado inválido'),
  
  // Campos opcionais da ficha cadastral
  body('numeroRegistro').optional({ values: 'falsy' }).trim(),
  body('dataRegistro').optional({ values: 'falsy' }).isISO8601().withMessage('Data de registro inválida'),
  body('cpf').optional({ values: 'falsy' }).trim(),
  body('conhecidoPor').optional({ values: 'falsy' }).trim(),
  body('telefoneComercial').optional({ values: 'falsy' }).trim(),
  body('telefone2').optional({ values: 'falsy' }).trim(),
  body('naturalidade').optional({ values: 'falsy' }).trim(),
  body('naturalidadeUf').optional({ values: 'falsy' }).isIn(['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO']).withMessage('Naturalidade UF inválida'),
  body('nacionalidade').optional({ values: 'falsy' }).trim(),
  body('rgNumero').optional({ values: 'falsy' }).trim(),
  body('rgDataEmissao').optional({ values: 'falsy' }).isISO8601().withMessage('RG data de emissão inválida'),
  body('rgOrgaoEmissor').optional({ values: 'falsy' }).trim(),
  body('escolaridade').optional({ values: 'falsy' }).trim(),
  body('profissao').optional({ values: 'falsy' }).trim(),
  body('tipoSanguineo').optional({ values: 'falsy' }).isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).withMessage('Tipo sanguíneo inválido'),
  body('nomePai').optional({ values: 'falsy' }).trim(),
  body('nomeMae').optional({ values: 'falsy' }).trim(),
  body('nomeConjuge').optional({ values: 'falsy' }).trim(),
  body('dataCasamento').optional({ values: 'falsy' }).isISO8601().withMessage('Data de casamento inválida'),
  body('quantidadeFilhos').optional({ values: 'falsy' }).isInt({ min: 0 }).withMessage('Quantidade de filhos deve ser um número inteiro positivo'),
  body('quantidadeFilhosMaiores').optional({ values: 'falsy' }).isInt({ min: 0 }).withMessage('Quantidade de filhos maiores deve ser um número inteiro positivo'),
  body('quantidadeFilhosMenores').optional({ values: 'falsy' }).isInt({ min: 0 }).withMessage('Quantidade de filhos menores deve ser um número inteiro positivo'),
  body('foiCasadoAnteriormente').optional({ values: 'falsy' }).isBoolean().withMessage('foiCasadoAnteriormente deve ser um booleano'),
  body('dataBatismo').optional({ values: 'falsy' }).isISO8601().withMessage('Data de batismo inválida'),
  body('localBatismo').optional({ values: 'falsy' }).trim(),
  body('igrejaOndeFoiBatizado').optional({ values: 'falsy' }).trim(),
  body('dataAdmissaoMinisterial').optional({ values: 'falsy' }).isISO8601().withMessage('Data de admissão ministerial inválida'),
  body('tipoAdmissaoMinisterial').optional({ values: 'falsy' }).trim(),
  body('igrejaOuMinisterioAnterior').optional({ values: 'falsy' }).trim(),
  body('dataConsagracao').optional({ values: 'falsy' }).isISO8601().withMessage('Data de consagração inválida'),
  body('consagracaoMinisterial').optional({ values: 'falsy' }).trim(),
  body('localConsagracao').optional({ values: 'falsy' }).trim(),
  body('consagradoPor').optional({ values: 'falsy' }).trim(),
  body('funcaoMinisterial').optional({ values: 'falsy' }).trim(),
  body('ministerioIntegracao').optional({ values: 'falsy' }).trim(),
  body('observacoes').optional({ values: 'falsy' }).trim(),
];

// Rotas
router.post(
  '/ficha-cadastral',
  authMiddleware,
  validarFichaCadastral,
  handleValidationErrors,
  criarOuAtualizarFichaCadastral
);

router.get(
  '/ficha-cadastral/me',
  authMiddleware,
  obterMinhaFichaCadastral
);

router.get(
  '/ficha-cadastral',
  authMiddleware,
  listarFichasCadastrais
);

router.get(
  '/ficha-cadastral/:pessoaId',
  authMiddleware,
  obterFichaCadastral
);

module.exports = router;
