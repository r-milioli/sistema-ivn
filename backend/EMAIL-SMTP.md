# Integração SMTP - Sistema IVN

Envio de emails via SMTP genérico (Gmail, SendGrid, Mailgun, servidor próprio, etc.) usando **Nodemailer**.

## Variáveis de Ambiente

Configure no `.env` ou na stack do Docker:

```env
# SMTP para envio de emails
SMTP_ENABLED=true                                    # Habilitar envio de emails
SMTP_HOST=smtp.gmail.com                             # Host do servidor SMTP
SMTP_PORT=587                                        # Porta (587=TLS, 465=SSL, 25=sem criptografia)
SMTP_SECURE=false                                    # true para SSL (porta 465), false para TLS
SMTP_USER=seu-email@gmail.com                        # Usuário/email para autenticação
SMTP_PASS=sua-senha-ou-app-password                  # Senha ou App Password
SMTP_FROM="Sistema IVN <noreply@suaigreja.com>"     # Email remetente
```

## Configurações Comuns

### Gmail

1. **Ative a verificação em 2 etapas** na sua conta Google
2. **Crie uma senha de app**: https://myaccount.google.com/apppasswords
3. Configure:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=seu-email@gmail.com
   SMTP_PASS=senha-de-app-de-16-digitos
   ```

### SendGrid

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=SG.sua-api-key-aqui
SMTP_FROM="Sistema IVN <noreply@seudominio.com>"
```

### Mailgun

```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=postmaster@seu-dominio.mailgun.org
SMTP_PASS=sua-senha-mailgun
```

### Servidor SMTP Próprio

```env
SMTP_HOST=mail.seudominio.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@seudominio.com
SMTP_PASS=senha-do-email
```

## API - Enviar Email de Teste

**Rota:** `POST /api/email/test` (somente admin)

**Body:**
```json
{
  "to": "destinatario@exemplo.com"
}
```

**Resposta (sucesso):**
```json
{
  "message": "Email de teste enviado com sucesso",
  "messageId": "<id-do-email>",
  "to": "destinatario@exemplo.com"
}
```

**Teste com curl:**
```bash
curl -X POST http://localhost:5000/api/email/test \
  -H "Authorization: Bearer SEU_TOKEN_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{"to":"seu-email@gmail.com"}'
```

## Uso no Código

### Enviar Email Simples

```javascript
const emailService = require('./services/emailService');

await emailService.sendEmail({
  to: 'destinatario@exemplo.com',
  subject: 'Assunto do Email',
  text: 'Texto simples do email',
  html: '<h1>HTML do email</h1><p>Corpo do email</p>'
});
```

### Enviar Notificação

```javascript
await emailService.sendNotification(
  'destinatario@exemplo.com',
  'Nome da Pessoa',
  'Sua mensagem personalizada aqui.'
);
```

### Exemplo: Notificar Novo Cadastro

```javascript
// Em pessoasController.js, após criar pessoa:
if (pessoa.email) {
  const emailService = require('../services/emailService');
  await emailService.sendNotification(
    pessoa.email,
    pessoa.nome,
    'Bem-vindo(a) ao Sistema IVN! Seu cadastro foi realizado com sucesso.'
  ).catch(e => console.error('Erro ao enviar email de boas-vindas:', e.message));
}
```

## Troubleshooting

### Email não está sendo enviado

1. **Confira os logs** do backend: `[Email] SMTP desabilitado` ou `[Email] SMTP_USER ou SMTP_PASS não configurados`
2. **SMTP_ENABLED** deve ser `true`
3. **SMTP_USER** e **SMTP_PASS** devem estar preenchidos

### Erro de autenticação (Gmail)

- Use **senha de app** (App Password), não a senha normal da conta
- Ative verificação em 2 etapas: https://myaccount.google.com/security

### Timeout ou conexão recusada

- Confira se o **SMTP_HOST** e **SMTP_PORT** estão corretos
- Se estiver em Docker/servidor, verifique se a porta SMTP não está bloqueada no firewall

### Email vai para spam

- Configure **SPF, DKIM e DMARC** no DNS do domínio remetente
- Use um serviço profissional (SendGrid, Mailgun) em vez de Gmail para produção

## Segurança

- **Nunca commite** `SMTP_PASS` no Git
- Use **Docker secrets** ou arquivo `.env` fora do repositório
- Em produção, prefira serviços profissionais (SendGrid, Mailgun) com autenticação por API key

## Próximos Passos

- [ ] Adicionar templates de email (aniversário, eventos, relatórios)
- [ ] Criar fila de emails (Bull/Redis) para envios em massa
- [ ] Dashboard de emails enviados/falhados
- [ ] Permitir anexos em emails
