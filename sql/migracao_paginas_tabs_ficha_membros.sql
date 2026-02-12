-- =====================================================
-- MIGRAÇÃO: Tabs da página Ficha de Membros
-- =====================================================
-- Insere a tab "Ficha de Membro" para a página /ficha-membros.
-- Permite configurar visibilidade em Config System > Páginas > Tabs.
-- =====================================================

INSERT INTO paginas_tabs (pagina_id, nome, valor, icone, ordem, visivel_geral, visivel_visitantes, visivel_lider_ministerio, visivel_participa_ministerio, ativo)
SELECT
  id,
  'Ficha de Membro',
  'ficha-membro',
  'ClipboardList',
  1,
  TRUE,
  FALSE,
  TRUE,
  TRUE,
  TRUE
FROM paginas_config
WHERE rota = '/ficha-membros'
  AND NOT EXISTS (
    SELECT 1 FROM paginas_tabs pt
    WHERE pt.pagina_id = paginas_config.id AND pt.valor = 'ficha-membro'
  );
