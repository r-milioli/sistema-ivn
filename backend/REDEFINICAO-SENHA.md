# Redefinição de Senha - Sistema IVN

Sistema completo de recuperação/redefinição de senha via email com token temporário.

## Fluxo Completo

1. **Usuário esquece a senha** → Acessa `/forgot-password` no frontend
2. **Solicita recuperação** → Backend gera token único válido por 1 hora
3. **Recebe email** → Com link contendo o token: `https://seu-site.com/forgot-password?token=xxx`
4. **Clica no link** → Frontend abre formulário de redefinição
5. **Define nova senha** → Backend valida token e atualiza senha
6. **Redireciona para login** → Usuário pode fazer login com a nova senha

## Variáveis de Ambiente

### Backend

```env
# SMTP (obrigatório para enviar emails)
SMTP_ENABLED=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-de-app
SMTP_FROM="Sistema IVN <noreply@suaigreja.com>"

# URL do frontend (para gerar link no email)
FRONTEND_URL=https://ivn.exemplo.top
```

### Nota sobre FRONTEND_URL

- **Produção**: Use o domínio real (ex: `https://ivn.exemplo.top`)
- **Desenvolvimento**: Use `http://localhost:3000`
- O link no email será: `${FRONTEND_URL}/forgot-password?token=xxx`

## API

### 1. Solicitar Redefinição

**Rota:** `POST /api/auth/forgot-password`

**Body:**
```json
{
  "email": "usuario@exemplo.com"
}
```

**Resposta (sucesso):**
```json
{
  "message": "Se o email existir, você receberá instruções para recuperar sua senha"
}
```

**Observações:**
- Sempre retorna sucesso (não revela se email existe ou não - segurança)
- Gera token válido por 1 hora
- Envia email automaticamente (se SMTP configurado)
- Em desenvolvimento, retorna também `token` e `resetUrl` no JSON

### 2. Redefinir Senha

**Rota:** `POST /api/auth/reset-password`

**Body:**
```json
{
  "token": "abc123...token-do-email",
  "senha": "novaSenha123"
}
```

**Resposta (sucesso):**
```json
{
  "message": "Senha redefinida com sucesso"
}
```

**Erros:**
- `400` - Token inválido
- `400` - Token expirado (solicitar nova recuperação)
- `400` - Senha muito curta (mínimo 6 caracteres)

## Banco de Dados

A tabela `credenciais_acesso` já possui os campos necessários:

```sql
CREATE TABLE credenciais_acesso (
  id SERIAL PRIMARY KEY,
  pessoa_id INTEGER NOT NULL UNIQUE REFERENCES pessoas(id),
  senha_hash VARCHAR(255) NOT NULL,
  
  -- Recuperação de senha
  token_recuperacao VARCHAR(255),
  token_recuperacao_expira TIMESTAMP,
  
  ...
);
```

## Frontend

### Páginas

1. **`/forgot-password`** (sem token na URL)
   - Formulário: solicitar recuperação por email
   - Componente: `ForgotPassword/ForgotPassword.jsx`

2. **`/forgot-password?token=xxx`** (com token na URL)
   - Formulário: definir nova senha
   - Mesmo componente, detecta token e muda modo

### Adicionar Link no Login

No `Login.jsx`, adicione:

```jsx
<Link to="/forgot-password">Esqueceu sua senha?</Link>
```

Exemplo completo:

```jsx
<div className="login-links">
  <Link to="/forgot-password">Esqueceu sua senha?</Link>
  <span> | </span>
  <Link to="/register">Criar conta</Link>
</div>
```

## Template do Email

O email enviado contém:

- **Assunto:** "Redefinição de Senha - Sistema IVN"
- **Conteúdo:**
  - Saudação personalizada (nome da pessoa)
  - Botão com link de redefinição
  - Link em texto (caso botão não funcione)
  - Aviso de expiração (1 hora)
  - Nota sobre segurança (ignorar se não solicitou)

## Segurança

✅ **Token único e aleatório** (32 bytes, hex) - Praticamente impossível adivinhar  
✅ **Expiração de 1 hora** - Token inválido após 60 minutos  
✅ **Token descartado após uso** - Não pode reutilizar o mesmo token  
✅ **Não revela se email existe** - Mesma resposta para email válido ou inválido  
✅ **Senha hasheada** - Armazenada com bcrypt  
✅ **Token no banco** - Validado antes de trocar senha  

## Teste Manual

### 1. Configurar SMTP

No `.env`:
```env
SMTP_ENABLED=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu-email@gmail.com
SMTP_PASS=senha-de-app-do-gmail
SMTP_FROM="Sistema IVN <noreply@exemplo.com>"
FRONTEND_URL=http://localhost:3000
```

### 2. Testar Solicitação

**Frontend:**
1. Acesse `http://localhost:3000/forgot-password`
2. Digite um email de usuário existente
3. Clique em "Enviar Instruções"
4. Verifique a caixa de entrada do email

**API (curl):**
```bash
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"usuario@exemplo.com"}'
```

### 3. Testar Redefinição

**Frontend:**
1. Abra o link recebido no email (ou use o console em dev)
2. Digite nova senha (mínimo 6 caracteres)
3. Confirme a senha
4. Clique em "Redefinir Senha"
5. Aguarde redirecionamento para login
6. Faça login com a nova senha

**API (curl):**
```bash
curl -X POST http://localhost:5000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token":"abc123...token-do-email","senha":"novaSenha123"}'
```

## Troubleshooting

### Email não chega

1. **Confira SMTP_ENABLED** → deve ser `true`
2. **Confira credenciais** → SMTP_USER e SMTP_PASS corretos
3. **Gmail: use App Password** → não use a senha normal da conta
4. **Verifique spam** → email pode estar na pasta de spam
5. **Veja logs** → procure por `[Auth] Email de redefinição enviado` ou erros

### Token expirado

- Token válido por 1 hora
- Solicite nova recuperação se passou do tempo

### Token inválido

- Verifique se copiou o token completo do email/URL
- Cada token só pode ser usado uma vez
- Após trocar senha, o token é descartado

### Erro ao enviar email (desenvolvimento)

- Em desenvolvimento, o token e resetUrl aparecem no console e na resposta JSON
- Você pode testar copiando o link do console mesmo sem email configurado

## Próximas Melhorias

- [ ] Limitar tentativas de recuperação por IP (rate limiting)
- [ ] Histórico de trocas de senha
- [ ] Notificação por email quando senha for alterada
- [ ] Autenticação de dois fatores (2FA)
- [ ] Perguntas de segurança como alternativa ao email
