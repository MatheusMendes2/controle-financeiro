const { Router } = require('express');
const { queryAll, queryOne } = require('../database');

const router = Router();

router.get('/dashboard', async (req, res, next) => {
  try {
    const ano = req.query.ano || new Date().getFullYear();
    const mes = req.query.mes || String(new Date().getMonth() + 1).padStart(2, '0');

    const receitasMes = await queryOne(
      `SELECT COALESCE(SUM(valor), 0)::numeric as total FROM receitas WHERE TO_CHAR(data_recebimento, 'MM') = $1 AND TO_CHAR(data_recebimento, 'YYYY') = $2`,
      [mes, String(ano)]
    );

    const despesasMes = await queryOne(
      `SELECT COALESCE(SUM(valor), 0)::numeric as total FROM despesas WHERE TO_CHAR(data, 'MM') = $1 AND TO_CHAR(data, 'YYYY') = $2`,
      [mes, String(ano)]
    );

    const despesasPagas = await queryOne(
      `SELECT COALESCE(SUM(valor), 0)::numeric as total FROM despesas WHERE TO_CHAR(data, 'MM') = $1 AND TO_CHAR(data, 'YYYY') = $2 AND status = 'paga'`,
      [mes, String(ano)]
    );

    const totalReceitas = await queryOne('SELECT COALESCE(SUM(valor), 0)::numeric as total FROM receitas');
    const totalDespesas = await queryOne('SELECT COALESCE(SUM(valor), 0)::numeric as total FROM despesas');

    const saldoAtual = Number(totalReceitas.total) - Number(totalDespesas.total);
    const receita = Number(receitasMes.total);
    const despesa = Number(despesasMes.total);
    const economia = receita - despesa;
    const economiaPercentual = receita > 0 ? Number(((economia / receita) * 100).toFixed(1)) : 0;

    res.json({
      saldoAtual,
      receitasMes: receita,
      despesasMes: despesa,
      despesasPagas: Number(despesasPagas.total),
      economia,
      economiaPercentual,
      mes: Number(mes),
      ano: Number(ano)
    });
  } catch (err) { next(err); }
});

router.get('/evolucao-mensal', async (req, res, next) => {
  try {
    const ano = req.query.ano || new Date().getFullYear();

    const sql = `
      WITH meses AS (
        SELECT generate_series(1, 12) as mes_num
      )
      SELECT
        LPAD(m.mes_num::text, 2, '0') as mes,
        COALESCE(r.total, 0) as receitas,
        COALESCE(d.total, 0) as despesas
      FROM meses m
      LEFT JOIN (
        SELECT EXTRACT(MONTH FROM data_recebimento)::int as mes_num, SUM(valor) as total
        FROM receitas WHERE TO_CHAR(data_recebimento, 'YYYY') = $1
        GROUP BY mes_num
      ) r ON m.mes_num = r.mes_num
      LEFT JOIN (
        SELECT EXTRACT(MONTH FROM data)::int as mes_num, SUM(valor) as total
        FROM despesas WHERE TO_CHAR(data, 'YYYY') = $1
        GROUP BY mes_num
      ) d ON m.mes_num = d.mes_num
      ORDER BY m.mes_num
    `;
    const meses = await queryAll(sql, [String(ano)]);

    const mesesNomes = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    const resultado = meses.map(m => ({
      mes: Number(m.mes),
      mesNome: mesesNomes[Number(m.mes) - 1],
      receitas: Number(m.receitas),
      despesas: Number(m.despesas),
      saldo: Number(m.receitas) - Number(m.despesas)
    }));

    res.json(resultado);
  } catch (err) { next(err); }
});

router.get('/gastos-categoria', async (req, res, next) => {
  try {
    const ano = req.query.ano || new Date().getFullYear();
    const mes = req.query.mes;

    let sql = `
      SELECT c.id, c.nome, c.cor, c.icone, COALESCE(SUM(d.valor), 0)::numeric as total, COUNT(d.id)::int as quantidade
      FROM categorias c
      LEFT JOIN despesas d ON c.id = d.categoria_id
      WHERE c.tipo IN ('despesa', 'ambos')
    `;
    const params = [];
    if (mes) {
      sql += ` AND TO_CHAR(d.data, 'MM') = $1 AND TO_CHAR(d.data, 'YYYY') = $2`;
      params.push(mes.toString().padStart(2, '0'), String(ano));
    } else {
      sql += ` AND TO_CHAR(d.data, 'YYYY') = $1`;
      params.push(String(ano));
    }
    sql += ' GROUP BY c.id ORDER BY total DESC';

    const gastos = await queryAll(sql, params);
    const total = gastos.reduce((acc, g) => acc + Number(g.total), 0);
    const resultado = gastos.map(g => ({
      ...g,
      total: Number(g.total),
      percentual: total > 0 ? Number(((Number(g.total) / total) * 100).toFixed(1)) : 0
    }));

    res.json({ categorias: resultado, total });
  } catch (err) { next(err); }
});

router.get('/comparativo', async (req, res, next) => {
  try {
    const ano = Number(req.query.ano || new Date().getFullYear());
    const anoAnterior = ano - 1;

    async function getAnual(ano) {
      const receitas = await queryOne(
        `SELECT COALESCE(SUM(valor), 0)::numeric as total FROM receitas WHERE TO_CHAR(data_recebimento, 'YYYY') = $1`,
        [String(ano)]
      );
      const despesas = await queryOne(
        `SELECT COALESCE(SUM(valor), 0)::numeric as total FROM despesas WHERE TO_CHAR(data, 'YYYY') = $1`,
        [String(ano)]
      );
      return { receitas: Number(receitas.total), despesas: Number(despesas.total) };
    }

    const atual = await getAnual(ano);
    const anterior = await getAnual(anoAnterior);

    const variacaoReceita = anterior.receitas > 0
      ? Number((((atual.receitas - anterior.receitas) / anterior.receitas) * 100).toFixed(1))
      : atual.receitas > 0 ? 100 : 0;

    const variacaoDespesa = anterior.despesas > 0
      ? Number((((atual.despesas - anterior.despesas) / anterior.despesas) * 100).toFixed(1))
      : atual.despesas > 0 ? 100 : 0;

    res.json({
      anoAtual: ano,
      anoAnterior,
      atual,
      anterior,
      variacaoReceita,
      variacaoDespesa
    });
  } catch (err) { next(err); }
});

router.get('/fluxo-caixa', async (req, res, next) => {
  try {
    const meses = Number(req.query.meses) || 6;

    const dataLimite = new Date();
    dataLimite.setMonth(dataLimite.getMonth() - meses + 1);
    const inicio = dataLimite.toISOString().slice(0, 10);

    const receitas = await queryAll(
      `SELECT TO_CHAR(data_recebimento, 'YYYY-MM') as mes, SUM(valor) as total FROM receitas WHERE data_recebimento >= $1 GROUP BY mes ORDER BY mes`,
      [inicio]
    );

    const despesas = await queryAll(
      `SELECT TO_CHAR(data, 'YYYY-MM') as mes, SUM(valor) as total FROM despesas WHERE data >= $1 GROUP BY mes ORDER BY mes`,
      [inicio]
    );

    const mesesSet = new Set();
    receitas.forEach(r => mesesSet.add(r.mes));
    despesas.forEach(d => mesesSet.add(d.mes));

    const resultado = Array.from(mesesSet).sort().map(mes => {
      const rec = receitas.find(r => r.mes === mes);
      const desp = despesas.find(d => d.mes === mes);
      return {
        mes,
        receita: Number(rec ? rec.total : 0),
        despesa: Number(desp ? desp.total : 0),
        saldo: Number(rec ? rec.total : 0) - Number(desp ? desp.total : 0)
      };
    });

    res.json(resultado);
  } catch (err) { next(err); }
});

module.exports = router;
