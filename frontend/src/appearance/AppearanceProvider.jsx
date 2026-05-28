import { useEffect, useMemo } from 'react';
import { COLORES_OFICIALES, getLogoInstitucionalUrl, useGetApariencia } from '../api/AparienciaApi';
import { AppearanceContext } from './AppearanceContext';

const CSS_VARIABLES = {
  headerActivo: '--sigta-header-active',
  footerFondo: '--sigta-footer-bg',
  tarjetaEmpresa: '--sigta-card-empresa',
  tarjetaTramite: '--sigta-card-tramite',
  loginFondo: '--sigta-login-bg',
  loginBoton: '--sigta-login-button',
  loginAcento: '--sigta-login-accent',
};

export const AppearanceProvider = ({ children }) => {
  const { data } = useGetApariencia();
  const apariencia = data?.apariencia;

  const colores = useMemo(() => ({
    ...COLORES_OFICIALES,
    ...(apariencia?.colores || {}),
  }), [apariencia?.colores]);

  useEffect(() => {
    Object.entries(CSS_VARIABLES).forEach(([key, cssVar]) => {
      document.documentElement.style.setProperty(cssVar, colores[key]);
    });
  }, [colores]);

  const value = useMemo(() => ({
    apariencia,
    colores,
    logoInstitucionalUrl: getLogoInstitucionalUrl(apariencia),
  }), [apariencia, colores]);

  return (
    <AppearanceContext.Provider value={value}>
      {children}
    </AppearanceContext.Provider>
  );
};
