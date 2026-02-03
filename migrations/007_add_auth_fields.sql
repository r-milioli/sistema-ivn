-- Migração 007: Adicionar campos de autenticação na tabela usuarios
-- Campos necessários para sistema de login e recuperação de senha

ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS senha_hash VARCHAR(255),
ADD COLUMN IF NOT EXISTS token_recuperacao VARCHAR(255),
ADD COLUMN IF NOT EXISTS token_recuperacao_expira TIMESTAMP,
ADD COLUMN IF NOT EXISTS email_verificado BOOLEAN DEFAULT FALSE;

-- Índice para melhorar performance em consultas de recuperação
CREATE INDEX IF NOT EXISTS idx_usuarios_token_recuperacao ON usuarios(token_recuperacao);

-- Comentários para documentação
COMMENT ON COLUMN usuarios.senha_hash IS 'Hash da senha do usuário (bcrypt)';
COMMENT ON COLUMN usuarios.token_recuperacao IS 'Token único para recuperação de senha';
COMMENT ON COLUMN usuarios.token_recuperacao_expira IS 'Data de expiração do token de recuperação';
COMMENT ON COLUMN usuarios.email_verificado IS 'Indica se o email foi verificado';
