# Storage S3 / MinIO

O backend pode usar armazenamento **local** (pasta `uploads/`) ou **S3-compatível** (MinIO, AWS S3) para:

- **Comprovantes** de saídas financeiras
- **Fotos de perfil** (pessoas e integração)

## Configuração

### Modo local (padrão)

Não é necessário configurar nada. Os arquivos ficam em `backend/uploads/`.

### Modo S3 / MinIO

1. Crie um bucket no MinIO (ou use um bucket S3).
2. No `.env` do backend:

```env
STORAGE_TYPE=s3
S3_ENDPOINT=http://seu-minio:9000
S3_BUCKET=sistema-ivn
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_USE_SSL=false
S3_REGION=us-east-1
```

- **MinIO local:** `S3_ENDPOINT=http://localhost:9000`
- **MinIO em servidor:** `S3_ENDPOINT=http://minio:9000` (nome do serviço no Docker)
- **AWS S3:** use `S3_ENDPOINT` vazio ou omita (o SDK usa o endpoint padrão da AWS).

## Comportamento

| Recurso        | Local                    | S3 |
|----------------|---------------------------|----|
| Comprovantes   | `uploads/comprovantes/`   | Key `comprovantes/xxx` no bucket |
| Fotos de perfil| Base64 no banco ou arquivo local | Key `fotos-perfil/xxx` no bucket |
| Leitura        | `GET /uploads/...` (static) | `GET /api/storage/file/:key` (proxy) |

O frontend não precisa ser alterado: a API devolve sempre um **path** (ex.: `/uploads/...` ou `/api/storage/file/fotos-perfil/xxx`). O cliente monta a URL com a origem da API.

## Docker com MinIO

Exemplo no `docker-compose.yml`:

```yaml
services:
  minio:
    image: minio/minio:latest
    command: server /data
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    volumes:
      - minio_data:/data
    ports:
      - "9000:9000"

  app:
    environment:
      STORAGE_TYPE: s3
      S3_ENDPOINT: http://minio:9000
      S3_BUCKET: sistema-ivn
      S3_ACCESS_KEY: minioadmin
      S3_SECRET_KEY: minioadmin
      S3_USE_SSL: "false"
```

O bucket `sistema-ivn` pode ser criado manualmente no MinIO ou por script na primeira execução.

## Migração local → S3

Os registros antigos continuam com `comprovante_path` ou `foto_perfil` em formato local ou base64. Novos uploads passam a usar S3 quando `STORAGE_TYPE=s3`. Não é obrigatório migrar os arquivos já existentes.
