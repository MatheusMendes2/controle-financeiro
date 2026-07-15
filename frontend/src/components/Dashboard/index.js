import React, { useState, useEffect } from 'react';
import {
  FiDollarSign, FiShoppingCart, FiTrendingUp, FiTrendingDown
} from 'react-icons/fi';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { relatoriosAPI, categoriasAPI } from '../../services/api';
import { formatCurrency, formatMonth, getCurrentMonth, getCurrentYear } from '../../utils/formatters';

function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [evolucao, setEvolucao] = useState([]);
  const [gastosCat, setGastosCat] = useState({ categorias: [], total: 0 });
  const [ano, setAno] = useState(getCurrentYear());
  const [mes, setMes] = useState(String(getCurrentMonth()).padStart(2, '0'));

  useEffect(() => {
    loadData();
  }, [ano, mes]);

  async function loadData() {
    try {
      const [dashRes, evolRes, gastosRes] = await Promise.all([
        relatoriosAPI.dashboard({ ano, mes }),
        relatoriosAPI.evolucaoMensal({ ano }),
        relatoriosAPI.gastosCategoria({ ano, mes })
      ]);
      setDashboard(dashRes.data);
      setEvolucao(evolRes.data);
      setGastosCat(gastosRes.data);
    } catch (err) {
      console.error('Erro ao carregar dashboard:', err);
    }
  }

  if (!dashboard) {
    return (
      <div className="main-content">
        <div className="page-header"><h2>Dashboard</h2></div>
        <div className="page-body"><div className="empty-state"><p>Carregando...</p></div></div>
      </div>
    );
  }

  const metrics = [
    {
      label: 'Saldo Atual',
      value: formatCurrency(dashboard.saldoAtual),
      color: dashboard.saldoAtual >= 0 ? 'green' : 'red',
      icon: FiDollarSign
    },
    {
      label: 'Receitas do Mês',
      value: formatCurrency(dashboard.receitasMes),
      color: 'green',
      icon: FiTrendingUp
    },
    {
      label: 'Despesas do Mês',
      value: formatCurrency(dashboard.despesasMes),
      color: 'red',
      icon: FiShoppingCart
    },
    {
      label: 'Economia do Mês',
      value: `${formatCurrency(dashboard.economia)} (${dashboard.economiaPercentual}%)`,
      color: dashboard.economia >= 0 ? 'green' : 'red',
      icon: FiTrendingDown
    }
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="card-glass" style={{ padding: '12px 16px' }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</p>
          {payload.map((entry, idx) => (
            <p key={idx} style={{ fontSize: 14, fontWeight: 600, color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <div className="page-header">
        <h2>Dashboard</h2>
      </div>
      <div className="page-body">
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <div className="filter-group">
            <label>Mês</label>
            <select className="form-select" value={mes} onChange={e => setMes(e.target.value)}>
              {['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
                .map((nome, i) => (
                  <option key={i + 1} value={String(i + 1).padStart(2, '0')}>{nome}</option>
                ))}
            </select>
          </div>
          <div className="filter-group">
            <label>Ano</label>
            <select className="form-select" value={ano} onChange={e => setAno(Number(e.target.value))}>
              {Array.from({ length: 5 }, (_, i) => getCurrentYear() - 2 + i).map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid-4">
          {metrics.map((m, i) => (
            <div key={i} className="metric-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div className="metric-label">{m.label}</div>
                  <div className={`metric-value ${m.color}`}>{m.value}</div>
                </div>
                <m.icon style={{ fontSize: 24, opacity: 0.3, color: `var(--accent-${m.color})` }} />
              </div>
            </div>
          ))}
        </div>

        <div className="grid-2">
          <div className="card">
            <div className="chart-title">Evolução Financeira - {ano}</div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={evolucao}>
                <defs>
                  <linearGradient id="gradReceita" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradDespesa" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="mes" tickFormatter={m => formatMonth(m)} stroke="var(--text-muted)" fontSize={12} />
                <YAxis tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} stroke="var(--text-muted)" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="receitas" stroke="#22c55e" fill="url(#gradReceita)" strokeWidth={2} name="Receitas" />
                <Area type="monotone" dataKey="despesas" stroke="#ef4444" fill="url(#gradDespesa)" strokeWidth={2} name="Despesas" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="card">
            <div className="chart-title">Gastos por Categoria</div>
            {gastosCat.categorias.length === 0 ? (
              <div className="empty-state" style={{ padding: 40 }}>
                <p>Nenhum gasto no período</p>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={gastosCat.categorias.filter(c => c.total > 0)}
                      cx="50%" cy="50%"
                      innerRadius={55} outerRadius={85}
                      paddingAngle={3}
                      dataKey="total"
                    >
                      {gastosCat.categorias.filter(c => c.total > 0).map((entry, idx) => (
                        <Cell key={idx} fill={entry.cor} />
                      ))}
                    </Pie>
                    <Tooltip formatter={v => formatCurrency(v)} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ marginTop: 12 }}>
                  {gastosCat.categorias.filter(c => c.total > 0).slice(0, 6).map(cat => (
                    <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <div className="color-dot" style={{ background: cat.cor }} />
                      <span style={{ flex: 1, fontSize: 13, color: 'var(--text-secondary)' }}>{cat.nome}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, minWidth: 80, textAlign: 'right' }}>{formatCurrency(cat.total)}</span>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 36, textAlign: 'right' }}>{cat.percentual}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default Dashboard;
