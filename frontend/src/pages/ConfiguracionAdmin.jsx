import { useState } from 'react';
import {
  useEliminarConfigTramiteDefinitivamente,
  useEliminarEmpresaDefinitivamente,
  useGetConfigTramitesArchivados,
  useGetEmpresasArchivadas,
  useRestaurarConfigTramite,
  useRestaurarEmpresa,
} from '../api/UserApi';

const ConfiguracionAdmin = () => {
  const [vista, setVista] = useState('menu');
  const [seccionPapelera, setSeccionPapelera] = useState('empresas');
  const [confirmacionBorrado, setConfirmacionBorrado] = useState(null);

  const { data: empresasData, isLoading: loadingEmpresas } = useGetEmpresasArchivadas();
  const { data: tramitesData, isLoading: loadingTramites } = useGetConfigTramitesArchivados();
  const { mutate: restaurarEmpresa } = useRestaurarEmpresa();
  const { mutate: eliminarEmpresa } = useEliminarEmpresaDefinitivamente();
  const { mutate: restaurarTramite } = useRestaurarConfigTramite();
  const { mutate: eliminarTramite } = useEliminarConfigTramiteDefinitivamente();

  const empresasArchivadas = empresasData?.empresas || [];
  const tramitesArchivados = tramitesData?.tramites || [];
  const totalArchivados = empresasArchivadas.length + tramitesArchivados.length;

  const pedirEliminacion = (item, onConfirm) => {
    setConfirmacionBorrado({
      item,
      onConfirm,
      nombre: item.nombre || item.email || item.tipo,
    });
  };

  const confirmarEliminacion = () => {
    if (!confirmacionBorrado) return;
    confirmacionBorrado.onConfirm(confirmacionBorrado.item._id);
    setConfirmacionBorrado(null);
  };

  const opciones = [
    {
      titulo: 'Papelera',
      descripcion: `${totalArchivados} elemento${totalArchivados !== 1 ? 's' : ''} archivado${totalArchivados !== 1 ? 's' : ''}.`,
      accion: () => setVista('papelera'),
    },
  ];

  if (vista === 'papelera') {
    const elementos = seccionPapelera === 'empresas' ? empresasArchivadas : tramitesArchivados;
    const cargando = seccionPapelera === 'empresas' ? loadingEmpresas : loadingTramites;

    return (
      <div className="empresas-container fade-in">
        <div className="config-header">
          <button className="config-back-btn" onClick={() => setVista('menu')}>
            Volver
          </button>
          <div>
            <h2>Papelera</h2>
            <p>Elementos archivados. Restaura uno para volver a consultarlo.</p>
          </div>
        </div>

        <div className="trash-tabs">
          <button
            className={`trash-tab ${seccionPapelera === 'empresas' ? 'active' : ''}`}
            onClick={() => setSeccionPapelera('empresas')}
          >
            Empresas <span>{empresasArchivadas.length}</span>
          </button>
          <button
            className={`trash-tab ${seccionPapelera === 'tramites' ? 'active' : ''}`}
            onClick={() => setSeccionPapelera('tramites')}
          >
            Trámites <span>{tramitesArchivados.length}</span>
          </button>
        </div>

        <div className="trash-list">
          {cargando ? (
            <div className="loader">Cargando papelera...</div>
          ) : elementos.length === 0 ? (
            <div className="trash-empty">
              No hay {seccionPapelera === 'empresas' ? 'empresas' : 'trámites'} en la papelera.
            </div>
          ) : (
            elementos.map((item) => {
              const esEmpresa = seccionPapelera === 'empresas';
              const nombre = esEmpresa ? item.nombre || item.email : `${item.tipo} — ${item.nombre}`;
              const restaurar = esEmpresa ? restaurarEmpresa : restaurarTramite;
              const eliminar = esEmpresa ? eliminarEmpresa : eliminarTramite;

              return (
                <div key={item._id} className="trash-row">
                  <span className="trash-row-title">{nombre}</span>
                  <div className="trash-actions">
                    <button className="trash-action restore" onClick={() => restaurar(item._id)}>
                      Restaurar
                    </button>
                    <button className="trash-action remove" onClick={() => pedirEliminacion(item, eliminar)}>
                      Borrar definitivo
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {confirmacionBorrado && (
          <div className="modal-overlay fade-in" onClick={(e) => e.target === e.currentTarget && setConfirmacionBorrado(null)}>
            <div className="modal-box" style={{ maxWidth: '430px' }}>
              <div className="modal-header">
                <h2>Borrar definitivamente</h2>
                <button className="modal-close" onClick={() => setConfirmacionBorrado(null)}>✕</button>
              </div>
              <div className="modal-body">
                <p style={{ color: '#444', margin: 0 }}>
                  Esta acción eliminará definitivamente <strong>{confirmacionBorrado.nombre}</strong>. No se podrá recuperar.
                </p>
              </div>
              <div className="modal-footer">
                <button className="btn-cancelar" onClick={() => setConfirmacionBorrado(null)}>
                  Cancelar
                </button>
                <button className="trash-action remove" onClick={confirmarEliminacion}>
                  Borrar definitivo
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="empresas-container fade-in">
      <h2 style={{ color: '#9f2241', marginBottom: '2rem' }}>
        Configuración
      </h2>

      <div className="empresas-grid">
        {opciones.map((opcion) => (
          <div
            key={opcion.titulo}
            className="empresa-card config-card"
            onClick={opcion.accion || undefined}
            style={{ cursor: opcion.accion ? 'pointer' : 'default' }}
          >
            <span className="empresa-name-text">{opcion.titulo}</span>
            <small>{opcion.descripcion}</small>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConfiguracionAdmin;
