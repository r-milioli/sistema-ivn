-- =====================================================
-- SCRIPT DE VERIFICAÇÃO: paginas_tabs
-- =====================================================
-- Execute este script para verificar se a tabela existe
-- =====================================================

-- Verificar se a tabela paginas_config existe
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'paginas_config') 
    THEN '✓ Tabela paginas_config existe'
    ELSE '✗ Tabela paginas_config NÃO existe - Execute primeiro migracao_paginas_config.sql'
  END as status_paginas_config;

-- Verificar se a tabela paginas_tabs existe
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'paginas_tabs') 
    THEN '✓ Tabela paginas_tabs existe'
    ELSE '✗ Tabela paginas_tabs NÃO existe - Execute migracao_paginas_tabs.sql'
  END as status_paginas_tabs;

-- Se a tabela existir, mostrar estrutura
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'paginas_tabs'
ORDER BY ordinal_position;

-- Se a tabela existir, contar registros
SELECT 
  COUNT(*) as total_tabs
FROM paginas_tabs;
