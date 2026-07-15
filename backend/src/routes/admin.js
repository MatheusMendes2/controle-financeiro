const { Router } = require('express');
const { queryAll, queryOne, query } = require('../database');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = Router();

router.use(authMiddleware, adminMiddleware);

router.get('/usuarios', async (req, res, next) => {
  try {
    const usuarios = await queryAll(`
      SELECT u.id, u.nome, u.email, u.admin, u.created_at,
        (SELECT COUNT(*) FROM receitas WHERE usuario_id = u.id) as total_receitas,
        (SELECT COUNT(*) FROM despesas WHERE usuario_id = u.id) as total_despesas,
        (SELECT COALESCE(SUM(valor), 0)::numeric FROM receitas WHERE usuario_id = u.id) as soma_receitas,
        (SELECT COALESCE(SUM(valor), 0)::numeric FROM despesas WHERE usuario_id = u.id) as soma_despesas
      FROM usuarios u
      ORDER BY u.created_at DESC
    `);
    res.json(usuarios);
  } catch (err) { next(err); }
});

router.delete('/usuarios/:id', async (req, res, next) => {
  try {
    const usuario = await queryOne('SELECT * FROM usuarios WHERE id = $1', [req.params.id]);
    if (!usuario) return res.status(404).json({ error: 'Usuário não encontrado' });
    if (usuario.admin) return res.status(400).json({ error: 'Não é possível remover um administrador' });

    const result = await query('DELETE FROM despesas WHERE usuario_id = $1', [req.params.id]);
    const totalDespesas = result.rowCount;
    const result2 = await query('DELETE FROM receitas WHERE usuario_id = $1', [req.params.id]);
    const totalReceitas = result2.rowCount;
    await query('DELETE FROM usuarios WHERE id = $1', [req.params.id]);

    res.json({
      message: 'Usuário e todos os seus dados removidos',
      registros_removidos: { receitas: totalReceitas, despesas: totalDespesas }
    });
  } catch (err) { next(err); }
});

module.exports = router;
