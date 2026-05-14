import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const token = () => localStorage.getItem('token');

const ESTADO_COLORS = {
  con_observaciones: { bg: '#ebd02f', text: '#1a1a1a' },
  enviado:           { bg: '#dbeafe', text: '#1d4ed8' },
  en_revision:       { bg: '#fef3c7', text: '#92400e' },
};

const NotifiUsuario = () => {
  const navigate = useNavigate();
  const [expedientes, setExpedientes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/expedientes`, {
          headers: { Authorization: `Bearer ${token()}` },
        });
        const pendientes = (res.data.expedientes || []).filter(e =>
          ['enviado', 'en_revision', 'con_observaciones'].includes(e.estado)
        );
        setExpedientes(pendientes);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

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
              backgroundColor: ESTADO_COLORS[exp.estado]?.bg || '#f5f5f5',
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
              La documentación del trámite <strong>{exp.tipo}</strong>
              {exp.estado === 'con_observaciones'
                ? ' está incompleta o es errónea, favor de corrección lo antes posible.'
                : exp.estado === 'enviado'
                ? ' fue recibida y está pendiente de revisión.'
                : ' se encuentra en revisión por parte de SAMA.'}
            </p>
            {exp.observacionesGenerales && (
              <p style={{ margin: '0.5rem 0', color: '#333', fontSize: '0.9rem', fontStyle: 'italic' }}>
                💬 {exp.observacionesGenerales}
              </p>
            )}
            {exp.fechaLimiteCorreccion && exp.estado === 'con_observaciones' && (
              <p style={{ margin: '0.5rem 0 0', color: '#1a1a1a', fontWeight: 'bold' }}>
                ⏰ Lapso de tiempo permitido: 10 días hábiles.
                Fecha límite: {new Date(exp.fechaLimiteCorreccion).toLocaleDateString('es-MX')}
              </p>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default NotifiUsuario;