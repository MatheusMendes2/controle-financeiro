import React, { useState, useEffect } from 'react';
import { FiUsers, FiTrash2, FiShield, FiAlertTriangle } from 'react-icons/fi';
import { adminAPI } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatters';

function Admin() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsuarios();
  }, []);

  async function loadUsuarios() {
    try {
      const res = await adminAPI.listUsuarios();
      setUsuarios(res.data);
    } catch (err) {
      console.error('Erro ao carregar usuários:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(user) {
    const msg = `Remover ${user.nome} (${user.email})?\n\nIsso apagará:\n- ${user.total_receitas} receitas (${formatCurrency(user.soma_receitas)})\n- ${user.total_despesas} despesas (${formatCurrency(user.soma_despesas)})\n\nEsta ação não pode ser desfeita!`;
    if (!window.confirm(msg)) return;

    try {
      const res = await adminAPI.deleteUsuario(user.id);
      alert(res.data.message);
      loadUsuarios();
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao remover usuário');
    }
  }

  return (
    <>
      <div className="page-header">
        <h2>Manutenção</h2>
      </div>
      <div className="page-body">
        {loading ? (
          <div className="empty-state"><p>Carregando...</p></div>
        ) : (
          <div className="card" style={{ padding: 0 }}>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Email</th>
                    <th>Cadastro</th>
                    <th style={{ textAlign: 'center' }}>Receitas</th>
                    <th style={{ textAlign: 'center' }}>Despesas</th>
                    <th style={{ textAlign: 'right' }}>Total</th>
                    <th style={{ width: 60, textAlign: 'center' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map(u => (
                    <tr key={u.id}>
                      <td style={{ fontWeight: 500 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {u.nome}
                          {u.admin && (
                            <FiShield size={14} color="var(--accent-purple)" title="Administrador" />
                          )}
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{formatDate(u.created_at)}</td>
                      <td style={{ textAlign: 'center', color: 'var(--accent-green)' }}>{u.total_receitas}</td>
                      <td style={{ textAlign: 'center', color: 'var(--accent-red)' }}>{u.total_despesas}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>
                        {formatCurrency(Number(u.soma_receitas) - Number(u.soma_despesas))}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {!u.admin && (
                          <button className="btn-icon" onClick={() => handleDelete(u)}
                            title="Remover usuário e todos os dados">
                            <FiTrash2 />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {usuarios.length === 0 && (
              <div className="empty-state">
                <FiUsers />
                <h4>Nenhum usuário encontrado</h4>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default Admin;
