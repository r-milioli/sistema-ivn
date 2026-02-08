-- =====================================================
-- MIGRAÇÃO: VINCULAR PÁGINA AO MINISTÉRIO (paginas_config.ministerio_id)
-- =====================================================
-- Permite que "Líder do ministério" e "Participante do ministério"
-- sejam avaliados em relação ao ministério DESTA página, não à função geral.
-- =====================================================

-- Adicionar coluna ministerio_id (opcional: quando preenchido, líder/participante só veem se forem desse ministério)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'paginas_config' AND column_name = 'ministerio_id'
  ) THEN
    ALTER TABLE paginas_config
    ADD COLUMN ministerio_id INTEGER REFERENCES ministerios(id) ON DELETE SET NULL;
    RAISE NOTICE 'Coluna paginas_config.ministerio_id criada.';
  ELSE
    RAISE NOTICE 'Coluna paginas_config.ministerio_id já existe.';
  END IF;
END $$;

-- Índice para consultas por ministério
CREATE INDEX IF NOT EXISTS idx_paginas_config_ministerio_id ON paginas_config(ministerio_id);

-- Opcional: vincular página "Recepção" ao ministério "Recepção" (se existir)
UPDATE paginas_config pc
SET ministerio_id = (SELECT id FROM ministerios m WHERE m.nome = 'Recepção' LIMIT 1)
WHERE pc.rota = '/recepcao'
  AND pc.ministerio_id IS NULL
  AND EXISTS (SELECT 1 FROM ministerios WHERE nome = 'Recepção');

-- Comentário
COMMENT ON COLUMN paginas_config.ministerio_id IS 'Ministério associado à página; usado para filtrar tabs "Líder do ministério" e "Participante do ministério" pelo ministério desta página.';
