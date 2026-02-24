-- =====================================================
-- MIGRAÇÃO: Coluna arquivado em acompanhamento
-- =====================================================
-- Permite arquivar acompanhamentos (soft delete) em vez de excluir.
-- =====================================================

ALTER TABLE acompanhamento
  ADD COLUMN IF NOT EXISTS arquivado BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_acompanhamento_arquivado ON acompanhamento(arquivado);

COMMENT ON COLUMN acompanhamento.arquivado IS 'Se TRUE, o acompanhamento foi arquivado e não aparece na listagem padrão.';
