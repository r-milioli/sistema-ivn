-- Migração 006: Inserção de dados iniciais
-- Estágios, cargos e categorias financeiras padrão

-- Inserir estágios padrão
INSERT INTO estagios_usuario (nome, descricao, ordem) VALUES
('Visitante', 'Pessoa que visita a igreja mas ainda não se comprometeu', 1),
('Novo Convertido', 'Pessoa que acabou de se converter e está em discipulado', 2),
('Membro', 'Membro oficial da igreja', 3),
('Participante de Ministério', 'Membro que participa ativamente de um ou mais ministérios', 4),
('Líder', 'Membro que exerce liderança em ministério ou área', 5)
ON CONFLICT (nome) DO NOTHING;

-- Inserir cargos eclesiásticos padrão
INSERT INTO cargos (nome, descricao, hierarquia) VALUES
('Pastor', 'Pastor da igreja - liderança principal', 1),
('Evangelista', 'Evangelista - responsável por evangelização', 2),
('Presbítero', 'Presbítero - liderança eclesiástica', 3),
('Diácono', 'Diácono - serviço e auxílio na igreja', 4)
ON CONFLICT (nome) DO NOTHING;

-- Inserir categorias financeiras padrão - ENTRADAS
INSERT INTO categorias_financeiras (nome, tipo, descricao) VALUES
('Oferta', 'ENTRADA', 'Ofertas dos membros e visitantes'),
('Dízimo', 'ENTRADA', 'Dízimos dos membros'),
('Cantina', 'ENTRADA', 'Receitas da cantina/lanchonete'),
('Eventos', 'ENTRADA', 'Receitas de eventos (jantares, bazar, etc.)'),
('Doações', 'ENTRADA', 'Doações diversas'),
('Outras Entradas', 'ENTRADA', 'Outras receitas não categorizadas')
ON CONFLICT (nome) DO NOTHING;

-- Inserir categorias financeiras padrão - SAÍDAS
INSERT INTO categorias_financeiras (nome, tipo, descricao) VALUES
('Aluguel', 'SAIDA', 'Pagamento de aluguel do templo'),
('Salários', 'SAIDA', 'Pagamento de salários e encargos'),
('Manutenção', 'SAIDA', 'Manutenção e reparos'),
('Utilidades', 'SAIDA', 'Contas de água, luz, telefone, internet'),
('Material', 'SAIDA', 'Compra de materiais e suprimentos'),
('Eventos', 'SAIDA', 'Gastos com eventos'),
('Missões', 'SAIDA', 'Contribuições para missões'),
('Benevolência', 'SAIDA', 'Auxílios e ajuda a necessitados'),
('Outras Saídas', 'SAIDA', 'Outras despesas não categorizadas')
ON CONFLICT (nome) DO NOTHING;

