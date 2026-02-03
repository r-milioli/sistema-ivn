const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'igreja_db',
  user: process.env.DB_USER || 'igreja_user',
  password: process.env.DB_PASSWORD || 'igreja_password',
});

// Testar conexão
pool.on('connect', () => {
  console.log('Conectado ao banco de dados PostgreSQL');
});

pool.on('error', (err) => {
  console.error('Erro inesperado no cliente PostgreSQL:', err);
  process.exit(-1);
});

module.exports = pool;
