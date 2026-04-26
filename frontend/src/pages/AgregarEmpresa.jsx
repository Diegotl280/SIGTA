import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateUser } from '../api/UserApi';

const AgregarEmpresa = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: ''
  });
  const [tramites, setTramites] = useState({
    coa: false,
    lau: false,
    mia: false
  });
  const { mutate: createUser, isPending: loading } = useCreateUser();

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleToggle = (tramite) => {
    setTramites({ ...tramites, [tramite]: !tramites[tramite] });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    createUser({
      ...formData,
      role: 'usuario',
      tramitesPermitidos: tramites
    }, {
      onSuccess: () => {
        navigate('/admin/empresas');
      }
    });
  };

  return (
    <div className="agregar-empresa-page fade-in">
      <div className="agregar-empresa-header">
        <h2 style={{ color: '#9f2241' }}>Agregar empresa</h2>
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
            type="password" 
            name="password" 
            placeholder="Contraseña" 
            value={formData.password}
            onChange={handleInputChange}
            required 
            className="input-line-style"
          />
        </div>

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
