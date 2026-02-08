-- =====================================================
-- MIGRAÇÃO: REFATORAR VISIBILIDADE DE PÁGINAS
-- =====================================================
-- Adiciona níveis de visibilidade para páginas (similar às tabs)
-- Remove coluna "ativo" (não utilizada)
-- =====================================================

-- Adicionar colunas de visibilidade de página por nível
DO $$
BEGIN
  -- Página visível para todos (acesso geral)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'paginas_config' AND column_name = 'pagina_visivel_geral'
  ) THEN
    ALTER TABLE paginas_config ADD COLUMN pagina_visivel_geral BOOLEAN DEFAULT TRUE;
    RAISE NOTICE 'Coluna pagina_visivel_geral criada.';
  END IF;

  -- Página visível para visitantes
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'paginas_config' AND column_name = 'pagina_visivel_visitantes'
  ) THEN
    ALTER TABLE paginas_config ADD COLUMN pagina_visivel_visitantes BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'Coluna pagina_visivel_visitantes criada.';
  END IF;

  -- Página visível para líderes do ministério (da página)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'paginas_config' AND column_name = 'pagina_visivel_lider_ministerio'
  ) THEN
    ALTER TABLE paginas_config ADD COLUMN pagina_visivel_lider_ministerio BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'Coluna pagina_visivel_lider_ministerio criada.';
  END IF;

  -- Página visível para participantes do ministério (da página)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'paginas_config' AND column_name = 'pagina_visivel_participa_ministerio'
  ) THEN
    ALTER TABLE paginas_config ADD COLUMN pagina_visivel_participa_ministerio BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'Coluna pagina_visivel_participa_ministerio criada.';
  END IF;

  -- Página visível para User (tipo_acesso = 'Usuario')
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'paginas_config' AND column_name = 'pagina_visivel_user'
  ) THEN
    ALTER TABLE paginas_config ADD COLUMN pagina_visivel_user BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'Coluna pagina_visivel_user criada.';
  END IF;

  -- Página visível para Admin (tipo_acesso = 'Admin')
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'paginas_config' AND column_name = 'pagina_visivel_admin'
  ) THEN
    ALTER TABLE paginas_config ADD COLUMN pagina_visivel_admin BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'Coluna pagina_visivel_admin criada.';
  END IF;

  -- Página visível para SuperAdmin (tipo_acesso = 'SuperAdmin')
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'paginas_config' AND column_name = 'pagina_visivel_superadmin'
  ) THEN
    ALTER TABLE paginas_config ADD COLUMN pagina_visivel_superadmin BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'Coluna pagina_visivel_superadmin criada.';
  END IF;
END $$;

-- Migrar dados existentes: se pagina_visivel = true, marcar pagina_visivel_geral = true
UPDATE paginas_config
SET pagina_visivel_geral = TRUE
WHERE pagina_visivel = TRUE AND pagina_visivel_geral IS NULL;

-- Remover coluna antiga pagina_visivel (agora temos flags específicas)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'paginas_config' AND column_name = 'pagina_visivel'
  ) THEN
    ALTER TABLE paginas_config DROP COLUMN pagina_visivel;
    RAISE NOTICE 'Coluna pagina_visivel removida (substituída por flags específicas).';
  END IF;
END $$;

-- Remover coluna ativo (não utilizada/não funciona)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'paginas_config' AND column_name = 'ativo'
  ) THEN
    ALTER TABLE paginas_config DROP COLUMN ativo;
    RAISE NOTICE 'Coluna ativo removida (não utilizada).';
  END IF;
END $$;

-- Índices para as novas colunas de visibilidade
CREATE INDEX IF NOT EXISTS idx_paginas_config_visivel_geral ON paginas_config(pagina_visivel_geral);
CREATE INDEX IF NOT EXISTS idx_paginas_config_visivel_admin ON paginas_config(pagina_visivel_admin);
CREATE INDEX IF NOT EXISTS idx_paginas_config_visivel_superadmin ON paginas_config(pagina_visivel_superadmin);

-- Comentários
COMMENT ON COLUMN paginas_config.pagina_visivel_geral IS 'Página visível para todos (acesso geral)';
COMMENT ON COLUMN paginas_config.pagina_visivel_visitantes IS 'Página visível para visitantes';
COMMENT ON COLUMN paginas_config.pagina_visivel_lider_ministerio IS 'Página visível para líderes do ministério desta página';
COMMENT ON COLUMN paginas_config.pagina_visivel_participa_ministerio IS 'Página visível para participantes do ministério desta página';
COMMENT ON COLUMN paginas_config.pagina_visivel_user IS 'Página visível para usuários com tipo_acesso = Usuario';
COMMENT ON COLUMN paginas_config.pagina_visivel_admin IS 'Página visível para usuários com tipo_acesso = Admin';
COMMENT ON COLUMN paginas_config.pagina_visivel_superadmin IS 'Página visível para usuários com tipo_acesso = SuperAdmin';

-- Verificação
SELECT 
  COUNT(*) as total_paginas,
  COUNT(CASE WHEN pagina_visivel_geral = TRUE THEN 1 END) as visiveis_geral,
  COUNT(CASE WHEN card_visivel = TRUE THEN 1 END) as cards_visiveis
FROM paginas_config;
