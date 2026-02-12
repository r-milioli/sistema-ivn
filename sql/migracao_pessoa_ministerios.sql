-- =====================================================
-- Migração: tabela pessoa_ministerios (participação em ministérios)
-- =====================================================
-- Garante que a tabela exista e, se você ainda usa o schema antigo
-- (pessoa_ministerios_lider / pessoa_ministerios_participante),
-- copia os dados para pessoa_ministerios.
-- =====================================================

-- 1) Criar a tabela pessoa_ministerios (jornada única)
CREATE TABLE IF NOT EXISTS pessoa_ministerios (
  id SERIAL PRIMARY KEY,
  pessoa_id INTEGER NOT NULL REFERENCES pessoas(id) ON DELETE CASCADE,
  ministerio_id INTEGER NOT NULL REFERENCES ministerios(id) ON DELETE CASCADE,
  e_lider BOOLEAN DEFAULT FALSE,
  data_inicio DATE NOT NULL,
  data_fim DATE,
  observacoes TEXT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(pessoa_id, ministerio_id, data_inicio)
);

-- 2) Índices para consultas da integração e atribuições
CREATE INDEX IF NOT EXISTS idx_pessoa_ministerios_pessoa_id ON pessoa_ministerios(pessoa_id);
CREATE INDEX IF NOT EXISTS idx_pessoa_ministerios_ministerio_id ON pessoa_ministerios(ministerio_id);
CREATE INDEX IF NOT EXISTS idx_pessoa_ministerios_e_lider ON pessoa_ministerios(e_lider);
CREATE INDEX IF NOT EXISTS idx_pessoa_ministerios_data_fim ON pessoa_ministerios(data_fim);

-- 3) Migrar do schema antigo (opcional: só roda se existirem pessoa_ministerios_lider / _participante)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'pessoa_ministerios_lider') THEN
    INSERT INTO pessoa_ministerios (pessoa_id, ministerio_id, e_lider, data_inicio)
    SELECT pl.pessoa_id, pl.ministerio_id, TRUE, COALESCE(pl.criado_em::date, CURRENT_DATE)
    FROM pessoa_ministerios_lider pl
    WHERE NOT EXISTS (
      SELECT 1 FROM pessoa_ministerios pm
      WHERE pm.pessoa_id = pl.pessoa_id AND pm.ministerio_id = pl.ministerio_id AND pm.data_fim IS NULL
    )
    ON CONFLICT (pessoa_id, ministerio_id, data_inicio) DO NOTHING;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'pessoa_ministerios_participante') THEN
    INSERT INTO pessoa_ministerios (pessoa_id, ministerio_id, e_lider, data_inicio)
    SELECT pp.pessoa_id, pp.ministerio_id, FALSE, COALESCE(pp.criado_em::date, CURRENT_DATE)
    FROM pessoa_ministerios_participante pp
    WHERE NOT EXISTS (
      SELECT 1 FROM pessoa_ministerios pm
      WHERE pm.pessoa_id = pp.pessoa_id AND pm.ministerio_id = pp.ministerio_id AND pm.data_fim IS NULL
    )
    ON CONFLICT (pessoa_id, ministerio_id, data_inicio) DO NOTHING;
  END IF;
END $$;

-- Comentário
COMMENT ON TABLE pessoa_ministerios IS 'Participação em ministérios: líder (e_lider=TRUE) ou participante (e_lider=FALSE). Preenchido pela Gestão de Pessoas > Atribuição.';
