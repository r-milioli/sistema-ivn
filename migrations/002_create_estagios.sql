-- Migração 002: Criação de tabelas para estágios do usuário
-- Permite rastrear a jornada do membro na igreja (visitante -> novo convertido -> membro, etc.)

-- Tabela de tipos de estágios
CREATE TABLE IF NOT EXISTS estagios_usuario (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    descricao TEXT,
    ordem INTEGER NOT NULL DEFAULT 0,
    ativo BOOLEAN DEFAULT TRUE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de histórico de estágios do usuário
-- Permite rastrear quando um usuário mudou de estágio
CREATE TABLE IF NOT EXISTS usuario_estagio (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    estagio_id INTEGER NOT NULL REFERENCES estagios_usuario(id) ON DELETE RESTRICT,
    data_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
    data_fim DATE,
    observacoes TEXT,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_data_fim CHECK (data_fim IS NULL OR data_fim >= data_inicio)
);

-- Índices para melhorar performance
CREATE INDEX idx_usuario_estagio_usuario_id ON usuario_estagio(usuario_id);
CREATE INDEX idx_usuario_estagio_estagio_id ON usuario_estagio(estagio_id);
CREATE INDEX idx_usuario_estagio_data_inicio ON usuario_estagio(data_inicio);
CREATE INDEX idx_usuario_estagio_data_fim ON usuario_estagio(data_fim) WHERE data_fim IS NULL;

-- Comentários para documentação
COMMENT ON TABLE estagios_usuario IS 'Tipos de estágios que um usuário pode ter na igreja';
COMMENT ON TABLE usuario_estagio IS 'Histórico de estágios dos usuários ao longo do tempo';
COMMENT ON COLUMN usuario_estagio.data_fim IS 'NULL indica que o estágio está ativo';

