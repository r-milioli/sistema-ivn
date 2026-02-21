/**
 * Script para rodar a migração da tabela aniversariantes_vistos.
 * Execute a partir da pasta backend: node scripts/run-migration-aniversariantes-vistos.js
 */
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'igreja_db',
  user: process.env.DB_USER || 'igreja_user',
  password: process.env.DB_PASSWORD || 'igreja_password',
});

const sqlPath = path.join(__dirname, '..', '..', 'sql', 'migracao_aniversariantes_vistos_por_linha.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

async function run() {
  const client = await pool.connect();
  try {
    await client.query(sql);
    console.log('Migração aniversariantes_vistos executada com sucesso.');
  } catch (err) {
    console.error('Erro na migração:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
