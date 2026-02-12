/**
 * Serviço de armazenamento de arquivos: local (disco) ou S3/MinIO.
 * - upload(key, buffer, contentType) → retorna path para salvar no banco
 * - getReadStream(key) → stream para enviar na resposta HTTP
 * - delete(key) → remove arquivo
 * - resolvePath(key) → path público para o frontend (ex: /api/storage/file/xxx)
 */

const path = require('path');
const fs = require('fs');
const config = require('../config/storage');

const STORAGE_PREFIX = 'storage:'; // prefixo no DB para identificar key S3 (path começa com /uploads/ ou storage:key)
const API_FILE_PATH = '/api/storage/file';

let s3Client = null;
let bucketEnsured = false;

function getS3Client() {
  if (s3Client) return s3Client;
  if (config.type !== 's3') return null;
  try {
    const { S3Client } = require('@aws-sdk/client-s3');
    const endpoint = (config.s3.endpoint || '').trim().replace(/\/$/, '') || 'http://localhost:9000';
    s3Client = new S3Client({
      region: config.s3.region || 'us-east-1',
      endpoint: endpoint || undefined,
      forcePathStyle: true,
      credentials: {
        accessKeyId: config.s3.accessKey || 'minioadmin',
        secretAccessKey: config.s3.secretKey || 'minioadmin'
      }
    });
    console.log(`[Storage S3] Cliente configurado: endpoint=${endpoint}, bucket=${config.s3.bucket}`);
    return s3Client;
  } catch (e) {
    console.error('Erro ao inicializar cliente S3:', e.message);
    return null;
  }
}

/**
 * Garante que o bucket existe no MinIO/S3 (cria se não existir).
 * MinIO pode retornar AccessDenied para bucket inexistente; tentamos CreateBucket em seguida.
 */
async function ensureBucketExists() {
  if (bucketEnsured || config.type !== 's3') return;
  const client = getS3Client();
  if (!client) return;
  const bucket = (config.s3.bucket || 'sistema-ivn').trim();
  if (!bucket) return;
  const { HeadBucketCommand, CreateBucketCommand } = require('@aws-sdk/client-s3');
  try {
    await client.send(new HeadBucketCommand({ Bucket: bucket }));
    bucketEnsured = true;
    return;
  } catch (headErr) {
    // NotFound, 404 ou AccessDenied (MinIO retorna AccessDenied para bucket inexistente)
  }
  try {
    await client.send(new CreateBucketCommand({ Bucket: bucket }));
    bucketEnsured = true;
    console.log(`[Storage S3] Bucket criado: ${bucket}`);
  } catch (e) {
    const msg = (e.message || '').toLowerCase();
    if (msg.includes('already own') || msg.includes('already exists') || e.name === 'BucketAlreadyOwnedByYou') {
      bucketEnsured = true;
      return;
    }
    console.error('[Storage S3] Bucket não acessível/criável:', bucket, '-', e.message);
    console.error('[Storage S3] Confira S3_ENDPOINT (do container: use host do MinIO, ex: http://minio:9000), S3_BUCKET, S3_ACCESS_KEY e S3_SECRET_KEY.');
  }
}

/**
 * Upload de arquivo.
 * @param {string} key - Caminho lógico (ex: comprovantes/xxx.pdf ou fotos-perfil/pessoa-1.jpg)
 * @param {Buffer} buffer - Conteúdo do arquivo
 * @param {string} contentType - MIME type
 * @returns {Promise<string>} - Path para salvar no banco: /uploads/... (local) ou storage:key (S3)
 */
async function upload(key, buffer, contentType) {
  if (config.type === 's3') {
    console.log(`[Storage S3] Iniciando upload: key=${key}, tamanho=${buffer.length} bytes, type=${contentType}`);
    const client = getS3Client();
    if (!client) throw new Error('Cliente S3 não disponível');
    await ensureBucketExists();
    const bucket = (config.s3.bucket || 'sistema-ivn').trim();
    const { PutObjectCommand } = require('@aws-sdk/client-s3');
    try {
      const result = await client.send(new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType || 'application/octet-stream'
      }));
      console.log(`[Storage S3] Upload concluído: ${key} - ETag: ${result.ETag || '(sem etag)'}`);
    } catch (e) {
      console.error(`[Storage S3] ERRO no upload de ${key}:`, e.name, '-', e.message);
      if (e.name === 'NoSuchBucket' || (e.message && e.message.includes('does not exist'))) {
        console.error('[Storage S3] Bucket não encontrado:', bucket, '- Endpoint:', config.s3.endpoint);
        console.error('[Storage S3] No MinIO/Docker use S3_ENDPOINT com o host correto (ex: http://minio:9000), não localhost se MinIO estiver em outro container.');
      }
      throw e;
    }
    return `${STORAGE_PREFIX}${key}`;
  }

  // Local: salvar em uploads/ conforme o key
  const uploadDir = path.join(__dirname, '../../uploads', path.dirname(key));
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  const filePath = path.join(__dirname, '../../uploads', key);
  fs.writeFileSync(filePath, buffer);
  return `/uploads/${key.replace(/\\/g, '/')}`;
}

/**
 * Retorna stream de leitura do arquivo (para resposta HTTP).
 * @param {string} pathOrKey - Valor do banco: /uploads/... ou storage:key
 * @returns {Promise<{ stream: ReadStream|Readable, contentType?: string } | null>}
 */
async function getReadStream(pathOrKey) {
  if (!pathOrKey || typeof pathOrKey !== 'string') return null;

  if (pathOrKey.startsWith(STORAGE_PREFIX)) {
    const key = pathOrKey.slice(STORAGE_PREFIX.length);
    const client = getS3Client();
    if (!client) return null;
    try {
      const { GetObjectCommand } = require('@aws-sdk/client-s3');
      const response = await client.send(new GetObjectCommand({ Bucket: config.s3.bucket, Key: key }));
      if (!response.Body) return null;
      const ext = path.extname(key).toLowerCase();
      const mime = { '.pdf': 'application/pdf', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.doc': 'application/msword', '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' };
      return {
        stream: response.Body,
        contentType: response.ContentType || mime[ext] || 'application/octet-stream'
      };
    } catch (e) {
      console.error('Erro ao ler do S3:', e.message);
      return null;
    }
  }

  // Local: path relativo a uploads ou absoluto
  const localPath = pathOrKey.startsWith('/uploads/')
    ? path.join(__dirname, '../..', pathOrKey)
    : path.join(__dirname, '../../uploads', pathOrKey);
  if (!fs.existsSync(localPath) || !fs.statSync(localPath).isFile()) return null;
  const ext = path.extname(localPath).toLowerCase();
  const mime = { '.pdf': 'application/pdf', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.doc': 'application/msword', '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' };
  return {
    stream: fs.createReadStream(localPath),
    contentType: mime[ext] || 'application/octet-stream'
  };
}

/**
 * Deleta arquivo.
 * @param {string} pathOrKey - Valor do banco
 */
async function deleteFile(pathOrKey) {
  if (!pathOrKey || typeof pathOrKey !== 'string') return;

  if (pathOrKey.startsWith(STORAGE_PREFIX)) {
    const key = pathOrKey.slice(STORAGE_PREFIX.length);
    const client = getS3Client();
    if (!client) return;
    try {
      const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
      await client.send(new DeleteObjectCommand({ Bucket: config.s3.bucket, Key: key }));
    } catch (e) {
      console.error('Erro ao deletar do S3:', e.message);
    }
    return;
  }

  const localPath = pathOrKey.startsWith('/uploads/')
    ? path.join(__dirname, '../..', pathOrKey)
    : path.join(__dirname, '../../uploads', pathOrKey);
  if (fs.existsSync(localPath) && fs.statSync(localPath).isFile()) {
    fs.unlinkSync(localPath);
  }
}

/**
 * Converte valor do banco em URL path para o frontend.
 * - Local /uploads/... → retorna como está (servido por express.static)
 * - S3 storage:key → retorna /api/storage/file/key (servido por rota que faz proxy)
 */
function toPublicPath(pathOrKey) {
  if (!pathOrKey || typeof pathOrKey !== 'string') return pathOrKey;
  if (pathOrKey.startsWith(STORAGE_PREFIX)) {
    const key = pathOrKey.slice(STORAGE_PREFIX.length);
    return `${API_FILE_PATH}/${encodeURIComponent(key)}`;
  }
  return pathOrKey;
}

/**
 * Verifica se o storage está configurado como S3.
 */
function isS3() {
  return config.type === 's3';
}

/**
 * Valor de foto_perfil para enviar na API (resolve storage:key para URL path).
 */
function resolveFotoPerfil(value) {
  if (value == null || value === '') return value;
  if (typeof value === 'string' && value.startsWith(STORAGE_PREFIX)) {
    return toPublicPath(value);
  }
  return value;
}

/**
 * Prepara foto_perfil para salvar no banco: se S3 e base64, faz upload e retorna storage:key; senão retorna o valor.
 * @param {string|null} base64OrPath - Base64 (data:image/...;base64,... ou string pura) ou path
 * @param {string} prefix - Prefixo da key (ex: 'fotos-perfil')
 * @param {string} uniqueId - Id único (ex: pessoa id ou timestamp)
 */
async function prepareFotoPerfilForSave(base64OrPath, prefix, uniqueId) {
  if (base64OrPath == null || base64OrPath === '') return null;
  if (config.type !== 's3') return base64OrPath;

  // Só faz upload se parecer base64 (string longa sem ser path/url)
  const isBase64 = typeof base64OrPath === 'string' &&
    base64OrPath.length > 200 &&
    !base64OrPath.startsWith('http') &&
    !base64OrPath.startsWith('/') &&
    !base64OrPath.startsWith(STORAGE_PREFIX);
  if (!isBase64) {
    console.log(`[Storage S3] prepareFotoPerfil: não é base64, retornando original (length=${(base64OrPath || '').length})`);
    return base64OrPath;
  }

  console.log(`[Storage S3] prepareFotoPerfil: detectado base64, iniciando upload (prefix=${prefix}, id=${uniqueId})`);
  try {
    let buffer = Buffer.from(base64OrPath, 'base64');
    if (base64OrPath.includes(',')) {
      const b64 = base64OrPath.split(',')[1];
      buffer = Buffer.from(b64 || base64OrPath, 'base64');
    }
    const key = `${prefix}/${uniqueId}-${Date.now()}.jpg`;
    const result = await upload(key, buffer, 'image/jpeg');
    console.log(`[Storage S3] prepareFotoPerfil: upload OK, retornando ${result}`);
    return result;
  } catch (e) {
    const msg = e.message || '';
    console.error('[Storage S3] Erro ao fazer upload de foto:', msg);
    if (msg.toLowerCase().includes('bucket') && msg.toLowerCase().includes('exist')) {
      console.error('[Storage S3] Endpoint usado:', config.s3?.endpoint || '(não definido)');
      console.error('[Storage S3] Bucket usado:', (config.s3?.bucket || 'sistema-ivn').trim());
      console.error('[Storage S3] Em produção, use S3_ENDPOINT com o host do MinIO (ex: http://minio:9000), não localhost.');
    }
    return base64OrPath;
  }
}

module.exports = {
  upload,
  getReadStream,
  deleteFile,
  toPublicPath,
  isS3,
  resolveFotoPerfil,
  prepareFotoPerfilForSave,
  STORAGE_PREFIX,
  API_FILE_PATH,
  config
};
