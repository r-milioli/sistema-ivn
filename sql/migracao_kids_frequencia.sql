-- =====================================================
-- MIGRAÇÃO: Tabela kids_frequencia (frequência por dia)
-- =====================================================
-- Se o kid já existe em kids_cadastro, não criar novo registro;
-- apenas registrar uma frequência naquele dia nesta tabela.
-- =====================================================

CREATE TABLE IF NOT EXISTS kids_frequencia (
  id SERIAL PRIMARY KEY,
  kid_id INTEGER NOT NULL REFERENCES kids_cadastro(id) ON DELETE CASCADE,
  data_visita TIMESTAMP NOT NULL,
  recepcionado_por INTEGER REFERENCES pessoas(id),
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_kids_frequencia_kid_id ON kids_frequencia(kid_id);
CREATE INDEX IF NOT EXISTS idx_kids_frequencia_data_visita ON kids_frequencia(data_visita);
CREATE INDEX IF NOT EXISTS idx_kids_frequencia_recepcionado_por ON kids_frequencia(recepcionado_por);

COMMENT ON TABLE kids_frequencia IS 'Frequência (presença por dia) de kids já cadastrados; evita duplicar registro em kids_cadastro';

-- Backfill: registros já existentes em kids_cadastro continuam sendo a "primeira visita".
-- Não é necessário inserir em kids_frequencia para o primeiro cadastro (a primeira visita
-- fica apenas em kids_cadastro.data_visita). Novas visitas do mesmo kid vão para kids_frequencia.
