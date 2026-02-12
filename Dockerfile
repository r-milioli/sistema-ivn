# =====================================================
# SISTEMA IVN - Dockerfile (imagem única)
# Frontend React + Backend Node.js/Express
# =====================================================

# ---- Estágio 1: Build do Frontend React ----
FROM node:18-alpine AS frontend-build

WORKDIR /app/frontend

# Copiar apenas package.json primeiro para aproveitar cache de camadas
COPY frontend/package.json frontend/package-lock.json* ./

# Instalar dependências do frontend
RUN npm install --legacy-peer-deps

# Copiar o restante do código do frontend
COPY frontend/ ./

# Variável de build: a API estará no mesmo host em produção
ENV REACT_APP_API_URL=/api

# Build de produção do React
RUN npm run build


# ---- Estágio 2: Imagem final (Backend + Frontend buildado) ----
FROM node:18-alpine

LABEL maintainer="Sistema IVN"
LABEL description="Sistema de Gestão de Igreja - Frontend + Backend"

WORKDIR /app

# Instalar apenas as dependências de produção do backend
COPY backend/package.json backend/package-lock.json* ./

RUN npm install --omit=dev

# Copiar código do backend
COPY backend/src ./src

# Copiar o build do frontend para a pasta pública do backend
COPY --from=frontend-build /app/frontend/build ./public

# Criar diretório de uploads (persistido via volume)
RUN mkdir -p uploads

# Variáveis de ambiente padrão (podem ser sobrescritas)
ENV NODE_ENV=production
ENV PORT=5000

# Expor a porta do servidor
EXPOSE 5000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# Iniciar o servidor
CMD ["node", "src/server.js"]
