const { Router } = require('express');
const crypto = require('crypto');
const { queryAll, queryOne, query } = require('../database');

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { mes, ano, categoria_id, status, data_inicio, data_fim, forma_pagamento, parcelado } = req.query;
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
    if (parcelado !== undefined) {
      idx += 1; sql += ` AND d.parcelado = $${idx}`; params.push(Number(parcelado));
    }

    sql += ' ORDER BY d.data DESC, d.created_at DESC';
    const despesas = await queryAll(sql, params);
    res.json(despesas);
  } catch (err) { next(err); }
});

router.get('/parcelamento/:id', async (req, res, next) => {
  try {
    const parcelas = await queryAll(
      `SELECT d.*, c.nome as categoria_nome, c.cor as categoria_cor
       FROM despesas d
       JOIN categorias c ON d.categoria_id = c.id
       WHERE d.id_parcelamento = $1
       ORDER BY d.parcela_atual`,
      [req.params.id]
    );
    if (parcelas.length === 0) return res.status(404).json({ error: 'Parcelamento não encontrado' });
    res.json(parcelas);
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
    const { descricao, valor, categoria_id, data, forma_pagamento, status, observacao, parcelado, numero_parcelas } = req.body;
    if (!descricao || !valor || !categoria_id || !data) {
      return res.status(400).json({ error: 'Descrição, valor, categoria e data são obrigatórios' });
    }

    const totalValor = Number(valor);
    const isParcelado = parcelado && Number(numero_parcelas) > 1;
    const totalParcelas = isParcelado ? Number(numero_parcelas) : 1;
    const valorParcela = isParcelado ? Number((totalValor / totalParcelas).toFixed(2)) : totalValor;
    const idParcelamento = isParcelado ? crypto.randomUUID() : null;

    const created = [];

    for (let i = 1; i <= totalParcelas; i++) {
      const installmentDate = new Date(data + (data.includes('T') ? '' : 'T00:00:00'));
      installmentDate.setMonth(installmentDate.getMonth() + (i - 1));
      const dateStr = installmentDate.toISOString().slice(0, 10);

      const installmentDescricao = isParcelado
        ? `${descricao} (${i}/${totalParcelas})`
        : descricao;

      const result = await query(
        `INSERT INTO despesas (descricao, valor, categoria_id, data, forma_pagamento, status, observacao, parcelado, numero_parcelas, parcela_atual, id_parcelamento)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
        [
          installmentDescricao,
          i === totalParcelas
            ? Number((totalValor - valorParcela * (totalParcelas - 1)).toFixed(2))
            : valorParcela,
          categoria_id,
          dateStr,
          forma_pagamento || 'dinheiro',
          i === 1 ? (status || 'pendente') : 'pendente',
          observacao || '',
          isParcelado ? 1 : 0,
          totalParcelas,
          i,
          idParcelamento
        ]
      );

      const full = await queryOne(`
        SELECT d.*, c.nome as categoria_nome, c.cor as categoria_cor
        FROM despesas d JOIN categorias c ON d.categoria_id = c.id
        WHERE d.id = $1
      `, [result.rows[0].id]);

      created.push(full);
    }

    res.status(201).json({
      message: isParcelado
        ? `Despesa parcelada em ${totalParcelas}x`
        : 'Despesa criada',
      despesa: created[0],
      parcelas: isParcelado ? created : undefined,
      id_parcelamento: idParcelamento
    });
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
      FROM despesas d JOIN categorias c ON d.categoria_id = c.id
      WHERE d.id = $1
    `, [req.params.id]);
    res.json(despesa);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const current = await queryOne('SELECT * FROM despesas WHERE id = $1', [req.params.id]);
    if (!current) return res.status(404).json({ error: 'Despesa não encontrada' });

    const { remover_todas } = req.query;

    if (current.parcelado && current.id_parcelamento && remover_todas === 'true') {
      const result = await query('DELETE FROM despesas WHERE id_parcelamento = $1', [current.id_parcelamento]);
      return res.json({ message: `${result.rowCount} parcelas removidas` });
    }

    const result = await query('DELETE FROM despesas WHERE id = $1', [req.params.id]);
    res.json({ message: 'Despesa removida' });
  } catch (err) { next(err); }
});

module.exports = router;
