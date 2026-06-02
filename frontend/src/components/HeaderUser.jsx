import { useState } from 'react';
import { useAuth } from '../auth/useAuth';
import { useNavigate, NavLink } from 'react-router-dom';
import { useGetUser } from '../api/UserApi';
import samaLogo from '../assets/LogoSAMA.png';
import MobileNav from './MobileNav';
import { useAppearance } from '../appearance/useAppearance';

const HeaderUser = () => {
  const { logout, user } = useAuth();
  const { logoInstitucionalUrl } = useAppearance();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const { data } = useGetUser();
  const userName = user?.nombre || data?.usuario?.nombre || data?.user?.nombre || "Usuario";

  const userLinks = [
    { to: "/notificaciones", label: "Notificaciones" },
    { to: "/tramites", label: "Tramites" },
  ];

  return (
    <header className="top-header">
      <div className="header-left">
        <div className="logo-placeholder">
          <img src={logoInstitucionalUrl || samaLogo} alt="Secretaría del Agua y Medio Ambiente" className="gobierno-logo-img" />
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

      <MobileNav 
        links={userLinks} 
        userName={userName} 
        onLogout={() => {
          logout();
          navigate('/login');
        }} 
      />
    </header>
  );
};

export default HeaderUser;
