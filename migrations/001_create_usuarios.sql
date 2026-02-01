-- Migração 001: Criação da tabela de usuários
-- Tabela principal para armazenar dados básicos dos membros da igreja

CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    telefone VARCHAR(20),
    data_nascimento DATE,
    cpf VARCHAR(14) UNIQUE,
    endereco TEXT,
    cidade VARCHAR(100),
    estado VARCHAR(2),
    cep VARCHAR(10),
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ativo BOOLEAN DEFAULT TRUE,
    observacoes TEXT
);

-- Índices para melhorar performance em consultas frequentes
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_cpf ON usuarios(cpf);
CREATE INDEX idx_usuarios_ativo ON usuarios(ativo);
CREATE INDEX idx_usuarios_data_cadastro ON usuarios(data_cadastro);

-- Comentários para documentação
COMMENT ON TABLE usuarios IS 'Tabela principal de usuários/membros da igreja';
COMMENT ON COLUMN usuarios.id IS 'Identificador único do usuário';
COMMENT ON COLUMN usuarios.nome IS 'Nome completo do usuário';
COMMENT ON COLUMN usuarios.email IS 'Email do usuário (único)';
COMMENT ON COLUMN usuarios.telefone IS 'Telefone de contato';
COMMENT ON COLUMN usuarios.data_nascimento IS 'Data de nascimento';
COMMENT ON COLUMN usuarios.cpf IS 'CPF do usuário (único)';
COMMENT ON COLUMN usuarios.ativo IS 'Indica se o usuário está ativo no sistema';

