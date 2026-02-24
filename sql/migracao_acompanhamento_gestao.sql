-- =====================================================
-- MIGRAÇÃO: Acompanhamento (Gestão de Pessoas)
-- =====================================================
-- Tabelas para atribuição de acompanhantes e visibilidade de leitura
-- do prontuário de acompanhamento de uma pessoa.
-- =====================================================

-- Tabela principal: um registro por pessoa acompanhada (prontuário único)
CREATE TABLE IF NOT EXISTS acompanhamento (
  id SERIAL PRIMARY KEY,
  pessoa_id INTEGER NOT NULL UNIQUE REFERENCES pessoas(id) ON DELETE CASCADE,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE acompanhamento IS 'Prontuário de acompanhamento por pessoa (Gestão de Pessoas > Acompanhamento). Uma pessoa só pode ter um acompanhamento.';

CREATE INDEX IF NOT EXISTS idx_acompanhamento_pessoa_id ON acompanhamento(pessoa_id);

-- Acompanhantes: pessoas que podem editar o relatório
CREATE TABLE IF NOT EXISTS acompanhamento_acompanhantes (
  acompanhamento_id INTEGER NOT NULL REFERENCES acompanhamento(id) ON DELETE CASCADE,
  pessoa_id INTEGER NOT NULL REFERENCES pessoas(id) ON DELETE CASCADE,
  PRIMARY KEY (acompanhamento_id, pessoa_id)
);

COMMENT ON TABLE acompanhamento_acompanhantes IS 'Pessoas responsáveis por editar o relatório de acompanhamento (podem ser várias).';

CREATE INDEX IF NOT EXISTS idx_acompanhamento_acompanhantes_acompanhamento ON acompanhamento_acompanhantes(acompanhamento_id);
CREATE INDEX IF NOT EXISTS idx_acompanhamento_acompanhantes_pessoa ON acompanhamento_acompanhantes(pessoa_id);

-- Visibilidade: pessoas que podem apenas ler o relatório
CREATE TABLE IF NOT EXISTS acompanhamento_visibilidade (
  acompanhamento_id INTEGER NOT NULL REFERENCES acompanhamento(id) ON DELETE CASCADE,
  pessoa_id INTEGER NOT NULL REFERENCES pessoas(id) ON DELETE CASCADE,
  PRIMARY KEY (acompanhamento_id, pessoa_id)
);

COMMENT ON TABLE acompanhamento_visibilidade IS 'Pessoas com permissão apenas de leitura do relatório de acompanhamento.';

CREATE INDEX IF NOT EXISTS idx_acompanhamento_visibilidade_acompanhamento ON acompanhamento_visibilidade(acompanhamento_id);
CREATE INDEX IF NOT EXISTS idx_acompanhamento_visibilidade_pessoa ON acompanhamento_visibilidade(pessoa_id);
