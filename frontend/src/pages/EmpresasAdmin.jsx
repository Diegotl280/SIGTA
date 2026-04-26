import React from 'react';
import { useNavigate } from 'react-router-dom';

const EmpresasAdmin = () => {
  const navigate = useNavigate();
  {/* Traer las empresas de la base de datos */ }
  const empresas = ['  XD   '];

  return (
    <div className="empresas-container fade-in">
      <div className="empresas-grid">
        {empresas.map((empresa, idx) => (
          <div key={idx} className="empresa-card">
            <span>{empresa}</span>
            <div className="empresa-edit-icon" title="Editar">
              <span className="edit-pencil">✎</span>
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
