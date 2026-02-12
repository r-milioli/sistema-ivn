#!/bin/bash
# =====================================================
# SISTEMA IVN - Inicializar Banco de Dados
# =====================================================

set -e

echo "======================================"
echo "Inicializando Banco de Dados"
echo "======================================"

# Verificar se o container do banco está rodando
if ! docker compose ps db | grep -q "Up"; then
    echo "❌ Container do banco não está rodando!"
    echo "Execute: docker compose up -d db"
    exit 1
fi

echo "📦 Aplicando schema do banco..."
echo ""

# Executar o SQL no container do PostgreSQL
docker compose exec -T db psql -U postgres -d igreja_db < database_schema_jornada_unica.sql

echo ""
echo "✅ Schema aplicado com sucesso!"
echo ""
echo "Testando conexão..."
docker compose exec db psql -U postgres -d igreja_db -c "SELECT COUNT(*) as total_tables FROM information_schema.tables WHERE table_schema = 'public';"

echo ""
echo "Pronto! Reinicie a aplicação se necessário:"
echo "  docker compose restart app"
