-- =====================================================
-- MIGRAÇÃO: Adicionar coluna pode_incluir_grupo_whatsapp em pessoas
-- =====================================================
-- Campo usado no formulário de integrar visitante (Integração > Integra)
-- =====================================================

ALTER TABLE pessoas
ADD COLUMN IF NOT EXISTS pode_incluir_grupo_whatsapp BOOLEAN DEFAULT NULL;

COMMENT ON COLUMN pessoas.pode_incluir_grupo_whatsapp IS 'Se a pessoa pode ser incluída no grupo de WhatsApp (preenchido na integração)';
