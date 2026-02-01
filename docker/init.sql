-- Script de inicialização do banco de dados
-- Este script é executado automaticamente quando o container PostgreSQL é criado pela primeira vez
-- Ele executa todas as migrações em ordem sequencial

-- Conectar ao banco de dados (já estamos conectados, mas é uma boa prática documentar)
\echo 'Iniciando execução das migrações...'

-- Executar migrações em ordem usando caminhos absolutos
\echo 'Executando migração 001: Criação de tabela de usuários...'
\i /docker-entrypoint-initdb.d/migrations/001_create_usuarios.sql

\echo 'Executando migração 002: Criação de tabelas de estágios...'
\i /docker-entrypoint-initdb.d/migrations/002_create_estagios.sql

\echo 'Executando migração 003: Criação de tabelas de ministérios e cargos...'
\i /docker-entrypoint-initdb.d/migrations/003_create_ministerios_cargos.sql

\echo 'Executando migração 004: Criação de relacionamentos de usuário...'
\i /docker-entrypoint-initdb.d/migrations/004_create_relacionamentos_usuario.sql

\echo 'Executando migração 005: Criação de tabelas de finanças...'
\i /docker-entrypoint-initdb.d/migrations/005_create_financas.sql

\echo 'Executando migração 006: Inserção de dados iniciais...'
\i /docker-entrypoint-initdb.d/migrations/006_insert_initial_data.sql

\echo 'Migrações concluídas com sucesso!'
\echo 'Banco de dados pronto para uso.'

