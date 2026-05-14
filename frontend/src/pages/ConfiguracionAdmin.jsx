import { useNavigate } from 'react-router-dom';

const ConfiguracionAdmin = () => {
  const navigate = useNavigate();

  const opciones = [
    {
      titulo: 'Roles y permisos',
      descripcion: 'Consulta los niveles de acceso del sistema.',
      icono: '🔐',
      accion: null,
    },
    {
      titulo: 'Catálogo de trámites',
      descripcion: 'Administra trámites, requisitos, fechas y días de corrección.',
      icono: '📄',
      accion: () => navigate('/admin/tramites'),
    },
    {
      titulo: 'Parámetros generales',
      descripcion: 'Configura reglas generales del sistema SIGTA.',
      icono: '⚙️',
      accion: null,
    },
  ];

  return (
    <div className="empresas-container fade-in">
      <h2 style={{ color: '#9f2241', marginBottom: '2rem' }}>
        Configuración
      </h2>

      <div className="empresas-grid">
        {opciones.map((opcion) => (
          <div
            key={opcion.titulo}
            className="empresa-card"
            onClick={opcion.accion || undefined}
            style={{
              cursor: opcion.accion ? 'pointer' : 'default',
              flexDirection: 'column',
              gap: '0.5rem',
              minHeight: '120px',
              textAlign: 'center',
              padding: '1rem',
            }}
          >
            <div style={{ fontSize: '1.8rem' }}>{opcion.icono}</div>
            <span className="empresa-name-text">{opcion.titulo}</span>
            <small style={{ color: '#555', maxWidth: '220px' }}>
              {opcion.descripcion}
            </small>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConfiguracionAdmin;