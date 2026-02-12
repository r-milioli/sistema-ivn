-- =====================================================
-- MIGRAÇÃO: Tabela aniversariantes_vistos (notificação lida de forma persistente)
-- =====================================================
-- Registra quando o usuário (pessoa_id) visualizou a lista de aniversariantes
-- em uma determinada data (data_referencia). Usado para badge "não lidos".
-- A mensagem só se torna lida após o usuário abrir o painel (clique no ícone).
-- =====================================================

CREATE TABLE IF NOT EXISTS aniversariantes_vistos (
  id SERIAL PRIMARY KEY,
  pessoa_id INTEGER NOT NULL REFERENCES pessoas(id) ON DELETE CASCADE,
  data_referencia DATE NOT NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(pessoa_id, data_referencia)
);

CREATE INDEX IF NOT EXISTS idx_aniversariantes_vistos_pessoa_data
  ON aniversariantes_vistos(pessoa_id, data_referencia);

COMMENT ON TABLE aniversariantes_vistos IS 'Registro de quando o usuário visualizou a lista de aniversariantes do dia (para badge lido/não lido persistente)';
