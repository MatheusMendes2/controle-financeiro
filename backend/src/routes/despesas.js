const { Router } = require('express');
const { queryAll, queryOne, query } = require('../database');

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { mes, ano, categoria_id, status, data_inicio, data_fim, forma_pagamento } = req.query;
    let sql = `
      SELECT d.*, c.nome as categoria_nome, c.cor as categoria_cor, c.icone as categoria_icone
      FROM despesas d
      JOIN categorias c ON d.categoria_id = c.id
      WHERE 1=1
    `;
    const params = [];
    let idx = 0;

    if (mes && ano) {
      idx += 1; sql += ` AND TO_CHAR(d.data, 'MM') = $${idx}`; params.push(mes.toString().padStart(2, '0'));
      idx += 1; sql += ` AND TO_CHAR(d.data, 'YYYY') = $${idx}`; params.push(ano.toString());
    } else if (ano) {
      idx += 1; sql += ` AND TO_CHAR(d.data, 'YYYY') = $${idx}`; params.push(ano.toString());
    }
    if (categoria_id) {
      idx += 1; sql += ` AND d.categoria_id = $${idx}`; params.push(categoria_id);
    }
    if (status) {
      idx += 1; sql += ` AND d.status = $${idx}`; params.push(status);
    }
    if (data_inicio) {
      idx += 1; sql += ` AND d.data >= $${idx}`; params.push(data_inicio);
    }
    if (data_fim) {
      idx += 1; sql += ` AND d.data <= $${idx}`; params.push(data_fim);
    }
    if (forma_pagamento) {
      idx += 1; sql += ` AND d.forma_pagamento = $${idx}`; params.push(forma_pagamento);
    }

    sql += ' ORDER BY d.data DESC, d.created_at DESC';
    const despesas = await queryAll(sql, params);
    res.json(despesas);
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const despesa = await queryOne(`
      SELECT d.*, c.nome as categoria_nome, c.cor as categoria_cor
      FROM despesas d
      JOIN categorias c ON d.categoria_id = c.id
      WHERE d.id = $1
    `, [req.params.id]);
    if (!despesa) return res.status(404).json({ error: 'Despesa não encontrada' });
    res.json(despesa);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { descricao, valor, categoria_id, data, forma_pagamento, status, observacao } = req.body;
    if (!descricao || !valor || !categoria_id || !data) {
      return res.status(400).json({ error: 'Descrição, valor, categoria e data são obrigatórios' });
    }
    const result = await query(
      `INSERT INTO despesas (descricao, valor, categoria_id, data, forma_pagamento, status, observacao) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [descricao, valor, categoria_id, data, forma_pagamento || 'dinheiro', status || 'pendente', observacao || '']
    );
    const despesa = await queryOne(`
      SELECT d.*, c.nome as categoria_nome, c.cor as categoria_cor
      FROM despesas d
      JOIN categorias c ON d.categoria_id = c.id
      WHERE d.id = $1
    `, [result.rows[0].id]);
    res.status(201).json(despesa);
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { descricao, valor, categoria_id, data, forma_pagamento, status, observacao } = req.body;
    const current = await queryOne('SELECT * FROM despesas WHERE id = $1', [req.params.id]);
    if (!current) return res.status(404).json({ error: 'Despesa não encontrada' });

    await query(
      `UPDATE despesas SET descricao = $1, valor = $2, categoria_id = $3, data = $4, forma_pagamento = $5, status = $6, observacao = $7, updated_at = CURRENT_TIMESTAMP WHERE id = $8`,
      [
        descricao || current.descricao,
        valor || current.valor,
        categoria_id || current.categoria_id,
        data || current.data,
        forma_pagamento || current.forma_pagamento,
        status || current.status,
        observacao !== undefined ? observacao : current.observacao,
        req.params.id
      ]
    );
    const despesa = await queryOne(`
      SELECT d.*, c.nome as categoria_nome, c.cor as categoria_cor
      FROM despesas d
      JOIN categorias c ON d.categoria_id = c.id
      WHERE d.id = $1
    `, [req.params.id]);
    res.json(despesa);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const result = await query('DELETE FROM despesas WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Despesa não encontrada' });
    res.json({ message: 'Despesa removida' });
  } catch (err) { next(err); }
});

module.exports = router;
