const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();
const { apiLimiter } = require('./middleware/rateLimitMiddleware');

const authRoutes = require('./routes/authRoutes');
const visitantesRoutes = require('./routes/visitantesRoutes');
const relatoriosRoutes = require('./routes/relatoriosRoutes');
const financasRoutes = require('./routes/financasRoutes');
const pessoasRoutes = require('./routes/pessoasRoutes');
const eventosRoutes = require('./routes/eventosRoutes');
const integracaoRoutes = require('./routes/integracaoRoutes');
const ministeriosRoutes = require('./routes/ministeriosRoutes');
const fichaCadastralRoutes = require('./routes/fichaCadastralRoutes');
const paginasConfigRoutes = require('./routes/paginasConfigRoutes');
const paginasTabsRoutes = require('./routes/paginasTabsRoutes');
const storageRoutes = require('./routes/storageRoutes');
const emailRoutes = require('./routes/emailRoutes');
const kidsRoutes = require('./routes/kidsRoutes');

const app = express();

// Trust proxy: necessário quando atrás de Traefik/nginx (express-rate-limit usa X-Forwarded-For para o IP real)
app.set('trust proxy', 1);

// Middlewares de segurança
app.use(helmet({
  contentSecurityPolicy: false, // Desabilitar CSP para não quebrar frontend
  crossOriginEmbedderPolicy: false
}));

// CORS - Se ALLOWED_ORIGINS estiver definido, usa a lista; senão permite qualquer origem
const allowedOriginsRaw = (process.env.ALLOWED_ORIGINS || '').trim();
const allowedOrigins = allowedOriginsRaw
  ? allowedOriginsRaw.split(',').map((o) => o.trim()).filter(Boolean)
  : null;

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (!allowedOrigins) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Origem não permitida pelo CORS'));
  },
  credentials: true
}));

// Rate limiting global para todas as rotas API
app.use('/api/', apiLimiter);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Servir arquivos estáticos (comprovantes)
app.use('/uploads', express.static('uploads'));

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/visitantes', visitantesRoutes);
app.use('/api/relatorios', relatoriosRoutes);
app.use('/api/financas', financasRoutes);
app.use('/api/eventos', eventosRoutes);
app.use('/api/integracao', integracaoRoutes);
app.use('/api/ministerios', ministeriosRoutes);
app.use('/api', pessoasRoutes);
app.use('/api', fichaCadastralRoutes);
app.use('/api/paginas-config', paginasConfigRoutes);
app.use('/api/paginas-tabs', paginasTabsRoutes);
app.use('/api/storage', storageRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/kids', kidsRoutes);
if (process.env.NODE_ENV !== 'production') {
  console.log('[app] Rotas registradas: /api/kids (POST /cadastro, GET /)');
}

// Rota de teste
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'API está funcionando' });
});

// Em produção, servir o frontend React buildado
if (process.env.NODE_ENV === 'production') {
  const frontendBuild = path.join(__dirname, '..', 'public');
  app.use(express.static(frontendBuild));

  // Qualquer rota que não seja /api/* devolve o index.html (SPA)
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
      return next();
    }
    res.sendFile(path.join(frontendBuild, 'index.html'));
  });
}

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Erro interno do servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

module.exports = app;
