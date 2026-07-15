import React, { useState, useEffect, useCallback } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiShoppingCart } from 'react-icons/fi';
import { despesasAPI, categoriasAPI } from '../../services/api';
import { formatCurrency, formatDate, toInputDate, getCurrentMonth, getCurrentYear } from '../../utils/formatters';
import Modal from '../common/Modal';
import Filters from '../common/Filters';

const formasPagamento = [
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'credito', label: 'Cartão de Crédito' },
  { value: 'debito', label: 'Cartão de Débito' },
  { value: 'pix', label: 'PIX' },
  { value: 'boleto', label: 'Boleto' },
  { value: 'transferencia', label: 'Transferência' }
];

function Despesas() {
  const [despesas, setDespesas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [filters, setFilters] = useState({
    mes: String(getCurrentMonth()).padStart(2, '0'),
    ano: getCurrentYear(),
    categoria_id: '',
    status: '',
    data_inicio: '',
    data_fim: ''
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    descricao: '', valor: '', categoria_id: '', data: '',
    forma_pagamento: 'pix', status: 'pendente', observacao: ''
  });

  const loadData = useCallback(async () => {
    try {
      const params = {};
      if (filters.mes) params.mes = filters.mes;
      if (filters.ano) params.ano = filters.ano;
      if (filters.categoria_id) params.categoria_id = filters.categoria_id;
      if (filters.status) params.status = filters.status;
      if (filters.data_inicio) params.data_inicio = filters.data_inicio;
      if (filters.data_fim) params.data_fim = filters.data_fim;
      const [despRes, catRes] = await Promise.all([
        despesasAPI.list(params),
        categoriasAPI.list({ tipo: 'despesa' })
      ]);
      setDespesas(despRes.data);
      setCategorias(catRes.data);
    } catch (err) {
      console.error('Erro ao carregar despesas:', err);
    }
  }, [filters]);

  useEffect(() => { loadData(); }, [loadData]);

  function openCreate() {
    setEditing(null);
    setForm({
      descricao: '', valor: '', categoria_id: '', data: new Date().toISOString().slice(0, 10),
      forma_pagamento: 'pix', status: 'pendente', observacao: ''
    });
    setModalOpen(true);
  }

  function openEdit(despesa) {
    setEditing(despesa);
    setForm({
      descricao: despesa.descricao,
      valor: String(despesa.valor),
      categoria_id: despesa.categoria_id,
      data: toInputDate(despesa.data),
      forma_pagamento: despesa.forma_pagamento,
      status: despesa.status,
      observacao: despesa.observacao || ''
    });
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const data = {
        ...form,
        valor: parseFloat(form.valor.replace(',', '.')) || 0
      };
      if (editing) {
        await despesasAPI.update(editing.id, data);
      } else {
        await despesasAPI.create(data);
      }
      setModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Erro ao salvar despesa:', err);
      alert('Erro ao salvar despesa');
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Remover esta despesa?')) return;
    try {
      await despesasAPI.delete(id);
      loadData();
    } catch (err) {
      console.error('Erro ao remover despesa:', err);
    }
  }

  async function toggleStatus(despesa) {
    try {
      await despesasAPI.update(despesa.id, { status: despesa.status === 'paga' ? 'pendente' : 'paga' });
      loadData();
    } catch (err) {
      console.error('Erro ao alterar status:', err);
    }
  }

  const total = despesas.reduce((acc, d) => acc + Number(d.valor || 0), 0);
  const totalPendente = despesas.filter(d => d.status === 'pendente').reduce((acc, d) => acc + Number(d.valor || 0), 0);

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Despesas</h2>
        <button className="btn btn-primary" onClick={openCreate}>
          <FiPlus /> Nova Despesa
        </button>
      </div>
      <div className="page-body">
        <Filters
          filters={{ ...filters, status: filters.status || '' }}
          onChange={setFilters}
          categorias={categorias}
        />

        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          <div className="card" style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Total</span>
              <span className="metric-value red">{formatCurrency(total)}</span>
            </div>
          </div>
          <div className="card" style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Pendentes</span>
              <span className="metric-value" style={{ color: '#eab308' }}>{formatCurrency(totalPendente)}</span>
            </div>
          </div>
        </div>

        {despesas.length === 0 ? (
          <div className="empty-state">
            <FiShoppingCart />
            <h4>Nenhuma despesa encontrada</h4>
            <p>Clique em "Nova Despesa" para adicionar.</p>
          </div>
        ) : (
          <div className="card" style={{ padding: 0 }}>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Descrição</th>
                    <th>Categoria</th>
                    <th>Data</th>
                    <th>Pagamento</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Valor</th>
                    <th style={{ width: 80 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {despesas.map(d => (
                    <tr key={d.id}>
                      <td style={{ fontWeight: 500 }}>{d.descricao}</td>
                      <td>
                        <span className="badge badge-info">
                          <span className="color-dot" style={{ background: d.categoria_cor }} />
                          {d.categoria_nome}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{formatDate(d.data)}</td>
                      <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        {formasPagamento.find(f => f.value === d.forma_pagamento)?.label || d.forma_pagamento}
                      </td>
                      <td>
                        <button
                          className={`badge ${d.status === 'paga' ? 'badge-success' : 'badge-warning'}`}
                          onClick={() => toggleStatus(d)}
                          style={{ cursor: 'pointer', border: 'none', fontFamily: 'inherit' }}
                        >
                          {d.status === 'paga' ? 'Paga' : 'Pendente'}
                        </button>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--accent-red)' }}>
                        {formatCurrency(d.valor)}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn-icon" onClick={() => openEdit(d)}><FiEdit2 /></button>
                          <button className="btn-icon" onClick={() => handleDelete(d.id)}><FiTrash2 /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editing ? 'Editar Despesa' : 'Nova Despesa'}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
              <button className="btn btn-primary" form="despesaForm">Salvar</button>
            </>
          }
        >
          <form id="despesaForm" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Descrição</label>
              <input className="form-input" placeholder="Ex: Supermercado" value={form.descricao}
                onChange={e => setForm({ ...form, descricao: e.target.value })} required />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Valor (R$)</label>
                <input className="form-input" type="number" step="0.01" min="0.01" placeholder="0,00"
                  value={form.valor} onChange={e => setForm({ ...form, valor: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Categoria</label>
                <select className="form-select" value={form.categoria_id}
                  onChange={e => setForm({ ...form, categoria_id: e.target.value })} required>
                  <option value="">Selecione</option>
                  {categorias.map(c => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Data</label>
                <input className="form-input" type="date" value={form.data}
                  onChange={e => setForm({ ...form, data: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Forma de Pagamento</label>
                <select className="form-select" value={form.forma_pagamento}
                  onChange={e => setForm({ ...form, forma_pagamento: e.target.value })}>
                  {formasPagamento.map(f => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <div style={{ display: 'flex', gap: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input type="radio" name="status" value="pendente" checked={form.status === 'pendente'}
                    onChange={e => setForm({ ...form, status: e.target.value })} />
                  <span style={{ fontSize: 14 }}>Pendente</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input type="radio" name="status" value="paga" checked={form.status === 'paga'}
                    onChange={e => setForm({ ...form, status: e.target.value })} />
                  <span style={{ fontSize: 14 }}>Paga</span>
                </label>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Observação</label>
              <textarea className="form-textarea" placeholder="Observações (opcional)" value={form.observacao}
                onChange={e => setForm({ ...form, observacao: e.target.value })} />
            </div>
          </form>
        </Modal>
      </div>
    </>
  );
}

export default Despesas;
