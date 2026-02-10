-- =====================================================
-- Migração: tabela comentarios_acompanhamento
-- =====================================================
-- Comentários do acompanhante sobre o novo convertido (persistentes, com data).
-- Usado na página Integração acompanhamento > Lista de novos convertidos.
-- =====================================================

CREATE TABLE IF NOT EXISTS comentarios_acompanhamento (
  id SERIAL PRIMARY KEY,
  pessoa_id INTEGER NOT NULL REFERENCES pessoas(id) ON DELETE CASCADE,
  autor_pessoa_id INTEGER NOT NULL REFERENCES pessoas(id) ON DELETE CASCADE,
  comentario TEXT NOT NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_comentarios_acompanhamento_pessoa_autor ON comentarios_acompanhamento(pessoa_id, autor_pessoa_id);

COMMENT ON TABLE comentarios_acompanhamento IS 'Comentários do acompanhante sobre o novo convertido; exibidos no modal da Lista de novos convertidos.';
