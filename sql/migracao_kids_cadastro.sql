-- =====================================================
-- MIGRAÇÃO: Tabela kids_cadastro (Cadastro Kids - página Kids)
-- =====================================================
-- Registros de cadastro de crianças na tab Cadastro Kids.
-- Idade é calculada no frontend/backend a partir de data_nascimento_crianca.
-- =====================================================

-- Garantir que a função update_updated_at_column exista
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS kids_cadastro (
  id SERIAL PRIMARY KEY,
  recepcionado_por INTEGER REFERENCES pessoas(id),
  data_visita TIMESTAMP NOT NULL,
  foto_crianca TEXT,
  nome_crianca VARCHAR(255) NOT NULL,
  data_nascimento_crianca DATE NOT NULL,
  foto_responsavel TEXT,
  nome_responsavel VARCHAR(255) NOT NULL,
  whatsapp_responsavel VARCHAR(20),
  bairro VARCHAR(255) NOT NULL,
  cidade VARCHAR(255) NOT NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_kids_cadastro_data_visita ON kids_cadastro(data_visita);
CREATE INDEX IF NOT EXISTS idx_kids_cadastro_recepcionado_por ON kids_cadastro(recepcionado_por);
CREATE INDEX IF NOT EXISTS idx_kids_cadastro_bairro ON kids_cadastro(bairro);
CREATE INDEX IF NOT EXISTS idx_kids_cadastro_cidade ON kids_cadastro(cidade);

DROP TRIGGER IF EXISTS update_kids_cadastro_updated_at ON kids_cadastro;
CREATE TRIGGER update_kids_cadastro_updated_at BEFORE UPDATE ON kids_cadastro
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE kids_cadastro IS 'Cadastro de crianças na página Kids (tab Cadastro Kids)';
