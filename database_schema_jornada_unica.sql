-- =====================================================
-- SISTEMA IVN - SCHEMA REFATORADO
-- VERSÃO COM JORNADA ÚNICA DO USUÁRIO
-- =====================================================
-- Cada pessoa tem um único registro que acompanha toda
-- sua jornada espiritual, desde visitante até líder
-- =====================================================

-- =====================================================
-- EXTENSÕES
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ENUMS
-- =====================================================

-- Enum para sexo
DO $$ BEGIN
  CREATE TYPE sexo_enum AS ENUM ('masculino', 'feminino', 'outro', 'nao-informar');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Enum para estado civil
DO $$ BEGIN
  CREATE TYPE estado_civil_enum AS ENUM ('solteiro', 'casado', 'divorciado', 'viuvo', 'uniao-estavel');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Enum para estados brasileiros
DO $$ BEGIN
  CREATE TYPE estado_brasil_enum AS ENUM (
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Enum para cargo eclesiástico
DO $$ BEGIN
  CREATE TYPE cargo_eclesiastico_enum AS ENUM ('Pastor', 'Evangelista', 'Presbítero', 'Diácono');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Enum para estágio espiritual (jornada do usuário)
DO $$ BEGIN
  CREATE TYPE estagio_espiritual_enum AS ENUM (
    'Visitante',           -- Primeira visita
    'Visitante Frequente', -- Voltou mais de uma vez
    'Novo Convertido',     -- Aceitou Jesus
    'Em Membresia',        -- Fazendo curso de membresia
    'Membro',              -- Concluiu membresia
    'Participante',        -- Participa de ministérios
    'Líder',               -- Lidera ministérios
    'Obreiro',             -- Tem cargo eclesiástico
    'Inativo'              -- Não frequenta mais
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Enum para tipo de acesso ao sistema
DO $$ BEGIN
  CREATE TYPE tipo_acesso_enum AS ENUM (
    'Sem Acesso',    -- Apenas cadastrado, não loga
    'Usuario',       -- Acesso básico
    'Lider',         -- Líder de ministério
    'Admin',         -- Administrador
    'SuperAdmin'     -- Super administrador
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Enum para categoria financeira
DO $$ BEGIN
  CREATE TYPE categoria_financeira_enum AS ENUM ('Dízimos', 'Ofertas', 'Cantina', 'Outros');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Enum para turno
DO $$ BEGIN
  CREATE TYPE turno_enum AS ENUM ('Dia', 'Tarde', 'Noite');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Enum para tipo de pagamento
DO $$ BEGIN
  CREATE TYPE tipo_pagamento_enum AS ENUM ('Dinheiro', 'Pix', 'Cartão', 'Outros');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Enum para como conheceu
DO $$ BEGIN
  CREATE TYPE como_conheceu_enum AS ENUM ('familia-amigo', 'google', 'redesocial', 'passei-frente', 'outros');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Enum para tipo de evento
DO $$ BEGIN
  CREATE TYPE tipo_evento_enum AS ENUM ('Culto', 'Reunião', 'Ensino', 'Evento Especial', 'Treinamento', 'Outro');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- TABELA CENTRAL: PESSOAS
-- =====================================================
-- Esta é a tabela principal que centraliza TODAS as pessoas
-- Um único cadastro acompanha toda a jornada espiritual

CREATE TABLE IF NOT EXISTS pessoas (
  id SERIAL PRIMARY KEY,
  
  -- Dados Pessoais Básicos
  nome VARCHAR(255) NOT NULL,
  sobrenome VARCHAR(255),
  data_nascimento DATE,
  sexo sexo_enum,
  estado_civil estado_civil_enum,
  
  -- Contato
  telefone VARCHAR(20),
  email VARCHAR(255),
  whatsapp VARCHAR(20), -- Pode ser diferente do telefone
  
  -- Endereço
  cep VARCHAR(10),
  rua VARCHAR(255),
  numero VARCHAR(20),
  complemento VARCHAR(255),
  bairro VARCHAR(255),
  cidade VARCHAR(255),
  estado estado_brasil_enum,
  
  -- Foto
  foto_perfil TEXT, -- URL ou path da imagem
  
  -- Jornada Espiritual
  estagio_atual estagio_espiritual_enum DEFAULT 'Visitante',
  data_primeira_visita TIMESTAMP, -- Quando veio pela primeira vez
  como_conheceu como_conheceu_enum,
  
  -- Cargo Eclesiástico (se tiver)
  cargo_eclesiastico cargo_eclesiastico_enum,
  data_ordenacao DATE, -- Quando foi ordenado ao cargo
  
  -- Status
  ativo BOOLEAN DEFAULT TRUE,
  
  -- Metadados
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT email_valido CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- =====================================================
-- HISTÓRICO DA JORNADA ESPIRITUAL
-- =====================================================
-- Registra cada mudança de estágio da pessoa
-- Mantém histórico completo da jornada

CREATE TABLE IF NOT EXISTS jornada_espiritual (
  id SERIAL PRIMARY KEY,
  pessoa_id INTEGER NOT NULL REFERENCES pessoas(id) ON DELETE CASCADE,
  
  -- Estágio
  estagio_anterior estagio_espiritual_enum,
  estagio_novo estagio_espiritual_enum NOT NULL,
  
  -- Contexto da mudança
  data_mudanca TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  observacoes TEXT, -- Ex: "Concluiu curso de membresia", "Converteu-se no culto de jovens"
  
  -- Quem registrou/acompanhou
  registrado_por INTEGER REFERENCES pessoas(id),
  
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- CREDENCIAIS DE ACESSO AO SISTEMA
-- =====================================================
-- Apenas pessoas que precisam logar no sistema têm registro aqui
-- Separa autenticação da gestão de pessoas

CREATE TABLE IF NOT EXISTS credenciais_acesso (
  id SERIAL PRIMARY KEY,
  pessoa_id INTEGER NOT NULL UNIQUE REFERENCES pessoas(id) ON DELETE CASCADE,
  
  -- Autenticação
  senha_hash VARCHAR(255) NOT NULL,
  tipo_acesso tipo_acesso_enum DEFAULT 'Usuario',
  
  -- Recuperação de senha
  token_recuperacao VARCHAR(255),
  token_recuperacao_expira TIMESTAMP,
  
  -- Verificação
  email_verificado BOOLEAN DEFAULT FALSE,
  token_verificacao VARCHAR(255),
  
  -- Segurança
  ultimo_login TIMESTAMP,
  tentativas_login_falhas INTEGER DEFAULT 0,
  bloqueado_ate TIMESTAMP,
  
  -- Metadados
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- VISITAS REGISTRADAS
-- =====================================================
-- Cada visita é registrada (permite ver frequência, datas específicas, etc)

CREATE TABLE IF NOT EXISTS visitas (
  id SERIAL PRIMARY KEY,
  pessoa_id INTEGER NOT NULL REFERENCES pessoas(id) ON DELETE CASCADE,
  
  -- Dados da visita
  data_visita TIMESTAMP NOT NULL,
  recepcionado_por INTEGER REFERENCES pessoas(id),
  
  -- Informações da visita
  pedido_oracao TEXT,
  observacoes TEXT,
  compareceu BOOLEAN DEFAULT TRUE, -- Para casos de "esperado mas não veio"
  
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- CONVERSÕES REGISTRADAS
-- =====================================================
-- Registro de quando a pessoa aceitou Jesus

CREATE TABLE IF NOT EXISTS conversoes (
  id SERIAL PRIMARY KEY,
  pessoa_id INTEGER NOT NULL UNIQUE REFERENCES pessoas(id) ON DELETE CASCADE,
  
  -- Dados da conversão
  data_conversao TIMESTAMP NOT NULL,
  local_conversao VARCHAR(255), -- Ex: "Culto de Domingo", "Célula"
  acompanhado_por INTEGER REFERENCES pessoas(id),
  
  -- Contexto
  testemunho TEXT, -- História da conversão
  
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABELA DE MINISTÉRIOS
-- =====================================================

CREATE TABLE IF NOT EXISTS ministerios (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL UNIQUE,
  descricao TEXT,
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- PARTICIPAÇÃO EM MINISTÉRIOS
-- =====================================================
-- Relaciona pessoas com ministérios (líder ou participante)

CREATE TABLE IF NOT EXISTS pessoa_ministerios (
  id SERIAL PRIMARY KEY,
  pessoa_id INTEGER NOT NULL REFERENCES pessoas(id) ON DELETE CASCADE,
  ministerio_id INTEGER NOT NULL REFERENCES ministerios(id) ON DELETE CASCADE,
  
  -- Tipo de participação
  e_lider BOOLEAN DEFAULT FALSE,
  
  -- Período
  data_inicio DATE NOT NULL,
  data_fim DATE, -- NULL = ainda participa
  
  -- Observações
  observacoes TEXT,
  
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(pessoa_id, ministerio_id, data_inicio)
);

-- =====================================================
-- CURSO DE MEMBRESIA
-- =====================================================

-- Tabela de matrículas em membresia
CREATE TABLE IF NOT EXISTS matriculas_membresia (
  id SERIAL PRIMARY KEY,
  pessoa_id INTEGER NOT NULL REFERENCES pessoas(id) ON DELETE CASCADE,
  
  -- Dados da matrícula
  data_matricula DATE NOT NULL,
  data_conclusao DATE, -- Quando concluiu todas as 5 aulas
  
  -- Status
  concluido BOOLEAN DEFAULT FALSE,
  
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(pessoa_id, data_matricula)
);

-- Tabela de aulas concluídas
CREATE TABLE IF NOT EXISTS aulas_membresia (
  id SERIAL PRIMARY KEY,
  matricula_id INTEGER NOT NULL REFERENCES matriculas_membresia(id) ON DELETE CASCADE,
  
  -- Aula
  aula_numero INTEGER NOT NULL CHECK (aula_numero >= 1 AND aula_numero <= 5),
  concluida BOOLEAN DEFAULT FALSE,
  data_conclusao DATE,
  
  -- Notas/Observações
  observacoes TEXT,
  
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(matricula_id, aula_numero)
);

-- =====================================================
-- GESTÃO FINANCEIRA
-- =====================================================

-- Entradas Financeiras
CREATE TABLE IF NOT EXISTS entradas_financeiras (
  id SERIAL PRIMARY KEY,
  
  -- Classificação
  categoria categoria_financeira_enum NOT NULL,
  valor DECIMAL(10, 2) NOT NULL CHECK (valor > 0),
  
  -- Data e contexto
  data_entrada DATE NOT NULL,
  turno turno_enum NOT NULL,
  tipo_pagamento tipo_pagamento_enum NOT NULL,
  
  -- Observações
  observacoes TEXT,
  
  -- Quem registrou
  registrado_por INTEGER REFERENCES pessoas(id),
  
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Autores de entrada (quem deu a oferta/dízimo)
-- Relação muitos-para-muitos (uma entrada pode ter múltiplos doadores)
CREATE TABLE IF NOT EXISTS entrada_doadores (
  id SERIAL PRIMARY KEY,
  entrada_id INTEGER NOT NULL REFERENCES entradas_financeiras(id) ON DELETE CASCADE,
  pessoa_id INTEGER NOT NULL REFERENCES pessoas(id) ON DELETE CASCADE,
  
  -- Valor específico desta pessoa (se dividido)
  valor_individual DECIMAL(10, 2),
  
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(entrada_id, pessoa_id)
);

-- Saídas Financeiras
CREATE TABLE IF NOT EXISTS saidas_financeiras (
  id SERIAL PRIMARY KEY,
  
  -- Valor e destino
  valor DECIMAL(10, 2) NOT NULL CHECK (valor > 0),
  motivo TEXT NOT NULL,
  ministerio_id INTEGER NOT NULL REFERENCES ministerios(id),
  
  -- Data
  data_saida DATE NOT NULL,
  
  -- Comprovante
  comprovante_nome VARCHAR(255),
  comprovante_path TEXT,
  
  -- Quem registrou
  registrado_por INTEGER REFERENCES pessoas(id),
  
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- EVENTOS
-- =====================================================

CREATE TABLE IF NOT EXISTS eventos (
  id SERIAL PRIMARY KEY,
  
  -- Dados do evento
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  tipo tipo_evento_enum NOT NULL,
  
  -- Data e local
  data DATE NOT NULL,
  hora TIME NOT NULL,
  local VARCHAR(255) NOT NULL,
  
  -- Responsável
  criado_por INTEGER REFERENCES pessoas(id),
  
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Participantes do evento
CREATE TABLE IF NOT EXISTS evento_participantes (
  id SERIAL PRIMARY KEY,
  evento_id INTEGER NOT NULL REFERENCES eventos(id) ON DELETE CASCADE,
  pessoa_id INTEGER NOT NULL REFERENCES pessoas(id) ON DELETE CASCADE,
  
  -- Confirmação
  confirmado BOOLEAN DEFAULT FALSE,
  compareceu BOOLEAN,
  
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(evento_id, pessoa_id)
);

-- =====================================================
-- RELATÓRIOS
-- =====================================================

CREATE TABLE IF NOT EXISTS relatorios (
  id SERIAL PRIMARY KEY,
  
  -- Identificação
  titulo VARCHAR(255) NOT NULL,
  ministerio_id INTEGER REFERENCES ministerios(id),
  
  -- Período de referência
  mes_referencia VARCHAR(2) CHECK (mes_referencia >= '01' AND mes_referencia <= '12'),
  ano_referencia INTEGER,
  
  -- Conteúdo
  conteudo TEXT NOT NULL, -- HTML do editor rich text
  
  -- Arquivo gerado
  arquivo_pdf_path TEXT,
  tamanho_arquivo VARCHAR(20),
  
  -- Quem criou
  criado_por INTEGER REFERENCES pessoas(id),
  
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices em pessoas
CREATE INDEX IF NOT EXISTS idx_pessoas_email ON pessoas(email);
CREATE INDEX IF NOT EXISTS idx_pessoas_telefone ON pessoas(telefone);
CREATE INDEX IF NOT EXISTS idx_pessoas_cidade ON pessoas(cidade);
CREATE INDEX IF NOT EXISTS idx_pessoas_estado ON pessoas(estado);
CREATE INDEX IF NOT EXISTS idx_pessoas_estagio_atual ON pessoas(estagio_atual);
CREATE INDEX IF NOT EXISTS idx_pessoas_ativo ON pessoas(ativo);
CREATE INDEX IF NOT EXISTS idx_pessoas_data_primeira_visita ON pessoas(data_primeira_visita);

-- Índices em jornada_espiritual
CREATE INDEX IF NOT EXISTS idx_jornada_pessoa_id ON jornada_espiritual(pessoa_id);
CREATE INDEX IF NOT EXISTS idx_jornada_data_mudanca ON jornada_espiritual(data_mudanca);
CREATE INDEX IF NOT EXISTS idx_jornada_estagio_novo ON jornada_espiritual(estagio_novo);

-- Índices em credenciais_acesso
CREATE INDEX IF NOT EXISTS idx_credenciais_pessoa_id ON credenciais_acesso(pessoa_id);
CREATE INDEX IF NOT EXISTS idx_credenciais_tipo_acesso ON credenciais_acesso(tipo_acesso);

-- Índices em visitas
CREATE INDEX IF NOT EXISTS idx_visitas_pessoa_id ON visitas(pessoa_id);
CREATE INDEX IF NOT EXISTS idx_visitas_data_visita ON visitas(data_visita);
CREATE INDEX IF NOT EXISTS idx_visitas_recepcionado_por ON visitas(recepcionado_por);

-- Índices em conversoes
CREATE INDEX IF NOT EXISTS idx_conversoes_pessoa_id ON conversoes(pessoa_id);
CREATE INDEX IF NOT EXISTS idx_conversoes_data_conversao ON conversoes(data_conversao);

-- Índices em pessoa_ministerios
CREATE INDEX IF NOT EXISTS idx_pessoa_ministerios_pessoa_id ON pessoa_ministerios(pessoa_id);
CREATE INDEX IF NOT EXISTS idx_pessoa_ministerios_ministerio_id ON pessoa_ministerios(ministerio_id);
CREATE INDEX IF NOT EXISTS idx_pessoa_ministerios_e_lider ON pessoa_ministerios(e_lider);

-- Índices em matriculas_membresia
CREATE INDEX IF NOT EXISTS idx_matriculas_pessoa_id ON matriculas_membresia(pessoa_id);
CREATE INDEX IF NOT EXISTS idx_matriculas_data_matricula ON matriculas_membresia(data_matricula);
CREATE INDEX IF NOT EXISTS idx_matriculas_concluido ON matriculas_membresia(concluido);

-- Índices em aulas_membresia
CREATE INDEX IF NOT EXISTS idx_aulas_matricula_id ON aulas_membresia(matricula_id);
CREATE INDEX IF NOT EXISTS idx_aulas_concluida ON aulas_membresia(concluida);

-- Índices em entradas_financeiras
CREATE INDEX IF NOT EXISTS idx_entradas_data ON entradas_financeiras(data_entrada);
CREATE INDEX IF NOT EXISTS idx_entradas_categoria ON entradas_financeiras(categoria);
CREATE INDEX IF NOT EXISTS idx_entradas_registrado_por ON entradas_financeiras(registrado_por);

-- Índices em saidas_financeiras
CREATE INDEX IF NOT EXISTS idx_saidas_data ON saidas_financeiras(data_saida);
CREATE INDEX IF NOT EXISTS idx_saidas_ministerio ON saidas_financeiras(ministerio_id);
CREATE INDEX IF NOT EXISTS idx_saidas_registrado_por ON saidas_financeiras(registrado_por);

-- Índices em eventos
CREATE INDEX IF NOT EXISTS idx_eventos_data ON eventos(data);
CREATE INDEX IF NOT EXISTS idx_eventos_tipo ON eventos(tipo);

-- =====================================================
-- TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA
-- =====================================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar triggers
DROP TRIGGER IF EXISTS update_pessoas_updated_at ON pessoas;
CREATE TRIGGER update_pessoas_updated_at BEFORE UPDATE ON pessoas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_credenciais_updated_at ON credenciais_acesso;
CREATE TRIGGER update_credenciais_updated_at BEFORE UPDATE ON credenciais_acesso
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_conversoes_updated_at ON conversoes;
CREATE TRIGGER update_conversoes_updated_at BEFORE UPDATE ON conversoes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ministerios_updated_at ON ministerios;
CREATE TRIGGER update_ministerios_updated_at BEFORE UPDATE ON ministerios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_pessoa_ministerios_updated_at ON pessoa_ministerios;
CREATE TRIGGER update_pessoa_ministerios_updated_at BEFORE UPDATE ON pessoa_ministerios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_matriculas_updated_at ON matriculas_membresia;
CREATE TRIGGER update_matriculas_updated_at BEFORE UPDATE ON matriculas_membresia
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_aulas_updated_at ON aulas_membresia;
CREATE TRIGGER update_aulas_updated_at BEFORE UPDATE ON aulas_membresia
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_entradas_updated_at ON entradas_financeiras;
CREATE TRIGGER update_entradas_updated_at BEFORE UPDATE ON entradas_financeiras
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_saidas_updated_at ON saidas_financeiras;
CREATE TRIGGER update_saidas_updated_at BEFORE UPDATE ON saidas_financeiras
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_eventos_updated_at ON eventos;
CREATE TRIGGER update_eventos_updated_at BEFORE UPDATE ON eventos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_relatorios_updated_at ON relatorios;
CREATE TRIGGER update_relatorios_updated_at BEFORE UPDATE ON relatorios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TRIGGER: ATUALIZAR ESTÁGIO ATUAL DA PESSOA
-- =====================================================
-- Quando houver mudança na jornada, atualiza o estágio_atual em pessoas

CREATE OR REPLACE FUNCTION atualizar_estagio_pessoa()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE pessoas 
  SET estagio_atual = NEW.estagio_novo,
      atualizado_em = CURRENT_TIMESTAMP
  WHERE id = NEW.pessoa_id;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_atualizar_estagio ON jornada_espiritual;
CREATE TRIGGER trigger_atualizar_estagio 
  AFTER INSERT ON jornada_espiritual
  FOR EACH ROW EXECUTE FUNCTION atualizar_estagio_pessoa();

-- =====================================================
-- TRIGGER: CONCLUIR MEMBRESIA AUTOMATICAMENTE
-- =====================================================
-- Quando a 5ª aula for marcada como concluída, marca a matrícula como concluída

CREATE OR REPLACE FUNCTION verificar_conclusao_membresia()
RETURNS TRIGGER AS $$
DECLARE
  aulas_concluidas INTEGER;
BEGIN
  -- Contar quantas aulas estão concluídas
  SELECT COUNT(*) INTO aulas_concluidas
  FROM aulas_membresia
  WHERE matricula_id = NEW.matricula_id AND concluida = TRUE;
  
  -- Se todas as 5 aulas estão concluídas
  IF aulas_concluidas = 5 THEN
    UPDATE matriculas_membresia
    SET concluido = TRUE,
        data_conclusao = CURRENT_DATE,
        atualizado_em = CURRENT_TIMESTAMP
    WHERE id = NEW.matricula_id;
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_conclusao_membresia ON aulas_membresia;
CREATE TRIGGER trigger_conclusao_membresia
  AFTER UPDATE ON aulas_membresia
  FOR EACH ROW 
  WHEN (NEW.concluida = TRUE AND OLD.concluida = FALSE)
  EXECUTE FUNCTION verificar_conclusao_membresia();

-- =====================================================
-- DADOS INICIAIS (SEEDS)
-- =====================================================

-- Inserir ministérios padrão
INSERT INTO ministerios (nome, descricao)
SELECT 'Louvor', 'Ministério de Louvor e Adoração'
WHERE NOT EXISTS (SELECT 1 FROM ministerios WHERE nome = 'Louvor');

INSERT INTO ministerios (nome, descricao)
SELECT 'Jovens', 'Ministério de Jovens'
WHERE NOT EXISTS (SELECT 1 FROM ministerios WHERE nome = 'Jovens');

INSERT INTO ministerios (nome, descricao)
SELECT 'Crianças', 'Ministério Infantil'
WHERE NOT EXISTS (SELECT 1 FROM ministerios WHERE nome = 'Crianças');

INSERT INTO ministerios (nome, descricao)
SELECT 'Intercessão', 'Ministério de Intercessão'
WHERE NOT EXISTS (SELECT 1 FROM ministerios WHERE nome = 'Intercessão');

INSERT INTO ministerios (nome, descricao)
SELECT 'Recepção', 'Ministério de Recepção'
WHERE NOT EXISTS (SELECT 1 FROM ministerios WHERE nome = 'Recepção');

INSERT INTO ministerios (nome, descricao)
SELECT 'Mídia', 'Ministério de Mídia'
WHERE NOT EXISTS (SELECT 1 FROM ministerios WHERE nome = 'Mídia');

INSERT INTO ministerios (nome, descricao)
SELECT 'Limpeza', 'Ministério de Limpeza'
WHERE NOT EXISTS (SELECT 1 FROM ministerios WHERE nome = 'Limpeza');

INSERT INTO ministerios (nome, descricao)
SELECT 'Segurança', 'Ministério de Segurança'
WHERE NOT EXISTS (SELECT 1 FROM ministerios WHERE nome = 'Segurança');

INSERT INTO ministerios (nome, descricao)
SELECT 'Ensino', 'Ministério de Ensino'
WHERE NOT EXISTS (SELECT 1 FROM ministerios WHERE nome = 'Ensino');

INSERT INTO ministerios (nome, descricao)
SELECT 'Missões', 'Ministério de Missões'
WHERE NOT EXISTS (SELECT 1 FROM ministerios WHERE nome = 'Missões');

INSERT INTO ministerios (nome, descricao)
SELECT 'Ação Social', 'Ministério de Ação Social'
WHERE NOT EXISTS (SELECT 1 FROM ministerios WHERE nome = 'Ação Social');

INSERT INTO ministerios (nome, descricao)
SELECT 'Visitação', 'Ministério de Visitação'
WHERE NOT EXISTS (SELECT 1 FROM ministerios WHERE nome = 'Visitação');

-- =====================================================
-- VIEWS ÚTEIS
-- =====================================================

-- View: Pessoas com seu estágio atual e informações resumidas
DROP VIEW IF EXISTS vw_pessoas_resumo CASCADE;
CREATE OR REPLACE VIEW vw_pessoas_resumo AS
SELECT 
  p.id,
  p.nome,
  p.sobrenome,
  p.nome || ' ' || COALESCE(p.sobrenome, '') as nome_completo,
  p.email,
  p.telefone,
  p.whatsapp,
  p.cidade,
  p.estado,
  p.estagio_atual,
  p.cargo_eclesiastico,
  p.data_primeira_visita,
  p.como_conheceu,
  p.ativo,
  ca.tipo_acesso,
  CASE 
    WHEN ca.id IS NOT NULL THEN TRUE 
    ELSE FALSE 
  END as tem_acesso_sistema,
  (SELECT COUNT(*) FROM visitas v WHERE v.pessoa_id = p.id) as total_visitas,
  (SELECT MAX(v.data_visita) FROM visitas v WHERE v.pessoa_id = p.id) as ultima_visita,
  (SELECT COUNT(*) FROM pessoa_ministerios pm WHERE pm.pessoa_id = p.id AND pm.data_fim IS NULL) as ministerios_ativos,
  p.criado_em,
  p.atualizado_em
FROM pessoas p
LEFT JOIN credenciais_acesso ca ON p.id = ca.pessoa_id;

-- View: Jornada completa de cada pessoa
DROP VIEW IF EXISTS vw_jornada_completa CASCADE;
CREATE OR REPLACE VIEW vw_jornada_completa AS
SELECT 
  p.id as pessoa_id,
  p.nome || ' ' || COALESCE(p.sobrenome, '') as nome_completo,
  p.estagio_atual,
  j.id as jornada_id,
  j.estagio_anterior,
  j.estagio_novo,
  j.data_mudanca,
  j.observacoes,
  r.nome || ' ' || COALESCE(r.sobrenome, '') as registrado_por_nome
FROM pessoas p
LEFT JOIN jornada_espiritual j ON p.id = j.pessoa_id
LEFT JOIN pessoas r ON j.registrado_por = r.id
ORDER BY p.id, j.data_mudanca DESC;

-- View: Pessoas em cada ministério
DROP VIEW IF EXISTS vw_ministerios_equipe CASCADE;
CREATE OR REPLACE VIEW vw_ministerios_equipe AS
SELECT 
  m.id as ministerio_id,
  m.nome as ministerio_nome,
  m.descricao as ministerio_descricao,
  p.id as pessoa_id,
  p.nome || ' ' || COALESCE(p.sobrenome, '') as pessoa_nome,
  p.email,
  p.telefone,
  pm.e_lider,
  pm.data_inicio,
  pm.data_fim,
  CASE 
    WHEN pm.data_fim IS NULL THEN 'Ativo'
    ELSE 'Inativo'
  END as status
FROM ministerios m
LEFT JOIN pessoa_ministerios pm ON m.id = pm.ministerio_id
LEFT JOIN pessoas p ON pm.pessoa_id = p.id
ORDER BY m.nome, pm.e_lider DESC, p.nome;

-- View: Progresso de membresia
DROP VIEW IF EXISTS vw_progresso_membresia CASCADE;
CREATE OR REPLACE VIEW vw_progresso_membresia AS
SELECT 
  mm.id as matricula_id,
  p.id as pessoa_id,
  p.nome || ' ' || COALESCE(p.sobrenome, '') as nome_completo,
  p.email,
  p.telefone,
  mm.data_matricula,
  mm.data_conclusao,
  mm.concluido,
  COUNT(am.id) FILTER (WHERE am.concluida = TRUE) as aulas_concluidas,
  COUNT(am.id) FILTER (WHERE am.concluida = FALSE OR am.concluida IS NULL) as aulas_pendentes,
  ROUND((COUNT(am.id) FILTER (WHERE am.concluida = TRUE)::DECIMAL / 5) * 100, 2) as progresso_percentual
FROM matriculas_membresia mm
INNER JOIN pessoas p ON mm.pessoa_id = p.id
LEFT JOIN aulas_membresia am ON mm.id = am.matricula_id
GROUP BY mm.id, p.id, p.nome, p.sobrenome, p.email, p.telefone, mm.data_matricula, mm.data_conclusao, mm.concluido;

-- View: Relatório financeiro consolidado
DROP VIEW IF EXISTS vw_relatorio_financeiro CASCADE;
CREATE OR REPLACE VIEW vw_relatorio_financeiro AS
SELECT 
  'ENTRADA' as tipo,
  e.id,
  e.categoria::TEXT as categoria,
  e.valor,
  e.data_entrada as data,
  e.turno,
  e.tipo_pagamento,
  e.observacoes as descricao,
  string_agg(DISTINCT p.nome || ' ' || COALESCE(p.sobrenome, ''), ', ') as doadores,
  rp.nome || ' ' || COALESCE(rp.sobrenome, '') as registrado_por,
  e.criado_em
FROM entradas_financeiras e
LEFT JOIN entrada_doadores ed ON e.id = ed.entrada_id
LEFT JOIN pessoas p ON ed.pessoa_id = p.id
LEFT JOIN pessoas rp ON e.registrado_por = rp.id
GROUP BY e.id, e.categoria, e.valor, e.data_entrada, e.turno, e.tipo_pagamento, e.observacoes, rp.nome, rp.sobrenome, e.criado_em
UNION ALL
SELECT 
  'SAIDA' as tipo,
  s.id,
  m.nome as categoria,
  s.valor,
  s.data_saida as data,
  NULL::turno_enum as turno,
  NULL::tipo_pagamento_enum as tipo_pagamento,
  s.motivo as descricao,
  NULL as doadores,
  rp.nome || ' ' || COALESCE(rp.sobrenome, '') as registrado_por,
  s.criado_em
FROM saidas_financeiras s
INNER JOIN ministerios m ON s.ministerio_id = m.id
LEFT JOIN pessoas rp ON s.registrado_por = rp.id
ORDER BY criado_em DESC;

-- View: Estatísticas gerais
DROP VIEW IF EXISTS vw_estatisticas_gerais CASCADE;
CREATE OR REPLACE VIEW vw_estatisticas_gerais AS
SELECT 
  (SELECT COUNT(*) FROM pessoas WHERE ativo = TRUE) as total_pessoas_ativas,
  (SELECT COUNT(*) FROM pessoas WHERE estagio_atual = 'Visitante') as total_visitantes,
  (SELECT COUNT(*) FROM pessoas WHERE estagio_atual = 'Novo Convertido') as total_novos_convertidos,
  (SELECT COUNT(*) FROM pessoas WHERE estagio_atual = 'Membro') as total_membros,
  (SELECT COUNT(*) FROM pessoas WHERE estagio_atual = 'Líder') as total_lideres,
  (SELECT COUNT(*) FROM pessoas WHERE estagio_atual = 'Obreiro') as total_obreiros,
  (SELECT COUNT(*) FROM ministerios WHERE ativo = TRUE) as total_ministerios_ativos,
  (SELECT COUNT(DISTINCT pessoa_id) FROM pessoa_ministerios WHERE data_fim IS NULL) as total_pessoas_em_ministerios,
  (SELECT COUNT(*) FROM matriculas_membresia WHERE concluido = FALSE) as total_em_membresia,
  (SELECT COUNT(*) FROM matriculas_membresia WHERE concluido = TRUE) as total_membresia_concluida,
  (SELECT COALESCE(SUM(valor), 0) FROM entradas_financeiras WHERE EXTRACT(MONTH FROM data_entrada) = EXTRACT(MONTH FROM CURRENT_DATE)) as entradas_mes_atual,
  (SELECT COALESCE(SUM(valor), 0) FROM saidas_financeiras WHERE EXTRACT(MONTH FROM data_saida) = EXTRACT(MONTH FROM CURRENT_DATE)) as saidas_mes_atual;

-- =====================================================
-- COMENTÁRIOS NAS TABELAS
-- =====================================================

COMMENT ON TABLE pessoas IS 'Tabela central de todas as pessoas (visitantes, membros, líderes, pastores)';
COMMENT ON TABLE jornada_espiritual IS 'Histórico completo da jornada espiritual de cada pessoa';
COMMENT ON TABLE credenciais_acesso IS 'Credenciais de login apenas para quem acessa o sistema';
COMMENT ON TABLE visitas IS 'Registro de cada visita realizada';
COMMENT ON TABLE conversoes IS 'Registro de conversões';
COMMENT ON TABLE ministerios IS 'Ministérios da igreja';
COMMENT ON TABLE pessoa_ministerios IS 'Relacionamento entre pessoas e ministérios (líder ou participante)';
COMMENT ON TABLE matriculas_membresia IS 'Matrículas no curso de membresia';
COMMENT ON TABLE aulas_membresia IS 'Aulas do curso de membresia';
COMMENT ON TABLE entradas_financeiras IS 'Entradas financeiras (dízimos, ofertas, etc)';
COMMENT ON TABLE entrada_doadores IS 'Doadores de cada entrada financeira';
COMMENT ON TABLE saidas_financeiras IS 'Saídas financeiras';
COMMENT ON TABLE eventos IS 'Eventos da igreja';
COMMENT ON TABLE evento_participantes IS 'Participantes de cada evento';
COMMENT ON TABLE relatorios IS 'Relatórios gerados pelos ministérios';

-- =====================================================
-- FIM DO SCHEMA REFATORADO
-- =====================================================