import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const token = () => localStorage.getItem('token');

const TIPOS_DISPONIBLES = ['LAU', 'COA', 'MIA', 'PSE', 'RRME'];
const NOMBRES_TRAMITE = {
  LAU: 'Licencia Ambiental Única',
  COA: 'Cédula de Operación Anual',
  MIA: 'Manifestación de Impacto Ambiental',
  PSE: 'Prestadores de Servicios Ecológicos',
  RRME: 'Registro de Residuos de Manejo Especial',
};

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

const modalBase = {
  tipo: '', nombre: '', activo: true,
  fechaApertura: '', fechaCierre: '',
  diasCorreccion: 10, requisitos: [],
};

const TramitesAdmin = () => {
  const [tramites, setTramites]               = useState([]);
  const [modoEdicion, setModoEdicion]         = useState(false);
  const [modalAbierto, setModalAbierto]       = useState(false);
  const [tramiteEditando, setTramiteEditando] = useState(null);
  const [form, setForm]                       = useState(modalBase);
  const [nuevoRequisito, setNuevoRequisito]   = useState('');
  const [requisitoOblig, setRequisitoOblig]   = useState(true);
  const [loading, setLoading]                 = useState(false);

  // Vista de expedientes
  const [tramiteSeleccionado, setTramiteSeleccionado] = useState(null);
  const [expedientes, setExpedientes]                 = useState([]);
  const [loadingExp, setLoadingExp]                   = useState(false);
  const [expedienteDetalle, setExpedienteDetalle]     = useState(null);
  const [checklist, setChecklist]                     = useState([]);
  const [loadingDetalle, setLoadingDetalle]           = useState(false);

  useEffect(() => { cargarTramites(); }, []);

  const cargarTramites = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/config-tramites`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      setTramites(res.data.tramites || []);
    } catch (err) { console.error(err); }
  };

  // ── Modal ──
  const abrirAgregar = () => {
    setTramiteEditando(null);
    setForm(modalBase);
    setModalAbierto(true);
    setModoEdicion(false);
  };

  const abrirEditar = (t) => {
    setTramiteEditando(t);
    setForm({
      tipo: t.tipo,
      nombre: t.nombre,
      activo: t.activo,
      fechaApertura: t.fechaApertura ? t.fechaApertura.slice(0, 10) : '',
      fechaCierre:   t.fechaCierre   ? t.fechaCierre.slice(0, 10)   : '',
      diasCorreccion: t.diasCorreccion,
      requisitos: t.requisitos || [],
    });
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setTramiteEditando(null);
    setForm(modalBase);
    setNuevoRequisito('');
  };

  const agregarRequisito = () => {
    if (!nuevoRequisito.trim()) return;
    setForm(f => ({
      ...f,
      requisitos: [...f.requisitos, { nombre: nuevoRequisito.trim(), obligatorio: requisitoOblig }],
    }));
    setNuevoRequisito('');
  };

  const eliminarRequisito = (i) => {
    setForm(f => ({ ...f, requisitos: f.requisitos.filter((_, idx) => idx !== i) }));
  };

  const guardarTramite = async () => {
    setLoading(true);
    try {
      const payload = {
        ...form,
        fechaApertura: form.fechaApertura || undefined,
        fechaCierre:   form.fechaCierre   || undefined,
      };
      if (tramiteEditando) {
        await axios.put(`${API_BASE_URL}/api/config-tramites/${tramiteEditando._id}`, payload, {
          headers: { Authorization: `Bearer ${token()}` },
        });
      } else {
        await axios.post(`${API_BASE_URL}/api/config-tramites`, payload, {
          headers: { Authorization: `Bearer ${token()}` },
        });
      }
      await cargarTramites();
      cerrarModal();
    } catch (err) {
      alert(err.response?.data?.msg || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  // ── Expedientes ──
  const seleccionarTramite = async (t) => {
    if (modoEdicion) { abrirEditar(t); return; }
    setTramiteSeleccionado(t);
    setExpedienteDetalle(null);
    setLoadingExp(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/expedientes`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      setExpedientes((res.data.expedientes || []).filter(e => e.tipo === t.tipo));
    } catch (err) { console.error(err); }
    finally { setLoadingExp(false); }
  };

  const verDetalle = async (exp) => {
    setExpedienteDetalle(exp);
    setLoadingDetalle(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/expedientes/${exp._id}/documentos`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      setChecklist(res.data.checklist || []);
    } catch (err) { console.error(err); }
    finally { setLoadingDetalle(false); }
  };

  const cambiarEstado = async (expId, nuevoEstado, obs = '') => {
    try {
      await axios.patch(`${API_BASE_URL}/api/expedientes/${expId}/estado`,
        { estado: nuevoEstado, observacionesGenerales: obs },
        { headers: { Authorization: `Bearer ${token()}` } }
      );
      setExpedientes(prev => prev.map(e => e._id === expId ? { ...e, estado: nuevoEstado } : e));
      setExpedienteDetalle(prev => prev ? { ...prev, estado: nuevoEstado } : null);
    } catch (err) { console.error(err); }
  };

  // ── Renders ──

  // Detalle expediente
  if (expedienteDetalle) return (
    <div className="tramites-detalle-container fade-in">
      <div className="detalle-header">
        <button className="btn-volver" onClick={() => setExpedienteDetalle(null)}>← Volver</button>
        <h2>Expediente: <span>{expedienteDetalle.folio}</span></h2>
        <span className="estado-badge" style={{ backgroundColor: ESTADO_COLORS[expedienteDetalle.estado]?.bg, color: ESTADO_COLORS[expedienteDetalle.estado]?.text }}>
          {ESTADO_LABELS[expedienteDetalle.estado]}
        </span>
      </div>
      <div className="detalle-info">
        <span><strong>Tipo:</strong> {expedienteDetalle.tipo}</span>
        <span><strong>Usuario:</strong> {expedienteDetalle.usuario?.email || expedienteDetalle.usuario}</span>
        <span><strong>Enviado:</strong> {expedienteDetalle.fechaEnvio ? new Date(expedienteDetalle.fechaEnvio).toLocaleDateString('es-MX') : '—'}</span>
        {expedienteDetalle.fechaLimiteCorreccion && (
          <span style={{ color: '#b91c1c' }}><strong>Límite corrección:</strong> {new Date(expedienteDetalle.fechaLimiteCorreccion).toLocaleDateString('es-MX')}</span>
        )}
      </div>
      {expedienteDetalle.observacionesGenerales && (
        <div className="detalle-obs"><strong>Observaciones:</strong> {expedienteDetalle.observacionesGenerales}</div>
      )}
      <div className="detalle-acciones">
        <button className="btn-estado en-revision" onClick={() => cambiarEstado(expedienteDetalle._id, 'en_revision')}>Marcar En revisión</button>
        <button className="btn-estado validado"    onClick={() => cambiarEstado(expedienteDetalle._id, 'validado')}>✓ Validar</button>
        <button className="btn-estado con-obs"     onClick={() => { const o = prompt('Observaciones:'); if (o !== null) cambiarEstado(expedienteDetalle._id, 'con_observaciones', o); }}>✗ Con observaciones</button>
      </div>
      <h3 className="checklist-titulo">Requisitos — {expedienteDetalle.tipo}</h3>
      {loadingDetalle ? <div className="loader">Cargando...</div> : (
        <div className="checklist-lista">
          {checklist.map((item, i) => (
            <div key={i} className="checklist-item">
              <div className="checklist-nombre">
                <span className={`req-badge ${item.obligatorio ? 'oblig' : 'opcional'}`}>{item.obligatorio ? 'Requerido' : 'Opcional'}</span>
                {item.requisito}
              </div>
              <div className="checklist-estado">
                <span className={`doc-estado ${item.estado.replace('_', '-')}`}>{item.estado === 'no_subido' ? 'No subido' : item.estado === 'pendiente' ? 'Pendiente' : item.estado === 'validado' ? '✓ Validado' : 'Con obs.'}</span>
                {item.documento && <span className="doc-nombre">📄 {item.documento.nombreArchivo}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Lista expedientes
  if (tramiteSeleccionado) return (
    <div className="tramites-lista-container fade-in">
      <div className="lista-header">
        <button className="btn-volver" onClick={() => setTramiteSeleccionado(null)}>← Volver</button>
        <h2>{tramiteSeleccionado.nombre}</h2>
      </div>
      {loadingExp ? <div className="loader">Cargando...</div> : expedientes.length === 0 ? (
        <div className="lista-vacia">No hay expedientes para {tramiteSeleccionado.tipo}</div>
      ) : (
        <div className="expedientes-lista">
          {expedientes.map(exp => (
            <div key={exp._id} className="expediente-row" onClick={() => verDetalle(exp)}>
              <span className="exp-folio">{exp.folio}</span>
              <span className="exp-usuario">{exp.usuario?.email || '—'}</span>
              <span className="exp-estado" style={{ backgroundColor: ESTADO_COLORS[exp.estado]?.bg, color: ESTADO_COLORS[exp.estado]?.text }}>{ESTADO_LABELS[exp.estado]}</span>
              <span className="exp-fecha">{new Date(exp.createdAt).toLocaleDateString('es-MX')}</span>
              <span className="exp-ver">Ver →</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Vista principal — botones de trámites
  return (
    <div className="tramites-admin-container fade-in">

      {/* Botones Agregar / Editar */}
      <div className="tramites-acciones-top">
        <button className="btn-agregar-tramite" onClick={abrirAgregar}>
          + Agregar trámite
        </button>
        <button
          className={`btn-editar-tramite ${modoEdicion ? 'cancelar' : ''}`}
          onClick={() => setModoEdicion(!modoEdicion)}
        >
          {modoEdicion ? '✕ Cancelar' : '✎ Editar trámite'}
        </button>
      </div>

      {modoEdicion && (
        <p className="modo-edicion-hint fade-in">Selecciona el trámite que deseas editar</p>
      )}

      {/* Grid de trámites */}
      <div className="tramites-btn-grid">
        {tramites.map(t => (
          <div key={t._id} className={`tramite-btn-wrapper ${modoEdicion ? 'modo-edicion' : ''}`}>
            {modoEdicion && <span className="tramite-edit-badge">✎</span>}
            <button
              className={`tramite-tipo-btn ${!t.activo ? 'inactivo' : ''}`}
              onClick={() => seleccionarTramite(t)}
            >
              {t.tipo}
            </button>
          </div>
        ))}
        {tramites.length === 0 && (
          <div className="lista-vacia">No hay trámites configurados. Agrega uno.</div>
        )}
      </div>

      {/* Modal Agregar / Editar */}
      {modalAbierto && (
        <div className="modal-overlay fade-in" onClick={(e) => e.target === e.currentTarget && cerrarModal()}>
          <div className="modal-box">
            <div className="modal-header">
              <h2>{tramiteEditando ? `Editar trámite — ${tramiteEditando.tipo}` : 'Agregar trámite'}</h2>
              <button className="modal-close" onClick={cerrarModal}>✕</button>
            </div>

            <div className="modal-body">
              {/* Tipo */}
              {!tramiteEditando && (
                <div className="modal-field">
                  <label>Tipo</label>
                  <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
                    <option value="">Selecciona...</option>
                    {TIPOS_DISPONIBLES.map(t => <option key={t} value={t}>{t} — {NOMBRES_TRAMITE[t]}</option>)}
                  </select>
                </div>
              )}

              {/* Nombre */}
              <div className="modal-field">
                <label>Nombre completo</label>
                <input type="text" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="ej. Licencia Ambiental Única" />
              </div>

              {/* Activo */}
              <div className="modal-field modal-field-row">
                <label>Trámite activo</label>
                <div className={`custom-toggle ${form.activo ? 'on' : 'off'}`} onClick={() => setForm(f => ({ ...f, activo: !f.activo }))}>
                  <div className="toggle-circle"></div>
                </div>
              </div>

              {/* Fechas */}
              <div className="modal-field-group">
                <div className="modal-field">
                  <label>Fecha de apertura</label>
                  <input type="date" value={form.fechaApertura} onChange={e => setForm(f => ({ ...f, fechaApertura: e.target.value }))} />
                </div>
                <div className="modal-field">
                  <label>Fecha de cierre</label>
                  <input type="date" value={form.fechaCierre} onChange={e => setForm(f => ({ ...f, fechaCierre: e.target.value }))} />
                </div>
              </div>

              {/* Días corrección */}
              <div className="modal-field">
                <label>Días para corrección</label>
                <input type="number" min="1" max="30" value={form.diasCorreccion} onChange={e => setForm(f => ({ ...f, diasCorreccion: Number(e.target.value) }))} />
              </div>

              {/* Requisitos */}
              <div className="modal-field">
                <label>Requisitos documentales ({form.requisitos.length})</label>
                <div className="requisitos-lista-modal">
                  {form.requisitos.map((r, i) => (
                    <div key={i} className="requisito-item-modal">
                      <span className={`req-badge ${r.obligatorio ? 'oblig' : 'opcional'}`}>{r.obligatorio ? 'Req.' : 'Opc.'}</span>
                      <span className="requisito-nombre-modal">{r.nombre}</span>
                      <button className="btn-eliminar-req" onClick={() => eliminarRequisito(i)}>✕</button>
                    </div>
                  ))}
                </div>
                <div className="agregar-requisito-row">
                  <input
                    type="text"
                    placeholder="Nombre del documento..."
                    value={nuevoRequisito}
                    onChange={e => setNuevoRequisito(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && agregarRequisito()}
                  />
                  <button className={`btn-oblig-toggle ${requisitoOblig ? 'oblig' : 'opcional'}`} onClick={() => setRequisitoOblig(!requisitoOblig)}>
                    {requisitoOblig ? 'Requerido' : 'Opcional'}
                  </button>
                  <button className="btn-add-req" onClick={agregarRequisito}>+ Agregar</button>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-cancelar" onClick={cerrarModal} disabled={loading}>
                <span className="btn-icon">✖</span> Cancelar
              </button>
              <button className="btn-continuar" onClick={guardarTramite} disabled={loading}>
                {loading ? 'Guardando...' : tramiteEditando ? 'Guardar cambios' : 'Crear trámite'} <span className="btn-icon">✔</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TramitesAdmin;