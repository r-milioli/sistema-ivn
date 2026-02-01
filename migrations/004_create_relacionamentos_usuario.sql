-- Migração 004: Criação de tabelas de relacionamento entre usuários, ministérios e cargos

-- Tabela de participação em ministérios
CREATE TABLE IF NOT EXISTS usuario_ministerio (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    ministerio_id INTEGER NOT NULL REFERENCES ministerios(id) ON DELETE RESTRICT,
    data_entrada DATE NOT NULL DEFAULT CURRENT_DATE,
    data_saida DATE,
    lider BOOLEAN DEFAULT FALSE,
    observacoes TEXT,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_data_saida CHECK (data_saida IS NULL OR data_saida >= data_entrada)
);

-- Tabela de cargos ocupados pelos usuários
CREATE TABLE IF NOT EXISTS usuario_cargo (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    cargo_id INTEGER NOT NULL REFERENCES cargos(id) ON DELETE RESTRICT,
    data_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
    data_fim DATE,
    ativo BOOLEAN DEFAULT TRUE,
    observacoes TEXT,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_data_fim_cargo CHECK (data_fim IS NULL OR data_fim >= data_inicio)
);

-- Índices para melhorar performance
CREATE INDEX idx_usuario_ministerio_usuario_id ON usuario_ministerio(usuario_id);
CREATE INDEX idx_usuario_ministerio_ministerio_id ON usuario_ministerio(ministerio_id);
CREATE INDEX idx_usuario_ministerio_data_saida ON usuario_ministerio(data_saida) WHERE data_saida IS NULL;
CREATE INDEX idx_usuario_ministerio_lider ON usuario_ministerio(lider) WHERE lider = TRUE;

CREATE INDEX idx_usuario_cargo_usuario_id ON usuario_cargo(usuario_id);
CREATE INDEX idx_usuario_cargo_cargo_id ON usuario_cargo(cargo_id);
CREATE INDEX idx_usuario_cargo_ativo ON usuario_cargo(ativo) WHERE ativo = TRUE;
CREATE INDEX idx_usuario_cargo_data_fim ON usuario_cargo(data_fim) WHERE data_fim IS NULL;

-- Comentários para documentação
COMMENT ON TABLE usuario_ministerio IS 'Relacionamento entre usuários e ministérios com histórico';
COMMENT ON TABLE usuario_cargo IS 'Relacionamento entre usuários e cargos eclesiásticos com histórico';
COMMENT ON COLUMN usuario_ministerio.data_saida IS 'NULL indica participação ativa';
COMMENT ON COLUMN usuario_ministerio.lider IS 'Indica se o usuário é líder do ministério';
COMMENT ON COLUMN usuario_cargo.data_fim IS 'NULL indica que o cargo está ativo';

