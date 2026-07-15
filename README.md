# Sistema de Controle Financeiro Pessoal

Aplicação completa para controle financeiro pessoal com tema escuro (estilo Nubank), dashboard interativo, gráficos, relatórios e exportação.

## Tecnologias

- **Frontend:** React 18, Recharts, jsPDF, XLSX, React Icons, React Router
- **Backend:** Node.js, Express, PostgreSQL
- **Banco:** PostgreSQL (gerenciado pelo Render)

## Estrutura

```
controle-financeiro/
├── backend/
│   ├── src/
│   │   ├── index.js          # Servidor Express
│   │   ├── database.js       # SQLite (sql.js) + migrations
│   │   ├── routes/
│   │   │   ├── categorias.js # CRUD categorias
│   │   │   ├── receitas.js   # CRUD receitas
│   │   │   ├── despesas.js   # CRUD despesas
│   │   │   └── relatorios.js # Relatórios agregados
│   │   └── middleware/
│   ├── data/                 # Banco SQLite (gerado automaticamente)
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout/       # Sidebar + estrutura
│   │   │   ├── Dashboard/    # Métricas + gráficos
│   │   │   ├── Receitas/     # CRUD receitas
│   │   │   ├── Despesas/     # CRUD despesas
│   │   │   ├── Categorias/   # Gerenciamento de categorias
│   │   │   ├── Relatorios/   # Relatórios + exportação
│   │   │   └── common/       # Modal, Filters
│   │   ├── services/api.js   # Axios client
│   │   ├── utils/            # Formatadores
│   │   └── styles/global.css # Tema escuro completo
│   ├── public/index.html
│   └── package.json
└── README.md
```

## Instalação

### Pré-requisitos

- Node.js 18+
- npm 9+

### 1. Backend

**Pré-requisito:** PostgreSQL rodando localmente.

Crie o banco de dados:
```bash
createdb financeiro
# ou via psql: CREATE DATABASE financeiro;
```

Configure a conexão editando `backend/.env` (opcional — o default usa `postgres:postgres@localhost:5432/financeiro`):

```bash
cd backend
npm install
npm start
```

O servidor iniciará em `http://localhost:3001`. As tabelas e categorias padrão são criadas automaticamente na primeira execução.

### 2. Frontend (desenvolvimento)

```bash
cd frontend
npm install
npm start
```

O frontend iniciará em `http://localhost:3000`.

### 3. Acessar (desenvolvimento)

Abra [http://localhost:3000](http://localhost:3000) no navegador.

## Produção (monolito)

Em produção, o backend serve o frontend buildado no mesmo domínio:

```bash
cd backend
npm install
npm run build   # Builda o frontend para frontend/build
npm start       # API + frontend estático na mesma porta
```

Acesse `http://localhost:3001`.

> ⚠️ Em produção, a variável de ambiente `DATABASE_URL` deve apontar para um PostgreSQL.

## Deploy no Render

### Opção 1: Deploy automático via render.yaml

1. Crie um repositório no GitHub e faça push do código:

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/seu-usuario/controle-financeiro.git
git push -u origin main
```

2. Acesse [dashboard.render.com](https://dashboard.render.com) e clique em **"Blueprint"**.

3. Conecte seu repositório GitHub. O Render lerá o `render.yaml` automaticamente e criará:
   - O **Web Service** (aplicação Node)
   - O **banco PostgreSQL** (nomeado `financeiro-db`)
   - A variável `DATABASE_URL` será injetada automaticamente no Web Service

4. A aplicação estará disponível em `https://controle-financeiro.onrender.com`.

### Opção 2: Deploy manual (Web Service + PostgreSQL)

1. No [dashboard.render.com](https://dashboard.render.com):
   - Crie um **"New +" > "PostgreSQL"** (plano Free)
   - Anote a `Internal Database URL`

2. Crie um **"New +" > "Web Service"**:
   - **Name:** `controle-financeiro`
   - **Runtime:** `Node`
   - **Build Command:** `cd backend && npm install && npm run build`
   - **Start Command:** `cd backend && npm start`
   - **Plan:** Free

3. Em **Environment Variables**, adicione:
   - `NODE_ENV`: `production`
   - `DATABASE_URL`: cole a `Internal Database URL` do PostgreSQL criado acima

4. Clique em **"Create Web Service"**.

### 💾 Banco de dados PostgreSQL

O banco PostgreSQL é gerenciado pelo Render e os dados persistem automaticamente entre deploys e reinícios. Não é necessário disco persistente como no SQLite.

## API Endpoints

### Categorias
- `GET /api/categorias` — Listar (query: tipo, ativo)
- `GET /api/categorias/:id` — Obter
- `POST /api/categorias` — Criar
- `PUT /api/categorias/:id` — Atualizar
- `DELETE /api/categorias/:id` — Remover (desativa se houver vínculos)

### Receitas
- `GET /api/receitas` — Listar (query: mes, ano, categoria_id, data_inicio, data_fim)
- `GET /api/receitas/:id` — Obter
- `POST /api/receitas` — Criar
- `PUT /api/receitas/:id` — Atualizar
- `DELETE /api/receitas/:id` — Remover

### Despesas
- `GET /api/despesas` — Listar (query: mes, ano, categoria_id, status, data_inicio, data_fim, forma_pagamento)
- `GET /api/despesas/:id` — Obter
- `POST /api/despesas` — Criar
- `PUT /api/despesas/:id` — Atualizar
- `DELETE /api/despesas/:id` — Remover

### Relatórios
- `GET /api/relatorios/dashboard` — Métricas do mês (query: mes, ano)
- `GET /api/relatorios/evolucao-mensal` — Evolução mensal (query: ano)
- `GET /api/relatorios/gastos-categoria` — Gastos agrupados (query: ano, mes)
- `GET /api/relatorios/comparativo` — Comparativo anual (query: ano)
- `GET /api/relatorios/fluxo-caixa` — Fluxo de caixa (query: meses)

## Funcionalidades

- **Dashboard:** Saldo, receitas/despesas do mês, economia, gráfico de evolução, pizza de gastos
- **Receitas:** Cadastro completo com categoria, data e valor
- **Despesas:** Cadastro com forma de pagamento, status (paga/pendente), toggle de status
- **Categorias:** Gerenciamento completo com cores, tipos (receita/despesa/ambos), ativação/desativação
- **Relatórios:** Gastos por categoria, fluxo de caixa, comparativo anual, exportação PDF e Excel
- **Filtros:** Por período (mês/ano), categoria, status, data personalizada
- **Tema escuro:** Design inspirado no Nubank com gradientes, glassmorphism e sidebar responsiva
