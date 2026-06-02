import { useState, useEffect } from 'react';
import { useAuth } from '../auth/useAuth';
import { useNavigate } from 'react-router-dom';
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
  cancelado:         { bg: '#fee2e2', text: '#991b1b' },
};

const ESTADO_LABELS = {
  borrador: 'Borrador', enviado: 'Enviado', en_revision: 'En revisión',
  con_observaciones: 'Con observaciones', validado: 'Validado', cerrado: 'Cerrado',
  cancelado: 'Cancelado',
};

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery]             = useState('');
  const [empresas, setEmpresas]       = useState([]);
  const [expedientes, setExpedientes] = useState([]);
  const [loading, setLoading]         = useState(false);
  const [buscado, setBuscado]         = useState(false);

  const isAdmin = user?.role === 'administrador';

  const buscar = async (q) => {
    if (!q.trim()) {
      setEmpresas([]);
      setExpedientes([]);
      setBuscado(false);
      return;
    }
    setLoading(true);
    try {
      const [resEmpresas, resExpedientes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/auth/empresas`, {
          headers: { Authorization: `Bearer ${token()}` }
        }),
        axios.get(`${API_BASE_URL}/api/expedientes`, {
          headers: { Authorization: `Bearer ${token()}` }
        }),
      ]);

      const texto = q.toLowerCase().trim();

      const empresasFiltradas = (resEmpresas.data.empresas || []).filter(e =>
        e.nombre?.toLowerCase().includes(texto) ||
        e.email?.toLowerCase().includes(texto) ||
        e.rfc?.toLowerCase().includes(texto)
      );

      const expedientesFiltrados = (resExpedientes.data.expedientes || []).filter(e =>
        e.folio?.toLowerCase().includes(texto) ||
        e.tipo?.toLowerCase().includes(texto) ||
        e.usuario?.email?.toLowerCase().includes(texto)
      );

      setEmpresas(empresasFiltradas);
      setExpedientes(expedientesFiltrados);
      setBuscado(true);
    } catch (err) {
      console.error('Error en búsqueda:', err);
    } finally {
      setLoading(false);
    }
  };

  // Búsqueda dinámica con debounce de 300ms
  useEffect(() => {
    const delay = setTimeout(() => {
      buscar(query);
    }, 300);
    return () => clearTimeout(delay);
  }, [query]);

  const totalResultados = empresas.length + expedientes.length;

  if (!isAdmin) return null;

  return (
    <div className="main-content fade-in">
      <div className="search-container">
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Buscar empresa, folio o trámite..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
        <button className="search-btn" onClick={() => buscar(query)} disabled={loading}>
          {loading ? 'Buscando...' : 'Buscar'}
        </button>
      </div>

      {/* Resultados */}
      {buscado && (
        <div className="search-results fade-in">
          {totalResultados === 0 ? (
            <p className="search-empty">No se encontraron resultados para "<strong>{query}</strong>"</p>
          ) : (
            <p className="search-total">{totalResultados} resultado{totalResultados !== 1 ? 's' : ''} para "<strong>{query}</strong>"</p>
          )}

          {/* Empresas */}
          {empresas.length > 0 && (
            <div className="search-section">
              <h3 className="search-section-title">Empresas ({empresas.length})</h3>
              <div className="search-list">
                {empresas.map(e => (
                  <div
                    key={e._id}
                    className="search-result-row"
                    onClick={() => navigate(`/admin/empresas/detalle/${e._id}`)}
                  >
                    <div className="search-result-icon">🏢</div>
                    <div className="search-result-info">
                      <span className="search-result-title">{e.nombre || '—'}</span>
                      <span className="search-result-sub">
                        {e.email}{e.rfc ? ` · RFC: ${e.rfc}` : ''}
                      </span>
                    </div>
                    <span className="search-result-tag empresa-tag">Empresa</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Expedientes */}
          {expedientes.length > 0 && (
            <div className="search-section">
              <h3 className="search-section-title">Expedientes ({expedientes.length})</h3>
              <div className="search-list">
                {expedientes.map(e => (
                  <div
                    key={e._id}
                    className="search-result-row"
                    onClick={() => {
                      if (e.usuario?._id) {
                        navigate(`/admin/empresas/detalle/${e.usuario._id}`, { state: { tipoAuto: e.tipo } });
                      } else {
                        navigate('/admin/empresas');
                      }
                    }}
                  >
                    <div className="search-result-icon">📄</div>
                    <div className="search-result-info">
                      <span className="search-result-title">{e.folio}</span>
                      <span className="search-result-sub">
                        {e.tipo} · {e.usuario?.email || '—'} · {new Date(e.createdAt).toLocaleDateString('es-MX')}
                      </span>
                    </div>
                    <span
                      className="search-result-tag"
                      style={{
                        backgroundColor: ESTADO_COLORS[e.estado]?.bg,
                        color: ESTADO_COLORS[e.estado]?.text,
                      }}
                    >
                      {ESTADO_LABELS[e.estado]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
