-- =====================================================
-- MIGRAÇÃO: Tab Acompanhamento da página Gestão de Pessoas
-- =====================================================
-- Insere a tab "Acompanhamento" na página /gestao-pessoas.
-- =====================================================

INSERT INTO paginas_tabs (pagina_id, nome, valor, icone, ordem, visivel_geral, visivel_visitantes, visivel_lider_ministerio, visivel_participa_ministerio, ativo)
SELECT id, 'Acompanhamento', 'acompanhamento', 'ClipboardList', 5, TRUE, FALSE, TRUE, TRUE, TRUE
FROM paginas_config WHERE rota = '/gestao-pessoas'
  AND NOT EXISTS (SELECT 1 FROM paginas_tabs pt WHERE pt.pagina_id = paginas_config.id AND pt.valor = 'acompanhamento');
