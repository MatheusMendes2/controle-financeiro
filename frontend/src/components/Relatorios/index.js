import React, { useState, useEffect, useCallback } from 'react';
import {
  FiDownload, FiBarChart2, FiFileText, FiTrendingUp, FiTrendingDown
} from 'react-icons/fi';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend
} from 'recharts';
import { relatoriosAPI, categoriasAPI } from '../../services/api';
import {
  formatCurrency, formatMonth, formatMonthFull, getCurrentYear, getCurrentMonth
} from '../../utils/formatters';
import Filters from '../common/Filters';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const meses = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'
];

function Relatorios() {
  const [activeTab, setActiveTab] = useState('gastos-categoria');
  const [ano, setAno] = useState(getCurrentYear());
  const [mes, setMes] = useState(String(getCurrentMonth()).padStart(2, '0'));
  const [categorias, setCategorias] = useState([]);
  const [filters, setFilters] = useState({ categoria_id: '' });
  const [gastosCat, setGastosCat] = useState({ categorias: [], total: 0 });
  const [fluxo, setFluxo] = useState([]);
  const [comparativo, setComparativo] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const catRes = await categoriasAPI.list();
      setCategorias(catRes.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (activeTab === 'gastos-categoria') {
      relatoriosAPI.gastosCategoria({ ano, mes }).then(r => setGastosCat(r.data)).catch(console.error);
    } else if (activeTab === 'fluxo-caixa') {
      relatoriosAPI.fluxoCaixa({ meses: 12 }).then(r => setFluxo(r.data)).catch(console.error);
    } else if (activeTab === 'comparativo') {
      relatoriosAPI.comparativo({ ano }).then(r => setComparativo(r.data)).catch(console.error);
    }
  }, [activeTab, ano, mes]);

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

  function exportarPDF() {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.setTextColor(124, 58, 237);
    doc.text('Relatório Financeiro', 14, 22);
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Período: ${meses[Number(mes) - 1]} de ${ano}`, 14, 30);

    if (activeTab === 'gastos-categoria') {
      doc.setFontSize(14);
      doc.setTextColor(50, 50, 50);
      doc.text('Gastos por Categoria', 14, 42);
      const body = gastosCat.categorias
        .filter(c => c.total > 0)
        .map(c => [c.nome, `R$ ${c.total.toFixed(2)}`, `${c.percentual}%`]);
      doc.autoTable({
        startY: 48,
        head: [['Categoria', 'Valor', '%']],
        body,
        theme: 'grid',
        headStyles: { fillColor: [124, 58, 237] }
      });
    } else if (activeTab === 'fluxo-caixa') {
      doc.setFontSize(14);
      doc.text('Fluxo de Caixa Mensal', 14, 42);
      const body = fluxo.map(f => [f.mes, `R$ ${f.receita.toFixed(2)}`, `R$ ${f.despesa.toFixed(2)}`, `R$ ${f.saldo.toFixed(2)}`]);
      doc.autoTable({
        startY: 48,
        head: [['Mês', 'Receitas', 'Despesas', 'Saldo']],
        body,
        theme: 'grid',
        headStyles: { fillColor: [124, 58, 237] }
      });
    }

    doc.save(`relatorio-${activeTab}-${mes}-${ano}.pdf`);
  }

  function exportarExcel() {
    let data = [];
    if (activeTab === 'gastos-categoria') {
      data = gastosCat.categorias
        .filter(c => c.total > 0)
        .map(c => ({ Categoria: c.nome, Valor: c.total, Percentual: `${c.percentual}%` }));
    } else if (activeTab === 'fluxo-caixa') {
      data = fluxo.map(f => ({ Mês: f.mes, Receitas: f.receita, Despesas: f.despesa, Saldo: f.saldo }));
    } else if (activeTab === 'comparativo' && comparativo) {
      data = [
        { Ano: String(comparativo.anoAnterior), Receitas: comparativo.anterior.receitas, Despesas: comparativo.anterior.despesas },
        { Ano: String(comparativo.anoAtual), Receitas: comparativo.atual.receitas, Despesas: comparativo.atual.despesas }
      ];
    }
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Relatório');
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([buf]), `relatorio-${activeTab}-${mes}-${ano}.xlsx`);
  }

  const tabs = [
    { key: 'gastos-categoria', label: 'Gastos por Categoria' },
    { key: 'fluxo-caixa', label: 'Fluxo de Caixa' },
    { key: 'comparativo', label: 'Comparativo Anual' }
  ];

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Relatórios</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={exportarPDF}>
            <FiFileText /> PDF
          </button>
          <button className="btn btn-secondary btn-sm" onClick={exportarExcel}>
            <FiDownload /> Excel
          </button>
        </div>
      </div>
      <div className="page-body">
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '10px 20px',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab.key ? '2px solid var(--accent-purple)' : '2px solid transparent',
                color: activeTab === tab.key ? 'var(--accent-purple)' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all 0.2s'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <div className="filter-group">
            <label>Mês</label>
            <select className="form-select" value={mes} onChange={e => setMes(e.target.value)}>
              {meses.map((nome, i) => (
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

        {activeTab === 'gastos-categoria' && (
          <div className="card">
            <div className="chart-title">
              Gastos por Categoria - {formatMonthFull(Number(mes))} {ano}
              <span style={{ float: 'right', fontSize: 14, color: 'var(--text-muted)', fontWeight: 400 }}>
                Total: {formatCurrency(gastosCat.total)}
              </span>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={gastosCat.categorias.filter(c => c.total > 0)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" tickFormatter={v => formatCurrency(v)} stroke="var(--text-muted)" fontSize={12} />
                <YAxis dataKey="nome" type="category" stroke="var(--text-muted)" fontSize={12} width={120} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                  {gastosCat.categorias.filter(c => c.total > 0).map((entry, idx) => (
                    <rect key={idx} fill={entry.cor} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{ marginTop: 16 }}>
              {gastosCat.categorias.filter(c => c.total > 0).map(cat => (
                <div key={cat.id} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      <span className="color-dot" style={{ background: cat.cor }} /> {cat.nome}
                      <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>({cat.quantidade} lançamentos)</span>
                    </span>
                    <span style={{ fontWeight: 600 }}>{formatCurrency(cat.total)}</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{
                      width: `${cat.percentual}%`,
                      background: cat.cor
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'fluxo-caixa' && (
          <div className="card">
            <div className="chart-title">Fluxo de Caixa Mensal</div>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={fluxo}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="mes" stroke="var(--text-muted)" fontSize={12} />
                <YAxis tickFormatter={v => formatCurrency(v)} stroke="var(--text-muted)" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line type="monotone" dataKey="receita" stroke="#22c55e" strokeWidth={2} name="Receitas" dot={{ fill: '#22c55e' }} />
                <Line type="monotone" dataKey="despesa" stroke="#ef4444" strokeWidth={2} name="Despesas" dot={{ fill: '#ef4444' }} />
                <Line type="monotone" dataKey="saldo" stroke="#7c3aed" strokeWidth={2} name="Saldo" dot={{ fill: '#7c3aed' }} />
              </LineChart>
            </ResponsiveContainer>
            <div style={{ marginTop: 16 }}>
              <div className="card" style={{ padding: '12px 16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, textAlign: 'center' }}>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total Receitas</div>
                    <div style={{ color: 'var(--accent-green)', fontWeight: 700, fontSize: 18 }}>
                      {formatCurrency(fluxo.reduce((a, f) => a + f.receita, 0))}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total Despesas</div>
                    <div style={{ color: 'var(--accent-red)', fontWeight: 700, fontSize: 18 }}>
                      {formatCurrency(fluxo.reduce((a, f) => a + f.despesa, 0))}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Saldo Acumulado</div>
                    <div style={{ color: 'var(--accent-purple)', fontWeight: 700, fontSize: 18 }}>
                      {formatCurrency(fluxo.reduce((a, f) => a + f.saldo, 0))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'comparativo' && comparativo && (
          <div className="card">
            <div className="chart-title">Comparativo Anual</div>
            <div className="grid-3" style={{ marginBottom: 24 }}>
              <div className="metric-card">
                <div className="metric-label">{comparativo.anoAnterior}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent-green)' }}>
                  {formatCurrency(comparativo.anterior.receitas)}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Receitas</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent-red)', marginTop: 8 }}>
                  {formatCurrency(comparativo.anterior.despesas)}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Despesas</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">{comparativo.anoAtual}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent-green)' }}>
                  {formatCurrency(comparativo.atual.receitas)}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Receitas</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent-red)', marginTop: 8 }}>
                  {formatCurrency(comparativo.atual.despesas)}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Despesas</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Variação</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <FiTrendingUp style={{ color: comparativo.variacaoReceita >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }} />
                  <span style={{ fontSize: 22, fontWeight: 700, color: comparativo.variacaoReceita >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                    {comparativo.variacaoReceita >= 0 ? '+' : ''}{comparativo.variacaoReceita}%
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Receitas</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FiTrendingDown style={{ color: comparativo.variacaoDespesa >= 0 ? 'var(--accent-red)' : 'var(--accent-green)' }} />
                  <span style={{ fontSize: 22, fontWeight: 700, color: comparativo.variacaoDespesa >= 0 ? 'var(--accent-red)' : 'var(--accent-green)' }}>
                    {comparativo.variacaoDespesa >= 0 ? '+' : ''}{comparativo.variacaoDespesa}%
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Despesas</span>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={[
                { ano: String(comparativo.anoAnterior), Receitas: comparativo.anterior.receitas, Despesas: comparativo.anterior.despesas },
                { ano: String(comparativo.anoAtual), Receitas: comparativo.atual.receitas, Despesas: comparativo.atual.despesas }
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="ano" stroke="var(--text-muted)" fontSize={12} />
                <YAxis tickFormatter={v => formatCurrency(v)} stroke="var(--text-muted)" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="Receitas" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </>
  );
}

export default Relatorios;
