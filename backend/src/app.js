const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const visitantesRoutes = require('./routes/visitantesRoutes');
const relatoriosRoutes = require('./routes/relatoriosRoutes');
const financasRoutes = require('./routes/financasRoutes');
const pessoasRoutes = require('./routes/pessoasRoutes');
const eventosRoutes = require('./routes/eventosRoutes');
const integracaoRoutes = require('./routes/integracaoRoutes');
const ministeriosRoutes = require('./routes/ministeriosRoutes');

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

// Rota de teste
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'API está funcionando' });
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Erro interno do servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

module.exports = app;
