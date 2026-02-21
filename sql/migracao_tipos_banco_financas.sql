-- =====================================================
-- MIGRAÇÃO: Tabela tipos_banco e colunas tipo_banco_id em entradas/saídas
-- =====================================================
-- Cadastro de tipos de banco para uso opcional em entradas e saídas financeiras.
-- =====================================================

-- Garantir que a função update_updated_at_column exista (usada por outras tabelas)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Tabela tipos_banco
CREATE TABLE IF NOT EXISTS tipos_banco (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL UNIQUE,
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tipos_banco_nome ON tipos_banco(nome);
CREATE INDEX IF NOT EXISTS idx_tipos_banco_ativo ON tipos_banco(ativo);

DROP TRIGGER IF EXISTS update_tipos_banco_updated_at ON tipos_banco;
CREATE TRIGGER update_tipos_banco_updated_at BEFORE UPDATE ON tipos_banco
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE tipos_banco IS 'Tipos de banco para classificação opcional em entradas e saídas financeiras';

-- Coluna opcional em entradas_financeiras
ALTER TABLE entradas_financeiras
  ADD COLUMN IF NOT EXISTS tipo_banco_id INTEGER REFERENCES tipos_banco(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_entradas_financeiras_tipo_banco ON entradas_financeiras(tipo_banco_id);

-- Coluna opcional em saidas_financeiras
ALTER TABLE saidas_financeiras
  ADD COLUMN IF NOT EXISTS tipo_banco_id INTEGER REFERENCES tipos_banco(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_saidas_financeiras_tipo_banco ON saidas_financeiras(tipo_banco_id);
