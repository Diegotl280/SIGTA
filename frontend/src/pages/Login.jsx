import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const res = await login(email, password);
    if (!res.ok) {
      setError(res.msg || 'Error al iniciar sesión');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box fade-in">
        <h2 className="auth-title">Bienvenido a SIGTA</h2>
        <p className="auth-subtitle">Inicia sesión en tu cuenta</p>
        
        {error && <div className="auth-alert">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label htmlFor="email">Correo Electrónico</label>
            <input 
              id="email" 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              placeholder="tu@correo.com"
            />
          </div>
          <div className="input-group">
            <label htmlFor="password">Contraseña</label>
            <input 
              id="password" 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              placeholder="••••••••"
            />
          </div>
          <button type="submit" className="auth-button">
            Iniciar Sesión
          </button>
        </form>
        
      </div>
    </div>
  );
};

export default Login;
