require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const path = require('path');
const { migrate } = require('./database');
const authRouter = require('./routes/auth');
const categoriasRouter = require('./routes/categorias');
const receitasRouter = require('./routes/receitas');
const despesasRouter = require('./routes/despesas');
const relatoriosRouter = require('./routes/relatorios');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/categorias', categoriasRouter);
app.use('/api/receitas', receitasRouter);
app.use('/api/despesas', despesasRouter);
app.use('/api/relatorios', relatoriosRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const frontendBuild = path.join(__dirname, '..', '..', 'frontend', 'build');
app.use(express.static(frontendBuild));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(frontendBuild, 'index.html'));
});

app.use(errorHandler);

migrate().then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });
}).catch(err => {
  console.error('Erro ao inicializar banco:', err);
  process.exit(1);
});
