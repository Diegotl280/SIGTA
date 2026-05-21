import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { descargarAcuseExpediente } from '../api/ExpedienteApi';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const token = () => localStorage.getItem('token');

const ESTADO_COLORS = {
  con_observaciones: { bg: '#ebd02f', text: '#1a1a1a' },
  enviado: { bg: '#dbeafe', text: '#1d4ed8' },
  en_revision: { bg: '#fef3c7', text: '#92400e' },
  acuse: { bg: '#dcfce7', text: '#14532d' },
  asignado: { bg: '#e0f2fe', text: '#0369a1' },
};

const NotifiUsuario = () => {
  const navigate = useNavigate();
  const [expedientes, setExpedientes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      try {
        const [res, userRes, configRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/expedientes`, { headers: { Authorization: `Bearer ${token()}` } }),
          axios.get(`${API_BASE_URL}/api/auth/me`, { headers: { Authorization: `Bearer ${token()}` } }),
          axios.get(`${API_BASE_URL}/api/config-tramites`, { headers: { Authorization: `Bearer ${token()}` } })
        ]);

        const todosExpedientes = res.data.expedientes || [];
        const tramitesPermitidos = userRes.data.usuario?.tramitesPermitidos || [];
        const configs = configRes.data.tramites || [];

        let pendientes = todosExpedientes.filter(e =>
          ['enviado', 'en_revision', 'con_observaciones'].includes(e.estado) || e.acuseRecepcion
        );

        // Filtrar aquellos donde ya pasaron los 10 días
        pendientes = pendientes.filter(exp => {
          if (exp.estado === 'con_observaciones' && exp.fechaLimiteCorreccion) {
            if (new Date() > new Date(exp.fechaLimiteCorreccion)) {
              return false; // Ocultar si ya pasaron los 10 días
            }
          }
          return true;
        });

        // Cargar los documentos para los que tienen observaciones
        pendientes = await Promise.all(pendientes.map(async (exp) => {
          if (exp.estado === 'con_observaciones') {
            try {
              const docsRes = await axios.get(`${API_BASE_URL}/api/expedientes/${exp._id}/documentos`, {
                headers: { Authorization: `Bearer ${token()}` },
              });
              const docsObservados = docsRes.data.documentos.filter(d => d.estado === 'con_observaciones');
              return { ...exp, docsObservados };
            } catch (error) {
              console.error("Error al obtener documentos para expediente", exp._id, error);
              return { ...exp, docsObservados: [] };
            }
          }
          return exp;
        }));

        const notificacionesAsignados = [];
        for (const tipo of tramitesPermitidos) {
          const config = configs.find(c => c.tipo === tipo);
          
          // Solo mostrar notificación si hay al menos un requisito obligatorio
          const tieneObligatorios = config?.requisitos?.some(r => r.obligatorio);
          if (!tieneObligatorios) continue;

          // Tomamos el expediente más reciente de este tipo (vienen ordenados desc por el backend)
          const exp = todosExpedientes.find(e => e.tipo === tipo);
          
          // Si no hay expediente, o si el más reciente está en borrador, mostramos la notificación
          if (!exp || exp.estado === 'borrador') {
            notificacionesAsignados.push({
              _id: `asignado-${tipo}`,
              tipo,
              isAsignado: true,
              nombreTramite: config?.nombre || tipo,
              fechaCierre: config?.fechaCierre,
              folio: 'NUEVO TRÁMITE ASIGNADO',
              estado: 'asignado'
            });
          }
        }

        setExpedientes([...notificacionesAsignados, ...pendientes]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  const handleDescargarAcuse = async (e, expediente) => {
    e.stopPropagation();

    try {
      const blob = await descargarAcuseExpediente(expediente._id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = expediente.acuseRecepcion?.nombreArchivo || `acuse-${expediente.folio}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      toast.error(err.message || 'Error al descargar el acuse');
    }
  };

  if (loading) return <div className="loader">Cargando notificaciones...</div>;

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '860px', margin: '0 auto' }}>

      {expedientes.length === 0 ? (
        <div style={{ color: '#888', marginTop: '2rem', fontSize: '0.95rem' }}>
          No hay notificaciones pendientes
        </div>
      ) : (
        expedientes.map(exp => (
          <div
            key={exp._id}
            onClick={() => navigate('/tramites')}
            style={{
              backgroundColor: ESTADO_COLORS[exp.estado]?.bg || (exp.acuseRecepcion ? ESTADO_COLORS.acuse.bg : '#f5f5f5'),
              padding: '1.5rem',
              borderRadius: '8px',
              width: '100%',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              marginBottom: '1rem',
              cursor: 'pointer',
              transition: 'opacity 0.2s',
            }}
          >
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#1a1a1a', fontWeight: '600' }}>
              {exp.folio}
            </h3>
            <p style={{ margin: '0 0 0.5rem 0', color: '#1a1a1a', fontSize: '1rem' }}>
              {exp.isAsignado ? (
                <>Tienes un trámite por completar: <strong>{exp.nombreTramite}</strong>.</>
              ) : (
                <>La documentación del trámite <strong>{exp.tipo}</strong>
                {exp.estado === 'con_observaciones'
                  ? ' está incompleta o es errónea, favor de corrección lo antes posible.'
                  : exp.acuseRecepcion
                    ? ' cuenta con un acuse de recepción disponible para descarga.'
                  : exp.estado === 'enviado'
                    ? ' fue recibida y está pendiente de revisión.'
                    : ' se encuentra en revisión por parte de SAMA.'}
                </>
              )}
            </p>
            {exp.isAsignado && exp.fechaCierre && (
              <p style={{ margin: '0.5rem 0 0', color: '#1a1a1a', fontWeight: 'bold' }}>
                ⏰ Fecha límite para enviarlo: {new Date(exp.fechaCierre).toLocaleDateString('es-MX')}
              </p>
            )}
            {exp.acuseRecepcion && (
              <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', padding: '0.75rem', backgroundColor: 'rgba(255,255,255,0.55)', borderRadius: '6px' }}>
                <span style={{ color: '#14532d', fontSize: '0.9rem', fontWeight: 600 }}>
                  {exp.acuseRecepcion.nombreArchivo}
                </span>
                <button
                  type="button"
                  onClick={(event) => handleDescargarAcuse(event, exp)}
                  style={{
                    backgroundColor: '#16a34a',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.5rem 0.9rem',
                    cursor: 'pointer',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                  }}
                >
                  Descargar acuse
                </button>
              </div>
            )}
            {exp.observacionesGenerales && (
              <p style={{ margin: '0.5rem 0', color: '#333', fontSize: '0.9rem', fontStyle: 'italic' }}>
                💬 {exp.observacionesGenerales}
              </p>
            )}
            {exp.fechaLimiteCorreccion && exp.estado === 'con_observaciones' && (
              <p style={{ margin: '0.5rem 0 0', color: '#1a1a1a', fontWeight: 'bold' }}>
                ⏰ Lapso de tiempo permitido: {exp.diasParaCorreccion} días naturales.
                Fecha límite: {new Date(exp.fechaLimiteCorreccion).toLocaleDateString('es-MX')}
              </p>
            )}

            {exp.estado === 'con_observaciones' && exp.docsObservados && exp.docsObservados.length > 0 && (
              <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: '6px' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#b45309', fontSize: '0.95rem' }}>Documentos con Observaciones:</h4>
                <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#1a1a1a', fontSize: '0.9rem' }}>
                  {exp.docsObservados.map(doc => (
                    <li key={doc._id} style={{ marginBottom: '0.25rem' }}>
                      <strong>{doc.tipoRequisito}:</strong> {doc.observacion || 'Sin observación detallada'}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default NotifiUsuario;
