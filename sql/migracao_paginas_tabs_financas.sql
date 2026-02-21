-- =====================================================
-- MIGRAÇÃO: Tabs da página Finanças
-- =====================================================
-- Insere as tabs da página /financas (Analytics, Nova Entrada, Nova Saída, Relatório, Config).
-- Permite configurar visibilidade em Config System > Páginas > Tabs.
-- =====================================================

-- Tab Analytics
INSERT INTO paginas_tabs (pagina_id, nome, valor, icone, ordem, visivel_geral, visivel_visitantes, visivel_lider_ministerio, visivel_participa_ministerio, ativo)
SELECT id, 'Analytics', 'analytics', 'BarChart3', 1, TRUE, FALSE, TRUE, TRUE, TRUE
FROM paginas_config WHERE rota = '/financas'
  AND NOT EXISTS (SELECT 1 FROM paginas_tabs pt WHERE pt.pagina_id = paginas_config.id AND pt.valor = 'analytics');

-- Tab Nova Entrada
INSERT INTO paginas_tabs (pagina_id, nome, valor, icone, ordem, visivel_geral, visivel_visitantes, visivel_lider_ministerio, visivel_participa_ministerio, ativo)
SELECT id, 'Nova Entrada', 'nova-entrada', 'PlusCircle', 2, TRUE, FALSE, TRUE, TRUE, TRUE
FROM paginas_config WHERE rota = '/financas'
  AND NOT EXISTS (SELECT 1 FROM paginas_tabs pt WHERE pt.pagina_id = paginas_config.id AND pt.valor = 'nova-entrada');

-- Tab Nova Saída
INSERT INTO paginas_tabs (pagina_id, nome, valor, icone, ordem, visivel_geral, visivel_visitantes, visivel_lider_ministerio, visivel_participa_ministerio, ativo)
SELECT id, 'Nova Saída', 'nova-saida', 'MinusCircle', 3, TRUE, FALSE, TRUE, TRUE, TRUE
FROM paginas_config WHERE rota = '/financas'
  AND NOT EXISTS (SELECT 1 FROM paginas_tabs pt WHERE pt.pagina_id = paginas_config.id AND pt.valor = 'nova-saida');

-- Tab Relatório Financeiro
INSERT INTO paginas_tabs (pagina_id, nome, valor, icone, ordem, visivel_geral, visivel_visitantes, visivel_lider_ministerio, visivel_participa_ministerio, ativo)
SELECT id, 'Relatório Financeiro', 'relatorio', 'FileText', 4, TRUE, FALSE, TRUE, TRUE, TRUE
FROM paginas_config WHERE rota = '/financas'
  AND NOT EXISTS (SELECT 1 FROM paginas_tabs pt WHERE pt.pagina_id = paginas_config.id AND pt.valor = 'relatorio');

-- Tab Config
INSERT INTO paginas_tabs (pagina_id, nome, valor, icone, ordem, visivel_geral, visivel_visitantes, visivel_lider_ministerio, visivel_participa_ministerio, ativo)
SELECT id, 'Config', 'config', 'Settings', 5, TRUE, FALSE, TRUE, TRUE, TRUE
FROM paginas_config WHERE rota = '/financas'
  AND NOT EXISTS (SELECT 1 FROM paginas_tabs pt WHERE pt.pagina_id = paginas_config.id AND pt.valor = 'config');
