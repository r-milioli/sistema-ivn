-- =====================================================
-- SCRIPT PARA CORRIGIR ENUM estagio_espiritual_enum
-- =====================================================
-- Este script adiciona os valores 'Em Batismo' e 'Batizado'
-- ao enum estagio_espiritual_enum se eles não existirem.
-- 
-- Execute este script no seu banco de dados PostgreSQL
-- para corrigir o erro: "valor de entrada é inválido para enum estagio_espiritual_enum: 'Batizado'"
-- =====================================================

-- Adicionar 'Em Batismo' se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_enum 
        WHERE enumlabel = 'Em Batismo' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'estagio_espiritual_enum')
    ) THEN
        ALTER TYPE estagio_espiritual_enum ADD VALUE 'Em Batismo';
        RAISE NOTICE 'Valor "Em Batismo" adicionado ao enum estagio_espiritual_enum';
    ELSE
        RAISE NOTICE 'Valor "Em Batismo" já existe no enum';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Erro ao adicionar "Em Batismo": %', SQLERRM;
END $$;

-- Adicionar 'Batizado' se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_enum 
        WHERE enumlabel = 'Batizado' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'estagio_espiritual_enum')
    ) THEN
        ALTER TYPE estagio_espiritual_enum ADD VALUE 'Batizado';
        RAISE NOTICE 'Valor "Batizado" adicionado ao enum estagio_espiritual_enum';
    ELSE
        RAISE NOTICE 'Valor "Batizado" já existe no enum';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Erro ao adicionar "Batizado": %', SQLERRM;
END $$;

-- Verificar todos os valores do enum (para confirmar)
SELECT 
    enumlabel as valor,
    enumsortorder as ordem
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'estagio_espiritual_enum')
ORDER BY enumsortorder;
