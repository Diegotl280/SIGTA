import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetEmpresas, useDeshabilitarEmpresa } from '../api/UserApi';

const EmpresasAdmin = () => {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useGetEmpresas();
  const { mutate: deshabilitarEmpresa } = useDeshabilitarEmpresa();
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [vistaLista, setVistaLista] = useState(false);

  const toggleDropdown = (id) => {
    setActiveDropdown(activeDropdown === id ? null : id);
  };

  const handleDelete = (empresaId, empresaNombre) => {
    const nombreParaConfirmar = empresaNombre || 'Sin nombre';
    const inputName = window.prompt(`Para confirmar, escribe el nombre de la empresa: ${nombreParaConfirmar}`);
    if (inputName === nombreParaConfirmar) {
      deshabilitarEmpresa(empresaId);
      setActiveDropdown(null);
    } else if (inputName !== null) {
      alert("El nombre no coincide. No se eliminó la empresa.");
    }
  };

  if (isLoading) return <div className="loader">Cargando empresas...</div>;
  if (isError) return <div className="error-message">Error al cargar las empresas</div>;

  const empresas = data?.empresas || [];

  return (
    <div className="empresas-container fade-in">

      {/* Toggle vista */}
      <div className="empresas-toolbar">
        <span className="empresas-count">{empresas.length} empresa{empresas.length !== 1 ? 's' : ''}</span>
        <div className="vista-toggle">
          <button
            className={`vista-btn ${!vistaLista ? 'active' : ''}`}
            onClick={() => setVistaLista(false)}
            title="Vista cuadrícula"
          >⊞</button>
          <button
            className={`vista-btn ${vistaLista ? 'active' : ''}`}
            onClick={() => setVistaLista(true)}
            title="Vista lista"
          >☰</button>
        </div>
      </div>

      {/* Vista cuadrícula */}
      {!vistaLista && (
        <div className="empresas-grid">
          {empresas.length === 0 && (
            <div className="lista-vacia">No hay empresas registradas</div>
          )}
          {empresas.map((empresa) => (
            <div key={empresa._id} className="empresa-card">
              <span>{empresa.nombre || empresa.email}</span>
              <div className="empresa-action-container">
                {activeDropdown === empresa._id ? (
                  <div className="empresa-action-dropdown fade-in">
                    <button className="action-btn edit-btn" onClick={() => {
                      setActiveDropdown(null);
                      navigate('/admin/empresas/agregar', { state: { empresa } });
                    }}>
                      <span className="edit-pencil">✎</span>
                      Editar
                    </button>
                    <button className="action-btn delete-btn" onClick={() => handleDelete(empresa._id, empresa.nombre)}>
                      Eliminar
                    </button>
                  </div>
                ) : (
                  <div
                    className="empresa-edit-icon"
                    title="Opciones"
                    onClick={() => toggleDropdown(empresa._id)}
                  >
                    <span className="edit-pencil">✎</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Vista lista */}
      {vistaLista && (
        <div className="empresas-lista-view">
          {empresas.length === 0 && (
            <div className="lista-vacia">No hay empresas registradas</div>
          )}
          {empresas.map((empresa) => (
            <div key={empresa._id} className="empresa-lista-row">
              <div className="empresa-lista-info">
                <span className="empresa-lista-nombre">{empresa.nombre || '—'}</span>
                <span className="empresa-lista-email">{empresa.email}</span>
              </div>
              <div className="empresa-lista-acciones">
                <button className="btn-lista-edit" onClick={() => {
                  toggleDropdown(empresa._id);
                  navigate('/admin/empresas/agregar', { state: { empresa } });
                }}>
                  ✎ Editar
                </button>
                <button className="btn-lista-delete" onClick={() => handleDelete(empresa._id, empresa.nombre)}>
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        className="agregar-empresa-btn"
        onClick={() => navigate('/admin/empresas/agregar')}
      >
        + Agregar empresa
      </button>
    </div>
  );
};

export default EmpresasAdmin;