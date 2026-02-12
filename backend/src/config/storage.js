/**
 * Configuração do storage (local ou S3/MinIO).
 * Variáveis de ambiente:
 *   STORAGE_TYPE=local|s3
 *   S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY, S3_SECRET_KEY, S3_USE_SSL, S3_REGION
 */
require('dotenv').config();

const config = {
  type: (process.env.STORAGE_TYPE || 'local').toLowerCase(),
  s3: {
    endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
    bucket: process.env.S3_BUCKET || 'sistema-ivn',
    accessKey: process.env.S3_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.S3_SECRET_KEY || 'minioadmin',
    useSSL: process.env.S3_USE_SSL !== 'false',
    region: process.env.S3_REGION || 'us-east-1',
    // URL pública do bucket (se configurado, para gerar URLs diretas)
    publicUrl: process.env.S3_PUBLIC_URL || null
  }
};

module.exports = config;
