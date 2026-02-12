-- =====================================================
-- MIGRAÇÃO: CRIAR TABELA paginas_tabs
-- =====================================================
-- Execute este script no seu banco de dados PostgreSQL
-- para criar a tabela de tabs das páginas e suas permissões
-- =====================================================

-- Verificar se a tabela paginas_config existe
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'paginas_config') THEN
    RAISE EXCEPTION 'A tabela paginas_config não existe. Execute primeiro o script migracao_paginas_config.sql';
  END IF;
END $$;

-- Criar tabela de tabs das páginas e permissões
CREATE TABLE IF NOT EXISTS paginas_tabs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pagina_id UUID NOT NULL REFERENCES paginas_config(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL, -- Nome da tab (ex: "Integra", "Novo Convertido")
  valor VARCHAR(255) NOT NULL, -- Valor da tab (ex: "integra", "novo-convertido")
  icone VARCHAR(100), -- Nome do ícone (opcional)
  ordem INTEGER DEFAULT 0, -- Ordem de exibição
  visivel_geral BOOLEAN DEFAULT TRUE, -- Visível para todos
  visivel_visitantes BOOLEAN DEFAULT FALSE, -- Visível para visitantes
  visivel_lider_ministerio BOOLEAN DEFAULT FALSE, -- Visível para líderes de ministério
  visivel_participa_ministerio BOOLEAN DEFAULT FALSE, -- Visível para participantes do ministério
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(pagina_id, valor) -- Uma tab com mesmo valor não pode existir duas vezes na mesma página
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_paginas_tabs_pagina_id ON paginas_tabs(pagina_id);
CREATE INDEX IF NOT EXISTS idx_paginas_tabs_ativo ON paginas_tabs(ativo);
CREATE INDEX IF NOT EXISTS idx_paginas_tabs_ordem ON paginas_tabs(ordem);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_paginas_tabs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_paginas_tabs_updated_at ON paginas_tabs;
CREATE TRIGGER update_paginas_tabs_updated_at
  BEFORE UPDATE ON paginas_tabs
  FOR EACH ROW
  EXECUTE FUNCTION update_paginas_tabs_updated_at();

-- Verificar se a tabela foi criada corretamente
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'paginas_tabs') THEN
    RAISE NOTICE '✓ Tabela paginas_tabs criada com sucesso!';
  ELSE
    RAISE EXCEPTION '✗ Erro ao criar tabela paginas_tabs';
  END IF;
END $$;

-- Mostrar estatísticas (se a tabela existir)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'paginas_tabs') THEN
    RAISE NOTICE 'Total de tabs: %', (SELECT COUNT(*) FROM paginas_tabs);
  END IF;
END $$;
