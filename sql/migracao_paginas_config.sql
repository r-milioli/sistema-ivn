-- =====================================================
-- MIGRAÇÃO: CRIAR TABELA paginas_config
-- =====================================================
-- Execute este script no seu banco de dados PostgreSQL
-- para criar a tabela de configuração de páginas
-- =====================================================

-- Criar tabela de configuração de páginas
CREATE TABLE IF NOT EXISTS paginas_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rota VARCHAR(255) NOT NULL UNIQUE, -- Ex: '/recepcao', '/financas'
  nome VARCHAR(255) NOT NULL, -- Nome exibido: 'Recepção', 'Finanças'
  icone VARCHAR(100), -- Nome do ícone (opcional)
  pagina_visivel BOOLEAN DEFAULT TRUE, -- Se a página está acessível
  card_visivel BOOLEAN DEFAULT TRUE, -- Se o card aparece no dashboard
  ordem INTEGER DEFAULT 0, -- Ordem de exibição no dashboard
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_paginas_config_rota ON paginas_config(rota);
CREATE INDEX IF NOT EXISTS idx_paginas_config_ativo ON paginas_config(ativo);
CREATE INDEX IF NOT EXISTS idx_paginas_config_card_visivel ON paginas_config(card_visivel);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_paginas_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_paginas_config_updated_at ON paginas_config;
CREATE TRIGGER update_paginas_config_updated_at
  BEFORE UPDATE ON paginas_config
  FOR EACH ROW
  EXECUTE FUNCTION update_paginas_config_updated_at();

-- Inserir páginas padrão (se não existirem)
INSERT INTO paginas_config (rota, nome, icone, pagina_visivel, card_visivel, ordem) VALUES
  ('/recepcao', 'Recepção', 'Handshake', TRUE, TRUE, 1),
  ('/financas', 'Finanças', 'Wallet', TRUE, TRUE, 2),
  ('/gestao-pessoas', 'Gestão de Pessoas', 'UserCog', TRUE, TRUE, 3),
  ('/integracao', 'Integração', 'Users', TRUE, TRUE, 4),
  ('/eventos', 'Eventos', 'Calendar', TRUE, TRUE, 5),
  ('/membresia', 'Membresia', 'UserCheck', TRUE, TRUE, 6),
  ('/batismo', 'Batismo', 'Droplet', TRUE, TRUE, 7),
  ('/relatorio', 'Relatório', 'FileText', TRUE, TRUE, 8),
  ('/ficha-membros', 'Ficha de Membros', 'ClipboardList', TRUE, TRUE, 9),
  ('/config-system', 'Config System', 'Server', TRUE, TRUE, 10),
  ('/configuracoes', 'Configurações', 'Settings', TRUE, TRUE, 11),
  ('/louvor', 'Louvor', 'Music', TRUE, TRUE, 12),
  ('/acao-social', 'Ação Social', 'HeartHandshake', TRUE, TRUE, 13),
  ('/obreiros', 'Obreiros', 'Hammer', TRUE, TRUE, 14),
  ('/adolescentes', 'Adolescentes', 'Smile', TRUE, TRUE, 15),
  ('/jovens', 'Jovens', 'Sparkles', TRUE, TRUE, 16),
  ('/casais', 'Casais', 'Heart', TRUE, TRUE, 17),
  ('/amos', 'Amós', 'BookOpen', TRUE, TRUE, 18),
  ('/radical', 'Radical', 'Zap', TRUE, TRUE, 19),
  ('/midia', 'Mídia', 'Video', TRUE, TRUE, 20),
  ('/kids', 'Kids', 'Baby', TRUE, TRUE, 21),
  ('/pedal', 'Pedal', 'Bike', TRUE, TRUE, 22),
  ('/visitacao', 'Visitação', 'Home', TRUE, TRUE, 23),
  ('/melhor-idade', 'Melhor Idade', 'Crown', TRUE, TRUE, 24),
  ('/espaco-gourmet', 'Espaço Gourmet', 'ChefHat', TRUE, TRUE, 25),
  ('/som', 'Som', 'Radio', TRUE, TRUE, 26),
  ('/missoes', 'Missões', 'Globe', TRUE, TRUE, 27),
  ('/sentinelas', 'Sentinelas', 'Shield', TRUE, TRUE, 28),
  ('/acolhimento', 'Acolhimento', 'UsersRound', TRUE, TRUE, 29),
  ('/juniores', 'Juniores', 'UserCircle', TRUE, TRUE, 30),
  ('/danca', 'Dança', 'Activity', TRUE, TRUE, 31),
  ('/intercessao', 'Intercessão', 'MessageCircle', TRUE, TRUE, 32),
  ('/libertacao', 'Libertação', 'Cross', TRUE, TRUE, 33),
  ('/edb', 'EDB', 'GraduationCap', TRUE, TRUE, 34),
  ('/cafe-com-graca', 'Café com Graça', 'Coffee', TRUE, TRUE, 35),
  ('/homens', 'Homens', 'User', TRUE, TRUE, 36),
  ('/mulheres', 'Mulheres', 'UserRound', TRUE, TRUE, 37),
  ('/jovem-casais', 'Jovem Casais', 'HeartPulse', TRUE, TRUE, 38),
  ('/teatro', 'Teatro', 'Drama', TRUE, TRUE, 39),
  ('/coral', 'Coral', 'Mic', TRUE, TRUE, 40)
ON CONFLICT (rota) DO NOTHING;

-- Verificar se a tabela foi criada corretamente
SELECT 
  COUNT(*) as total_paginas,
  COUNT(CASE WHEN pagina_visivel = TRUE THEN 1 END) as paginas_visiveis,
  COUNT(CASE WHEN card_visivel = TRUE THEN 1 END) as cards_visiveis
FROM paginas_config;

-- Mostrar algumas páginas para confirmar
SELECT rota, nome, pagina_visivel, card_visivel, ordem
FROM paginas_config
ORDER BY ordem
LIMIT 10;
