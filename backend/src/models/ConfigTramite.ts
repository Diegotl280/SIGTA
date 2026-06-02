import { Schema, model, Document } from 'mongoose';
import { TipoTramite } from './Expediente';

export interface IRequisito {
  nombre: string;
  obligatorio: boolean;
  descripcion?: string;
}

export interface IConfigTramite extends Document {
  tipo: TipoTramite;
  historialTipos: TipoTramite[];
  nombre: string;             // nombre legible, ej. "Licencia Ambiental Única"
  activo: boolean;
  fechaApertura?: Date;       // para trámites con periodo (ej. COA enero–abril)
  fechaCierre?: Date;
  diasCorreccion: number;     // plazo para correcciones (default 10)
  requisitos: IRequisito[];
}

const RequisitoSchema = new Schema<IRequisito>({
  nombre:      { type: String, required: true },
  obligatorio: { type: Boolean, default: true },
  descripcion: { type: String },
}, { _id: false });

const ConfigTramiteSchema = new Schema<IConfigTramite>(
  {
    tipo: {
      type: String,

      required: true,
      unique: true,
    },
    historialTipos: {
      type: [String],
      default: [],
    },
    nombre: {
      type: String,
      required: true,
    },
    activo: {
      type: Boolean,
      default: true,
    },
    fechaApertura: { type: Date },
    fechaCierre:   { type: Date },
    diasCorreccion: {
      type: Number,
      default: 10,
    },
    requisitos: [RequisitoSchema],
  },
  { timestamps: true }
);

export const ConfigTramite = model<IConfigTramite>('ConfigTramite', ConfigTramiteSchema);
