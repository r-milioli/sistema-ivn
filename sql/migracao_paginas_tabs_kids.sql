-- =====================================================
-- MIGRAÇÃO: Tabs da página Kids
-- =====================================================
-- Insere as tabs da página /kids (Cadastro Kids, Listar Kids, Buscar Kids, Estatísticas).
-- =====================================================

INSERT INTO paginas_tabs (pagina_id, nome, valor, icone, ordem, visivel_geral, visivel_visitantes, visivel_lider_ministerio, visivel_participa_ministerio, ativo)
SELECT id, 'Cadastro Kids', 'cadastro-kids', 'UserPlus', 1, TRUE, FALSE, TRUE, TRUE, TRUE
FROM paginas_config WHERE rota = '/kids'
  AND NOT EXISTS (SELECT 1 FROM paginas_tabs pt WHERE pt.pagina_id = paginas_config.id AND pt.valor = 'cadastro-kids');

INSERT INTO paginas_tabs (pagina_id, nome, valor, icone, ordem, visivel_geral, visivel_visitantes, visivel_lider_ministerio, visivel_participa_ministerio, ativo)
SELECT id, 'Listar Kids', 'listar-kids', 'List', 2, TRUE, FALSE, TRUE, TRUE, TRUE
FROM paginas_config WHERE rota = '/kids'
  AND NOT EXISTS (SELECT 1 FROM paginas_tabs pt WHERE pt.pagina_id = paginas_config.id AND pt.valor = 'listar-kids');

INSERT INTO paginas_tabs (pagina_id, nome, valor, icone, ordem, visivel_geral, visivel_visitantes, visivel_lider_ministerio, visivel_participa_ministerio, ativo)
SELECT id, 'Buscar Kids', 'buscar-kids', 'Search', 3, TRUE, FALSE, TRUE, TRUE, TRUE
FROM paginas_config WHERE rota = '/kids'
  AND NOT EXISTS (SELECT 1 FROM paginas_tabs pt WHERE pt.pagina_id = paginas_config.id AND pt.valor = 'buscar-kids');

INSERT INTO paginas_tabs (pagina_id, nome, valor, icone, ordem, visivel_geral, visivel_visitantes, visivel_lider_ministerio, visivel_participa_ministerio, ativo)
SELECT id, 'Estatísticas', 'estatisticas', 'BarChart3', 4, TRUE, FALSE, TRUE, TRUE, TRUE
FROM paginas_config WHERE rota = '/kids'
  AND NOT EXISTS (SELECT 1 FROM paginas_tabs pt WHERE pt.pagina_id = paginas_config.id AND pt.valor = 'estatisticas');
