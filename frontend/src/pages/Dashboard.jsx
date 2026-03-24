import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

const Dashboard = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'administrador';
  
  // Dummy displayName
  const displayName = isAdmin ? "Bienvenido Admin" : "Cesantoni";

  return (
    <div className="layout-container">
      {/* HEADER */}
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
          <div className="secretaria-text">
            <span>SECRETARÍA DEL</span>
            <strong>AGUA Y</strong>
            <strong>MEDIO AMBIENTE</strong>
          </div>
        </div>

        <div className="header-center">
          <nav className="nav-pill">
            {isAdmin ? (
              <>
                <button className="nav-link">Notificaciones</button>
                <span className="divider"></span>
                <button className="nav-link">Empresas</button>
                <span className="divider"></span>
                <button className="nav-link active">Inicio</button>
                <span className="divider"></span>
                <button className="nav-link">Tramites</button>
                <span className="divider"></span>
                <button className="nav-link">Configuracion</button>
              </>
            ) : (
              <>
                <button className="nav-link active">Inicio</button>
                <span className="divider"></span>
                <button className="nav-link">Empresas</button>
                <span className="divider"></span>
                <button className="nav-link text-red">Notificaciones</button>
                <span className="divider"></span>
                <button className="nav-link">Tramites</button>
                <span className="divider"></span>
                <button className="nav-link">Configuracion</button>
              </>
            )}
            <button className="nav-arrow">{'>'}</button>
          </nav>
        </div>

        <div className="header-right">
          <span className="user-name">{displayName}</span>
          <div className="profile-icon"></div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="main-content">
        {isAdmin && (
          <div className="search-container">
            <div className="search-bar">
              <span className="search-icon">🔍</span>
              <input type="text" placeholder="Busqueda" />
            </div>
            <button className="search-btn">Buscar</button>
          </div>
        )}
      </main>

      {/* FOOTER WIDGET */}
      <div className="labsol-widget">
        <div className="labsol-icon"></div>
        <div className="labsol-text">
          <strong>LABSOL</strong>
          <span>Laboratorio de Software Libre</span>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
