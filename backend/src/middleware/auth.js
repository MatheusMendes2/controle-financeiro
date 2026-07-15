const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'controle-financeiro-secret-key-change-in-production';

function gerarToken(usuario) {
  return jwt.sign(
    { id: usuario.id, email: usuario.email, nome: usuario.nome, admin: usuario.admin === 1 || usuario.admin === true },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }
  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.usuario = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}

function adminMiddleware(req, res, next) {
  if (!req.usuario || !req.usuario.admin) {
    return res.status(403).json({ error: 'Acesso restrito a administradores' });
  }
  next();
}

module.exports = { gerarToken, authMiddleware, adminMiddleware, JWT_SECRET };
