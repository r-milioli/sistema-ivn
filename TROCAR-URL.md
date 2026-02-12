# Como Trocar a URL de Acesso - Sistema IVN

Guia rápido para alterar a URL/domínio do sistema.

## Checklist de Alterações

### 1. DNS (no provedor de domínio)
Configure o DNS do novo domínio para apontar para o IP do servidor:
- Tipo: **A** ou **CNAME**
- Nome: `@` ou `novo-dominio.com`
- Valor: IP do servidor (ex: `123.45.67.89`)
- TTL: 300 (5 minutos) ou padrão

### 2. Variável FRONTEND_URL
**Arquivo:** `.env` ou `.env.production` no servidor

```env
FRONTEND_URL=https://novo-dominio.com
```

Ou exporte antes do deploy:
```bash
export FRONTEND_URL=https://novo-dominio.com
```

**O que isso afeta:**
- Links de redefinição de senha nos emails

### 3. Docker Stack (Traefik)
**Arquivo:** `docker-stack.yml`

Altere o label do Traefik:
```yaml
labels:
  - "traefik.http.routers.sistema-ivn.rule=Host(`novo-dominio.com`)"
```

**O que isso afeta:**
- Roteamento HTTP/HTTPS (é o mais importante!)
- Certificado SSL (Traefik vai solicitar um novo via Let's Encrypt)

### 4. Variáveis S3 (se usar URL pública do MinIO)
Se você configurou `S3_PUBLIC_URL` ou se o MinIO está em subdomínio, ajuste:
```env
S3_PUBLIC_URL=https://minio.novo-dominio.com
```

## Comandos para Aplicar

### Opção 1: Com variável de ambiente (recomendado)
```bash
# No servidor
export FRONTEND_URL=https://novo-dominio.com

# Edite docker-stack.yml manualmente para trocar Host()

# Atualize a stack
docker stack deploy -c docker-stack.yml sistema-ivn

# Aguarde Traefik solicitar novo certificado SSL (~30 segundos)
```

### Opção 2: Com arquivo .env
```bash
# Crie .env.production com FRONTEND_URL=https://novo-dominio.com
# Edite docker-stack.yml para trocar Host()

docker stack deploy -c docker-stack.yml --env-file .env.production sistema-ivn
```

### Opção 3: Update direto no serviço (se já estiver rodando)
```bash
# Atualizar variável de ambiente
docker service update sistema-ivn_app --env-add FRONTEND_URL=https://novo-dominio.com

# Mas ainda precisa editar docker-stack.yml e redesenhar para Traefik pegar novo Host()
docker stack deploy -c docker-stack.yml sistema-ivn
```

## Verificação

### 1. Teste o acesso
```bash
curl -I https://novo-dominio.com
# Deve retornar 200 ou redirecionar para /login
```

### 2. Verifique o certificado SSL
```bash
curl -vI https://novo-dominio.com 2>&1 | grep "subject:"
# Deve mostrar o certificado emitido para novo-dominio.com
```

### 3. Teste redefinição de senha
1. Acesse `https://novo-dominio.com/forgot-password`
2. Solicite recuperação de senha
3. Verifique se o link no email aponta para `https://novo-dominio.com/forgot-password?token=...`

## Observações Importantes

⚠️ **Traefik Host() é OBRIGATÓRIO** - Sem alterar esse label, o sistema não vai aceitar requisições no novo domínio.

⚠️ **Certificado SSL** - Traefik vai solicitar um novo certificado automaticamente. Aguarde ~30 segundos após o deploy.

⚠️ **DNS** - A mudança de DNS pode levar de 5 minutos a 24 horas para propagar (depende do TTL).

⚠️ **FRONTEND_URL** - Afeta apenas emails. Se você não usa emails, não precisa alterar.

## Exemplo Completo

**Antes:**
```yaml
# docker-stack.yml
FRONTEND_URL: ${FRONTEND_URL:-https://ivn.exemplo.top}
# ...
labels:
  - "traefik.http.routers.sistema-ivn.rule=Host(`ivn.exemplo.top`)"
```

**Depois:**
```yaml
# docker-stack.yml
FRONTEND_URL: ${FRONTEND_URL:-https://minha-igreja.com.br}
# ...
labels:
  - "traefik.http.routers.sistema-ivn.rule=Host(`minha-igreja.com.br`)"
```

```bash
# .env.production ou export
export FRONTEND_URL=https://minha-igreja.com.br

# Deploy
docker stack deploy -c docker-stack.yml sistema-ivn
```

## Rollback (voltar URL antiga)

Se algo der errado, basta reverter as alterações e fazer deploy novamente:
```bash
export FRONTEND_URL=https://url-antiga.com
# Edite docker-stack.yml de volta
docker stack deploy -c docker-stack.yml sistema-ivn
```
