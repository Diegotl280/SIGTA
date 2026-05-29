import { Document, Schema, model } from 'mongoose';

export interface IAparienciaSistema extends Document {
  logoInstitucional?: {
    nombreArchivo: string;
    rutaArchivo: string;
    fechaCarga: Date;
  };
  colores: {
    headerActivo: string;
    footerFondo: string;
    tarjetaEmpresa: string;
    tarjetaTramite: string;
    loginFondo: string;
    loginBoton: string;
    loginAcento: string;
  };
}

export const COLORES_OFICIALES = {
  headerActivo: '#bb4433',
  footerFondo: '#525252',
  tarjetaEmpresa: '#f5adab',
  tarjetaTramite: '#fce2e4',
  loginFondo: '#f5adab',
  loginBoton: '#bb4433',
  loginAcento: '#781005',
};

const LogoInstitucionalSchema = new Schema(
  {
    nombreArchivo: { type: String, required: true },
    rutaArchivo: { type: String, required: true },
    fechaCarga: { type: Date, required: true, default: Date.now },
  },
  { _id: false }
);

const AparienciaSistemaSchema = new Schema<IAparienciaSistema>(
  {
    logoInstitucional: {
      type: LogoInstitucionalSchema,
      required: false,
    },
    colores: {
      headerActivo: { type: String, default: COLORES_OFICIALES.headerActivo },
      footerFondo: { type: String, default: COLORES_OFICIALES.footerFondo },
      tarjetaEmpresa: { type: String, default: COLORES_OFICIALES.tarjetaEmpresa },
      tarjetaTramite: { type: String, default: COLORES_OFICIALES.tarjetaTramite },
      loginFondo: { type: String, default: COLORES_OFICIALES.loginFondo },
      loginBoton: { type: String, default: COLORES_OFICIALES.loginBoton },
      loginAcento: { type: String, default: COLORES_OFICIALES.loginAcento },
    },
  },
  { timestamps: true }
);

export const AparienciaSistema = model<IAparienciaSistema>('AparienciaSistema', AparienciaSistemaSchema);
