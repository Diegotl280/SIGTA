import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetEmpresas } from '../api/UserApi';

const EmpresasAdmin = () => {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useGetEmpresas();
  const [activeDropdown, setActiveDropdown] = useState(null);

  const toggleDropdown = (id) => {
    if (activeDropdown === id) {
      setActiveDropdown(null);
    } else {
      setActiveDropdown(id);
    }
  };

  if (isLoading) return <div className="loader">Cargando empresas...</div>;
  if (isError) return <div className="error-message">Error al cargar las empresas</div>;

  const empresas = data?.empresas || [];

  return (
    <div className="empresas-container fade-in">
      <div className="empresas-grid">
        {empresas.map((empresa) => (
          <div key={empresa._id} className="empresa-card">
            <span>{empresa.nombre}</span>
            <div className="empresa-action-container">
              {activeDropdown === empresa._id ? (
                <div className="empresa-action-dropdown fade-in">
                  <button className="action-btn edit-btn" onClick={() => setActiveDropdown(null)}>
                    <span className="edit-pencil">✎</span>
                    Editar
                  </button>
                  <button className="action-btn delete-btn" onClick={() => setActiveDropdown(null)}>
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
      <button
        className="agregar-empresa-btn"
        onClick={() => navigate('/admin/empresas/agregar')}
      >
        Agregar empresa
      </button>
    </div>
  );
};

export default EmpresasAdmin;
