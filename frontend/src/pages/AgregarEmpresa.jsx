import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCreateUser, useUpdateEmpresaAdmin } from '../api/UserApi';
import axios from 'axios';

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
  const [tramitesDisponibles, setTramitesDisponibles] = useState([]);
  const [tramitesPermitidos, setTramitesPermitidos] = useState(
    empresaToEdit?.tramitesPermitidos || []
  );

  useEffect(() => {
    const fetchTramites = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/config-tramites`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTramitesDisponibles(res.data.tramites || []);
      } catch (err) {
        console.error("Error cargando tramites", err);
      }
    };
    fetchTramites();
  }, []);
  const { mutate: createUser, isPending: creating } = useCreateUser();
  const { mutate: updateEmpresa, isPending: updating } = useUpdateEmpresaAdmin();
  const loading = creating || updating;

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleToggle = (tramiteTipo) => {
    if (tramitesPermitidos.includes(tramiteTipo)) {
      setTramitesPermitidos(tramitesPermitidos.filter(t => t !== tramiteTipo));
    } else {
      setTramitesPermitidos([...tramitesPermitidos, tramiteTipo]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (formData.nombre && formData.nombre.trim().split(/\s+/).length > 500) {
      alert("El nombre de la empresa no puede exceder las 500 palabras.");
      return;
    }

    const payload = {
      ...formData,
      role: 'usuario',
      tramitesPermitidos
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
        <div className="tramites-aplicables-wrapper">
          <h3 className="tramites-aplicables-title">Tramites aplicables a esta empresa</h3>
          <div className="tramites-toggles-container">
            {tramitesDisponibles.length === 0 && (
              <p>Cargando trámites disponibles...</p>
            )}
            {tramitesDisponibles.map((tramite, index) => {
              const bgColors = ['box-cyan', 'box-orange', 'box-green'];
              const colorClass = bgColors[index % bgColors.length];
              const isEnabled = tramitesPermitidos.includes(tramite.tipo);
              return (
                <div key={tramite._id} className={`tramite-toggle-item ${colorClass} ${!isEnabled ? 'disabled-text' : ''}`}>
                  <div
                    className={`custom-toggle ${isEnabled ? 'on' : 'off'}`}
                    onClick={() => handleToggle(tramite.tipo)}
                  >
                    <div className="toggle-circle"></div>
                  </div>
                  <p>REQUISITOS PARA EL TRÁMITE DE {tramite.nombre ? tramite.nombre.toUpperCase() : tramite.tipo}</p>
                </div>
              );
            })}
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
