-- =====================================================
-- SISTEMA IVN - SCHEMA COMPLETO DO BANCO DE DADOS
-- VERSÃO SEGURA (PRESERVA DADOS EXISTENTES)
-- =====================================================
-- Este arquivo cria o banco de dados apenas se não existir
-- PRESERVA todos os dados existentes
-- =====================================================

-- =====================================================
-- EXTENSÕES
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ENUMS (cria apenas se não existir)
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

-- Enum para tipo de usuário
DO $$ BEGIN
  CREATE TYPE tipo_usuario_enum AS ENUM ('Usuario', 'Admin', 'SuperAdmin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Enum para cargo eclesiástico
DO $$ BEGIN
  CREATE TYPE cargo_eclesiastico_enum AS ENUM ('Pastor', 'Evangelista', 'Presbítero', 'Diácono');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Enum para estágio de usuário
DO $$ BEGIN
  CREATE TYPE estagio_usuario_enum AS ENUM (
    'Visitante', 
    'Novo Convertido', 
    'Membro', 
    'Participante de Ministério', 
    'Líder'
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
  CREATE TYPE como_conheceu_enum AS ENUM ('familia-amigo', 'google', 'redesocial', 'passei-frente');
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
-- TABELAS PRINCIPAIS (cria apenas se não existir)
-- =====================================================

-- Tabela de Usuários (Autenticação e Perfil)
CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  sobrenome VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  telefone VARCHAR(20),
  data_nascimento DATE,
  sexo sexo_enum,
  estado_civil estado_civil_enum,
  cep VARCHAR(10),
  rua VARCHAR(255),
  numero VARCHAR(20),
  complemento VARCHAR(255),
  bairro VARCHAR(255),
  cidade VARCHAR(255),
  estado estado_brasil_enum,
  foto_perfil TEXT, -- URL ou path da imagem
  tipo_usuario tipo_usuario_enum DEFAULT 'Usuario',
  token_recuperacao VARCHAR(255),
  token_recuperacao_expira TIMESTAMP,
  email_verificado BOOLEAN DEFAULT FALSE,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Ministérios
CREATE TABLE IF NOT EXISTS ministerios (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL UNIQUE,
  descricao TEXT,
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Visitantes
CREATE TABLE IF NOT EXISTS visitantes (
  id SERIAL PRIMARY KEY,
  recepcionado_por INTEGER REFERENCES usuarios(id),
  dia_visita TIMESTAMP NOT NULL,
  nome_completo VARCHAR(255) NOT NULL,
  data_nascimento DATE NOT NULL,
  whatsapp VARCHAR(20) NOT NULL,
  email VARCHAR(255) NOT NULL,
  bairro VARCHAR(255) NOT NULL,
  cidade VARCHAR(255) NOT NULL,
  como_conheceu como_conheceu_enum NOT NULL,
  pedido_oracao TEXT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Novos Convertidos
CREATE TABLE IF NOT EXISTS novos_convertidos (
  id SERIAL PRIMARY KEY,
  recepcionado_por INTEGER REFERENCES usuarios(id),
  dia_visita TIMESTAMP NOT NULL,
  nome_completo VARCHAR(255) NOT NULL,
  data_nascimento DATE NOT NULL,
  whatsapp VARCHAR(20) NOT NULL,
  email VARCHAR(255) NOT NULL,
  bairro VARCHAR(255) NOT NULL,
  cidade VARCHAR(255) NOT NULL,
  como_conheceu como_conheceu_enum NOT NULL,
  pedido_oracao TEXT,
  foto_perfil TEXT, -- URL ou path da imagem
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Pessoas (Gestão de Pessoas)
CREATE TABLE IF NOT EXISTS pessoas (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  sobrenome VARCHAR(255) NOT NULL,
  sexo sexo_enum NOT NULL,
  estado_civil estado_civil_enum NOT NULL,
  data_nascimento DATE NOT NULL,
  telefone VARCHAR(20) NOT NULL,
  email VARCHAR(255) NOT NULL,
  cep VARCHAR(10) NOT NULL,
  rua VARCHAR(255) NOT NULL,
  numero VARCHAR(20) NOT NULL,
  complemento VARCHAR(255),
  bairro VARCHAR(255) NOT NULL,
  cidade VARCHAR(255) NOT NULL,
  estado estado_brasil_enum NOT NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Atribuições
CREATE TABLE IF NOT EXISTS atribuicoes (
  id SERIAL PRIMARY KEY,
  pessoa_id INTEGER NOT NULL REFERENCES pessoas(id) ON DELETE CASCADE,
  cargo_eclesiastico cargo_eclesiastico_enum,
  tipo_usuario tipo_usuario_enum NOT NULL DEFAULT 'Usuario',
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(pessoa_id)
);

-- Tabela de Estágios de Usuário (Relação muitos-para-muitos)
CREATE TABLE IF NOT EXISTS pessoa_estagios (
  id SERIAL PRIMARY KEY,
  pessoa_id INTEGER NOT NULL REFERENCES pessoas(id) ON DELETE CASCADE,
  estagio estagio_usuario_enum NOT NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(pessoa_id, estagio)
);

-- Tabela de Ministérios como Líder (Relação muitos-para-muitos)
CREATE TABLE IF NOT EXISTS pessoa_ministerios_lider (
  id SERIAL PRIMARY KEY,
  pessoa_id INTEGER NOT NULL REFERENCES pessoas(id) ON DELETE CASCADE,
  ministerio_id INTEGER NOT NULL REFERENCES ministerios(id) ON DELETE CASCADE,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(pessoa_id, ministerio_id)
);

-- Tabela de Ministérios como Participante (Relação muitos-para-muitos)
CREATE TABLE IF NOT EXISTS pessoa_ministerios_participante (
  id SERIAL PRIMARY KEY,
  pessoa_id INTEGER NOT NULL REFERENCES pessoas(id) ON DELETE CASCADE,
  ministerio_id INTEGER NOT NULL REFERENCES ministerios(id) ON DELETE CASCADE,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(pessoa_id, ministerio_id)
);

-- Tabela de Entradas Financeiras
CREATE TABLE IF NOT EXISTS entradas_financeiras (
  id SERIAL PRIMARY KEY,
  categoria categoria_financeira_enum NOT NULL,
  valor DECIMAL(10, 2) NOT NULL CHECK (valor > 0),
  data_entrada DATE NOT NULL,
  turno turno_enum NOT NULL,
  tipo_pagamento tipo_pagamento_enum NOT NULL,
  criado_por INTEGER REFERENCES usuarios(id),
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Autores de Entrada (Relação muitos-para-muitos)
CREATE TABLE IF NOT EXISTS entrada_autores (
  id SERIAL PRIMARY KEY,
  entrada_id INTEGER NOT NULL REFERENCES entradas_financeiras(id) ON DELETE CASCADE,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(entrada_id, usuario_id)
);

-- Tabela de Saídas Financeiras
CREATE TABLE IF NOT EXISTS saidas_financeiras (
  id SERIAL PRIMARY KEY,
  valor DECIMAL(10, 2) NOT NULL CHECK (valor > 0),
  data_saida DATE NOT NULL,
  motivo TEXT NOT NULL,
  ministerio_id INTEGER NOT NULL REFERENCES ministerios(id),
  comprovante_nome VARCHAR(255),
  comprovante_path TEXT, -- Path ou URL do arquivo
  criado_por INTEGER REFERENCES usuarios(id),
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Eventos
CREATE TABLE IF NOT EXISTS eventos (
  id SERIAL PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  data DATE NOT NULL,
  hora TIME NOT NULL,
  local VARCHAR(255) NOT NULL,
  tipo tipo_evento_enum NOT NULL,
  criado_por INTEGER REFERENCES usuarios(id),
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Alunos de Membresia
CREATE TABLE IF NOT EXISTS alunos_membresia (
  id SERIAL PRIMARY KEY,
  novo_convertido_id INTEGER REFERENCES novos_convertidos(id),
  nome_completo VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  telefone VARCHAR(20) NOT NULL,
  data_nascimento DATE NOT NULL,
  endereco VARCHAR(255) NOT NULL,
  cidade VARCHAR(255) NOT NULL,
  data_matricula DATE NOT NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Aulas de Membresia
CREATE TABLE IF NOT EXISTS aulas_membresia (
  id SERIAL PRIMARY KEY,
  aluno_id INTEGER NOT NULL REFERENCES alunos_membresia(id) ON DELETE CASCADE,
  aula_numero INTEGER NOT NULL CHECK (aula_numero >= 1 AND aula_numero <= 5),
  concluida BOOLEAN DEFAULT FALSE,
  data_conclusao DATE,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(aluno_id, aula_numero)
);

-- Tabela de Relatórios
CREATE TABLE IF NOT EXISTS relatorios (
  id SERIAL PRIMARY KEY,
  nome_ministerio VARCHAR(255) NOT NULL,
  mes_referencia VARCHAR(2) NOT NULL CHECK (mes_referencia >= '01' AND mes_referencia <= '12'),
  ano_referencia INTEGER NOT NULL,
  conteudo TEXT NOT NULL, -- HTML do editor rich text
  arquivo_pdf_path TEXT, -- Path do arquivo PDF gerado
  tamanho_arquivo VARCHAR(20), -- Tamanho em KB
  criado_por INTEGER REFERENCES usuarios(id),
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- ATUALIZAÇÃO DE TABELAS EXISTENTES
-- Adiciona colunas faltantes nas tabelas que já existem
-- =====================================================

-- Adicionar colunas faltantes na tabela usuarios (se já existir)
DO $$ 
BEGIN
  -- Adicionar colunas que podem não existir
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'usuarios') THEN
    ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS sobrenome VARCHAR(255);
    ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS sexo sexo_enum;
    ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS estado_civil estado_civil_enum;
    ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS rua VARCHAR(255);
    ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS numero VARCHAR(20);
    ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS complemento VARCHAR(255);
    ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS bairro VARCHAR(255);
    ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS foto_perfil TEXT;
    ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS tipo_usuario tipo_usuario_enum DEFAULT 'Usuario';
    ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    
    -- Se não tiver senha_hash, adicionar (pode ser NULL inicialmente)
    ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS senha_hash VARCHAR(255);
    ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS token_recuperacao VARCHAR(255);
    ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS token_recuperacao_expira TIMESTAMP;
    ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS email_verificado BOOLEAN DEFAULT FALSE;
    
    -- Atualizar criado_em e atualizado_em se não existirem mas data_cadastro/data_atualizacao existirem
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'data_cadastro') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'criado_em') THEN
      ALTER TABLE usuarios RENAME COLUMN data_cadastro TO criado_em;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'data_atualizacao') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'atualizado_em') THEN
      ALTER TABLE usuarios RENAME COLUMN data_atualizacao TO atualizado_em;
    END IF;
    
    -- Se estado existe como VARCHAR, não alteramos (pode ser convertido depois se necessário)
    -- Por enquanto, apenas adicionamos se não existir
  END IF;
END $$;

-- =====================================================
-- ÍNDICES PARA PERFORMANCE (cria apenas se não existir)
-- =====================================================

-- Índices para usuários (apenas se as colunas existirem)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'email') THEN
    CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'tipo_usuario') THEN
    CREATE INDEX IF NOT EXISTS idx_usuarios_tipo_usuario ON usuarios(tipo_usuario);
  END IF;
END $$;

-- Índices para visitantes
CREATE INDEX IF NOT EXISTS idx_visitantes_dia_visita ON visitantes(dia_visita);
CREATE INDEX IF NOT EXISTS idx_visitantes_recepcionado_por ON visitantes(recepcionado_por);
CREATE INDEX IF NOT EXISTS idx_visitantes_email ON visitantes(email);
CREATE INDEX IF NOT EXISTS idx_visitantes_cidade ON visitantes(cidade);

-- Índices para novos convertidos
CREATE INDEX IF NOT EXISTS idx_novos_convertidos_dia_visita ON novos_convertidos(dia_visita);
CREATE INDEX IF NOT EXISTS idx_novos_convertidos_recepcionado_por ON novos_convertidos(recepcionado_por);
CREATE INDEX IF NOT EXISTS idx_novos_convertidos_email ON novos_convertidos(email);
CREATE INDEX IF NOT EXISTS idx_novos_convertidos_cidade ON novos_convertidos(cidade);

-- Índices para pessoas
CREATE INDEX IF NOT EXISTS idx_pessoas_email ON pessoas(email);
CREATE INDEX IF NOT EXISTS idx_pessoas_telefone ON pessoas(telefone);
CREATE INDEX IF NOT EXISTS idx_pessoas_cidade ON pessoas(cidade);
CREATE INDEX IF NOT EXISTS idx_pessoas_estado ON pessoas(estado);

-- Índices para atribuições
CREATE INDEX IF NOT EXISTS idx_atribuicoes_pessoa_id ON atribuicoes(pessoa_id);
CREATE INDEX IF NOT EXISTS idx_pessoa_estagios_pessoa_id ON pessoa_estagios(pessoa_id);
CREATE INDEX IF NOT EXISTS idx_pessoa_ministerios_lider_pessoa_id ON pessoa_ministerios_lider(pessoa_id);
CREATE INDEX IF NOT EXISTS idx_pessoa_ministerios_participante_pessoa_id ON pessoa_ministerios_participante(pessoa_id);

-- Índices para finanças
CREATE INDEX IF NOT EXISTS idx_entradas_financeiras_data ON entradas_financeiras(data_entrada);
CREATE INDEX IF NOT EXISTS idx_entradas_financeiras_categoria ON entradas_financeiras(categoria);
CREATE INDEX IF NOT EXISTS idx_saidas_financeiras_data ON saidas_financeiras(data_saida);
CREATE INDEX IF NOT EXISTS idx_saidas_financeiras_ministerio ON saidas_financeiras(ministerio_id);

-- Índices para eventos
CREATE INDEX IF NOT EXISTS idx_eventos_data ON eventos(data);
CREATE INDEX IF NOT EXISTS idx_eventos_tipo ON eventos(tipo);

-- Índices para membresia
CREATE INDEX IF NOT EXISTS idx_alunos_membresia_data_matricula ON alunos_membresia(data_matricula);
CREATE INDEX IF NOT EXISTS idx_alunos_membresia_cidade ON alunos_membresia(cidade);
CREATE INDEX IF NOT EXISTS idx_aulas_membresia_aluno_id ON aulas_membresia(aluno_id);
CREATE INDEX IF NOT EXISTS idx_aulas_membresia_concluida ON aulas_membresia(concluida);

-- Índices para relatórios
CREATE INDEX IF NOT EXISTS idx_relatorios_mes_ano ON relatorios(mes_referencia, ano_referencia);
CREATE INDEX IF NOT EXISTS idx_relatorios_ministerio ON relatorios(nome_ministerio);

-- =====================================================
-- TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA
-- =====================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger em todas as tabelas com atualizado_em
DROP TRIGGER IF EXISTS update_usuarios_updated_at ON usuarios;
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ministerios_updated_at ON ministerios;
CREATE TRIGGER update_ministerios_updated_at BEFORE UPDATE ON ministerios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_visitantes_updated_at ON visitantes;
CREATE TRIGGER update_visitantes_updated_at BEFORE UPDATE ON visitantes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_novos_convertidos_updated_at ON novos_convertidos;
CREATE TRIGGER update_novos_convertidos_updated_at BEFORE UPDATE ON novos_convertidos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_pessoas_updated_at ON pessoas;
CREATE TRIGGER update_pessoas_updated_at BEFORE UPDATE ON pessoas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_atribuicoes_updated_at ON atribuicoes;
CREATE TRIGGER update_atribuicoes_updated_at BEFORE UPDATE ON atribuicoes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_entradas_financeiras_updated_at ON entradas_financeiras;
CREATE TRIGGER update_entradas_financeiras_updated_at BEFORE UPDATE ON entradas_financeiras
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_saidas_financeiras_updated_at ON saidas_financeiras;
CREATE TRIGGER update_saidas_financeiras_updated_at BEFORE UPDATE ON saidas_financeiras
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_eventos_updated_at ON eventos;
CREATE TRIGGER update_eventos_updated_at BEFORE UPDATE ON eventos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_alunos_membresia_updated_at ON alunos_membresia;
CREATE TRIGGER update_alunos_membresia_updated_at BEFORE UPDATE ON alunos_membresia
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_aulas_membresia_updated_at ON aulas_membresia;
CREATE TRIGGER update_aulas_membresia_updated_at BEFORE UPDATE ON aulas_membresia
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_relatorios_updated_at ON relatorios;
CREATE TRIGGER update_relatorios_updated_at BEFORE UPDATE ON relatorios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- DADOS INICIAIS (SEEDS) - apenas insere se não existir
-- =====================================================

-- Inserir alguns ministérios padrão (apenas se não existirem)
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
-- VIEWS ÚTEIS (recria se já existir)
-- =====================================================

-- View para pessoas com suas atribuições
DROP VIEW IF EXISTS vw_pessoas_com_atribuicoes;
CREATE OR REPLACE VIEW vw_pessoas_com_atribuicoes AS
SELECT 
  p.id,
  p.nome,
  p.sobrenome,
  p.email,
  p.telefone,
  p.cidade,
  p.estado,
  a.cargo_eclesiastico,
  a.tipo_usuario,
  array_agg(DISTINCT pe.estagio) FILTER (WHERE pe.estagio IS NOT NULL) as estagios,
  array_agg(DISTINCT ml.ministerio_id) FILTER (WHERE ml.ministerio_id IS NOT NULL) as ministerios_lider,
  array_agg(DISTINCT mp.ministerio_id) FILTER (WHERE mp.ministerio_id IS NOT NULL) as ministerios_participante
FROM pessoas p
LEFT JOIN atribuicoes a ON p.id = a.pessoa_id
LEFT JOIN pessoa_estagios pe ON p.id = pe.pessoa_id
LEFT JOIN pessoa_ministerios_lider ml ON p.id = ml.pessoa_id
LEFT JOIN pessoa_ministerios_participante mp ON p.id = mp.pessoa_id
GROUP BY p.id, a.cargo_eclesiastico, a.tipo_usuario;

-- View para relatório financeiro consolidado
DROP VIEW IF EXISTS vw_relatorio_financeiro;
CREATE OR REPLACE VIEW vw_relatorio_financeiro AS
SELECT 
  'ENTRADA' as tipo,
  e.id,
  e.categoria::TEXT as categoria,
  e.valor,
  e.data_entrada as data,
  e.turno,
  e.tipo_pagamento,
  string_agg(DISTINCT u.nome || ' ' || COALESCE(u.sobrenome, ''), ', ') as descricao,
  e.criado_em
FROM entradas_financeiras e
LEFT JOIN entrada_autores ea ON e.id = ea.entrada_id
LEFT JOIN usuarios u ON ea.usuario_id = u.id
GROUP BY e.id, e.categoria, e.valor, e.data_entrada, e.turno, e.tipo_pagamento, e.criado_em
UNION ALL
SELECT 
  'SAIDA' as tipo,
  s.id,
  'Saída'::TEXT as categoria,
  s.valor,
  s.data_saida as data,
  NULL::turno_enum as turno,
  NULL::tipo_pagamento_enum as tipo_pagamento,
  s.motivo as descricao,
  s.criado_em
FROM saidas_financeiras s
ORDER BY criado_em DESC;

-- View para alunos de membresia com progresso
DROP VIEW IF EXISTS vw_alunos_membresia_progresso;
CREATE OR REPLACE VIEW vw_alunos_membresia_progresso AS
SELECT 
  am.id,
  am.nome_completo,
  am.email,
  am.telefone,
  am.data_matricula,
  am.cidade,
  COUNT(a.id) FILTER (WHERE a.concluida = TRUE) as aulas_concluidas,
  COUNT(a.id) FILTER (WHERE a.concluida = FALSE) as aulas_nao_feitas,
  ROUND((COUNT(a.id) FILTER (WHERE a.concluida = TRUE)::DECIMAL / 5) * 100, 2) as progresso_percentual,
  MAX(a.data_conclusao) FILTER (WHERE a.concluida = TRUE) as ultima_aula_concluida
FROM alunos_membresia am
LEFT JOIN aulas_membresia a ON am.id = a.aluno_id
GROUP BY am.id, am.nome_completo, am.email, am.telefone, am.data_matricula, am.cidade;

-- =====================================================
-- COMENTÁRIOS NAS TABELAS
-- =====================================================

COMMENT ON TABLE usuarios IS 'Tabela de usuários do sistema com dados de autenticação e perfil';
COMMENT ON TABLE ministerios IS 'Tabela de ministérios da igreja';
COMMENT ON TABLE visitantes IS 'Tabela de visitantes cadastrados na recepção';
COMMENT ON TABLE novos_convertidos IS 'Tabela de novos convertidos';
COMMENT ON TABLE pessoas IS 'Tabela de pessoas cadastradas na gestão de pessoas';
COMMENT ON TABLE atribuicoes IS 'Tabela de atribuições de cargos e tipos de usuário';
COMMENT ON TABLE pessoa_estagios IS 'Relação muitos-para-muitos entre pessoas e estágios';
COMMENT ON TABLE pessoa_ministerios_lider IS 'Relação muitos-para-muitos entre pessoas e ministérios como líder';
COMMENT ON TABLE pessoa_ministerios_participante IS 'Relação muitos-para-muitos entre pessoas e ministérios como participante';
COMMENT ON TABLE entradas_financeiras IS 'Tabela de entradas financeiras (dízimos, ofertas, etc)';
COMMENT ON TABLE entrada_autores IS 'Relação muitos-para-muitos entre entradas e autores';
COMMENT ON TABLE saidas_financeiras IS 'Tabela de saídas financeiras';
COMMENT ON TABLE eventos IS 'Tabela de eventos da igreja';
COMMENT ON TABLE alunos_membresia IS 'Tabela de alunos de membresia';
COMMENT ON TABLE aulas_membresia IS 'Tabela de aulas concluídas pelos alunos de membresia';
COMMENT ON TABLE relatorios IS 'Tabela de relatórios gerados pelos ministérios';

-- =====================================================
-- FIM DO SCHEMA (VERSÃO SEGURA)
-- =====================================================
