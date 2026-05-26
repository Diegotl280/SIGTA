import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useGetEmpresas, useGetExpedientesByEmpresa, useGetConfigTramites } from '../api/UserApi';
import { useGetDocumentosByExpediente, useValidarDocumento } from '../api/DocApi';
import { useSubirAcuseExpediente, descargarAcuseExpediente } from '../api/ExpedienteApi';
import iconAprobado from '../assets/icono_aprovado.png';
import iconObs from '../assets/icon_con_observaciones.png';
import iconRevision from '../assets/icon_revision.png';
import iconPdf from '../assets/icon_pdf.png';
import { toast } from 'sonner';
import './EmpresaDetalleAdmin.css';



const EmpresaDetalleAdmin = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const { data: dataEmpresas, isLoading: isLoadingEmpresas } = useGetEmpresas();
  const { data: dataExpedientes, isLoading: isLoadingExpedientes } = useGetExpedientesByEmpresa(id);
  const { data: dataConfig, isLoading: isLoadingConfig } = useGetConfigTramites();

  const [empresa, setEmpresa] = useState(null);
  const [tramiteSeleccionado, setTramiteSeleccionado] = useState(null);
  const [modalObservacion, setModalObservacion] = useState(null);
  const acuseInputRef = useRef(null);

  const validarDocMutation = useValidarDocumento();
  const subirAcuseMutation = useSubirAcuseExpediente();

  const expedienteActual = dataExpedientes?.expedientes?.find(e => e.tipo === tramiteSeleccionado);
  const { data: dataDocumentos, isLoading: isLoadingDocumentos } = useGetDocumentosByExpediente(expedienteActual?._id);

  useEffect(() => {
    if (dataEmpresas && dataEmpresas.empresas) {
      const emp = dataEmpresas.empresas.find(e => e._id === id);
      if (emp) setEmpresa(emp);
    }
  }, [dataEmpresas, id]);

  useEffect(() => {
    if (location.state?.tipoAuto) {
      setTramiteSeleccionado(location.state.tipoAuto);
    }
  }, [location.state]);

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

  const renderStatusBox = (tipoExpediente, estadoActual) => {
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
    if (tramiteSeleccionado) {
      setTramiteSeleccionado(null);
    } else {
      navigate('/admin/empresas');
    }
  };

  const validarDocumento = (documentoId, estado) => {
    if (estado === "con_observaciones") {
      setModalObservacion({ documentoId, texto: '' });
      return;
    }

    validarDocMutation.mutate({
      expedienteId: expedienteActual._id,
      documentoId,
      estado,
      observacion: ''
    });
  };

  const confirmarObservacion = () => {
    const observacion = modalObservacion?.texto?.trim() || '';

    if (!observacion) {
      toast.error("La observación no puede estar vacía.");
      return;
    }

    if (observacion.split(/\s+/).length > 500) {
      toast.error("La observación no puede exceder las 500 palabras.");
      return;
    }

    validarDocMutation.mutate({
      expedienteId: expedienteActual._id,
      documentoId: modalObservacion.documentoId,
      estado: 'con_observaciones',
      observacion
    }, {
      onSuccess: () => setModalObservacion(null)
    });
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
      toast.error("Error al descargar el archivo");
      console.error(err);
    }
  };

  const handleAcuseUpload = (e) => {
    const file = e.target.files[0];
    e.target.value = '';

    if (!file || !expedienteActual) return;

    if (file.type !== 'application/pdf') {
      toast.error("Solo se permiten archivos PDF.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("El acuse no puede exceder 10MB.");
      return;
    }

    subirAcuseMutation.mutate({
      expedienteId: expedienteActual._id,
      archivo: file,
    });
  };

  const handleDescargarAcuse = async () => {
    if (!expedienteActual?.acuseRecepcion) return;

    try {
      const blob = await descargarAcuseExpediente(expedienteActual._id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = expedienteActual.acuseRecepcion.nombreArchivo || `acuse-${expedienteActual.folio}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      toast.error(err.message || "Error al descargar el acuse");
    }
  };

  return (
    <div className="empresa-detalle-container fade-in">
      <div className="detalle-header-top" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
        <button type="button" className="btn-volver" onClick={() => navigate('/admin/empresas')}>
          ← Volver
        </button>
        <h1 className="empresa-titulo" style={{ margin: 0 }}>{empresa.nombre}</h1>
        <div className="estado-label" style={{ marginLeft: 'auto' }}>ESTADO</div>
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
                  {renderStatusBox(tipo, estado)}
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
                {renderStatusBox(tramiteSeleccionado, estado)}
              </div>
            );
          })()}

          <div className="requisitos-container">
            {expedienteActual && (
              <div className="acuse-admin-panel">
                <div className="acuse-admin-info">
                  <span className="pdf-hover-wrapper">
                    <img src={iconPdf} alt="PDF" className="pdf-icon" />
                    {expedienteActual.acuseRecepcion && (
                      <span className="pdf-name-tooltip">{expedienteActual.acuseRecepcion.nombreArchivo}</span>
                    )}
                  </span>
                  <div>
                    <strong>Acuse de recepción</strong>
                    <span>
                      {expedienteActual.acuseRecepcion
                        ? `Archivo cargado: ${expedienteActual.acuseRecepcion.nombreArchivo}`
                        : 'Sin acuse cargado'}
                    </span>
                  </div>
                </div>

                <div className="acuse-admin-actions">
                  {expedienteActual.acuseRecepcion && (
                    <button
                      type="button"
                      className="btn-descargar-pdf"
                      onClick={handleDescargarAcuse}
                    >
                      Descargar acuse
                    </button>
                  )}

                  <button
                    type="button"
                    className="btn-reemplazar"
                    onClick={() => acuseInputRef.current?.click()}
                    disabled={subirAcuseMutation.isPending}
                  >
                    {subirAcuseMutation.isPending
                      ? 'Subiendo...'
                      : expedienteActual.acuseRecepcion
                        ? 'Reemplazar acuse'
                        : 'Subir acuse'}
                  </button>
                  <input
                    type="file"
                    ref={acuseInputRef}
                    accept="application/pdf"
                    style={{ display: 'none' }}
                    onChange={handleAcuseUpload}
                  />
                </div>
              </div>
            )}

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
                      <span className="pdf-hover-wrapper">
                        <img src={iconPdf} alt="PDF" className="pdf-icon" />
                        {docSubido && (
                          <span className="pdf-name-tooltip">{docSubido.nombreArchivo}</span>
                        )}
                      </span>
                      {docSubido ? (
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: docSubido.estado === 'validado' ? '#10b981' : docSubido.estado === 'con_observaciones' ? '#ef4444' : '#6b7280' }}>
                            {docSubido.estado === 'validado' ? '✓ Validado' : docSubido.estado === 'con_observaciones' ? '✕ Observaciones' : 'Pendiente'}
                          </span>

                          <button
                            onClick={() => handleDescargarPdf(expedienteActual._id, docSubido._id, docSubido.nombreArchivo)}
                            className="btn-descargar-pdf"
                          >
                            Descargar PDF
                          </button>

                          <button
                            onClick={() => validarDocumento(docSubido._id, "validado")}
                            style={{ fontSize: "0.75rem", padding: "0.3rem 0.6rem", background: "#10b981", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
                          >
                            ✓ Validar
                          </button>

                          <button
                            onClick={() => validarDocumento(docSubido._id, "con_observaciones")}
                            style={{ fontSize: "0.75rem", padding: "0.3rem 0.6rem", background: "#ef4444", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
                          >
                            ✕ Observación
                          </button>

                          {docSubido.estado === 'con_observaciones' && docSubido.observacion && (
                            <span style={{ fontSize: "0.75rem", color: "#ef4444", marginLeft: "0.5rem", fontStyle: 'italic' }}>
                              Ob: {docSubido.observacion}
                            </span>
                          )}
                        </div>
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

      {/* Footer */}
      <div className="footer-seccion">
        <div className="footer-botones">
          <div className="btn-left">
          </div>
          <div className="btn-right">

            <button className="btn-continuar" onClick={handleContinuar}>
              Continuar <span className="btn-icon">✔</span>
            </button>
          </div>
        </div>
      </div>

      {modalObservacion && (
        <div className="modal-overlay fade-in" onClick={(e) => e.target === e.currentTarget && setModalObservacion(null)}>
          <div className="modal-box" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h2>Observación del documento</h2>
              <button className="modal-close" onClick={() => setModalObservacion(null)}>✕</button>
            </div>
            <div className="modal-body">
              <textarea
                value={modalObservacion.texto}
                onChange={(e) => setModalObservacion((actual) => ({ ...actual, texto: e.target.value }))}
                placeholder="Escribe la observación para la empresa..."
                style={{
                  width: '100%',
                  minHeight: '140px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  padding: '0.8rem',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                }}
              />
              <p style={{ margin: '0.5rem 0 0', color: '#6b7280', fontSize: '0.85rem' }}>
                Máximo 500 palabras.
              </p>
            </div>
            <div className="modal-footer">

              <button className="btn-continuar" onClick={confirmarObservacion}>
                Guardar observación <span className="btn-icon">✔</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmpresaDetalleAdmin;
