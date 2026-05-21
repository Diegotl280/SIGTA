import { useState } from 'react';
import { useAuth } from '../auth/useAuth';
import { useNavigate, NavLink } from 'react-router-dom';
import { useGetUser } from '../api/UserApi';
import gobiernoLogo from '../assets/Gobierno.jpeg';

const HeaderUser = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const { data } = useGetUser();
  const userName = user?.nombre || data?.usuario?.nombre || data?.user?.nombre || "Usuario";

  return (
    <header className="top-header">
      <div className="header-left">
        <div className="logo-placeholder">
          <img src={gobiernoLogo} alt="Gobierno de Zacatecas" className="gobierno-logo-img" />
        </div>
        <div className="secretaria-text">
          <span>SECRETARÍA DEL</span>
          <strong>AGUA Y</strong>
          <strong>MEDIO AMBIENTE</strong>
        </div>
      </div>

      <div className="header-center">
        <nav className="nav-pill">
          <NavLink to="/notificaciones" className={({ isActive }) => `nav-link ${isActive ? 'text-red active' : ''}`}>
            Notificaciones
          </NavLink>
          <span className="divider"></span>
          <NavLink to="/tramites" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Tramites
          </NavLink>
        </nav>
      </div>

      <div className="header-right">
        <div className="profile-container" style={{ position: 'relative' }}>
          <div className="user-pill" onClick={() => setShowDropdown(!showDropdown)}>
            {userName}
          </div>
          {showDropdown && (
            <div className="profile-dropdown fade-in">
              <button className="logout-btn" onClick={() => { logout(); navigate('/login'); }}>
                <div className="logout-icon-container">
                  <span className="logout-power-icon"></span>
                </div>
                Cerrar Sesion
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default HeaderUser;