import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetEmpresas, useDeshabilitarEmpresa } from '../api/UserApi';
import editarIcon from '../assets/editar.png';

const EmpresasAdmin = () => {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useGetEmpresas();
  const { mutate: deshabilitarEmpresa } = useDeshabilitarEmpresa();
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [vistaLista, setVistaLista] = useState(false);
  const [modalEliminar, setModalEliminar] = useState(null);
  const [inputConfirm, setInputConfirm] = useState('');

  const toggleDropdown = (id) => {
    setActiveDropdown(activeDropdown === id ? null : id);
  };

  const handleDelete = (empresaId, empresaNombre) => {
    setInputConfirm('');
    setModalEliminar({ id: empresaId, nombre: empresaNombre || 'Sin nombre' });
    setActiveDropdown(null);
  };

  const confirmarEliminar = () => {
    if (inputConfirm === modalEliminar.nombre) {
      deshabilitarEmpresa(modalEliminar.id);
      setModalEliminar(null);
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
      </div>

      <div className="toggle-bottom-right">
        <button
          className={`vista-btn ${!vistaLista ? 'active' : ''}`}
          onClick={() => setVistaLista(false)}
          title="Vista cuadrícula"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
        </button>
        <button
          className={`vista-btn ${vistaLista ? 'active' : ''}`}
          onClick={() => setVistaLista(true)}
          title="Vista lista"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9f2241" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="6" x2="20" y2="6"></line>
            <line x1="4" y1="12" x2="20" y2="12"></line>
            <line x1="4" y1="18" x2="20" y2="18"></line>
          </svg>
        </button>
      </div>

      {/* Vista cuadrícula */}
      {!vistaLista && (
        <div className="empresas-grid">
          {empresas.length === 0 && (
            <div className="lista-vacia">No hay empresas registradas</div>
          )}
          {empresas.map((empresa) => (
            <div key={empresa._id} className="empresa-card">
              <span className="empresa-name-text">{empresa.nombre || empresa.email}</span>
              <div className="empresa-action-container">
                {activeDropdown === empresa._id ? (
                  <div className="empresa-action-dropdown fade-in">
                    <button className="action-btn edit-btn" onClick={() => {
                      setActiveDropdown(null);
                      navigate('/admin/empresas/agregar', { state: { empresa } });
                    }}>
                      <img src={editarIcon} alt="Editar" style={{ width: '16px', height: '16px', objectFit: 'contain' }} />
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
                    <img src={editarIcon} alt="Editar" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
                  </div>
                )}
              </div>
            </div>
          ))}
          <button
            className="agregar-empresa-btn"
            onClick={() => navigate('/admin/empresas/agregar')}
            style={{ width: '260px', marginTop: '1rem' }}
          >
            + Agregar empresa
          </button>
        </div>
      )}

      {/* Vista lista */}
      {vistaLista && (
        <div className="empresas-grid-wide">
          {empresas.length === 0 && (
            <div className="lista-vacia">No hay empresas registradas</div>
          )}
          {empresas.map((empresa) => (
            <div key={empresa._id} className="empresa-card-wide">
              <span className="empresa-name-text">{empresa.nombre || empresa.email}</span>
              <div className="empresa-action-container-wide">
                {activeDropdown === empresa._id ? (
                  <div className="empresa-dropdown-expanded fade-in">
                    <button className="btn-edit-half" onClick={() => {
                      setActiveDropdown(null);
                      navigate('/admin/empresas/agregar', { state: { empresa } });
                    }}>
                      Editar
                    </button>
                    <button className="btn-delete-half" onClick={() => handleDelete(empresa._id, empresa.nombre)}>
                      Eliminar
                    </button>
                  </div>
                ) : (
                  <div
                    className="empresa-action-square"
                    onClick={() => toggleDropdown(empresa._id)}
                  >
                    <img src={editarIcon} alt="Editar" style={{ width: '22px', height: '22px', objectFit: 'contain' }} />
                  </div>
                )}
              </div>
            </div>
          ))}
          <button
            className="btn-agregar-wide"
            onClick={() => navigate('/admin/empresas/agregar')}
          >
            Agregar empresa
          </button>
        </div>
      )}

      {/* Modal confirmación eliminar */}
      {modalEliminar && (
        <div className="modal-overlay fade-in" onClick={(e) => e.target === e.currentTarget && setModalEliminar(null)}>
          <div className="modal-box" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h2>Eliminar empresa</h2>
              <button className="modal-close" onClick={() => setModalEliminar(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.95rem', color: '#444', marginBottom: '1rem' }}>
                Esta acción deshabilitará la empresa permanentemente. Para confirmar, escribe el nombre exacto:
              </p>
              <div style={{ background: '#fee2e2', borderRadius: '8px', padding: '0.6rem 1rem', marginBottom: '1.2rem' }}>
                <strong style={{ color: '#b91c1c' }}>{modalEliminar.nombre}</strong>
              </div>
              <input
                type="text"
                value={inputConfirm}
                onChange={e => setInputConfirm(e.target.value)}
                placeholder="Escribe el nombre de la empresa..."
                onKeyDown={e => e.key === 'Enter' && confirmarEliminar()}
                style={{
                  width: '100%',
                  border: `1px solid ${inputConfirm === modalEliminar.nombre ? '#10b981' : '#ddd'}`,
                  borderRadius: '8px',
                  padding: '0.6rem 0.8rem',
                  fontSize: '0.95rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
              />
            </div>
            <div className="modal-footer">
              <button className="btn-cancelar" onClick={() => setModalEliminar(null)}>
                <span className="btn-icon">✖</span> Cancelar
              </button>
              <button
                onClick={confirmarEliminar}
                disabled={inputConfirm !== modalEliminar.nombre}
                style={{
                  background: inputConfirm === modalEliminar.nombre ? '#ef4444' : '#fca5a5',
                  color: 'white',
                  border: 'none',
                  borderRadius: '20px',
                  padding: '0.6rem 1.5rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: inputConfirm === modalEliminar.nombre ? 'pointer' : 'not-allowed',
                  transition: 'background 0.2s',
                }}
              >
                <span className="btn-icon">✔</span> Confirmar eliminación
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default EmpresasAdmin;