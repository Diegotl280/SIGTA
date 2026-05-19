import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Login.css';

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
    <div className="login-split-container">
      <div className="login-left-pane"></div>

      <div className="login-right-pane">
        <div className="login-form-container fade-in">
          <h1 className="login-title">LOGIN</h1>

          {error && <div className="login-error-alert">{error}</div>}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-input-group">
              <input
                id="email"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="USUARIO O ID"
                autoComplete="username"
              />
            </div>

            <div className="login-input-group">
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="CONTRASEÑA"
                autoComplete="current-password"
              />
            </div>

            <div className="login-button-container">
              <button type="submit" className="login-submit-btn">
                Iniciar sesión <span className="login-btn-icon"></span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
