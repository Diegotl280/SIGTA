import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const token = () => localStorage.getItem('token');

const ESTADO_COLORS = {
  enviado:           { bg: '#dbeafe', text: '#1d4ed8' },
  en_revision:       { bg: '#fef3c7', text: '#92400e' },
  con_observaciones: { bg: '#fee2e2', text: '#b91c1c' },
  validado:          { bg: '#d1fae5', text: '#065f46' },
};

const ESTADO_LABELS = {
  enviado:           'Enviado — pendiente de revisión',
  en_revision:       'En revisión',
  con_observaciones: 'Con observaciones',
  validado:          'Validado',
};

const ESTADO_ICONOS = {
  enviado:           '📬',
  en_revision:       '🔍',
  con_observaciones: '⚠️',
  validado:          '✅',
};

const NotificacionesAdmin = () => {
  const navigate = useNavigate();
  const [expedientes, setExpedientes] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [filtro, setFiltro]           = useState('todos');

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/expedientes`, {
          headers: { Authorization: `Bearer ${token()}` },
        });
        // Solo mostrar los que requieren atención del admin o están validados
        const pendientes = (res.data.expedientes || []).filter(e =>
          ['enviado', 'en_revision', 'con_observaciones', 'validado'].includes(e.estado)
        );
        // Ordenar: con_observaciones primero, luego enviado, luego en_revision, luego validado
        const orden = { con_observaciones: 0, enviado: 1, en_revision: 2, validado: 3 };
        pendientes.sort((a, b) => orden[a.estado] - orden[b.estado]);
        setExpedientes(pendientes);
      } catch (err) {
        console.error('Error cargando notificaciones:', err);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  const filtrados = filtro === 'todos'
    ? expedientes
    : expedientes.filter(e => e.estado === filtro);

  const conteo = {
    enviado:           expedientes.filter(e => e.estado === 'enviado').length,
    en_revision:       expedientes.filter(e => e.estado === 'en_revision').length,
    con_observaciones: expedientes.filter(e => e.estado === 'con_observaciones').length,
    validado:          expedientes.filter(e => e.estado === 'validado').length,
  };

  const irADetalleExpediente = (exp) => {
    const empresaId = exp.usuario?._id || exp.usuario;
    if (!empresaId) return;
    navigate(`/admin/empresas/detalle/${empresaId}`, { state: { tipoAuto: exp.tipo, expedienteId: exp._id } });
  };

  return (
    <div className="notif-admin-container fade-in">

      <div className="notif-header">
        <h2 className="notif-titulo">Notificaciones</h2>
        {!loading && (
          <span className="notif-badge-total">
            {expedientes.length} pendiente{expedientes.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Filtros */}
      <div className="notif-filtros">
        <button
          className={`notif-filtro-btn ${filtro === 'todos' ? 'active' : ''}`}
          onClick={() => setFiltro('todos')}
        >
          Todos ({expedientes.length})
        </button>
        <button
          className={`notif-filtro-btn ${filtro === 'enviado' ? 'active' : ''}`}
          onClick={() => setFiltro('enviado')}
        >
          📬 Nuevos ({conteo.enviado})
        </button>
        <button
          className={`notif-filtro-btn ${filtro === 'en_revision' ? 'active' : ''}`}
          onClick={() => setFiltro('en_revision')}
        >
          🔍 En revisión ({conteo.en_revision})
        </button>
        <button
          className={`notif-filtro-btn ${filtro === 'con_observaciones' ? 'active' : ''}`}
          onClick={() => setFiltro('con_observaciones')}
        >
          ⚠️ Con observaciones ({conteo.con_observaciones})
        </button>
        <button
          className={`notif-filtro-btn ${filtro === 'validado' ? 'active' : ''}`}
          onClick={() => setFiltro('validado')}
        >
          ✅ Validados ({conteo.validado})
        </button>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="loader">Cargando notificaciones...</div>
      ) : filtrados.length === 0 ? (
        <div className="notif-vacia">
          <span style={{ fontSize: '2.5rem' }}>✅</span>
          <p>No hay expedientes pendientes de atención</p>
        </div>
      ) : (
        <div className="notif-lista">
          {filtrados.map(exp => (
            <div
              key={exp._id}
              className="notif-card"
              onClick={() => irADetalleExpediente(exp)}
            >
              <div className="notif-card-icono">
                {ESTADO_ICONOS[exp.estado]}
              </div>
              <div className="notif-card-info">
                <div className="notif-card-top">
                  <span className="notif-folio">{exp.folio}</span>
                  <span
                    className="notif-estado"
                    style={{
                      backgroundColor: ESTADO_COLORS[exp.estado]?.bg,
                      color: ESTADO_COLORS[exp.estado]?.text,
                    }}
                  >
                    {ESTADO_LABELS[exp.estado]}
                  </span>
                </div>
                <div className="notif-card-bottom">
                  <span className="notif-empresa">
                    {exp.usuario?.email || exp.usuario || '—'}
                  </span>
                  <span className="notif-tipo">Trámite: {exp.tipo}</span>
                  {exp.estado === 'enviado' && !exp.acuseRecepcion && (
                    <span className="notif-plazo">
                      Acuse pendiente
                    </span>
                  )}
                  {exp.acuseRecepcion && (
                    <span className="notif-plazo">
                      Acuse cargado
                    </span>
                  )}
                  {exp.fechaLimiteCorreccion && (
                    <span className="notif-plazo">
                      ⏰ Plazo: {new Date(exp.fechaLimiteCorreccion).toLocaleDateString('es-MX')}
                    </span>
                  )}
                  <span className="notif-fecha">
                    {new Date(exp.createdAt).toLocaleDateString('es-MX')}
                  </span>
                </div>
                {exp.observacionesGenerales && (
                  <div className="notif-obs">
                    💬 {exp.observacionesGenerales}
                  </div>
                )}
              </div>
              <div className="notif-arrow">→</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificacionesAdmin;
