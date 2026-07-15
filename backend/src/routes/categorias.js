const { Router } = require('express');
const { queryAll, queryOne, query } = require('../database');

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { tipo, ativo } = req.query;
    let sql = 'SELECT * FROM categorias WHERE 1=1';
    const params = [];
    if (tipo === 'ambos') {
      sql += ' AND (tipo = $1 OR tipo = $2)';
      params.push('ambos', 'ambos');
    } else if (tipo) {
      sql += ' AND (tipo = $1 OR tipo = $2)';
      params.push(tipo, 'ambos');
    }
    if (ativo !== undefined) {
      sql += ` AND ativo = $${params.length + 1}`;
      params.push(Number(ativo));
    }
    sql += ' ORDER BY tipo, nome';
    const categorias = await queryAll(sql, params);
    res.json(categorias);
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const categoria = await queryOne('SELECT * FROM categorias WHERE id = $1', [req.params.id]);
    if (!categoria) return res.status(404).json({ error: 'Categoria não encontrada' });
    res.json(categoria);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { nome, tipo, cor, icone } = req.body;
    if (!nome || !tipo) {
      return res.status(400).json({ error: 'Nome e tipo são obrigatórios' });
    }
    const result = await query(
      'INSERT INTO categorias (nome, tipo, cor, icone) VALUES ($1, $2, $3, $4) RETURNING *',
      [nome, tipo, cor || '#6366f1', icone || 'tag']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { nome, tipo, cor, icone, ativo } = req.body;
    const current = await queryOne('SELECT * FROM categorias WHERE id = $1', [req.params.id]);
    if (!current) return res.status(404).json({ error: 'Categoria não encontrada' });

    const result = await query(
      `UPDATE categorias SET nome = $1, tipo = $2, cor = $3, icone = $4, ativo = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6 RETURNING *`,
      [
        nome || current.nome,
        tipo || current.tipo,
        cor || current.cor,
        icone || current.icone,
        ativo !== undefined ? Number(ativo) : current.ativo,
        req.params.id
      ]
    );
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const usado = await queryOne(
      `SELECT (SELECT COUNT(*) FROM receitas WHERE categoria_id = $1) + (SELECT COUNT(*) FROM despesas WHERE categoria_id = $1)::int as total`,
      [req.params.id]
    );
    if (usado.total > 0) {
      await query('UPDATE categorias SET ativo = 0, updated_at = CURRENT_TIMESTAMP WHERE id = $1', [req.params.id]);
      return res.json({ message: 'Categoria desativada (possui lançamentos vinculados)' });
    }
    const result = await query('DELETE FROM categorias WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Categoria não encontrada' });
    res.json({ message: 'Categoria removida' });
  } catch (err) { next(err); }
});

module.exports = router;
