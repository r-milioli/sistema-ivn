# Sistema IVN - Gestão de Igreja

Sistema completo de gestão para igrejas com funcionalidades de:
- 👥 Gestão de membros e visitantes
- 📋 Recepção e integração
- 💰 Controle financeiro
- 📊 Relatórios e estatísticas
- 🎓 Acompanhamento de membresia e batismo
- 📅 Gestão de eventos

## Tecnologias

- **Frontend:** React 18 + Tailwind CSS + shadcn/ui
- **Backend:** Node.js + Express
- **Banco de Dados:** PostgreSQL
- **Autenticação:** JWT
- **Deploy:** Docker + Swarm

---

## Desenvolvimento Local

### Pré-requisitos
- Node.js 18+
- PostgreSQL 12+
- npm ou yarn

### Setup

1. **Clone o repositório**
```bash
git clone <repo-url>
cd sistema-ivn
```

2. **Instale dependências**
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

3. **Configure o banco de dados**
```bash
# Crie o banco
createdb igreja_db

# Execute o schema
psql -d igreja_db -f database_schema_jornada_unica.sql
```

4. **Configure variáveis de ambiente**
```bash
# Backend
cd backend
cp env.example .env
# Edite .env com suas configurações

# Frontend
cd ../frontend
cp env.example .env
# Edite .env (API_URL: http://localhost:5000/api)
```

5. **Inicie os serviços**
```bash
# Backend (em um terminal)
cd backend
npm run dev

# Frontend (em outro terminal)
cd frontend
npm start
```

Acesse: http://localhost:3000

---

## Docker (Desenvolvimento)

### Usando Docker Compose

```bash
# Subir tudo (app + banco)
docker compose up -d

# Ver logs
docker compose logs -f

# Parar
docker compose down

# Resetar banco (apagar dados)
docker compose down -v
```

Acesse: http://localhost:3000

---

## Deploy em Produção (Docker Swarm)

Veja instruções completas em [DEPLOY.md](./DEPLOY.md)

### Quick Start

1. **Configure variáveis de ambiente**
```bash
cp .env.production.example .env.production
nano .env.production
```

2. **Deploy da stack**
```bash
chmod +x deploy.sh
./deploy.sh v1.0.0
```

3. **Verifique o status**
```bash
docker stack services sistema-ivn
docker service logs sistema-ivn_app -f
```

Acesse: https://ivn.exemplo.top

---

## Build da Imagem Docker

```bash
# Build local
docker build -t automacaodebaixocusto/sistema-igreja:v1.0.0 .

# Push para registry
docker push automacaodebaixocusto/sistema-igreja:v1.0.0
```

---

## Estrutura do Projeto

```
sistema-ivn/
├── backend/              # API Node.js/Express
│   ├── src/
│   │   ├── server.js    # Entry point
│   │   ├── app.js       # Express config
│   │   ├── config/      # Database config
│   │   ├── controllers/ # Business logic
│   │   ├── routes/      # API routes
│   │   ├── middleware/  # Auth & validation
│   │   └── utils/       # Helpers
│   └── package.json
├── frontend/             # React SPA
│   ├── src/
│   │   ├── pages/       # Page components
│   │   ├── components/  # Reusable components
│   │   ├── services/    # API client
│   │   └── context/     # Auth & Theme
│   └── package.json
├── database_schema_jornada_unica.sql  # Schema completo
├── Dockerfile            # Build multi-stage
├── docker-compose.yml    # Dev environment
├── docker-stack.yml      # Production (Swarm)
└── DEPLOY.md            # Deploy guide
```

---

## API Endpoints

### Autenticação
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registro
- `GET /api/auth/me` - Usuário atual

### Pessoas
- `GET /api/pessoas` - Listar pessoas
- `POST /api/pessoas` - Criar pessoa
- `PUT /api/pessoas/:id` - Atualizar pessoa
- `DELETE /api/pessoas/:id` - Excluir pessoa

### Finanças
- `GET /api/financas/entradas` - Listar entradas
- `POST /api/financas/entradas` - Criar entrada
- `GET /api/financas/saidas` - Listar saídas
- `POST /api/financas/saidas` - Criar saída

### Eventos
- `GET /api/eventos` - Listar eventos
- `POST /api/eventos` - Criar evento

*Veja mais endpoints na documentação da API*

---

## Variáveis de Ambiente

### Backend
- `NODE_ENV` - Environment (development/production)
- `PORT` - Porta do servidor (padrão: 5000)
- `DB_HOST` - Host do PostgreSQL
- `DB_PORT` - Porta do PostgreSQL
- `DB_NAME` - Nome do banco
- `DB_USER` - Usuário do banco
- `DB_PASSWORD` - Senha do banco
- `JWT_SECRET` - Segredo para JWT
- `JWT_EXPIRES_IN` - Expiração do token (ex: 7d)

### Frontend (build)
- `REACT_APP_API_URL` - URL da API

---

## Licença

Proprietary - Todos os direitos reservados

---

## Suporte

Para dúvidas ou problemas, abra uma issue no repositório.
