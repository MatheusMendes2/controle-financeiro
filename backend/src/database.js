const { Pool, types } = require('pg');

types.setTypeParser(1700, val => parseFloat(val));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false
});

pool.on('error', (err) => {
  console.error('Erro inesperado no pool PostgreSQL:', err);
});

async function query(sql, params = []) {
  return pool.query(sql, params);
}

async function queryAll(sql, params = []) {
  const result = await query(sql, params);
  return result.rows;
}

async function queryOne(sql, params = []) {
  const rows = await queryAll(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

async function migrate() {
  await query(`
    CREATE TABLE IF NOT EXISTS categorias (
      id SERIAL PRIMARY KEY,
      nome TEXT NOT NULL UNIQUE,
      tipo TEXT NOT NULL CHECK (tipo IN ('receita', 'despesa', 'ambos')),
      cor TEXT NOT NULL DEFAULT '#6366f1',
      icone TEXT NOT NULL DEFAULT 'tag',
      ativo INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS receitas (
      id SERIAL PRIMARY KEY,
      descricao TEXT NOT NULL,
      valor NUMERIC(12,2) NOT NULL CHECK (valor > 0),
      categoria_id INTEGER NOT NULL REFERENCES categorias(id),
      data_recebimento DATE NOT NULL,
      observacao TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS despesas (
      id SERIAL PRIMARY KEY,
      descricao TEXT NOT NULL,
      valor NUMERIC(12,2) NOT NULL CHECK (valor > 0),
      categoria_id INTEGER NOT NULL REFERENCES categorias(id),
      data DATE NOT NULL,
      forma_pagamento TEXT NOT NULL DEFAULT 'dinheiro',
      status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('paga', 'pendente')),
      observacao TEXT DEFAULT '',
      parcelado INTEGER DEFAULT 0,
      numero_parcelas INTEGER DEFAULT 1,
      parcela_atual INTEGER DEFAULT 1,
      id_parcelamento TEXT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const cols = await queryAll(`
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = 'despesas' AND column_name IN ('parcelado','numero_parcelas','parcela_atual','id_parcelamento')
  `);
  const existingCols = cols.map(c => c.column_name);
  if (!existingCols.includes('parcelado')) {
    await query("ALTER TABLE despesas ADD COLUMN parcelado INTEGER DEFAULT 0");
  }
  if (!existingCols.includes('numero_parcelas')) {
    await query("ALTER TABLE despesas ADD COLUMN numero_parcelas INTEGER DEFAULT 1");
  }
  if (!existingCols.includes('parcela_atual')) {
    await query("ALTER TABLE despesas ADD COLUMN parcela_atual INTEGER DEFAULT 1");
  }
  if (!existingCols.includes('id_parcelamento')) {
    await query("ALTER TABLE despesas ADD COLUMN id_parcelamento TEXT DEFAULT NULL");
  }
  await query('CREATE INDEX IF NOT EXISTS idx_despesas_parcelamento ON despesas(id_parcelamento)');

  await query('CREATE INDEX IF NOT EXISTS idx_receitas_data ON receitas(data_recebimento)');
  await query('CREATE INDEX IF NOT EXISTS idx_receitas_categoria ON receitas(categoria_id)');
  await query('CREATE INDEX IF NOT EXISTS idx_despesas_data ON despesas(data)');
  await query('CREATE INDEX IF NOT EXISTS idx_despesas_categoria ON despesas(categoria_id)');
  await query('CREATE INDEX IF NOT EXISTS idx_despesas_status ON despesas(status)');

  const count = await queryOne('SELECT COUNT(*)::int as total FROM categorias');
  if (count.total === 0) {
    const categorias = [
      ['Salário', 'receita', '#22c55e', 'salary'],
      ['Freelance', 'receita', '#3b82f6', 'freelance'],
      ['Investimentos', 'receita', '#a855f7', 'investiment'],
      ['Outras Receitas', 'receita', '#64748b', 'other-income'],
      ['Alimentação', 'despesa', '#ef4444', 'food'],
      ['Transporte', 'despesa', '#f97316', 'transport'],
      ['Moradia', 'despesa', '#eab308', 'housing'],
      ['Saúde', 'despesa', '#06b6d4', 'health'],
      ['Educação', 'despesa', '#6366f1', 'education'],
      ['Lazer', 'despesa', '#ec4899', 'leisure'],
      ['Assinaturas', 'despesa', '#8b5cf6', 'subscription'],
      ['Outros', 'ambos', '#64748b', 'other']
    ];
    for (const [nome, tipo, cor, icone] of categorias) {
      await query(
        'INSERT INTO categorias (nome, tipo, cor, icone) VALUES ($1, $2, $3, $4)',
        [nome, tipo, cor, icone]
      );
    }
    console.log('Categorias padrão inseridas.');
  }

  console.log('Migração concluída com sucesso.');
}

async function closePool() {
  await pool.end();
}

module.exports = { query, queryAll, queryOne, migrate, closePool, pool };
