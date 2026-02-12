-- =====================================================
-- MIGRAÇÃO: Aniversariantes vistos POR LINHA (por clique na linha)
-- =====================================================
-- Substitui a tabela antiga: agora registra qual aniversariante (linha)
-- o usuário marcou como visto, não mais "viu o painel todo".
-- Só após o clique na linha correspondente é que aquela linha se torna vista.
-- =====================================================

DROP TABLE IF EXISTS aniversariantes_vistos;

CREATE TABLE aniversariantes_vistos (
  id SERIAL PRIMARY KEY,
  pessoa_id_quem_viu INTEGER NOT NULL REFERENCES pessoas(id) ON DELETE CASCADE,
  pessoa_id_aniversariante INTEGER NOT NULL REFERENCES pessoas(id) ON DELETE CASCADE,
  data_referencia DATE NOT NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(pessoa_id_quem_viu, pessoa_id_aniversariante, data_referencia)
);

CREATE INDEX IF NOT EXISTS idx_aniversariantes_vistos_quem_data
  ON aniversariantes_vistos(pessoa_id_quem_viu, data_referencia);

COMMENT ON TABLE aniversariantes_vistos IS 'Registro de quais aniversariantes do dia o usuário marcou como visto (clique na linha)';
