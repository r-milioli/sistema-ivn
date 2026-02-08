const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const paginasConfigController = require('../controllers/paginasConfigController');

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// Listar todas as configurações de páginas
router.get('/', paginasConfigController.listarPaginasConfig);

// Obter páginas visíveis no dashboard
router.get('/visiveis', paginasConfigController.obterPaginasVisiveis);

// Verificar se uma página específica está visível pela rota
router.get('/verificar', paginasConfigController.verificarVisibilidadePagina);

// Atualizar configuração de uma página específica
router.put('/:id', paginasConfigController.atualizarPaginaConfig);

// Atualizar múltiplas páginas de uma vez
router.put('/', paginasConfigController.atualizarMultiplasPaginas);

module.exports = router;
