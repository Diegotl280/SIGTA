import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useGetUser, useGetConfigTramites } from '../api/UserApi';
import { useGetMisExpedientes, useCrearExpediente, useEnviarExpediente, descargarAcuseExpediente } from '../api/ExpedienteApi';
import { useGetDocumentosByExpediente, useSubirDocumento } from '../api/DocApi';
import { toast } from 'sonner';
import iconAprobado from '../assets/icono_aprovado.png';
import iconObs from '../assets/icon_con_observaciones.png';
import iconRevision from '../assets/icon_revision.png';
import iconAgregaDoc from '../assets/icon_agrega_doc.png';
import iconPdf from '../assets/icon_pdf.png';
import '../pages/EmpresaDetalleAdmin.css';
import './TramitesUser.css';



const TramitesUser = () => {
  const { data: userData, isLoading: isLoadingUser } = useGetUser();
  const { data: dataExpedientes, isLoading: isLoadingExpedientes } = useGetMisExpedientes();
  const { data: dataConfig, isLoading: isLoadingConfig } = useGetConfigTramites();

  const { mutate: crearExpediente } = useCrearExpediente();
  const { mutate: subirDocumento } = useSubirDocumento();
  const { mutate: enviarExpediente } = useEnviarExpediente();

  const [tramiteSeleccionado, setTramiteSeleccionado] = useState(null);
  const location = useLocation();

  const expedientes = useMemo(() => dataExpedientes?.expedientes || [], [dataExpedientes?.expedientes]);
  const configs = dataConfig?.tramites || [];
  const tramitesPermitidos = userData?.usuario?.tramitesPermitidos || [];

  useEffect(() => {
    if (location.state?.tramite && tramitesPermitidos.length > 0 && !isLoadingExpedientes) {
      const tipo = location.state.tramite;
      setTramiteSeleccionado(tipo);
      
      if (!expedientes.find(e => e.tipo === tipo)) {
        crearExpediente(tipo);
      }

      window.history.replaceState({}, document.title);
    }
  }, [location.state, tramitesPermitidos.length, isLoadingExpedientes, expedientes, crearExpediente]);

  const expedienteActual = expedientes.find(e => e.tipo === tramiteSeleccionado);
  const { data: dataDocumentos, isLoading: isLoadingDocumentos } = useGetDocumentosByExpediente(expedienteActual?._id);

  const fileInputRef = useRef({});

  if (isLoadingUser || isLoadingExpedientes || isLoadingConfig) {
    return <div className="loader">Cargando trámites...</div>;
  }

  const getEstadoTramite = (tipo) => {
    const exp = expedientes.find(e => e.tipo === tipo);
    if (!exp) return 'nuevo';
    if (exp.estado === 'borrador') return 'nuevo';
    if (exp.estado === 'validado' || exp.estado === 'cerrado') return 'aprobado';
    if (exp.estado === 'con_observaciones') return 'observaciones';
    return 'pendiente';
  };

  const getBackgroundColor = (index) => {
    const colors = [
      'var(--sigta-card-tramite)',
      'color-mix(in srgb, var(--sigta-card-tramite) 82%, #ffffff)',
      'color-mix(in srgb, var(--sigta-card-tramite) 74%, #f5adab)',
    ];
    return colors[index % colors.length];
  };

  const handleSeleccionarTramite = (tipo) => {
    setTramiteSeleccionado(tipo);
    // Si no existe un expediente para este trámite, lo creamos automáticamente
    if (!expedientes.find(e => e.tipo === tipo)) {
      crearExpediente(tipo);
    }
  };

  const handleFileUpload = (e, tipoRequisito) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error("Solo se permiten archivos PDF.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("El archivo excede el límite de 5MB.");
      return;
    }

    if (!expedienteActual) {
      toast.error("Hubo un problema al cargar el expediente. Por favor, intenta de nuevo.");
      return;
    }

    subirDocumento({
      expedienteId: expedienteActual._id,
      tipoRequisito,
      archivo: file
    });
  };

  const isTrámiteCompleto = () => {
    if (!dataDocumentos?.checklist) return false;
    // Verificar que todos los requeridos estén subidos
    const requeridos = dataDocumentos.checklist.filter(req => req.obligatorio);
    return requeridos.every(req => req.estado !== 'no_subido');
  };

  const handleEnviarTramite = () => {
    if (!isTrámiteCompleto()) {
      toast.error("Faltan documentos obligatorios por subir.");
      return;
    }
    enviarExpediente(expedienteActual._id, {
      onSuccess: () => setTramiteSeleccionado(null)
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
    <div className="tramites-user-container fade-in">


      {!tramiteSeleccionado ? (
        // VISTA 1: Lista de Trámites
        <div className="tramites-list">
          {tramitesPermitidos.length > 0 ? (
            tramitesPermitidos.map((tipo, index) => {
              const config = configs.find(c => c.tipo === tipo);
              const nombreTramite = config ? config.nombre : tipo;
              const estado = getEstadoTramite(tipo);
              const bgColor = getBackgroundColor(index);

              return (
                <div key={tipo} className="tramite-row" onClick={() => handleSeleccionarTramite(tipo)}>
                  <div className="tramite-btn" style={{ backgroundColor: bgColor }}>
                    <span className="tramite-nombre">REQUISITOS PARA EL TRÁMITE DE LA {nombreTramite.toUpperCase()} ({tipo})</span>
                    <div className="tramite-icon-right">
                      {estado === 'aprobado' && <img src={iconAprobado} alt="OK" className="tramite-main-icon" />}
                      {estado === 'observaciones' && <img src={iconObs} alt="Obs" className="tramite-main-icon" />}
                      {estado === 'pendiente' && <img src={iconRevision} alt="Pend" className="tramite-main-icon" />}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="lista-vacia">No tienes trámites asignados.</div>
          )}
        </div>
      ) : (
        // VISTA 2: Documentos a subir
        <div className="documentos-list">
          {(() => {
            const index = tramitesPermitidos.indexOf(tramiteSeleccionado);
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
              </div>
            );
          })()}

          <div className="requisitos-container">
            {expedienteActual?.acuseRecepcion && (
              <div className="acuse-user-panel">
                <div className="acuse-user-info">
                  <span className="pdf-hover-wrapper">
                    <img src={iconPdf} alt="PDF" className="pdf-icon" />
                    <span className="pdf-name-tooltip">{expedienteActual.acuseRecepcion.nombreArchivo}</span>
                  </span>
                  <div>
                    <strong>Acuse de recepción disponible</strong>
                    <span>{expedienteActual.acuseRecepcion.nombreArchivo}</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-descargar-pdf"
                  onClick={handleDescargarAcuse}
                >
                  Descargar acuse
                </button>
              </div>
            )}

            {isLoadingDocumentos ? (
              <div className="loader">Cargando requisitos...</div>
            ) : (
              configs.find(c => c.tipo === tramiteSeleccionado)?.requisitos.map((req, idx) => {
                const docSubido = dataDocumentos?.documentos?.find(d => d.tipoRequisito === req.nombre);

                return (
                  <div key={idx} className="requisito-card user-req-card">
                    <div className="req-info">
                      <span className="req-texto">
                        {req.nombre}
                        {req.obligatorio ? <span className="text-red-500 ml-1">*</span> : <span className="text-gray-500 ml-1"> (Opcional)</span>}
                      </span>
                    </div>

                    <div className="req-acciones user-req-acciones">
                      {docSubido ? (
                        <>
                          <span className="pdf-hover-wrapper">
                            <img src={iconPdf} alt="PDF" className="pdf-icon" />
                            <span className="pdf-name-tooltip">{docSubido.nombreArchivo}</span>
                          </span>
                          <button
                            onClick={() => handleDescargarPdf(expedienteActual._id, docSubido._id, docSubido.nombreArchivo)}
                            className="btn-descargar-pdf"
                          >
                            Descargar
                          </button>
                          {docSubido.estado === 'con_observaciones' ? (
                            <label className="btn-reemplazar">
                              Reemplazar
                              <input
                                type="file"
                                accept="application/pdf"
                                style={{ display: 'none' }}
                                onChange={(e) => handleFileUpload(e, req.nombre)}
                              />
                            </label>
                          ) : (
                            <button
                              className="btn-reemplazar"
                              disabled
                              style={{ opacity: 0.5, cursor: 'not-allowed', border: 'none', background: '#ccc', color: '#666' }}
                              title="Solo se puede reemplazar cuando hay observaciones del administrador"
                            >
                              Reemplazar
                            </button>
                          )}
                        </>
                      ) : (
                        <div className="upload-btn-wrapper">
                          <img
                            src={iconAgregaDoc}
                            alt="Agregar Documento"
                            className="icon-agrega-doc"
                            onClick={() => fileInputRef.current[req.nombre]?.click()}
                          />
                          <input
                            type="file"
                            ref={el => fileInputRef.current[req.nombre] = el}
                            accept="application/pdf"
                            style={{ display: 'none' }}
                            onChange={(e) => handleFileUpload(e, req.nombre)}
                          />
                        </div>
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

          {/* Botones inferiores del trámite */}
          <div className="footer-botones" style={{ marginTop: '2rem' }}>
            <div className="btn-left">
              <button className="btn-volver-tramites" onClick={() => setTramiteSeleccionado(null)}>
                ← Volver a trámites
              </button>
            </div>
            {(!expedienteActual || expedienteActual.estado === 'borrador' || expedienteActual.estado === 'con_observaciones') && (
              <div className="btn-right">
                <button
                  className={`btn-completar ${!isTrámiteCompleto() ? 'disabled' : ''}`}
                  onClick={handleEnviarTramite}
                  disabled={!isTrámiteCompleto()}
                  title={!isTrámiteCompleto() ? 'Sube todos los documentos obligatorios para continuar' : ''}
                >
                  Completar Trámite <span className="btn-icon">✔</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Leyenda de Estados */}
      {!tramiteSeleccionado && (
        <div className="leyenda-estados">
          <div className="leyenda-item">
            <img src={iconAprobado} alt="Aprobado" className="leyenda-icon" />
            <span>Documentacion revisada y aprobada</span>
          </div>
          <div className="leyenda-item">
            <img src={iconRevision} alt="Revisión" className="leyenda-icon" />
            <span>Documentación en revisión</span>
          </div>
          <div className="leyenda-item">
            <img src={iconObs} alt="Observaciones" className="leyenda-icon" />
            <span>Consulte sus notificaciones</span>
          </div>
        </div>
      )}

    </div>
  );
};

export default TramitesUser;
