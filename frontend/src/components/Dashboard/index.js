import React, { useState, useEffect } from 'react';
import {
  FiDollarSign, FiShoppingCart, FiTrendingUp, FiTrendingDown, FiPlus, FiX
} from 'react-icons/fi';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { relatoriosAPI, categoriasAPI, receitasAPI, despesasAPI } from '../../services/api';
import { formatCurrency, formatMonth, getCurrentMonth, getCurrentYear } from '../../utils/formatters';
import Modal from '../common/Modal';

function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [evolucao, setEvolucao] = useState([]);
  const [gastosCat, setGastosCat] = useState({ categorias: [], total: 0 });
  const [ano, setAno] = useState(getCurrentYear());
  const [mes, setMes] = useState(String(getCurrentMonth()).padStart(2, '0'));
  const [catsReceita, setCatsReceita] = useState([]);
  const [catsDespesa, setCatsDespesa] = useState([]);

  const [modalReceita, setModalReceita] = useState(false);
  const [modalDespesa, setModalDespesa] = useState(false);
  const [formRec, setFormRec] = useState({ descricao: '', valor: '', categoria_id: '', data_recebimento: '', observacao: '' });
  const [formDesp, setFormDesp] = useState({ descricao: '', valor: '', categoria_id: '', data: '', forma_pagamento: 'pix', status: 'pendente', observacao: '', parcelado: false, numero_parcelas: 2 });

  const formasPagamento = [
    { value: 'dinheiro', label: 'Dinheiro' },
    { value: 'credito', label: 'Cartão de Crédito' },
    { value: 'debito', label: 'Cartão de Débito' },
    { value: 'pix', label: 'PIX' },
    { value: 'boleto', label: 'Boleto' },
    { value: 'transferencia', label: 'Transferência' }
  ];

  useEffect(() => {
    loadData();
    categoriasAPI.list({ tipo: 'receita' }).then(r => setCatsReceita(r.data)).catch(() => {});
    categoriasAPI.list({ tipo: 'despesa' }).then(r => setCatsDespesa(r.data)).catch(() => {});
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

  function abrirRec() {
    setFormRec({ descricao: '', valor: '', categoria_id: '', data_recebimento: new Date().toISOString().slice(0, 10), observacao: '' });
    setModalReceita(true);
  }

  function abrirDesp() {
    setFormDesp({ descricao: '', valor: '', categoria_id: '', data: new Date().toISOString().slice(0, 10), forma_pagamento: 'pix', status: 'pendente', observacao: '', parcelado: false, numero_parcelas: 2 });
    setModalDespesa(true);
  }

  async function submitRec(e) {
    e.preventDefault();
    try {
      await receitasAPI.create({ ...formRec, valor: parseFloat(formRec.valor.replace(',', '.')) || 0 });
      setModalReceita(false);
      loadData();
    } catch (err) {
      alert('Erro ao salvar receita');
    }
  }

  async function submitDesp(e) {
    e.preventDefault();
    try {
      await despesasAPI.create({ ...formDesp, valor: parseFloat(formDesp.valor.replace(',', '.')) || 0 });
      setModalDespesa(false);
      loadData();
    } catch (err) {
      alert('Erro ao salvar despesa');
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
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Dashboard</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" onClick={abrirRec}>
            <FiPlus /> Nova Receita
          </button>
          <button className="btn btn-primary" onClick={abrirDesp}
            style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
            <FiPlus /> Nova Despesa
          </button>
        </div>
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

      <Modal isOpen={modalReceita} onClose={() => setModalReceita(false)} title="Nova Receita"
        footer={<><button className="btn btn-secondary" onClick={() => setModalReceita(false)}>Cancelar</button><button className="btn btn-primary" form="formRec">Salvar</button></>}>
        <form id="formRec" onSubmit={submitRec}>
          <div className="form-group">
            <label className="form-label">Descrição</label>
            <input className="form-input" placeholder="Ex: Salário" value={formRec.descricao}
              onChange={e => setFormRec({ ...formRec, descricao: e.target.value })} required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Valor (R$)</label>
              <input className="form-input" type="number" step="0.01" min="0.01" placeholder="0,00"
                value={formRec.valor} onChange={e => setFormRec({ ...formRec, valor: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Categoria</label>
              <select className="form-select" value={formRec.categoria_id}
                onChange={e => setFormRec({ ...formRec, categoria_id: e.target.value })} required>
                <option value="">Selecione</option>
                {catsReceita.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Data de Recebimento</label>
            <input className="form-input" type="date" value={formRec.data_recebimento}
              onChange={e => setFormRec({ ...formRec, data_recebimento: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Observação</label>
            <textarea className="form-textarea" placeholder="Opcional" value={formRec.observacao}
              onChange={e => setFormRec({ ...formRec, observacao: e.target.value })} />
          </div>
        </form>
      </Modal>

      <Modal isOpen={modalDespesa} onClose={() => setModalDespesa(false)} title="Nova Despesa"
        footer={<><button className="btn btn-secondary" onClick={() => setModalDespesa(false)}>Cancelar</button><button className="btn btn-primary" form="formDesp">Salvar</button></>}>
        <form id="formDesp" onSubmit={submitDesp}>
          <div className="form-group">
            <label className="form-label">Descrição</label>
            <input className="form-input" placeholder="Ex: Supermercado" value={formDesp.descricao}
              onChange={e => setFormDesp({ ...formDesp, descricao: e.target.value })} required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Valor Total (R$)</label>
              <input className="form-input" type="number" step="0.01" min="0.01" placeholder="0,00"
                value={formDesp.valor} onChange={e => setFormDesp({ ...formDesp, valor: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Categoria</label>
              <select className="form-select" value={formDesp.categoria_id}
                onChange={e => setFormDesp({ ...formDesp, categoria_id: e.target.value })} required>
                <option value="">Selecione</option>
                {catsDespesa.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Data</label>
              <input className="form-input" type="date" value={formDesp.data}
                onChange={e => setFormDesp({ ...formDesp, data: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Pagamento</label>
              <select className="form-select" value={formDesp.forma_pagamento}
                onChange={e => setFormDesp({ ...formDesp, forma_pagamento: e.target.value })}>
                {formasPagamento.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group" style={{ background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', padding: '12px 16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input type="checkbox" checked={formDesp.parcelado}
                onChange={e => setFormDesp({ ...formDesp, parcelado: e.target.checked })}
                style={{ width: 18, height: 18, accentColor: 'var(--accent-purple)' }} />
              <span style={{ fontSize: 14, fontWeight: 600 }}>Compra parcelada</span>
            </label>
            {formDesp.parcelado && (
              <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                <label style={{ fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Parcelas:</label>
                <select className="form-select" value={formDesp.numero_parcelas}
                  onChange={e => setFormDesp({ ...formDesp, numero_parcelas: Number(e.target.value) })}
                  style={{ width: 100 }}>
                  {[2,3,4,5,6,7,8,9,10,11,12].map(n => <option key={n} value={n}>{n}x</option>)}
                </select>
                {formDesp.valor && Number(formDesp.valor) > 0 && (
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    {formDesp.numero_parcelas}x de {formatCurrency(Number(formDesp.valor) / formDesp.numero_parcelas)}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <div style={{ display: 'flex', gap: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <input type="radio" name="st" value="pendente" checked={formDesp.status === 'pendente'}
                  onChange={e => setFormDesp({ ...formDesp, status: e.target.value })} />
                <span style={{ fontSize: 14 }}>Pendente</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <input type="radio" name="st" value="paga" checked={formDesp.status === 'paga'}
                  onChange={e => setFormDesp({ ...formDesp, status: e.target.value })} />
                <span style={{ fontSize: 14 }}>Paga</span>
              </label>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Observação</label>
            <textarea className="form-textarea" placeholder="Opcional" value={formDesp.observacao}
              onChange={e => setFormDesp({ ...formDesp, observacao: e.target.value })} />
          </div>
        </form>
      </Modal>
    </>
  );
}

export default Dashboard;
