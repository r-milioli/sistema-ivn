-- Migração 003: Criação de tabelas para ministérios e cargos eclesiásticos

-- Tabela de ministérios
CREATE TABLE IF NOT EXISTS ministerios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    descricao TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de cargos eclesiásticos
CREATE TABLE IF NOT EXISTS cargos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    descricao TEXT,
    hierarquia INTEGER NOT NULL DEFAULT 0,
    -- Hierarquia: valores menores = maior hierarquia (ex: 1 = Pastor, 2 = Presbítero, etc.)
    ativo BOOLEAN DEFAULT TRUE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_ministerios_ativo ON ministerios(ativo);
CREATE INDEX idx_cargos_hierarquia ON cargos(hierarquia);
CREATE INDEX idx_cargos_ativo ON cargos(ativo);

-- Comentários para documentação
COMMENT ON TABLE ministerios IS 'Ministérios da igreja (ex: Louvor, Jovens, Crianças, etc.)';
COMMENT ON TABLE cargos IS 'Cargos eclesiásticos (Pastor, Presbítero, Diácono, Evangelista)';
COMMENT ON COLUMN cargos.hierarquia IS 'Ordem hierárquica: valores menores indicam maior hierarquia';

