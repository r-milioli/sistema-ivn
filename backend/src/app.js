const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

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

const app = express();

// Middlewares
app.use(cors());
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
