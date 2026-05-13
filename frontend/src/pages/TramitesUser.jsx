import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const token = () => localStorage.getItem('token');

const ESTADO_COLORS = {
  borrador:          { bg: '#e5e7eb', text: '#374151' },
  enviado:           { bg: '#dbeafe', text: '#1d4ed8' },
  en_revision:       { bg: '#fef3c7', text: '#92400e' },
  con_observaciones: { bg: '#fee2e2', text: '#b91c1c' },
  validado:          { bg: '#d1fae5', text: '#065f46' },
  cerrado:           { bg: '#f3f4f6', text: '#6b7280' },
};

const ESTADO_LABELS = {
  borrador: 'Borrador', enviado: 'Enviado', en_revision: 'En revisión',
  con_observaciones: 'Con observaciones', validado: 'Validado', cerrado: 'Cerrado',
};

const TramitesUser = () => {
  const [vista, setVista]                     = useState('lista'); // lista | detalle | subir
  const [expedientes, setExpedientes]         = useState([]);
  const [tramites, setTramites]               = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [expedienteActivo, setExpedienteActivo] = useState(null);
  const [checklist, setChecklist]             = useState([]);
  const [loadingChecklist, setLoadingChecklist] = useState(false);
  const [modalNuevo, setModalNuevo]           = useState(false);
  const [tipoSeleccionado, setTipoSeleccionado] = useState('');
  const [creando, setCreando]                 = useState(false);
  const [subiendo, setSubiendo]               = useState(null); // tipoRequisito que se está subiendo
  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null);

  useEffect(() => { cargarDatos(); }, []);

  const cargarDatos = async () => {
    try {
      const [resExp, resTram] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/expedientes`, { headers: { Authorization: `Bearer ${token()}` } }),
        axios.get(`${API_BASE_URL}/api/config-tramites`, { headers: { Authorization: `Bearer ${token()}` } }),
      ]);
      setExpedientes(resExp.data.expedientes || []);
      setTramites((resTram.data.tramites || []).filter(t => t.activo));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const verDetalle = async (exp) => {
    setExpedienteActivo(exp);
    setVista('detalle');
    setLoadingChecklist(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/expedientes/${exp._id}/documentos`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      setChecklist(res.data.checklist || []);
    } catch (err) { console.error(err); }
    finally { setLoadingChecklist(false); }
  };

  const crearExpediente = async () => {
    if (!tipoSeleccionado) return;
    setCreando(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/expedientes`,
        { tipo: tipoSeleccionado },
        { headers: { Authorization: `Bearer ${token()}` } }
      );
      setModalNuevo(false);
      setTipoSeleccionado('');
      await cargarDatos();
      verDetalle(res.data.expediente);
    } catch (err) {
      alert(err.response?.data?.msg || 'Error al crear el expediente');
    } finally { setCreando(false); }
  };

  const enviarExpediente = async () => {
    if (!window.confirm('¿Deseas enviar el expediente a SAMA para revisión?')) return;
    try {
      await axios.patch(`${API_BASE_URL}/api/expedientes/${expedienteActivo._id}/enviar`, {},
        { headers: { Authorization: `Bearer ${token()}` } }
      );
      await cargarDatos();
      setExpedienteActivo(prev => ({ ...prev, estado: 'enviado' }));
    } catch (err) {
      alert(err.response?.data?.msg || 'Error al enviar');
    }
  };

  const subirDocumento = async (tipoRequisito) => {
    if (!archivoSeleccionado) { alert('Selecciona un archivo PDF'); return; }
    setSubiendo(tipoRequisito);
    try {
      const formData = new FormData();
      formData.append('archivo', archivoSeleccionado);
      formData.append('tipoRequisito', tipoRequisito);
      await axios.post(
        `${API_BASE_URL}/api/expedientes/${expedienteActivo._id}/documentos`,
        formData,
        { headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'multipart/form-data' } }
      );
      setArchivoSeleccionado(null);
      // Recargar checklist
      const res = await axios.get(`${API_BASE_URL}/api/expedientes/${expedienteActivo._id}/documentos`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      setChecklist(res.data.checklist || []);
    } catch (err) {
      alert(err.response?.data?.msg || 'Error al subir documento');
    } finally { setSubiendo(null); }
  };

  const puedeSubir = expedienteActivo &&
    ['borrador', 'con_observaciones'].includes(expedienteActivo.estado);

  // ── Vista detalle ──
  if (vista === 'detalle' && expedienteActivo) return (
    <div className="tramites-detalle-container fade-in">
      <div className="detalle-header">
        <button className="btn-volver" onClick={() => { setVista('lista'); setExpedienteActivo(null); }}>← Volver</button>
        <h2>Expediente: <span>{expedienteActivo.folio}</span></h2>
        <span className="estado-badge" style={{
          backgroundColor: ESTADO_COLORS[expedienteActivo.estado]?.bg,
          color: ESTADO_COLORS[expedienteActivo.estado]?.text,
        }}>
          {ESTADO_LABELS[expedienteActivo.estado]}
        </span>
      </div>

      <div className="detalle-info">
        <span><strong>Tipo:</strong> {expedienteActivo.tipo}</span>
        <span><strong>Creado:</strong> {new Date(expedienteActivo.createdAt).toLocaleDateString('es-MX')}</span>
        {expedienteActivo.fechaLimiteCorreccion && (
          <span style={{ color: '#b91c1c' }}>
            <strong>⏰ Límite corrección:</strong> {new Date(expedienteActivo.fechaLimiteCorreccion).toLocaleDateString('es-MX')}
          </span>
        )}
      </div>

      {expedienteActivo.observacionesGenerales && (
        <div className="detalle-obs">
          <strong>Observaciones de SAMA:</strong> {expedienteActivo.observacionesGenerales}
        </div>
      )}

      {/* Botón enviar */}
      {expedienteActivo.estado === 'borrador' && (
        <div style={{ marginBottom: '1rem' }}>
          <button className="btn-continuar" onClick={enviarExpediente}>
            📤 Enviar expediente a SAMA
          </button>
        </div>
      )}

      <h3 className="checklist-titulo">Requisitos — {expedienteActivo.tipo}</h3>

      {/* Selector de archivo global */}
      {puedeSubir && (
        <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', padding: '0.8rem 1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.85rem', color: '#166534', fontWeight: '600' }}>📎 Selecciona el PDF a subir:</span>
          <input
            type="file"
            accept=".pdf"
            onChange={e => setArchivoSeleccionado(e.target.files[0])}
            style={{ fontSize: '0.85rem' }}
          />
          {archivoSeleccionado && (
            <span style={{ fontSize: '0.8rem', color: '#166534' }}>✓ {archivoSeleccionado.name}</span>
          )}
        </div>
      )}

      {loadingChecklist ? <div className="loader">Cargando...</div> : (
        <div className="checklist-lista">
          {checklist.map((item, i) => (
            <div key={i} className="checklist-item">
              <div className="checklist-nombre">
                <span className={`req-badge ${item.obligatorio ? 'oblig' : 'opcional'}`}>
                  {item.obligatorio ? 'Requerido' : 'Opcional'}
                </span>
                {item.requisito}
              </div>
              <div className="checklist-estado" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {item.documento && (
                  <span className="doc-nombre">📄 {item.documento.nombreArchivo}</span>
                )}
                <span className={`doc-estado ${item.estado === 'no_subido' ? 'no-subido' : item.estado === 'pendiente' ? 'pendiente' : item.estado === 'validado' ? 'validado' : 'con-obs'}`}>
                  {item.estado === 'no_subido' ? 'No subido' : item.estado === 'pendiente' ? 'Pendiente' : item.estado === 'validado' ? '✓ Validado' : 'Con observaciones'}
                </span>
                {puedeSubir && item.estado !== 'validado' && (
                  <button
                    className="btn-add-req"
                    onClick={() => subirDocumento(item.requisito)}
                    disabled={subiendo === item.requisito || !archivoSeleccionado}
                    style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                  >
                    {subiendo === item.requisito ? 'Subiendo...' : item.estado === 'no_subido' ? '+ Subir' : '↑ Reemplazar'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ── Vista lista ──
  return (
    <div className="tramites-lista-container fade-in">
      <div className="lista-header" style={{ justifyContent: 'space-between' }}>
        <h2>Mis Trámites</h2>
        <button className="btn-continuar" onClick={() => setModalNuevo(true)}>
          + Nuevo trámite
        </button>
      </div>

      {loading ? <div className="loader">Cargando...</div> : expedientes.length === 0 ? (
        <div className="lista-vacia">
          No tienes trámites registrados.
          <br />
          <button className="btn-continuar" style={{ marginTop: '1rem' }} onClick={() => setModalNuevo(true)}>
            + Crear mi primer trámite
          </button>
        </div>
      ) : (
        <div className="expedientes-lista">
          {expedientes.map(exp => (
            <div key={exp._id} className="expediente-row" onClick={() => verDetalle(exp)}>
              <span className="exp-folio">{exp.folio}</span>
              <span className="exp-estado" style={{
                backgroundColor: ESTADO_COLORS[exp.estado]?.bg,
                color: ESTADO_COLORS[exp.estado]?.text,
              }}>{ESTADO_LABELS[exp.estado]}</span>
              <span className="exp-fecha">{new Date(exp.createdAt).toLocaleDateString('es-MX')}</span>
              <span className="exp-ver">Ver →</span>
            </div>
          ))}
        </div>
      )}

      {/* Modal nuevo expediente */}
      {modalNuevo && (
        <div className="modal-overlay fade-in" onClick={e => e.target === e.currentTarget && setModalNuevo(false)}>
          <div className="modal-box" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h2>Nuevo trámite</h2>
              <button className="modal-close" onClick={() => setModalNuevo(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="modal-field">
                <label>Tipo de trámite</label>
                <select value={tipoSeleccionado} onChange={e => setTipoSeleccionado(e.target.value)}>
                  <option value="">Selecciona...</option>
                  {tramites.map(t => (
                    <option key={t._id} value={t.tipo}>
                      {t.tipo} — {t.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancelar" onClick={() => setModalNuevo(false)}>
                <span className="btn-icon">✖</span> Cancelar
              </button>
              <button className="btn-continuar" onClick={crearExpediente} disabled={!tipoSeleccionado || creando}>
                {creando ? 'Creando...' : 'Crear'} <span className="btn-icon">✔</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TramitesUser;