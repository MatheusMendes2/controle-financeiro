import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');
    if (senha.length < 6) {
      setErro('Senha deve ter no mínimo 6 caracteres');
      return;
    }
    try {
      await register(nome, email, senha);
      navigate('/');
    } catch (err) {
      setErro(err.response?.data?.error || 'Erro ao cadastrar');
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-primary)', padding: 20
    }}>
      <div className="card" style={{ width: '100%', maxWidth: 400, padding: 32 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Finanças
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: 14 }}>Crie sua conta</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nome</label>
            <input className="form-input" placeholder="Seu nome"
              value={nome} onChange={e => setNome(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" placeholder="seu@email.com"
              value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Senha</label>
            <input className="form-input" type="password" placeholder="Mínimo 6 caracteres"
              value={senha} onChange={e => setSenha(e.target.value)} required />
          </div>

          {erro && <p style={{ color: 'var(--accent-red)', fontSize: 13, marginBottom: 12 }}>{erro}</p>}

          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 12 }}>
            Cadastrar
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, color: 'var(--text-muted)', fontSize: 14 }}>
          Já tem conta? <Link to="/login" style={{ color: 'var(--accent-purple)', textDecoration: 'none', fontWeight: 600 }}>Entrar</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
