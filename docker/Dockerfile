# Dockerfile para PostgreSQL com estrutura de banco de dados da igreja
FROM postgres:16-alpine

# Manter o diretório de inicialização padrão do PostgreSQL
# O PostgreSQL executa automaticamente scripts .sql e .sh em /docker-entrypoint-initdb.d/

# Copiar scripts de migração para o diretório de inicialização
COPY migrations/ /docker-entrypoint-initdb.d/migrations/
COPY init.sql /docker-entrypoint-initdb.d/

# Garantir permissões corretas
RUN chmod -R 755 /docker-entrypoint-initdb.d/

# O PostgreSQL já tem o entrypoint configurado para executar scripts em /docker-entrypoint-initdb.d/
# Não precisamos modificar o CMD ou ENTRYPOINT

