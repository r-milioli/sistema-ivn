-- Script de inicialização do banco de dados
-- Este script executa todas as migrações em ordem sequencial
-- Execute este script para criar toda a estrutura do banco de dados

\echo 'Iniciando execução das migrações...'

-- Executar migrações em ordem
\echo 'Executando migração 001: Criação de tabela de usuários...'
\i migrations/001_create_usuarios.sql

\echo 'Executando migração 002: Criação de tabelas de estágios...'
\i migrations/002_create_estagios.sql

\echo 'Executando migração 003: Criação de tabelas de ministérios e cargos...'
\i migrations/003_create_ministerios_cargos.sql

\echo 'Executando migração 004: Criação de relacionamentos de usuário...'
\i migrations/004_create_relacionamentos_usuario.sql

\echo 'Executando migração 005: Criação de tabelas de finanças...'
\i migrations/005_create_financas.sql

\echo 'Executando migração 006: Inserção de dados iniciais...'
\i migrations/006_insert_initial_data.sql

\echo 'Executando migração 007: Adicionar campos de autenticação...'
\i migrations/007_add_auth_fields.sql

\echo 'Migrações concluídas com sucesso!'
\echo 'Banco de dados pronto para uso.'
