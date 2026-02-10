-- =====================================================
-- MIGRAÇÃO: Inserir tab "Atribuição de acompanhante" na página Integração acompanhamento
-- =====================================================
-- Permite configurar visibilidade da tab em Config System > Páginas > Tabs
-- =====================================================

INSERT INTO paginas_tabs (pagina_id, nome, valor, icone, ordem, visivel_geral, visivel_visitantes, visivel_lider_ministerio, visivel_participa_ministerio, ativo)
SELECT
  id,
  'Atribuição de acompanhante',
  'atribuicao-acompanhante',
  'UserCheck',
  2,
  TRUE,
  FALSE,
  TRUE,
  TRUE,
  TRUE
FROM paginas_config
WHERE rota = '/integracao-acompanhamento'
  AND NOT EXISTS (
    SELECT 1 FROM paginas_tabs pt
    WHERE pt.pagina_id = paginas_config.id AND pt.valor = 'atribuicao-acompanhante'
  );

-- Tab "Início" (opcional - para manter ordem e configuração)
INSERT INTO paginas_tabs (pagina_id, nome, valor, icone, ordem, visivel_geral, visivel_visitantes, visivel_lider_ministerio, visivel_participa_ministerio, ativo)
SELECT
  id,
  'Início',
  'inicio',
  'Home',
  1,
  TRUE,
  TRUE,
  TRUE,
  TRUE,
  TRUE
FROM paginas_config
WHERE rota = '/integracao-acompanhamento'
  AND NOT EXISTS (
    SELECT 1 FROM paginas_tabs pt
    WHERE pt.pagina_id = paginas_config.id AND pt.valor = 'inicio'
  );
