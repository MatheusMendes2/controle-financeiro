const { Router } = require('express');
const { queryAll, queryOne, query } = require('../database');

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { mes, ano, categoria_id, data_inicio, data_fim } = req.query;
    let sql = `
      SELECT r.*, c.nome as categoria_nome, c.cor as categoria_cor, c.icone as categoria_icone
      FROM receitas r
      JOIN categorias c ON r.categoria_id = c.id
      WHERE 1=1
    `;
    const params = [];
    let idx = 0;

    if (mes && ano) {
      idx += 1; sql += ` AND TO_CHAR(r.data_recebimento, 'MM') = $${idx}`; params.push(mes.toString().padStart(2, '0'));
      idx += 1; sql += ` AND TO_CHAR(r.data_recebimento, 'YYYY') = $${idx}`; params.push(ano.toString());
    } else if (ano) {
      idx += 1; sql += ` AND TO_CHAR(r.data_recebimento, 'YYYY') = $${idx}`; params.push(ano.toString());
    }
    if (categoria_id) {
      idx += 1; sql += ` AND r.categoria_id = $${idx}`; params.push(categoria_id);
    }
    if (data_inicio) {
      idx += 1; sql += ` AND r.data_recebimento >= $${idx}`; params.push(data_inicio);
    }
    if (data_fim) {
      idx += 1; sql += ` AND r.data_recebimento <= $${idx}`; params.push(data_fim);
    }

    sql += ' ORDER BY r.data_recebimento DESC, r.created_at DESC';
    const receitas = await queryAll(sql, params);
    res.json(receitas);
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const receita = await queryOne(`
      SELECT r.*, c.nome as categoria_nome, c.cor as categoria_cor
      FROM receitas r
      JOIN categorias c ON r.categoria_id = c.id
      WHERE r.id = $1
    `, [req.params.id]);
    if (!receita) return res.status(404).json({ error: 'Receita não encontrada' });
    res.json(receita);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { descricao, valor, categoria_id, data_recebimento, observacao } = req.body;
    if (!descricao || !valor || !categoria_id || !data_recebimento) {
      return res.status(400).json({ error: 'Descrição, valor, categoria e data são obrigatórios' });
    }
    const result = await query(
      `INSERT INTO receitas (descricao, valor, categoria_id, data_recebimento, observacao) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [descricao, valor, categoria_id, data_recebimento, observacao || '']
    );
    const receita = await queryOne(`
      SELECT r.*, c.nome as categoria_nome, c.cor as categoria_cor
      FROM receitas r
      JOIN categorias c ON r.categoria_id = c.id
      WHERE r.id = $1
    `, [result.rows[0].id]);
    res.status(201).json(receita);
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { descricao, valor, categoria_id, data_recebimento, observacao } = req.body;
    const current = await queryOne('SELECT * FROM receitas WHERE id = $1', [req.params.id]);
    if (!current) return res.status(404).json({ error: 'Receita não encontrada' });

    await query(
      `UPDATE receitas SET descricao = $1, valor = $2, categoria_id = $3, data_recebimento = $4, observacao = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6`,
      [
        descricao || current.descricao,
        valor || current.valor,
        categoria_id || current.categoria_id,
        data_recebimento || current.data_recebimento,
        observacao !== undefined ? observacao : current.observacao,
        req.params.id
      ]
    );
    const receita = await queryOne(`
      SELECT r.*, c.nome as categoria_nome, c.cor as categoria_cor
      FROM receitas r
      JOIN categorias c ON r.categoria_id = c.id
      WHERE r.id = $1
    `, [req.params.id]);
    res.json(receita);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const result = await query('DELETE FROM receitas WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Receita não encontrada' });
    res.json({ message: 'Receita removida' });
  } catch (err) { next(err); }
});

module.exports = router;
