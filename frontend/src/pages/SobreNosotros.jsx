import { Link } from 'react-router-dom';
import samaLogo from '../assets/LogoSAMA.png';
import labsolLogo from '../assets/Labsol.png';
import { useAppearance } from '../appearance/useAppearance';
import './SobreNosotros.css';

const IconoUsuario = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="8" r="3.25" />
    <path d="M5.5 19c.8-3.2 3-4.8 6.5-4.8s5.7 1.6 6.5 4.8" />
  </svg>
);

const IconoCorreo = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <rect x="3.5" y="5.5" width="17" height="13" rx="1.5" />
    <path d="m4.5 7 7.5 5.6L19.5 7" />
  </svg>
);

const IconoLinkedIn = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <rect x="3.5" y="3.5" width="17" height="17" rx="2" />
    <path d="M7.5 10v6.5M7.5 7.5v.1M11 16.5V10m0 2.7c.7-1.7 5-2.2 5 1v3.8" />
  </svg>
);

const integrantes = [
  {
    nombre: 'Diego Alexis Torres Lemus',
    correo: 'dtorres102803@gmail.com',
    linkedin: 'https://www.linkedin.com/in/diego-alexis-torres-lemus-176768391',
  },
];

const SobreNosotros = () => {
  const { logoInstitucionalUrl } = useAppearance();

  return (
    <main className="about-page">
      <header className="about-header">
        <Link to="/login" className="about-back-link">← Volver al acceso</Link>
        <img
          src={logoInstitucionalUrl || samaLogo}
          alt="Secretaría del Agua y Medio Ambiente"
          className="about-sama-logo"
        />
      </header>

      <section className="about-intro">
        <p className="about-eyebrow">Sistema de Gestión de Trámites Ambientales</p>
        <h1>Sobre nosotros</h1>
        <p>
          SIGTA es una plataforma orientada a digitalizar y facilitar el seguimiento de
          trámites ambientales. Su desarrollo busca aportar una experiencia clara,
          ordenada y confiable para las empresas usuarias y el personal administrativo.
        </p>
        <p>
          Este proyecto fue desarrollado en colaboración con LABSOL Network, como parte
          de un esfuerzo académico y tecnológico enfocado en crear soluciones útiles para
          procesos institucionales.
        </p>
      </section>

      <section className="about-team" aria-labelledby="about-team-title">
        <div className="about-section-heading">
          <p>Créditos del proyecto</p>
          <h2 id="about-team-title">Equipo de desarrollo</h2>
        </div>

        <div className="about-team-grid">
          {integrantes.map((integrante) => (
            <article className="about-profile" key={integrante.correo}>
              <div className="about-profile-avatar">
                <IconoUsuario />
              </div>
              <div className="about-profile-details">
                <h3>{integrante.nombre}</h3>
                <a href={`mailto:${integrante.correo}`} className="about-contact-row">
                  <IconoCorreo />
                  <span>{integrante.correo}</span>
                </a>
                <a
                  href={integrante.linkedin}
                  className="about-contact-row about-linkedin"
                  target="_blank"
                  rel="noreferrer"
                >
                  <IconoLinkedIn />
                  <span>Perfil de LinkedIn</span>
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <footer className="about-footer">
        <img src={labsolLogo} alt="LABSOL Network" />
        <span>Desarrollado en colaboración con LABSOL Network</span>
      </footer>
    </main>
  );
};

export default SobreNosotros;
