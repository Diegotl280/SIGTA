import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCreateUser, useUpdateEmpresaAdmin } from '../api/UserApi';

const AgregarEmpresa = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const empresaToEdit = location.state?.empresa;

  const [formData, setFormData] = useState({
    nombre: empresaToEdit?.nombre || '',
    email: empresaToEdit?.email || '',
    password: '',
    rfc: empresaToEdit?.rfc || '',
    telefono: empresaToEdit?.telefono || ''
  });
  const [tramites, setTramites] = useState({
    coa: false,
    lau: false,
    mia: false
  });
  const { mutate: createUser, isPending: creating } = useCreateUser();
  const { mutate: updateEmpresa, isPending: updating } = useUpdateEmpresaAdmin();
  const loading = creating || updating;

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleToggle = (tramite) => {
    setTramites({ ...tramites, [tramite]: !tramites[tramite] });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const payload = {
      ...formData,
      role: 'usuario',
      tramitesPermitidos: tramites
    };

    if (empresaToEdit) {
      updateEmpresa({ id: empresaToEdit._id, data: payload }, {
        onSuccess: () => {
          navigate('/admin/empresas');
        }
      });
    } else {
      createUser(payload, {
        onSuccess: () => {
          navigate('/admin/empresas');
        }
      });
    }
  };

  return (
    <div className="agregar-empresa-page fade-in">
      <div className="agregar-empresa-header">
        <h2 style={{ color: '#9f2241' }}>{empresaToEdit ? 'Editar empresa' : 'Agregar empresa'}</h2>
      </div>

      <form onSubmit={handleSubmit} className="agregar-empresa-form">
        <div className="input-line-group">
          <input
            type="text"
            name="nombre"
            placeholder="Nombre de la empresa"
            value={formData.nombre}
            onChange={handleInputChange}
            required
            className="input-line-style italic-placeholder"
          />
          <span className="input-icon-green">✎</span>
        </div>

        <div className="input-line-group">
          <input
            type="email"
            name="email"
            placeholder="Correo electronico"
            value={formData.email}
            onChange={handleInputChange}
            required
            className="input-line-style"
          />
        </div>

        <div className="input-line-group">
          <input
            type="text"
            name="rfc"
            placeholder="RFC"
            value={formData.rfc}
            onChange={handleInputChange}
            className="input-line-style"
          />
        </div>

        <div className="input-line-group">
          <input
            type="text"
            name="telefono"
            placeholder="Teléfono"
            value={formData.telefono}
            onChange={(e) => {
              const val = e.target.value;
              if (val === '' || /^[0-9]+$/.test(val)) {
                handleInputChange(e);
              }
            }}
            className="input-line-style"
          />
        </div>

        <div className="input-line-group">
          <input
            type="password"
            name="password"
            placeholder={empresaToEdit ? "Contraseña (dejar en blanco para no cambiar)" : "Contraseña"}
            value={formData.password}
            onChange={handleInputChange}
            required={!empresaToEdit}
            className="input-line-style"
          />
        </div>
        {/*ESTO ES SOLO UN EJEMPLO DE LOS TRAMITES QUE PODRAN ACCEDER LAS EMPRESAS. LUEGO LO CONECTAREMOS CON LA BASE DE DATOS*/}
        <div className="tramites-toggles-container">
          {/* COA */}
          <div className="tramite-toggle-item box-cyan">
            <div
              className={`custom-toggle ${tramites.coa ? 'on' : 'off'}`}
              onClick={() => handleToggle('coa')}
            >
              <div className="toggle-circle"></div>
            </div>
            <p>REQUISITOS PARA EL TRÁMITE DE LA CÉDULA DE OPERACIÓN ANUAL (COA)</p>
          </div>

          {/* LAU */}
          <div className="tramite-toggle-item box-orange">
            <div
              className={`custom-toggle ${tramites.lau ? 'on' : 'off'}`}
              onClick={() => handleToggle('lau')}
            >
              <div className="toggle-circle"></div>
            </div>
            <p>REQUISITOS PARA EL TRÁMITE DE LA LICENCIA AMBIENTAL UNICA (LAU)</p>
          </div>

          {/* MIA */}
          <div className="tramite-toggle-item box-green">
            <div
              className={`custom-toggle ${tramites.mia ? 'on' : 'off'}`}
              onClick={() => handleToggle('mia')}
            >
              <div className="toggle-circle"></div>
            </div>
            <p>REQUISITOS PARA EL TRÁMITE DE LA MANIFESTACIÓN DE IMPACTO AMBIENTAL (MIA) E INFORME PREVENTIVO (IP)</p>
          </div>
        </div>

        <div className="form-actions-bottom">
          <button
            type="button"
            className="btn-cancelar"
            onClick={() => navigate('/admin/empresas')}
            disabled={loading}
          >
            <span className="btn-icon">✖</span> Cancelar
          </button>

          <button
            type="submit"
            className="btn-continuar"
            disabled={loading}
          >
            Continuar <span className="btn-icon">✔</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default AgregarEmpresa;
