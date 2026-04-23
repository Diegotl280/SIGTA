import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('usuario');
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const res = await register(email, password, role);
    if (!res.ok) {
      setError(res.msg || 'Error al registrar usuario');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box fade-in">
        <h2 className="auth-title">Crear Cuenta</h2>
        <p className="auth-subtitle">Regístrate en SIGTA</p>
        
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
          <div className="input-group">
            <label htmlFor="role">Rol</label>
            <select id="role" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="usuario">Usuario</option>
              <option value="administrador">Administrador</option>
            </select>
          </div>
          <button type="submit" className="auth-button">
            Registrarse
          </button>
        </form>
        
        <p className="auth-switch">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
