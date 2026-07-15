import React, { useState, useEffect, useCallback } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiTrendingUp } from 'react-icons/fi';
import { receitasAPI, categoriasAPI } from '../../services/api';
import { formatCurrency, formatDate, toInputDate, getCurrentMonth, getCurrentYear } from '../../utils/formatters';
import Modal from '../common/Modal';
import Filters from '../common/Filters';

function Receitas() {
  const [receitas, setReceitas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [filters, setFilters] = useState({
    mes: String(getCurrentMonth()).padStart(2, '0'),
    ano: getCurrentYear(),
    categoria_id: '',
    data_inicio: '',
    data_fim: ''
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    descricao: '', valor: '', categoria_id: '', data_recebimento: '', observacao: ''
  });

  const loadData = useCallback(async () => {
    try {
      const params = {};
      if (filters.mes) params.mes = filters.mes;
      if (filters.ano) params.ano = filters.ano;
      if (filters.categoria_id) params.categoria_id = filters.categoria_id;
      if (filters.data_inicio) params.data_inicio = filters.data_inicio;
      if (filters.data_fim) params.data_fim = filters.data_fim;
      const [recRes, catRes] = await Promise.all([
        receitasAPI.list(params),
        categoriasAPI.list({ tipo: 'receita' })
      ]);
      setReceitas(recRes.data);
      setCategorias(catRes.data);
    } catch (err) {
      console.error('Erro ao carregar receitas:', err);
    }
  }, [filters]);

  useEffect(() => { loadData(); }, [loadData]);

  function openCreate() {
    setEditing(null);
    setForm({ descricao: '', valor: '', categoria_id: '', data_recebimento: new Date().toISOString().slice(0, 10), observacao: '' });
    setModalOpen(true);
  }

  function openEdit(receita) {
    setEditing(receita);
    setForm({
      descricao: receita.descricao,
      valor: String(receita.valor),
      categoria_id: receita.categoria_id,
      data_recebimento: toInputDate(receita.data_recebimento),
      observacao: receita.observacao || ''
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
        await receitasAPI.update(editing.id, data);
      } else {
        await receitasAPI.create(data);
      }
      setModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Erro ao salvar receita:', err);
      alert('Erro ao salvar receita');
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Remover esta receita?')) return;
    try {
      await receitasAPI.delete(id);
      loadData();
    } catch (err) {
      console.error('Erro ao remover receita:', err);
    }
  }

  const total = receitas.reduce((acc, r) => acc + r.valor, 0);

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Receitas</h2>
        <button className="btn btn-primary" onClick={openCreate}>
          <FiPlus /> Nova Receita
        </button>
      </div>
      <div className="page-body">
        <Filters filters={filters} onChange={setFilters} categorias={categorias} />

        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Total de Receitas</span>
            <span className="metric-value green">{formatCurrency(total)}</span>
          </div>
        </div>

        {receitas.length === 0 ? (
          <div className="empty-state">
            <FiTrendingUp />
            <h4>Nenhuma receita encontrada</h4>
            <p>Clique em "Nova Receita" para adicionar.</p>
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
                    <th style={{ textAlign: 'right' }}>Valor</th>
                    <th style={{ width: 80 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {receitas.map(r => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 500 }}>{r.descricao}</td>
                      <td>
                        <span className="badge badge-info">
                          <span className="color-dot" style={{ background: r.categoria_cor }} />
                          {r.categoria_nome}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{formatDate(r.data_recebimento)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--accent-green)' }}>
                        {formatCurrency(r.valor)}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn-icon" onClick={() => openEdit(r)}><FiEdit2 /></button>
                          <button className="btn-icon" onClick={() => handleDelete(r.id)}><FiTrash2 /></button>
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
          title={editing ? 'Editar Receita' : 'Nova Receita'}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
              <button className="btn btn-primary" form="receitaForm">Salvar</button>
            </>
          }
        >
          <form id="receitaForm" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Descrição</label>
              <input className="form-input" placeholder="Ex: Salário mensal" value={form.descricao}
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
                <label className="form-label">Data de Recebimento</label>
                <input className="form-input" type="date" value={form.data_recebimento}
                  onChange={e => setForm({ ...form, data_recebimento: e.target.value })} required />
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

export default Receitas;
