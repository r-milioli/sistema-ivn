-- =====================================================
-- MIGRAÇÃO: Adicionar página "Integração acompanhamento"
-- =====================================================
-- Execute em um banco que já usa paginas_config com colunas
-- pagina_visivel_geral, card_visivel, etc.
-- =====================================================

INSERT INTO paginas_config (rota, nome, icone, pagina_visivel_geral, card_visivel, ordem)
VALUES ('/integracao-acompanhamento', 'Integração acompanhamento', 'ListChecks', TRUE, TRUE, 41)
ON CONFLICT (rota) DO NOTHING;
