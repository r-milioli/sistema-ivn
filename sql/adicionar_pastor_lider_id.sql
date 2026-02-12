-- Script para adicionar coluna pastor_lider_id na tabela relatorios
-- Execute este script no seu banco de dados PostgreSQL

-- Adicionar coluna pastor_lider_id na tabela relatorios (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'relatorios' AND column_name = 'pastor_lider_id'
  ) THEN
    ALTER TABLE relatorios 
    ADD COLUMN pastor_lider_id INTEGER REFERENCES pessoas(id);
    
    RAISE NOTICE 'Coluna pastor_lider_id adicionada com sucesso na tabela relatorios';
  ELSE
    RAISE NOTICE 'Coluna pastor_lider_id já existe na tabela relatorios';
  END IF;
END $$;
