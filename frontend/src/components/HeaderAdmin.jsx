import { useState } from "react";
import { useAuth } from "../auth/useAuth";
import { useNavigate, NavLink } from "react-router-dom";
import samaLogo from "../assets/LogoSAMA.png";
import MobileNav from "./MobileNav";
import { useAppearance } from "../appearance/useAppearance";

const HeaderAdmin = () => {
  const { logout } = useAuth();
  const { logoInstitucionalUrl } = useAppearance();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  const adminLinks = [
    { to: "/admin", label: "Inicio", end: true },
    { to: "/admin/empresas", label: "Empresas" },
    { to: "/admin/tramites", label: "Trámites" },
    { to: "/admin/notificaciones", label: "Notificaciones" },
    { to: "/admin/configuracion", label: "Configuración" },
  ];

  return (
    <header className="top-header">
      <div className="header-left">
        <div className="logo-placeholder">
          <img
            src={logoInstitucionalUrl || samaLogo}
            alt="Secretaría del Agua y Medio Ambiente"
            className="gobierno-logo-img"
          />
        </div>
      </div>

      <div className="header-center">

        <nav className="nav-pill">
          <NavLink
            to="/admin"
            end
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            Inicio
          </NavLink>
          <span className="divider"></span>
          <NavLink
            to="/admin/empresas"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            Empresas
          </NavLink>
          <span className="divider"></span>
          <NavLink
            to="/admin/tramites"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            Trámites
          </NavLink>
          <span className="divider"></span>
          <NavLink
            to="/admin/notificaciones"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            Notificaciones
          </NavLink>
          <span className="divider"></span>

          <NavLink
            to="/admin/configuracion"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            Configuración
          </NavLink>
        </nav>
      </div>



      <div className="header-right">
        <div className="profile-container" style={{ position: "relative" }}>
          <div
            className="user-pill"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            Admin
          </div>

          {showDropdown && (
            <div className="profile-dropdown fade-in">
              <button
                className="logout-btn"
                onClick={() => {
                  logout();
                  navigate("/login");
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

      <MobileNav 
        links={adminLinks} 
        userName="Admin" 
        onLogout={() => {
          logout();
          navigate("/login");
        }} 
      />
    </header>
  );
};

export default HeaderAdmin;
