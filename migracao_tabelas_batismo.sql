-- =====================================================
-- MIGRAÇÃO: Criar tabelas de Batismo (matriculas_batismo e aulas_batismo)
-- =====================================================
-- Execute em um banco que já possui: pessoas, jornada_espiritual
-- Cria também a função update_updated_at_column() se não existir
-- =====================================================

-- Tabela de matrículas em batismo
CREATE TABLE IF NOT EXISTS matriculas_batismo (
  id SERIAL PRIMARY KEY,
  pessoa_id INTEGER NOT NULL REFERENCES pessoas(id) ON DELETE CASCADE,

  data_matricula DATE NOT NULL,
  data_conclusao DATE,

  concluido BOOLEAN DEFAULT FALSE,

  observacoes TEXT,

  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(pessoa_id, data_matricula)
);

-- Tabela de aulas de batismo (5 aulas por matrícula)
CREATE TABLE IF NOT EXISTS aulas_batismo (
  id SERIAL PRIMARY KEY,
  matricula_id INTEGER NOT NULL REFERENCES matriculas_batismo(id) ON DELETE CASCADE,

  aula_numero INTEGER NOT NULL CHECK (aula_numero >= 1 AND aula_numero <= 5),
  concluida BOOLEAN DEFAULT FALSE,
  data_conclusao DATE,

  observacoes TEXT,

  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(matricula_id, aula_numero)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_matriculas_batismo_pessoa_id ON matriculas_batismo(pessoa_id);
CREATE INDEX IF NOT EXISTS idx_matriculas_batismo_data_matricula ON matriculas_batismo(data_matricula);
CREATE INDEX IF NOT EXISTS idx_matriculas_batismo_concluido ON matriculas_batismo(concluido);

CREATE INDEX IF NOT EXISTS idx_aulas_batismo_matricula_id ON aulas_batismo(matricula_id);
CREATE INDEX IF NOT EXISTS idx_aulas_batismo_concluida ON aulas_batismo(concluida);
CREATE INDEX IF NOT EXISTS idx_aulas_batismo_aula_numero ON aulas_batismo(aula_numero);

-- Função genérica para atualizado_em (se ainda não existir)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizado_em
DROP TRIGGER IF EXISTS update_matriculas_batismo_updated_at ON matriculas_batismo;
CREATE TRIGGER update_matriculas_batismo_updated_at BEFORE UPDATE ON matriculas_batismo
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_aulas_batismo_updated_at ON aulas_batismo;
CREATE TRIGGER update_aulas_batismo_updated_at BEFORE UPDATE ON aulas_batismo
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função: quando a 5ª aula for concluída, marca a matrícula como concluída
CREATE OR REPLACE FUNCTION verificar_conclusao_batismo()
RETURNS TRIGGER AS $$
DECLARE
  aulas_concluidas INTEGER;
BEGIN
  SELECT COUNT(*) INTO aulas_concluidas
  FROM aulas_batismo
  WHERE matricula_id = NEW.matricula_id AND concluida = TRUE;

  IF aulas_concluidas = 5 THEN
    UPDATE matriculas_batismo
    SET concluido = TRUE,
        data_conclusao = CURRENT_DATE,
        atualizado_em = CURRENT_TIMESTAMP
    WHERE id = NEW.matricula_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_conclusao_batismo ON aulas_batismo;
CREATE TRIGGER trigger_conclusao_batismo
  AFTER UPDATE ON aulas_batismo
  FOR EACH ROW
  WHEN (NEW.concluida = TRUE AND OLD.concluida = FALSE)
  EXECUTE FUNCTION verificar_conclusao_batismo();

-- Função: ao matricular em batismo, atualiza estágio da pessoa para "Em Batismo"
CREATE OR REPLACE FUNCTION atualizar_estagio_ao_matricular_batismo()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE pessoas
  SET estagio_atual = 'Em Batismo',
      atualizado_em = CURRENT_TIMESTAMP
  WHERE id = NEW.pessoa_id
    AND estagio_atual = 'Novo Convertido';

  INSERT INTO jornada_espiritual (pessoa_id, estagio_anterior, estagio_novo, observacoes)
  SELECT
    NEW.pessoa_id,
    estagio_atual,
    'Em Batismo',
    'Matriculado no curso de batismo'
  FROM pessoas
  WHERE id = NEW.pessoa_id
    AND estagio_atual = 'Novo Convertido';

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_atualizar_estagio_batismo ON matriculas_batismo;
CREATE TRIGGER trigger_atualizar_estagio_batismo
  AFTER INSERT ON matriculas_batismo
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_estagio_ao_matricular_batismo();

-- Comentários
COMMENT ON TABLE matriculas_batismo IS 'Matrículas no curso de batismo';
COMMENT ON TABLE aulas_batismo IS 'Aulas do curso de batismo (5 aulas)';

-- Confirmação
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'matriculas_batismo')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'aulas_batismo') THEN
    RAISE NOTICE 'Migração concluída: tabelas matriculas_batismo e aulas_batismo criadas.';
  ELSE
    RAISE EXCEPTION 'Erro: tabelas de batismo não foram criadas.';
  END IF;
END $$;
