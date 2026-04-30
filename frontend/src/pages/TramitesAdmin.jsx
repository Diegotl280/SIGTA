import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../auth/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const TRAMITES = [
  { tipo: 'LAU', nombre: 'Licencia Ambiental Única', color: '#b3b3b3' },
  { tipo: 'MIA', nombre: 'Manifestación de Impacto Ambiental', color: '#b3b3b3' },
  { tipo: 'COA', nombre: 'Cédula de Operación Anual', color: '#b3b3b3' },
  { tipo: 'PSE', nombre: 'Prestadores de Servicios Ecológicos', color: '#b3b3b3' },
  { tipo: 'RRME', nombre: 'Registro de Residuos de Manejo Especial', color: '#b3b3b3' },
];

const ESTADO_COLORS = {
  borrador:          { bg: '#e5e7eb', text: '#374151' },
  enviado:           { bg: '#dbeafe', text: '#1d4ed8' },
  en_revision:       { bg: '#fef3c7', text: '#92400e' },
  con_observaciones: { bg: '#fee2e2', text: '#b91c1c' },
  validado:          { bg: '#d1fae5', text: '#065f46' },
  cerrado:           { bg: '#f3f4f6', text: '#6b7280' },
};

const ESTADO_LABELS = {
  borrador:          'Borrador',
  enviado:           'Enviado',
  en_revision:       'En revisión',
  con_observaciones: 'Con observaciones',
  validado:          'Validado',
  cerrado:           'Cerrado',
};

const TramitesAdmin = () => {
  const { user } = useAuth();
  const [tramiteSeleccionado, setTramiteSeleccionado] = useState(null);
  const [expedientes, setExpedientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expedienteDetalle, setExpedienteDetalle] = useState(null);
  const [checklist, setChecklist] = useState([]);
  const [loadingDetalle, setLoadingDetalle] = useState(false);

  const token = localStorage.getItem('token');

  const cargarExpedientes = async (tipo) => {
    setLoading(true);
    setExpedienteDetalle(null);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/expedientes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const filtrados = (res.data.expedientes || []).filter(e => e.tipo === tipo);
      setExpedientes(filtrados);
    } catch (err) {
      console.error('Error al cargar expedientes', err);
    } finally {
      setLoading(false);
    }
  };

  const seleccionarTramite = (tramite) => {
    setTramiteSeleccionado(tramite);
    setExpedienteDetalle(null);
    setChecklist([]);
    cargarExpedientes(tramite.tipo);
  };

  const verDetalle = async (expediente) => {
    setExpedienteDetalle(expediente);
    setLoadingDetalle(true);
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/expedientes/${expediente._id}/documentos`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setChecklist(res.data.checklist || []);
    } catch (err) {
      console.error('Error al cargar checklist', err);
    } finally {
      setLoadingDetalle(false);
    }
  };

  const cambiarEstado = async (expedienteId, nuevoEstado, obs = '') => {
    try {
      await axios.patch(
        `${API_BASE_URL}/api/expedientes/${expedienteId}/estado`,
        { estado: nuevoEstado, observacionesGenerales: obs },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Refrescar
      cargarExpedientes(tramiteSeleccionado.tipo);
      setExpedienteDetalle(prev => prev ? { ...prev, estado: nuevoEstado } : null);
    } catch (err) {
      console.error('Error al cambiar estado', err);
    }
  };

  // Vista: selección de trámite
  if (!tramiteSeleccionado) {
    return (
      <div className="tramites-admin-container fade-in">
        <div className="tramites-btn-grid">
          {TRAMITES.map((t) => (
            <button
              key={t.tipo}
              className="tramite-tipo-btn"
              onClick={() => seleccionarTramite(t)}
            >
              {t.tipo}
            </button>
          ))}
        </div>
        <div className="tramites-acciones">
          <button className="tramite-accion-btn cyan">
            Estadísticas de trámites
          </button>
          <button className="tramite-accion-btn green">
            Estado de trámites por empresa
          </button>
        </div>
      </div>
    );
  }

  // Vista: detalle de un expediente
  if (expedienteDetalle) {
    return (
      <div className="tramites-detalle-container fade-in">
        <div className="detalle-header">
          <button className="btn-volver" onClick={() => setExpedienteDetalle(null)}>
            ← Volver
          </button>
          <h2>Expediente: <span>{expedienteDetalle.folio}</span></h2>
          <span
            className="estado-badge"
            style={{
              backgroundColor: ESTADO_COLORS[expedienteDetalle.estado]?.bg,
              color: ESTADO_COLORS[expedienteDetalle.estado]?.text,
            }}
          >
            {ESTADO_LABELS[expedienteDetalle.estado]}
          </span>
        </div>

        <div className="detalle-info">
          <span><strong>Tipo:</strong> {expedienteDetalle.tipo}</span>
          <span><strong>Usuario:</strong> {expedienteDetalle.usuario?.email || expedienteDetalle.usuario}</span>
          <span><strong>Enviado:</strong> {expedienteDetalle.fechaEnvio ? new Date(expedienteDetalle.fechaEnvio).toLocaleDateString('es-MX') : '—'}</span>
          {expedienteDetalle.fechaLimiteCorreccion && (
            <span style={{ color: '#b91c1c' }}>
              <strong>Límite corrección:</strong> {new Date(expedienteDetalle.fechaLimiteCorreccion).toLocaleDateString('es-MX')}
            </span>
          )}
        </div>

        {expedienteDetalle.observacionesGenerales && (
          <div className="detalle-obs">
            <strong>Observaciones generales:</strong> {expedienteDetalle.observacionesGenerales}
          </div>
        )}

        <div className="detalle-acciones">
          <button
            className="btn-estado en-revision"
            onClick={() => cambiarEstado(expedienteDetalle._id, 'en_revision')}
          >
            Marcar En revisión
          </button>
          <button
            className="btn-estado validado"
            onClick={() => cambiarEstado(expedienteDetalle._id, 'validado')}
          >
            ✓ Validar
          </button>
          <button
            className="btn-estado con-obs"
            onClick={() => {
              const obs = prompt('Escribe las observaciones para la empresa:');
              if (obs !== null) cambiarEstado(expedienteDetalle._id, 'con_observaciones', obs);
            }}
          >
            ✗ Con observaciones
          </button>
        </div>

        <h3 className="checklist-titulo">
          Requisitos para el trámite de {expedienteDetalle.tipo}
        </h3>

        {loadingDetalle ? (
          <div className="loader">Cargando documentos...</div>
        ) : (
          <div className="checklist-lista">
            {checklist.map((item, i) => (
              <div key={i} className="checklist-item">
                <div className="checklist-nombre">
                  <span className={`req-badge ${item.obligatorio ? 'oblig' : 'opcional'}`}>
                    {item.obligatorio ? 'Requerido' : 'Opcional'}
                  </span>
                  {item.requisito}
                </div>
                <div className="checklist-estado">
                  {item.estado === 'no_subido' && (
                    <span className="doc-estado no-subido">No subido</span>
                  )}
                  {item.estado === 'pendiente' && (
                    <span className="doc-estado pendiente">Pendiente revisión</span>
                  )}
                  {item.estado === 'validado' && (
                    <span className="doc-estado validado">✓ Validado</span>
                  )}
                  {item.estado === 'con_observaciones' && (
                    <span className="doc-estado con-obs">Con observaciones</span>
                  )}
                  {item.documento && (
                    <span className="doc-nombre">📄 {item.documento.nombreArchivo}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Vista: lista de expedientes del trámite seleccionado
  return (
    <div className="tramites-lista-container fade-in">
      <div className="lista-header">
        <button className="btn-volver" onClick={() => setTramiteSeleccionado(null)}>
          ← Volver
        </button>
        <h2>{tramiteSeleccionado.nombre}</h2>
      </div>

      {loading ? (
        <div className="loader">Cargando expedientes...</div>
      ) : expedientes.length === 0 ? (
        <div className="lista-vacia">
          No hay expedientes registrados para {tramiteSeleccionado.tipo}
        </div>
      ) : (
        <div className="expedientes-lista">
          {expedientes.map((exp) => (
            <div key={exp._id} className="expediente-row" onClick={() => verDetalle(exp)}>
              <span className="exp-folio">{exp.folio}</span>
              <span className="exp-usuario">{exp.usuario?.email || '—'}</span>
              <span
                className="exp-estado"
                style={{
                  backgroundColor: ESTADO_COLORS[exp.estado]?.bg,
                  color: ESTADO_COLORS[exp.estado]?.text,
                }}
              >
                {ESTADO_LABELS[exp.estado]}
              </span>
              <span className="exp-fecha">
                {new Date(exp.createdAt).toLocaleDateString('es-MX')}
              </span>
              <span className="exp-ver">Ver →</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TramitesAdmin;