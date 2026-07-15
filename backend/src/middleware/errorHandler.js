function errorHandler(err, req, res, next) {
  console.error('Erro:', err.message);
  console.error(err.stack);

  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    return res.status(409).json({ error: 'Registro duplicado', detail: err.message });
  }
  if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
    return res.status(400).json({ error: 'Referência inválida', detail: err.message });
  }

  res.status(err.status || 500).json({
    error: err.message || 'Erro interno do servidor',
    detail: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
}

module.exports = errorHandler;
