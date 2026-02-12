-- =====================================================
-- Migração: tabela ficha_cadastral
-- =====================================================
-- Cria a tabela de ficha cadastral completa (relacionamento 1:1 com pessoas).
-- Necessária para a rota "minha ficha cadastral" e páginas que usam ficha.
-- =====================================================

-- Enum de estados (se não existir)
DO $$ BEGIN
  CREATE TYPE estado_brasil_enum AS ENUM (
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Função para atualizar updated_at (se não existir)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Tabela ficha_cadastral
CREATE TABLE IF NOT EXISTS ficha_cadastral (
  id SERIAL PRIMARY KEY,
  pessoa_id INTEGER NOT NULL UNIQUE REFERENCES pessoas(id) ON DELETE CASCADE,

  numero_registro VARCHAR(50),
  data_registro DATE,
  cpf VARCHAR(14),
  conhecido_por VARCHAR(255),

  telefone_comercial VARCHAR(20),
  telefone_2 VARCHAR(20),

  naturalidade VARCHAR(255),
  naturalidade_uf estado_brasil_enum,
  nacionalidade VARCHAR(100) DEFAULT 'Brasileira',
  rg_numero VARCHAR(20),
  rg_data_emissao DATE,
  rg_orgao_emissor VARCHAR(50),
  escolaridade VARCHAR(100),
  profissao VARCHAR(255),
  tipo_sanguineo VARCHAR(5),

  nome_pai VARCHAR(255),
  nome_mae VARCHAR(255),
  nome_conjuge VARCHAR(255),
  data_casamento DATE,
  quantidade_filhos INTEGER DEFAULT 0,
  quantidade_filhos_maiores INTEGER DEFAULT 0,
  quantidade_filhos_menores INTEGER DEFAULT 0,
  foi_casado_anteriormente BOOLEAN,

  data_batismo DATE,
  local_batismo VARCHAR(255),
  igreja_onde_foi_batizado VARCHAR(255),

  data_admissao_ministerial DATE,
  tipo_admissao_ministerial VARCHAR(100),
  igreja_ou_ministerio_anterior VARCHAR(255),

  data_consagracao DATE,
  consagracao_ministerial VARCHAR(255),
  local_consagracao VARCHAR(255),
  consagrado_por VARCHAR(255),

  funcao_ministerial VARCHAR(255),
  ministerio_integracao VARCHAR(255),

  observacoes TEXT,

  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT cpf_valido CHECK (cpf IS NULL OR LENGTH(REPLACE(REPLACE(cpf, '.', ''), '-', '')) = 11)
);

CREATE INDEX IF NOT EXISTS idx_ficha_cadastral_pessoa_id ON ficha_cadastral(pessoa_id);
CREATE INDEX IF NOT EXISTS idx_ficha_cadastral_cpf ON ficha_cadastral(cpf);
CREATE INDEX IF NOT EXISTS idx_ficha_cadastral_numero_registro ON ficha_cadastral(numero_registro);
CREATE INDEX IF NOT EXISTS idx_ficha_cadastral_data_registro ON ficha_cadastral(data_registro);

DROP TRIGGER IF EXISTS update_ficha_cadastral_updated_at ON ficha_cadastral;
CREATE TRIGGER update_ficha_cadastral_updated_at
  BEFORE UPDATE ON ficha_cadastral
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

COMMENT ON TABLE ficha_cadastral IS 'Ficha cadastral completa com informações detalhadas (opcional).';
