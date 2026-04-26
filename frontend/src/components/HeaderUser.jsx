import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useNavigate, NavLink } from 'react-router-dom';
import { useGetUser } from '../api/UserApi';

const HeaderUser = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  //Obtiene la información del usuario autenticado
  const { data } = useGetUser();
  const userName = data?.user?.nombre || "Usuario";

  return (
    /** Encabezado */
    <header className="top-header">
      <div className="header-left">
        <div className="logo-placeholder">
          <div className="logo-icon zacatecas-icon"></div>
          <div className="logo-text">
            <strong>Zacatecas</strong>
            <span>GOBIERNO DEL ESTADO</span>
            <span className="small-text">2021-2027</span>
          </div>
        </div>
        {/*Nombre de la secretaría */}
        <div className="secretaria-text">
          <span>SECRETARÍA DEL</span>
          <strong>AGUA Y</strong>
          <strong>MEDIO AMBIENTE</strong>
        </div>
      </div>

      {/*Enlaces de navegación */}
      <div className="header-center">
        <nav className="nav-pill">
          <NavLink
            to="/notificaciones"
            className={({ isActive }) => `nav-link ${isActive ? 'text-red active' : ''}`}
          >
            Notificaciones
          </NavLink>
          <span className="divider"></span>
          <NavLink
            to="/tramites"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            Tramites
          </NavLink>
        </nav>
      </div>

      {/*Información del usuario */}
      <div className="header-right">
        <span className="user-name">{userName}</span>
        <div className="profile-container" style={{ position: 'relative' }}>
          <div
            className="profile-icon"
            onClick={() => setShowDropdown(!showDropdown)}
            style={{ cursor: 'pointer' }}
          ></div>

          {showDropdown && (/**Dropdown */
            <div className="profile-dropdown fade-in">
              <button
                className="logout-btn"
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
              >
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
