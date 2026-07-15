import React from 'react';
import { FiSearch } from 'react-icons/fi';

function Filters({ filters, onChange, categorias }) {
  const handleChange = (key, value) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <div className="filters-bar">
      {filters.mes !== undefined && (
        <div className="filter-group">
          <label>Mês</label>
          <select
            className="form-select"
            value={filters.mes}
            onChange={e => handleChange('mes', e.target.value)}
          >
            {[
              'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
              'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'
            ].map((nome, i) => (
              <option key={i + 1} value={String(i + 1).padStart(2, '0')}>{nome}</option>
            ))}
          </select>
        </div>
      )}
      {filters.ano !== undefined && (
        <div className="filter-group">
          <label>Ano</label>
          <select
            className="form-select"
            value={filters.ano}
            onChange={e => handleChange('ano', e.target.value)}
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
      )}
      {filters.categoria_id !== undefined && (
        <div className="filter-group">
          <label>Categoria</label>
          <select
            className="form-select"
            value={filters.categoria_id}
            onChange={e => handleChange('categoria_id', e.target.value)}
          >
            <option value="">Todas</option>
            {categorias.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.nome}</option>
            ))}
          </select>
        </div>
      )}
      {filters.status !== undefined && (
        <div className="filter-group">
          <label>Status</label>
          <select
            className="form-select"
            value={filters.status}
            onChange={e => handleChange('status', e.target.value)}
          >
            <option value="">Todos</option>
            <option value="paga">Paga</option>
            <option value="pendente">Pendente</option>
          </select>
        </div>
      )}
      {filters.data_inicio !== undefined && (
        <div className="filter-group">
          <label>Data Início</label>
          <input
            type="date"
            className="form-input"
            value={filters.data_inicio}
            onChange={e => handleChange('data_inicio', e.target.value)}
          />
        </div>
      )}
      {filters.data_fim !== undefined && (
        <div className="filter-group">
          <label>Data Fim</label>
          <input
            type="date"
            className="form-input"
            value={filters.data_fim}
            onChange={e => handleChange('data_fim', e.target.value)}
          />
        </div>
      )}
    </div>
  );
}

export default Filters;
