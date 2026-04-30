import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { useNavigate, NavLink } from "react-router-dom";
import gobiernoLogo from "../assets/Gobierno.jpeg";

const HeaderAdmin = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <header className="top-header">
      <div className="header-left">
        <div className="logo-placeholder">
          <img
            src={gobiernoLogo}
            alt="Gobierno de Zacatecas"
            className="gobierno-logo-img"
          />
        </div>

        <div className="secretaria-text">
          <span>SECRETARÍA DEL</span>
          <strong>AGUA Y</strong>
          <strong>MEDIO AMBIENTE</strong>
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
        <span className="user-name">Bienvenido Admin</span>
        <div className="profile-container" style={{ position: "relative" }}>
          <div
            className="profile-icon"
            onClick={() => setShowDropdown(!showDropdown)}
            style={{ cursor: "pointer" }}
          ></div>

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
    </header>
  );
};

export default HeaderAdmin;
