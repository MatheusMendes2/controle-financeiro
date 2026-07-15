const { Router } = require('express');
const bcrypt = require('bcryptjs');
const { query, queryOne } = require('../database');
const { gerarToken, authMiddleware } = require('../middleware/auth');

const router = Router();

router.post('/register', async (req, res, next) => {
  try {
    const { nome, email, senha } = req.body;
    if (!nome || !email || !senha) {
      return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
    }
    if (senha.length < 6) {
      return res.status(400).json({ error: 'Senha deve ter no mínimo 6 caracteres' });
    }

    const existente = await queryOne('SELECT id FROM usuarios WHERE email = $1', [email]);
    if (existente) {
      return res.status(409).json({ error: 'Email já cadastrado' });
    }

    const senhaHash = await bcrypt.hash(senha, 10);
    const result = await query(
      'INSERT INTO usuarios (nome, email, senha) VALUES ($1, $2, $3) RETURNING id, nome, email, created_at',
      [nome, email, senhaHash]
    );
    const usuario = result.rows[0];
    const token = gerarToken(usuario);

    res.status(201).json({ usuario: { ...usuario, admin: false }, token });
  } catch (err) { next(err); }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, senha } = req.body;
    if (!email || !senha) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    const usuario = await queryOne('SELECT * FROM usuarios WHERE email = $1', [email]);
    if (!usuario) {
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) {
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    const token = gerarToken(usuario);
    res.json({ usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, admin: usuario.admin === 1 || usuario.admin === true }, token });
  } catch (err) { next(err); }
});

router.get('/me', authMiddleware, (req, res) => {
  res.json({ usuario: req.usuario });
});

module.exports = router;
