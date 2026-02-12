# Deploy em Produção - Docker Swarm

## Pré-requisitos

1. **Docker Swarm** inicializado no servidor
2. **Traefik** rodando no Swarm (rede `network_public`)
3. **PostgreSQL** rodando (pode ser container ou instalação nativa)
4. Banco de dados `igreja_db` criado e schema aplicado

---

## 1. Preparar o Banco de Dados

Se o PostgreSQL ainda não tem o schema, execute:

```bash
# Conectar no PostgreSQL
psql -h localhost -U postgres -d igreja_db

# Ou via arquivo SQL
psql -h localhost -U postgres -d igreja_db -f database_schema_jornada_unica.sql
```

---

## 2. Configurar Variáveis de Ambiente

Crie o arquivo `.env.production` na pasta do projeto:

```bash
cp .env.production.example .env.production
nano .env.production
```

Preencha com os dados reais:
- `DB_HOST` - IP ou hostname do PostgreSQL
- `DB_PASSWORD` - Senha do banco
- `JWT_SECRET` - Segredo forte (use `openssl rand -hex 32`)

---

## 3. Build e Push da Imagem (se necessário atualizar)

```bash
# Build da imagem
docker build -t automacaodebaixocusto/sistema-igreja:v1.0.0 .

# Login no Docker Hub
docker login

# Push da imagem
docker push automacaodebaixocusto/sistema-igreja:v1.0.0
```

---

## 4. Deploy da Stack no Swarm

```bash
# Deploy da stack
docker stack deploy -c docker-stack.yml sistema-ivn --env-file .env.production

# Verificar status
docker stack services sistema-ivn

# Ver logs
docker service logs sistema-ivn_app -f
```

---

## 5. Verificar Acesso

- URL: https://ivn.exemplo.top
- Health check: https://ivn.exemplo.top/api/health

---

## Comandos Úteis

### Ver replicas
```bash
docker service ps sistema-ivn_app
```

### Escalar serviço
```bash
docker service scale sistema-ivn_app=3
```

### Atualizar imagem (rolling update)
```bash
docker service update --image automacaodebaixocusto/sistema-igreja:v1.0.1 sistema-ivn_app
```

### Remover stack
```bash
docker stack rm sistema-ivn
```

### Ver logs de todas as réplicas
```bash
docker service logs sistema-ivn_app -f --tail 100
```

---

## Troubleshooting

### Verificar conectividade com o banco
```bash
docker exec -it $(docker ps -q -f name=sistema-ivn_app) sh
apk add postgresql-client
psql -h $DB_HOST -U $DB_USER -d $DB_NAME
```

### Verificar variáveis de ambiente
```bash
docker service inspect sistema-ivn_app --format='{{json .Spec.TaskTemplate.ContainerSpec.Env}}' | jq
```

### Reiniciar serviço
```bash
docker service update --force sistema-ivn_app
```

---

## Backup e Restore

### Backup do banco
```bash
pg_dump -h localhost -U postgres igreja_db > backup-$(date +%Y%m%d).sql
```

### Backup dos uploads
```bash
docker run --rm -v sistema-ivn_uploads:/data -v $(pwd):/backup alpine \
  tar czf /backup/uploads-backup-$(date +%Y%m%d).tar.gz -C /data .
```

### Restore
```bash
psql -h localhost -U postgres igreja_db < backup-20260212.sql
```

---

## Segurança

- [ ] Alterar senha padrão do PostgreSQL
- [ ] Usar `JWT_SECRET` forte (mínimo 32 caracteres)
- [ ] Configurar firewall para permitir apenas conexões necessárias
- [ ] Habilitar SSL no PostgreSQL
- [ ] Fazer backups regulares
- [ ] Monitorar logs e métricas
