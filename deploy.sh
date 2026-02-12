#!/bin/bash
# =====================================================
# SISTEMA IVN - Script de Deploy no Swarm
# =====================================================

set -e

STACK_NAME="sistema-ivn"
IMAGE_NAME="automacaodebaixocusto/sistema-igreja"
VERSION="${1:-v1.0.0}"

echo "======================================"
echo "Deploy Sistema IVN - Swarm"
echo "======================================"
echo "Stack: $STACK_NAME"
echo "Imagem: $IMAGE_NAME:$VERSION"
echo ""

# Verificar se .env.production existe
if [ ! -f ".env.production" ]; then
    echo "❌ Arquivo .env.production não encontrado!"
    echo "Copie .env.production.example e configure:"
    echo "  cp .env.production.example .env.production"
    exit 1
fi

# Verificar se está no Swarm
if ! docker info 2>/dev/null | grep -q "Swarm: active"; then
    echo "❌ Docker Swarm não está ativo!"
    echo "Inicialize o Swarm com: docker swarm init"
    exit 1
fi

# Verificar se a rede network_public existe
if ! docker network ls | grep -q "network_public"; then
    echo "⚠️  Rede network_public não encontrada!"
    echo "Criando rede..."
    docker network create --driver=overlay --attachable network_public
fi

# Atualizar imagem (opcional, se já existe localmente)
echo "📦 Baixando imagem $IMAGE_NAME:$VERSION..."
docker pull $IMAGE_NAME:$VERSION || echo "⚠️  Imagem não encontrada no registry (usando local)"

# Deploy da stack
echo ""
echo "🚀 Fazendo deploy da stack..."
docker stack deploy -c docker-stack.yml $STACK_NAME --env-file .env.production

echo ""
echo "✅ Deploy iniciado!"
echo ""
echo "Comandos úteis:"
echo "  Ver serviços:  docker stack services $STACK_NAME"
echo "  Ver logs:      docker service logs ${STACK_NAME}_app -f"
echo "  Ver réplicas:  docker service ps ${STACK_NAME}_app"
echo "  Remover stack: docker stack rm $STACK_NAME"
echo ""
echo "Acesse: https://ivn.exemplo.top"
