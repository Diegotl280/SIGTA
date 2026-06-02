import { useRef, useState } from 'react';
import samaLogo from '../assets/LogoSAMA.png';
import {
  COLORES_OFICIALES,
  getLogoInstitucionalUrl,
  useActualizarApariencia,
  useGetApariencia,
  useRestaurarAparienciaOficial,
  useSubirLogoInstitucional,
} from '../api/AparienciaApi';
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
  const [coloresForm, setColoresForm] = useState(null);
  const logoInputRef = useRef(null);

  const { data: empresasData, isLoading: loadingEmpresas } = useGetEmpresasArchivadas();
  const { data: tramitesData, isLoading: loadingTramites } = useGetConfigTramitesArchivados();
  const { data: aparienciaData } = useGetApariencia();
  const { mutate: restaurarEmpresa } = useRestaurarEmpresa();
  const { mutate: eliminarEmpresa } = useEliminarEmpresaDefinitivamente();
  const { mutate: restaurarTramite } = useRestaurarConfigTramite();
  const { mutate: eliminarTramite } = useEliminarConfigTramiteDefinitivamente();
  const actualizarApariencia = useActualizarApariencia();
  const subirLogo = useSubirLogoInstitucional();
  const restaurarApariencia = useRestaurarAparienciaOficial();

  const apariencia = aparienciaData?.apariencia;
  const logoActual = getLogoInstitucionalUrl(apariencia) || samaLogo;
  const coloresActuales = coloresForm || {
    ...COLORES_OFICIALES,
    ...(apariencia?.colores || {}),
  };

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
    {
      titulo: 'Apariencia',
      descripcion: 'Personaliza logo institucional y colores oficiales del sistema.',
      accion: () => setVista('apariencia'),
    },
  ];

  const cambiarColor = (key, value) => {
    setColoresForm((actual) => ({ ...(actual || coloresActuales), [key]: value }));
  };

  const guardarApariencia = () => {
    actualizarApariencia.mutate(coloresActuales);
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    subirLogo.mutate(file);
  };

  if (vista === 'papelera') {
    const elementos = seccionPapelera === 'empresas' ? empresasArchivadas : tramitesArchivados;
    const cargando = seccionPapelera === 'empresas' ? loadingEmpresas : loadingTramites;

    return (
      <div className="empresas-container fade-in">
        <div className="config-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <button className="btn-volver" onClick={() => setVista('menu')}>
            ← Volver
          </button>
          <div>
            <h2 style={{ margin: 0 }}>Papelera</h2>
            <p style={{ margin: 0 }}>Elementos archivados. Restaura uno para volver a consultarlo.</p>
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

  if (vista === 'apariencia') {
    const camposColor = [
      ['headerActivo', 'Click activo del header'],
      ['footerFondo', 'Color del footer'],
      ['tarjetaEmpresa', 'Tarjetas de empresas'],
      ['tarjetaTramite', 'Tarjetas de trámites'],
      ['loginFondo', 'Fondo del login'],
      ['loginBoton', 'Botón del login'],
      ['loginAcento', 'Acento del login'],
    ];

    return (
      <div className="empresas-container fade-in">
        <div className="config-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <button className="btn-volver" onClick={() => setVista('menu')}>
            ← Volver
          </button>
          <div>
            <h2 style={{ margin: 0 }}>Apariencia</h2>
            <p style={{ margin: 0 }}>Logo institucional y paleta oficial del sistema.</p>
          </div>
        </div>

        <div className="appearance-panel">
          <section className="appearance-section">
            <div>
              <h3>Logo institucional</h3>
              <p>El logo LABSOL del footer se mantiene fijo y no es editable.</p>
            </div>
            <div className="appearance-logo-row">
              <div className="appearance-logo-preview">
                <img src={logoActual} alt="Logo institucional actual" />
              </div>
              <div className="appearance-actions">
                <button className="btn-continuar" type="button" onClick={() => logoInputRef.current?.click()}>
                  Cambiar logo
                </button>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  style={{ display: 'none' }}
                  onChange={handleLogoUpload}
                />
                <small>Formatos permitidos: PNG, JPG, JPEG o WEBP. Máximo 5MB.</small>
              </div>
            </div>
          </section>

          <section className="appearance-section">
            <div>
              <h3>Colores</h3>
              <p>Valores iniciales tomados de la paleta oficial de Gobierno.</p>
            </div>

            <div className="appearance-color-grid">
              {camposColor.map(([key, label]) => (
                <label key={key} className="appearance-color-field">
                  <span>{label}</span>
                  <div>
                    <input
                      type="color"
                      value={coloresActuales[key]}
                      onChange={(e) => cambiarColor(key, e.target.value)}
                    />
                    <input
                      type="text"
                      value={coloresActuales[key]}
                      onChange={(e) => cambiarColor(key, e.target.value)}
                    />
                  </div>
                </label>
              ))}
            </div>

          </section>

          <div className="appearance-footer">
            <button
              className="btn-cancelar"
              type="button"
              onClick={() => {
                setColoresForm(null);
                restaurarApariencia.mutate();
              }}
              disabled={restaurarApariencia.isPending}
            >
              Restaurar oficiales
            </button>
            <button
              className="btn-continuar"
              type="button"
              onClick={guardarApariencia}
              disabled={actualizarApariencia.isPending || subirLogo.isPending}
            >
              Guardar cambios
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="empresas-container fade-in">
      <h2 style={{ color: 'var(--sigta-header-active)', marginBottom: '2rem' }}>
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
