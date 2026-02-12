-- Script de inicialização do banco de dados (compatível com pgAdmin)
-- Este script executa todas as migrações em ordem sequencial
-- Execute este script no Query Tool do pgAdmin

-- ============================================
-- Migração 001: Criação da tabela de usuários
-- ============================================

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

CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_cpf ON usuarios(cpf);
CREATE INDEX IF NOT EXISTS idx_usuarios_ativo ON usuarios(ativo);
CREATE INDEX IF NOT EXISTS idx_usuarios_data_cadastro ON usuarios(data_cadastro);

COMMENT ON TABLE usuarios IS 'Tabela principal de usuários/membros da igreja';
COMMENT ON COLUMN usuarios.id IS 'Identificador único do usuário';
COMMENT ON COLUMN usuarios.nome IS 'Nome completo do usuário';
COMMENT ON COLUMN usuarios.email IS 'Email do usuário (único)';
COMMENT ON COLUMN usuarios.telefone IS 'Telefone de contato';
COMMENT ON COLUMN usuarios.data_nascimento IS 'Data de nascimento';
COMMENT ON COLUMN usuarios.cpf IS 'CPF do usuário (único)';
COMMENT ON COLUMN usuarios.ativo IS 'Indica se o usuário está ativo no sistema';

-- ============================================
-- Migração 002: Criação de tabelas de estágios
-- ============================================

CREATE TABLE IF NOT EXISTS estagios_usuario (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    descricao TEXT,
    ordem INTEGER NOT NULL DEFAULT 0,
    ativo BOOLEAN DEFAULT TRUE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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

CREATE INDEX IF NOT EXISTS idx_usuario_estagio_usuario_id ON usuario_estagio(usuario_id);
CREATE INDEX IF NOT EXISTS idx_usuario_estagio_estagio_id ON usuario_estagio(estagio_id);
CREATE INDEX IF NOT EXISTS idx_usuario_estagio_data_inicio ON usuario_estagio(data_inicio);
CREATE INDEX IF NOT EXISTS idx_usuario_estagio_data_fim ON usuario_estagio(data_fim) WHERE data_fim IS NULL;

COMMENT ON TABLE estagios_usuario IS 'Tipos de estágios que um usuário pode ter na igreja';
COMMENT ON TABLE usuario_estagio IS 'Histórico de estágios dos usuários ao longo do tempo';
COMMENT ON COLUMN usuario_estagio.data_fim IS 'NULL indica que o estágio está ativo';

-- ============================================
-- Migração 003: Criação de tabelas de ministérios e cargos
-- ============================================

CREATE TABLE IF NOT EXISTS ministerios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    descricao TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cargos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    descricao TEXT,
    hierarquia INTEGER NOT NULL DEFAULT 0,
    ativo BOOLEAN DEFAULT TRUE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ministerios_ativo ON ministerios(ativo);
CREATE INDEX IF NOT EXISTS idx_cargos_hierarquia ON cargos(hierarquia);
CREATE INDEX IF NOT EXISTS idx_cargos_ativo ON cargos(ativo);

COMMENT ON TABLE ministerios IS 'Ministérios da igreja (ex: Louvor, Jovens, Crianças, etc.)';
COMMENT ON TABLE cargos IS 'Cargos eclesiásticos (Pastor, Presbítero, Diácono, Evangelista)';
COMMENT ON COLUMN cargos.hierarquia IS 'Ordem hierárquica: valores menores indicam maior hierarquia';

-- ============================================
-- Migração 004: Criação de relacionamentos de usuário
-- ============================================

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

CREATE INDEX IF NOT EXISTS idx_usuario_ministerio_usuario_id ON usuario_ministerio(usuario_id);
CREATE INDEX IF NOT EXISTS idx_usuario_ministerio_ministerio_id ON usuario_ministerio(ministerio_id);
CREATE INDEX IF NOT EXISTS idx_usuario_ministerio_data_saida ON usuario_ministerio(data_saida) WHERE data_saida IS NULL;
CREATE INDEX IF NOT EXISTS idx_usuario_ministerio_lider ON usuario_ministerio(lider) WHERE lider = TRUE;

CREATE INDEX IF NOT EXISTS idx_usuario_cargo_usuario_id ON usuario_cargo(usuario_id);
CREATE INDEX IF NOT EXISTS idx_usuario_cargo_cargo_id ON usuario_cargo(cargo_id);
CREATE INDEX IF NOT EXISTS idx_usuario_cargo_ativo ON usuario_cargo(ativo) WHERE ativo = TRUE;
CREATE INDEX IF NOT EXISTS idx_usuario_cargo_data_fim ON usuario_cargo(data_fim) WHERE data_fim IS NULL;

COMMENT ON TABLE usuario_ministerio IS 'Relacionamento entre usuários e ministérios com histórico';
COMMENT ON TABLE usuario_cargo IS 'Relacionamento entre usuários e cargos eclesiásticos com histórico';
COMMENT ON COLUMN usuario_ministerio.data_saida IS 'NULL indica participação ativa';
COMMENT ON COLUMN usuario_ministerio.lider IS 'Indica se o usuário é líder do ministério';
COMMENT ON COLUMN usuario_cargo.data_fim IS 'NULL indica que o cargo está ativo';

-- ============================================
-- Migração 005: Criação de tabelas de finanças
-- ============================================

CREATE TABLE IF NOT EXISTS categorias_financeiras (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('ENTRADA', 'SAIDA')),
    descricao TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transacoes_financeiras (
    id SERIAL PRIMARY KEY,
    categoria_id INTEGER NOT NULL REFERENCES categorias_financeiras(id) ON DELETE RESTRICT,
    tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('ENTRADA', 'SAIDA')),
    valor DECIMAL(10, 2) NOT NULL CHECK (valor > 0),
    data DATE NOT NULL DEFAULT CURRENT_DATE,
    descricao TEXT,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    observacoes TEXT,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_categorias_financeiras_tipo ON categorias_financeiras(tipo);
CREATE INDEX IF NOT EXISTS idx_categorias_financeiras_ativo ON categorias_financeiras(ativo);

CREATE INDEX IF NOT EXISTS idx_transacoes_financeiras_categoria_id ON transacoes_financeiras(categoria_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_financeiras_tipo ON transacoes_financeiras(tipo);
CREATE INDEX IF NOT EXISTS idx_transacoes_financeiras_data ON transacoes_financeiras(data);
CREATE INDEX IF NOT EXISTS idx_transacoes_financeiras_usuario_id ON transacoes_financeiras(usuario_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_financeiras_data_tipo ON transacoes_financeiras(data, tipo);

CREATE OR REPLACE FUNCTION validar_dizimo_requer_usuario()
RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT nome FROM categorias_financeiras WHERE id = NEW.categoria_id) = 'Dízimo' 
       AND NEW.usuario_id IS NULL THEN
        RAISE EXCEPTION 'Transações de dízimo devem ter um usuário associado (não podem ser anônimas)';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_validar_dizimo_requer_usuario ON transacoes_financeiras;
CREATE TRIGGER trigger_validar_dizimo_requer_usuario
    BEFORE INSERT OR UPDATE ON transacoes_financeiras
    FOR EACH ROW
    EXECUTE FUNCTION validar_dizimo_requer_usuario();

COMMENT ON TABLE categorias_financeiras IS 'Categorias para classificar transações financeiras';
COMMENT ON TABLE transacoes_financeiras IS 'Registro de todas as transações financeiras (entradas e saídas)';
COMMENT ON COLUMN categorias_financeiras.tipo IS 'Tipo da categoria: ENTRADA ou SAIDA';
COMMENT ON COLUMN transacoes_financeiras.tipo IS 'Tipo da transação: ENTRADA ou SAIDA';
COMMENT ON COLUMN transacoes_financeiras.valor IS 'Valor da transação (sempre positivo)';
COMMENT ON COLUMN transacoes_financeiras.usuario_id IS 'Doador/usuário da transação (obrigatório para dízimos, opcional para ofertas e outras categorias)';
COMMENT ON FUNCTION validar_dizimo_requer_usuario() IS 'Valida que transações de dízimo sempre tenham um usuário associado (não podem ser anônimas)';

-- ============================================
-- Migração 006: Inserção de dados iniciais
-- ============================================

INSERT INTO estagios_usuario (nome, descricao, ordem) VALUES
('Visitante', 'Pessoa que visita a igreja mas ainda não se comprometeu', 1),
('Novo Convertido', 'Pessoa que acabou de se converter e está em discipulado', 2),
('Membro', 'Membro oficial da igreja', 3),
('Participante de Ministério', 'Membro que participa ativamente de um ou mais ministérios', 4),
('Líder', 'Membro que exerce liderança em ministério ou área', 5)
ON CONFLICT (nome) DO NOTHING;

INSERT INTO cargos (nome, descricao, hierarquia) VALUES
('Pastor', 'Pastor da igreja - liderança principal', 1),
('Evangelista', 'Evangelista - responsável por evangelização', 2),
('Presbítero', 'Presbítero - liderança eclesiástica', 3),
('Diácono', 'Diácono - serviço e auxílio na igreja', 4)
ON CONFLICT (nome) DO NOTHING;

INSERT INTO categorias_financeiras (nome, tipo, descricao) VALUES
('Oferta', 'ENTRADA', 'Ofertas dos membros e visitantes'),
('Dízimo', 'ENTRADA', 'Dízimos dos membros'),
('Cantina', 'ENTRADA', 'Receitas da cantina/lanchonete'),
('Eventos', 'ENTRADA', 'Receitas de eventos (jantares, bazar, etc.)'),
('Doações', 'ENTRADA', 'Doações diversas'),
('Outras Entradas', 'ENTRADA', 'Outras receitas não categorizadas')
ON CONFLICT (nome) DO NOTHING;

INSERT INTO categorias_financeiras (nome, tipo, descricao) VALUES
('Aluguel', 'SAIDA', 'Pagamento de aluguel do templo'),
('Salários', 'SAIDA', 'Pagamento de salários e encargos'),
('Manutenção', 'SAIDA', 'Manutenção e reparos'),
('Utilidades', 'SAIDA', 'Contas de água, luz, telefone, internet'),
('Material', 'SAIDA', 'Compra de materiais e suprimentos'),
('Eventos', 'SAIDA', 'Gastos com eventos'),
('Missões', 'SAIDA', 'Contribuições para missões'),
('Benevolência', 'SAIDA', 'Auxílios e ajuda a necessitados'),
('Outras Saídas', 'SAIDA', 'Outras despesas não categorizadas')
ON CONFLICT (nome) DO NOTHING;

-- ============================================
-- Migração 007: Adicionar campos de autenticação
-- ============================================

ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS senha_hash VARCHAR(255),
ADD COLUMN IF NOT EXISTS token_recuperacao VARCHAR(255),
ADD COLUMN IF NOT EXISTS token_recuperacao_expira TIMESTAMP,
ADD COLUMN IF NOT EXISTS email_verificado BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_usuarios_token_recuperacao ON usuarios(token_recuperacao);

COMMENT ON COLUMN usuarios.senha_hash IS 'Hash da senha do usuário (bcrypt)';
COMMENT ON COLUMN usuarios.token_recuperacao IS 'Token único para recuperação de senha';
COMMENT ON COLUMN usuarios.token_recuperacao_expira IS 'Data de expiração do token de recuperação';
COMMENT ON COLUMN usuarios.email_verificado IS 'Indica se o email foi verificado';

-- ============================================
-- Migrações concluídas com sucesso!
-- ============================================
