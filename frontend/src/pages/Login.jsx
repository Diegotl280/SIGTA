import { useState } from 'react';
import { useAuth } from '../auth/useAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import samaLogo from '../assets/LogoSAMA.png';
import { useAppearance } from '../appearance/useAppearance';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const { logoInstitucionalUrl } = useAppearance();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await login(email, password);
    if (!res.ok) {
      toast.error(res.msg || 'Error al iniciar sesión');
    } else {

      navigate('/');
    }
  };

  return (
    <div className="login-split-container">
      <div className="login-left-pane">
        <div className="login-brand-mark">
          <span>SIGTA</span>
          <strong>Trámites ambientales</strong>
        </div>
      </div>

      <div className="login-right-pane">
        <div className="login-form-container fade-in">
          <img
            src={logoInstitucionalUrl || samaLogo}
            alt="Secretaría del Agua y Medio Ambiente"
            className="login-logo"
          />

          <div className="login-heading">
            <h1 className="login-title">Acceso SIGTA</h1>
            <p>Sistema de Gestión de Trámites Ambientales</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-input-group">
              <label htmlFor="email">Correo electrónico</label>
              <input
                id="email"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="correo@institucion.gob.mx"
                autoComplete="username"
              />
            </div>

            <div className="login-input-group">
              <label htmlFor="password">Contraseña</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Ingresa tu contraseña"
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
