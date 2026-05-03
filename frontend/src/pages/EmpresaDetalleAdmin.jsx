import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useGetEmpresas, useGetExpedientesByEmpresa, useGetConfigTramites } from '../api/UserApi';
import { useGetDocumentosByExpediente } from '../api/DocApi';
import iconAprobado from '../assets/icono_aprovado.png';
import iconObs from '../assets/icon_con_observaciones.png';
import iconRevision from '../assets/icon_revision.png';
import './EmpresaDetalleAdmin.css';

// SVG para el ícono de PDF
const PdfIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="18" height="18" rx="2" fill="#E11D48"/>
    <path d="M8 11V15M8 11H10.5C11.3284 11 12 11.6716 12 12.5C12 13.3284 11.3284 14 10.5 14H8M8 11V9H10.5C11.3284 9 12 9.6716 12 10.5C12 11.3284 11.3284 12 10.5 12H8" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 9V15M16 9H18M16 12H17.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 15V9H13.5C14.3284 9 15 9.6716 15 10.5V13.5C15 14.3284 14.3284 15 13.5 15H12Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const EmpresaDetalleAdmin = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const { data: dataEmpresas, isLoading: isLoadingEmpresas } = useGetEmpresas();
  const { data: dataExpedientes, isLoading: isLoadingExpedientes } = useGetExpedientesByEmpresa(id);
  const { data: dataConfig, isLoading: isLoadingConfig } = useGetConfigTramites();

  const [empresa, setEmpresa] = useState(null);
  const [tramiteSeleccionado, setTramiteSeleccionado] = useState(null);
  const [observaciones, setObservaciones] = useState('');

  const expedienteActual = dataExpedientes?.expedientes?.find(e => e.tipo === tramiteSeleccionado);
  const { data: dataDocumentos, isLoading: isLoadingDocumentos } = useGetDocumentosByExpediente(expedienteActual?._id);

  useEffect(() => {
    if (dataEmpresas && dataEmpresas.empresas) {
      const emp = dataEmpresas.empresas.find(e => e._id === id);
      if (emp) setEmpresa(emp);
    }
  }, [dataEmpresas, id]);

  if (isLoadingEmpresas || isLoadingExpedientes || isLoadingConfig) {
    return <div className="loader">Cargando detalles...</div>;
  }

  if (!empresa) {
    return <div className="lista-vacia">Empresa no encontrada</div>;
  }

  const expedientes = dataExpedientes?.expedientes || [];
  const configs = dataConfig?.tramites || [];

  // Función para determinar el estado general de un trámite
  const getEstadoTramite = (tipo) => {
    const exp = expedientes.find(e => e.tipo === tipo);
    if (!exp) return 'pendiente'; // No ha subido nada o no ha iniciado
    if (exp.estado === 'validado' || exp.estado === 'cerrado') return 'aprobado';
    if (exp.estado === 'con_observaciones') return 'observaciones';
    return 'pendiente'; // borrador, enviado, en_revision
  };

  const getBackgroundColor = (index) => {
    const colors = ['#cffafe', '#dcfce7', '#ffedd5', '#f3e8ff', '#fce7f3'];
    return colors[index % colors.length];
  };

  const renderStatusBox = (estadoActual) => {
    return (
      <div className="status-box">
        <img 
          src={iconAprobado} 
          alt="Aprobado" 
          className={`status-icon ${estadoActual === 'aprobado' ? 'active' : 'inactive'}`} 
        />
        <img 
          src={iconObs} 
          alt="Observaciones" 
          className={`status-icon ${estadoActual === 'observaciones' ? 'active' : 'inactive'}`} 
        />
        <img 
          src={iconRevision} 
          alt="Pendiente" 
          className={`status-icon ${estadoActual === 'pendiente' ? 'active' : 'inactive'}`} 
        />
      </div>
    );
  };

  const handleContinuar = () => {
    // Si estamos viendo los documentos, volvemos a la lista de trámites
    if (tramiteSeleccionado) {
      setTramiteSeleccionado(null);
    } else {
      // Si estamos en la vista de empresa, regresamos a la lista de empresas
      navigate('/admin/empresas');
    }
  };

  const handleDescargarPdf = async (expedienteId, documentoId, nombreArchivo) => {
    try {
      const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/expedientes/${expedienteId}/documentos/${documentoId}/descargar`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Error al descargar');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = nombreArchivo;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      alert("Error al descargar el archivo");
      console.error(err);
    }
  };

  return (
    <div className="empresa-detalle-container fade-in">
      <div className="detalle-header-top">
        <h1 className="empresa-titulo">{empresa.nombre}</h1>
        <div className="estado-label">ESTADO</div>
      </div>

      {!tramiteSeleccionado ? (
        // VISTA 1: Lista de Trámites
        <div className="tramites-list">
          {empresa.tramitesPermitidos && empresa.tramitesPermitidos.length > 0 ? (
            empresa.tramitesPermitidos.map((tipo, index) => {
              const config = configs.find(c => c.tipo === tipo);
              const nombreTramite = config ? config.nombre : tipo;
              const estado = getEstadoTramite(tipo);
              const bgColor = getBackgroundColor(index);

              return (
                <div key={tipo} className="tramite-row" onClick={() => setTramiteSeleccionado(tipo)}>
                  <div className="tramite-btn" style={{ backgroundColor: bgColor }}>
                    <span className="tramite-nombre">REQUISITOS PARA EL TRÁMITE DE LA {nombreTramite.toUpperCase()} ({tipo})</span>
                    <div className="tramite-icon-right">
                       {estado === 'aprobado' && <img src={iconAprobado} alt="OK" className="tramite-main-icon" />}
                       {estado === 'observaciones' && <img src={iconObs} alt="Obs" className="tramite-main-icon" />}
                       {estado === 'pendiente' && <img src={iconRevision} alt="Pend" className="tramite-main-icon" />}
                    </div>
                  </div>
                  {renderStatusBox(estado)}
                </div>
              );
            })
          ) : (
            <div className="lista-vacia">Esta empresa no tiene trámites asignados.</div>
          )}
        </div>
      ) : (
        // VISTA 2: Documentos de un Trámite
        <div className="documentos-list">
          {(() => {
            const index = empresa.tramitesPermitidos.indexOf(tramiteSeleccionado);
            const config = configs.find(c => c.tipo === tramiteSeleccionado);
            const nombreTramite = config ? config.nombre : tramiteSeleccionado;
            const estado = getEstadoTramite(tramiteSeleccionado);
            const bgColor = getBackgroundColor(index !== -1 ? index : 0);
            
            return (
              <div className="tramite-row">
                <div className="tramite-btn" style={{ backgroundColor: bgColor, cursor: 'default' }}>
                  <span className="tramite-nombre">REQUISITOS PARA EL TRÁMITE DE LA {nombreTramite.toUpperCase()} ({tramiteSeleccionado})</span>
                  <div className="tramite-icon-right">
                     {estado === 'aprobado' && <img src={iconAprobado} alt="OK" className="tramite-main-icon" />}
                     {estado === 'observaciones' && <img src={iconObs} alt="Obs" className="tramite-main-icon" />}
                     {estado === 'pendiente' && <img src={iconRevision} alt="Pend" className="tramite-main-icon" />}
                  </div>
                </div>
                {renderStatusBox(estado)}
              </div>
            );
          })()}

          <div className="requisitos-container">
            {isLoadingDocumentos ? (
              <div className="loader">Cargando documentos...</div>
            ) : (
              configs.find(c => c.tipo === tramiteSeleccionado)?.requisitos.map((req, idx) => {
                // Buscamos si hay un documento subido para este requisito
                const docSubido = dataDocumentos?.documentos?.find(d => d.tipoRequisito === req.nombre);
                const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

                return (
                  <div key={idx} className="requisito-card">
                    <span className="req-texto">{req.nombre}</span>
                    <div className="req-acciones">
                      <PdfIcon />
                      {docSubido ? (
                        <button 
                          onClick={() => handleDescargarPdf(expedienteActual._id, docSubido._id, docSubido.nombreArchivo)}
                          className="btn-descargar-pdf"
                        >
                          Descargar PDF
                        </button>
                      ) : (
                        <button className="btn-descargar-pdf" disabled style={{ backgroundColor: '#d1d5db', color: '#6b7280', cursor: 'not-allowed' }}>
                          No hay pdfs adjuntos
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            {(!configs.find(c => c.tipo === tramiteSeleccionado)?.requisitos || configs.find(c => c.tipo === tramiteSeleccionado)?.requisitos.length === 0) && (
              <div className="lista-vacia">No hay requisitos configurados para este trámite.</div>
            )}
          </div>
        </div>
      )}

      {/* Footer / Observaciones */}
      <div className="footer-seccion">
        <div className="obs-container">
          <label>Observaciones</label>
          <textarea 
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
          ></textarea>
        </div>

        <div className="footer-botones">
          <div className="btn-left">
            <button className="btn-folios">Folios</button>
          </div>
          <div className="btn-right">
            <button className="btn-cancelar" onClick={() => navigate('/admin/empresas')}>
              <span className="btn-icon">✖</span> Cancelar
            </button>
            <button className="btn-continuar" onClick={handleContinuar}>
              Continuar <span className="btn-icon">✔</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmpresaDetalleAdmin;
