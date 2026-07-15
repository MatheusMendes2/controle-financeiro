import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
});

export const categoriasAPI = {
  list: (params) => api.get('/categorias', { params }),
  get: (id) => api.get(`/categorias/${id}`),
  create: (data) => api.post('/categorias', data),
  update: (id, data) => api.put(`/categorias/${id}`, data),
  delete: (id) => api.delete(`/categorias/${id}`)
};

export const receitasAPI = {
  list: (params) => api.get('/receitas', { params }),
  get: (id) => api.get(`/receitas/${id}`),
  create: (data) => api.post('/receitas', data),
  update: (id, data) => api.put(`/receitas/${id}`, data),
  delete: (id) => api.delete(`/receitas/${id}`)
};

export const despesasAPI = {
  list: (params) => api.get('/despesas', { params }),
  get: (id) => api.get(`/despesas/${id}`),
  create: (data) => api.post('/despesas', data),
  update: (id, data) => api.put(`/despesas/${id}`, data),
  delete: (id, config) => api.delete(`/despesas/${id}`, config),
  getParcelas: (idParcelamento) => api.get(`/despesas/parcelamento/${idParcelamento}`)
};

export const adminAPI = {
  listUsuarios: () => api.get('/admin/usuarios'),
  deleteUsuario: (id) => api.delete(`/admin/usuarios/${id}`)
};

export const relatoriosAPI = {
  dashboard: (params) => api.get('/relatorios/dashboard', { params }),
  evolucaoMensal: (params) => api.get('/relatorios/evolucao-mensal', { params }),
  gastosCategoria: (params) => api.get('/relatorios/gastos-categoria', { params }),
  comparativo: (params) => api.get('/relatorios/comparativo', { params }),
  fluxoCaixa: (params) => api.get('/relatorios/fluxo-caixa', { params })
};

export default api;
