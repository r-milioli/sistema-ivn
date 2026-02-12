# Guia de Instalação - Sistema IVN

Este guia explica como configurar e executar o sistema de gestão de igreja.

## Pré-requisitos

- Node.js (versão 16 ou superior)
- PostgreSQL (versão 12 ou superior)
- npm ou yarn

## Configuração do Banco de Dados

1. **Criar o banco de dados:**
   ```bash
   psql -U postgres
   ```
   
   Dentro do psql:
   ```sql
   CREATE DATABASE igreja_db;
   CREATE USER igreja_user WITH PASSWORD '123456';
   GRANT ALL PRIVILEGES ON DATABASE igreja_db TO igreja_user;
   \q
   ```

2. **Executar as migrações:**
   ```bash
   psql -U igreja_user -d igreja_db -f init_database.sql
   ```

## Configuração do Backend

1. **Navegar para a pasta do backend:**
   ```bash
   cd backend
   ```

2. **Instalar dependências:**
   ```bash
   npm install
   ```

3. **Configurar variáveis de ambiente:**
   - Copie o arquivo `env.example` para `.env`:
     ```bash
     cp env.example .env
     ```
   - Edite o arquivo `.env` com suas configurações:
     ```
     DB_HOST=localhost
     DB_PORT=5432
     DB_NAME=igreja_db
     DB_USER=igreja_user
     DB_PASSWORD=igreja_password
     JWT_SECRET=seu_jwt_secret_aqui_mude_em_producao
     JWT_EXPIRES_IN=7d
     PORT=5000
     NODE_ENV=development
     ```

4. **Iniciar o servidor:**
   ```bash
   npm start
   ```
   
   Ou em modo desenvolvimento (com nodemon):
   ```bash
   npm run dev
   ```

   O servidor estará rodando em `http://localhost:5000`

## Configuração do Frontend

1. **Navegar para a pasta do frontend:**
   ```bash
   cd frontend
   ```

2. **Instalar dependências:**
   ```bash
   npm install
   ```

3. **Configurar variáveis de ambiente:**
   - Crie um arquivo `.env` na pasta `frontend`:
     ```
     REACT_APP_API_URL=http://localhost:5000/api
     ```

4. **Iniciar o servidor de desenvolvimento:**
   ```bash
   npm start
   ```

   A aplicação estará rodando em `http://localhost:3000`

## Estrutura do Projeto

```
sistema-ivn/
├── backend/              # API Node.js/Express
│   ├── src/
│   │   ├── config/      # Configurações (banco de dados)
│   │   ├── controllers/ # Lógica de negócio
│   │   ├── middleware/  # Middlewares (auth, validação)
│   │   ├── routes/      # Rotas da API
│   │   └── utils/       # Utilitários (JWT, password)
│   ├── .env            # Variáveis de ambiente (não versionado)
│   └── package.json
├── frontend/            # Aplicação React
│   ├── src/
│   │   ├── components/ # Componentes reutilizáveis
│   │   ├── context/    # Context API (AuthContext)
│   │   ├── pages/      # Páginas da aplicação
│   │   ├── services/   # Serviços (API client)
│   │   └── utils/      # Utilitários
│   ├── .env           # Variáveis de ambiente (não versionado)
│   └── package.json
└── migrations/         # Migrações do banco de dados
```

## Funcionalidades Implementadas

### Autenticação
- ✅ Login
- ✅ Criar conta
- ✅ Recuperar senha
- ✅ Redefinir senha com token
- ✅ Proteção de rotas

### Páginas
- ✅ Página de Login
- ✅ Página de Registro
- ✅ Página de Recuperação de Senha
- ✅ Dashboard (página em branco, pronta para customização)

## Endpoints da API

### Públicos
- `POST /api/auth/register` - Criar nova conta
- `POST /api/auth/login` - Fazer login
- `POST /api/auth/forgot-password` - Solicitar recuperação de senha
- `POST /api/auth/reset-password` - Redefinir senha com token

### Protegidos (requerem autenticação)
- `GET /api/auth/me` - Obter dados do usuário autenticado

## Próximos Passos

Após a instalação, você pode:
1. Testar o fluxo completo de autenticação
2. Personalizar o dashboard conforme necessário
3. Adicionar novas funcionalidades ao sistema

## Notas Importantes

- Em desenvolvimento, o token de recuperação de senha é exibido no console do backend
- Em produção, configure um serviço de email para envio de tokens
- Altere o `JWT_SECRET` para um valor seguro em produção
- Configure CORS adequadamente se o frontend estiver em outro domínio
