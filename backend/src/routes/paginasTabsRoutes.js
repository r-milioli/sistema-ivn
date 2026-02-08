const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const paginasTabsController = require('../controllers/paginasTabsController');

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// Listar tabs de uma página
router.get('/pagina/:paginaId', paginasTabsController.listarTabsPagina);

// Criar ou atualizar uma tab
router.post('/', paginasTabsController.criarOuAtualizarTab);

// Atualizar permissões de uma tab
router.put('/:id/permissoes', paginasTabsController.atualizarPermissoesTab);

// Sincronizar tabs de uma página
router.post('/pagina/:paginaId/sincronizar', paginasTabsController.sincronizarTabsPagina);

// Obter tabs visíveis de uma página baseado no tipo de usuário
router.get('/pagina/:paginaId/visiveis', paginasTabsController.obterTabsVisiveis);

module.exports = router;
