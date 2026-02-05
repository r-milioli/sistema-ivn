# Banco de Dados - Sistema de Gestão de Igreja

Estrutura de banco de dados PostgreSQL para sistema de gestão de igreja, com execução manual de migrações.

## Estrutura do Projeto

```
sistema-ivn/
├── migrations/
│   ├── 001_create_usuarios.sql
│   ├── 002_create_estagios.sql
│   ├── 003_create_ministerios_cargos.sql
│   ├── 004_create_relacionamentos_usuario.sql
│   ├── 005_create_financas.sql
│   └── 006_insert_initial_data.sql
├── init_database.sql      # Script para executar todas as migrações
└── README.md
```

## Estrutura do Banco de Dados

### Tabelas de Usuários

- **`usuarios`**: Dados básicos dos membros (nome, email, telefone, CPF, endereço, etc.)
- **`estagios_usuario`**: Tipos de estágios (Visitante, Novo Convertido, Membro, etc.)
- **`usuario_estagio`**: Histórico de estágios dos usuários ao longo do tempo

### Tabelas de Ministérios e Cargos

- **`ministerios`**: Ministérios da igreja (Louvor, Jovens, Crianças, etc.)
- **`cargos`**: Cargos eclesiásticos (Pastor, Presbítero, Diácono, Evangelista)
- **`usuario_ministerio`**: Participação dos usuários em ministérios (com histórico)
- **`usuario_cargo`**: Cargos ocupados pelos usuários (com histórico)

### Tabelas de Finanças

- **`categorias_financeiras`**: Categorias para classificar transações (Oferta, Dízimo, Cantina, etc.)
- **`transacoes_financeiras`**: Registro de todas as transações financeiras (entradas e saídas)

#### Regras de Negócio - Transações Financeiras

- **Ofertas**: Podem ser anônimas (`usuario_id` pode ser NULL)
- **Dízimos**: **Obrigatoriamente** devem ter um usuário associado (`usuario_id` não pode ser NULL)
- **Outras categorias**: Podem ter ou não usuário associado, conforme necessário

Essa validação é garantida por um trigger no banco de dados que impede a inserção ou atualização de dízimos sem usuário associado.

## Diagrama de Relacionamento (Simplificado)

```
usuarios
  ├── usuario_estagio → estagios_usuario
  ├── usuario_ministerio → ministerios
  ├── usuario_cargo → cargos
  └── transacoes_financeiras → categorias_financeiras
```

## Como Usar

### Pré-requisitos

- PostgreSQL instalado localmente (versão 12 ou superior)
- Acesso ao PostgreSQL via linha de comando (psql) ou cliente gráfico

### Instalação do PostgreSQL

**Windows:**
- Baixe e instale o PostgreSQL em: https://www.postgresql.org/download/windows/
- Durante a instalação, defina uma senha para o usuário `postgres`

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

**macOS:**
```bash
brew install postgresql
brew services start postgresql
```

### Configuração Inicial

1. **Criar o banco de dados:**
   ```bash
   psql -U postgres
   ```
   
   Dentro do psql, execute:
   ```sql
   CREATE DATABASE igreja_db;
   CREATE USER postgres WITH PASSWORD '123456';
   GRANT ALL PRIVILEGES ON DATABASE igreja_db TO postgres;
   \q
   ```

2. **Executar as migrações:**
   
   **Opção 1: Usando o script init_database.sql (recomendado)**
   
   Execute o script a partir do diretório raiz do projeto:
   ```bash
   psql -U postgres -d igreja_db -f init_database.sql
   ```
   
   **Opção 2: Executando migrações individualmente**
   
   Execute cada migração em ordem:
   ```bash
   psql -U postgres -d igreja_db -f migrations/001_create_usuarios.sql
   psql -U postgres -d igreja_db -f migrations/002_create_estagios.sql
   psql -U postgres -d igreja_db -f migrations/003_create_ministerios_cargos.sql
   psql -U postgres -d igreja_db -f migrations/004_create_relacionamentos_usuario.sql
   psql -U postgres -d igreja_db -f migrations/005_create_financas.sql
   psql -U postgres -d igreja_db -f migrations/006_insert_initial_data.sql
   ```
   
   **Opção 3: Executando dentro do psql**
   
   Conecte-se ao banco e execute:
   ```bash
   psql -U postgres -d igreja_db
   ```
   
   Dentro do psql:
   ```sql
   \i init_database.sql
   ```

### Conexão ao Banco de Dados

**Credenciais padrão:**
- Host: `localhost`
- Porta: `5432`
- Usuário: `postgres`
- Senha: `123456`
- Banco: `igreja_db`

**String de conexão:**
```
postgresql://postgres:123456@localhost:5432/igreja_db
```

### Exemplos de Uso

**Conectar via psql:**
```bash
psql -U postgres -d igreja_db
```

**Conectar via cliente externo:**
Use qualquer cliente PostgreSQL (pgAdmin, DBeaver, etc.) com as credenciais acima.

## Dados Iniciais

O sistema já vem com os seguintes dados pré-configurados:

### Estágios de Usuário
- Visitante
- Novo Convertido
- Membro
- Participante de Ministério
- Líder

### Cargos Eclesiásticos
- Pastor (hierarquia 1)
- Evangelista (hierarquia 2)
- Presbítero (hierarquia 3)
- Diácono (hierarquia 4)

### Categorias Financeiras - Entradas
- Oferta
- Dízimo
- Cantina
- Eventos
- Doações
- Outras Entradas

### Categorias Financeiras - Saídas
- Aluguel
- Salários
- Manutenção
- Utilidades
- Material
- Eventos
- Missões
- Benevolência
- Outras Saídas

## Características Técnicas

- **Normalização**: Estrutura 3NF para evitar redundâncias
- **Histórico**: Tabelas de relacionamento permitem rastrear mudanças ao longo do tempo
- **Flexibilidade**: Fácil adicionar novos estágios, ministérios, cargos e categorias
- **Performance**: Índices em campos frequentemente consultados
- **Integridade**: Foreign keys e constraints para garantir consistência

## Comandos Úteis

**Conectar ao banco:**
```bash
psql -U postgres -d igreja_db
```

**Backup do banco:**
```bash
pg_dump -U postgres -d igreja_db > backup.sql
```

**Restaurar backup:**
```bash
psql -U postgres -d igreja_db < backup.sql
```

**Listar todas as tabelas:**
```sql
\dt
```

**Descrever estrutura de uma tabela:**
```sql
\d nome_da_tabela
```

**Sair do psql:**
```sql
\q
```

## Estrutura de Migrações

Para adicionar novas migrações:

1. Crie um novo arquivo SQL em `migrations/` com numeração sequencial (ex: `007_nova_tabela.sql`)
2. Adicione a referência no arquivo `init_database.sql`
3. Execute a nova migração:
   ```bash
   psql -U postgres -d igreja_db -f migrations/007_nova_tabela.sql
   ```

**Nota:** Sempre execute as migrações em ordem sequencial para manter a integridade dos dados.

## Segurança

⚠️ **Importante:** As credenciais padrão são apenas para desenvolvimento. Em produção:

1. Altere as credenciais do banco de dados
2. Use senhas fortes
3. Configure firewall adequadamente
4. Use SSL/TLS para conexões
5. Limite permissões de usuários conforme necessário

## Suporte e Evolução

Esta estrutura foi projetada para evoluir com o tempo. Novas tabelas e funcionalidades podem ser adicionadas através de migrações sequenciais, mantendo a integridade e histórico dos dados.
