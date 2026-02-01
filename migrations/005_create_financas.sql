-- Migração 005: Criação de tabelas para gestão financeira

-- Tabela de categorias financeiras
CREATE TABLE IF NOT EXISTS categorias_financeiras (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('ENTRADA', 'SAIDA')),
    descricao TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de transações financeiras
CREATE TABLE IF NOT EXISTS transacoes_financeiras (
    id SERIAL PRIMARY KEY,
    categoria_id INTEGER NOT NULL REFERENCES categorias_financeiras(id) ON DELETE RESTRICT,
    tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('ENTRADA', 'SAIDA')),
    valor DECIMAL(10, 2) NOT NULL CHECK (valor > 0),
    data DATE NOT NULL DEFAULT CURRENT_DATE,
    descricao TEXT,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    -- usuario_id: doador/usuário da transação (obrigatório para dízimos, opcional para ofertas)
    observacoes TEXT,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para melhorar performance em consultas frequentes
CREATE INDEX idx_categorias_financeiras_tipo ON categorias_financeiras(tipo);
CREATE INDEX idx_categorias_financeiras_ativo ON categorias_financeiras(ativo);

CREATE INDEX idx_transacoes_financeiras_categoria_id ON transacoes_financeiras(categoria_id);
CREATE INDEX idx_transacoes_financeiras_tipo ON transacoes_financeiras(tipo);
CREATE INDEX idx_transacoes_financeiras_data ON transacoes_financeiras(data);
CREATE INDEX idx_transacoes_financeiras_usuario_id ON transacoes_financeiras(usuario_id);
CREATE INDEX idx_transacoes_financeiras_data_tipo ON transacoes_financeiras(data, tipo);

-- Função para validar que dízimos tenham usuário associado
CREATE OR REPLACE FUNCTION validar_dizimo_requer_usuario()
RETURNS TRIGGER AS $$
BEGIN
    -- Verifica se a categoria é "Dízimo" e se usuario_id é NULL
    IF (SELECT nome FROM categorias_financeiras WHERE id = NEW.categoria_id) = 'Dízimo' 
       AND NEW.usuario_id IS NULL THEN
        RAISE EXCEPTION 'Transações de dízimo devem ter um usuário associado (não podem ser anônimas)';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para validar dízimos antes de inserir ou atualizar
CREATE TRIGGER trigger_validar_dizimo_requer_usuario
    BEFORE INSERT OR UPDATE ON transacoes_financeiras
    FOR EACH ROW
    EXECUTE FUNCTION validar_dizimo_requer_usuario();

-- Comentários para documentação
COMMENT ON TABLE categorias_financeiras IS 'Categorias para classificar transações financeiras';
COMMENT ON TABLE transacoes_financeiras IS 'Registro de todas as transações financeiras (entradas e saídas)';
COMMENT ON COLUMN categorias_financeiras.tipo IS 'Tipo da categoria: ENTRADA ou SAIDA';
COMMENT ON COLUMN transacoes_financeiras.tipo IS 'Tipo da transação: ENTRADA ou SAIDA';
COMMENT ON COLUMN transacoes_financeiras.valor IS 'Valor da transação (sempre positivo)';
COMMENT ON COLUMN transacoes_financeiras.usuario_id IS 'Doador/usuário da transação (obrigatório para dízimos, opcional para ofertas e outras categorias)';
COMMENT ON FUNCTION validar_dizimo_requer_usuario() IS 'Valida que transações de dízimo sempre tenham um usuário associado (não podem ser anônimas)';

