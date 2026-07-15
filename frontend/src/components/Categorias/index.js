import React, { useState, useEffect, useCallback } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiGrid } from 'react-icons/fi';
import { categoriasAPI } from '../../services/api';
import Modal from '../common/Modal';

const coresSugeridas = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#ec4899',
  '#f43f5e', '#14b8a6', '#84cc16', '#0ea5e9', '#d946ef'
];

function Categorias() {
  const [categorias, setCategorias] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ nome: '', tipo: 'despesa', cor: '#6366f1', icone: 'tag' });

  const loadData = useCallback(async () => {
    try {
      const res = await categoriasAPI.list();
      setCategorias(res.data);
    } catch (err) {
      console.error('Erro ao carregar categorias:', err);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  function openCreate() {
    setEditing(null);
    setForm({ nome: '', tipo: 'despesa', cor: '#6366f1', icone: 'tag' });
    setModalOpen(true);
  }

  function openEdit(cat) {
    setEditing(cat);
    setForm({ nome: cat.nome, tipo: cat.tipo, cor: cat.cor, icone: cat.icone });
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (editing) {
        await categoriasAPI.update(editing.id, form);
      } else {
        await categoriasAPI.create(form);
      }
      setModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Erro ao salvar categoria:', err);
      alert('Erro ao salvar categoria');
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Remover esta categoria?')) return;
    try {
      await categoriasAPI.delete(id);
      loadData();
    } catch (err) {
      console.error('Erro ao remover categoria:', err);
    }
  }

  const categoriasAtivas = categorias.filter(c => c.ativo);
  const categoriasInativas = categorias.filter(c => !c.ativo);

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Categorias</h2>
        <button className="btn btn-primary" onClick={openCreate}>
          <FiPlus /> Nova Categoria
        </button>
      </div>
      <div className="page-body">
        <div className="grid-3">
          {categoriasAtivas.map(cat => (
            <div key={cat.id} className="metric-card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: `${cat.cor}22`, display: 'flex',
                alignItems: 'center', justifyContent: 'center'
              }}>
                <div style={{ width: 20, height: 20, borderRadius: 6, background: cat.cor }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{cat.nome}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  {cat.tipo === 'receita' ? 'Receita' : cat.tipo === 'despesa' ? 'Despesa' : 'Ambos'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button className="btn-icon" onClick={() => openEdit(cat)}><FiEdit2 /></button>
                <button className="btn-icon" onClick={() => handleDelete(cat.id)}><FiTrash2 /></button>
              </div>
            </div>
          ))}
        </div>

        {categoriasAtivas.length === 0 && (
          <div className="empty-state">
            <FiGrid />
            <h4>Nenhuma categoria</h4>
            <p>Crie categorias para organizar seus lançamentos.</p>
          </div>
        )}

        {categoriasInativas.length > 0 && (
          <>
            <h3 style={{ fontSize: 16, marginTop: 32, marginBottom: 12, color: 'var(--text-secondary)' }}>
              Categorias Inativas
            </h3>
            <div className="grid-3">
              {categoriasInativas.map(cat => (
                <div key={cat.id} className="metric-card" style={{ display: 'flex', alignItems: 'center', gap: 16, opacity: 0.5 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: `${cat.cor}22`, display: 'flex',
                    alignItems: 'center', justifyContent: 'center'
                  }}>
                    <div style={{ width: 20, height: 20, borderRadius: 6, background: cat.cor }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{cat.nome}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      {cat.tipo === 'receita' ? 'Receita' : cat.tipo === 'despesa' ? 'Despesa' : 'Ambos'}
                    </div>
                  </div>
                  <button className="btn-icon" onClick={() => openEdit(cat)}><FiEdit2 /></button>
                </div>
              ))}
            </div>
          </>
        )}

        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editing ? 'Editar Categoria' : 'Nova Categoria'}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
              <button className="btn btn-primary" form="catForm">Salvar</button>
            </>
          }
        >
          <form id="catForm" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Nome</label>
              <input className="form-input" placeholder="Ex: Mercado" value={form.nome}
                onChange={e => setForm({ ...form, nome: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Tipo</label>
              <select className="form-select" value={form.tipo}
                onChange={e => setForm({ ...form, tipo: e.target.value })}>
                <option value="receita">Receita</option>
                <option value="despesa">Despesa</option>
                <option value="ambos">Ambos</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Cor</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {coresSugeridas.map(cor => (
                  <div key={cor} onClick={() => setForm({ ...form, cor })}
                    style={{
                      width: 32, height: 32, borderRadius: 8, background: cor,
                      cursor: 'pointer', border: form.cor === cor ? '2px solid white' : '2px solid transparent',
                      transition: 'border 0.2s'
                    }}
                  />
                ))}
              </div>
              <input className="form-input" type="text" value={form.cor}
                onChange={e => setForm({ ...form, cor: e.target.value })}
                style={{ marginTop: 8, width: 120 }} />
            </div>
          </form>
        </Modal>
      </div>
    </>
  );
}

export default Categorias;
