import { Schema, model, Document, Types } from 'mongoose';

export type TipoTramite = string;
export type EstadoExpediente = 'borrador' | 'enviado' | 'en_revision' | 'con_observaciones' | 'validado' | 'cerrado';

export interface IExpediente extends Document {
  folio: string;
  tipo: TipoTramite;
  usuario: Types.ObjectId;
  estado: EstadoExpediente;
  fechaEnvio?: Date;
  fechaLimiteCorreccion?: Date;
  diasParaCorreccion?: number;
  observacionesGenerales?: string;
  acuseRecepcion?: {
    nombreArchivo: string;
    rutaArchivo: string;
    fechaCarga: Date;
    subidoPor: Types.ObjectId;
  };
}

const AcuseRecepcionSchema = new Schema(
  {
    nombreArchivo: {
      type: String,
      required: true,
    },
    rutaArchivo: {
      type: String,
      required: true,
    },
    fechaCarga: {
      type: Date,
      required: true,
      default: Date.now,
    },
    subidoPor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { _id: false }
);

const ExpedienteSchema = new Schema<IExpediente>(
  {
    folio: {
      type: String,
      required: true,
      unique: true,
    },
    tipo: {
      type: String,

      required: true,
    },
    usuario: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    estado: {
      type: String,
      enum: ['borrador', 'enviado', 'en_revision', 'con_observaciones', 'validado', 'cerrado'],
      default: 'borrador',
    },
    fechaEnvio: {
      type: Date,
    },
    fechaLimiteCorreccion: {
      type: Date,
    },
    diasParaCorreccion: {
      type: Number,
    },
    observacionesGenerales: {
      type: String,
    },
    acuseRecepcion: {
      type: AcuseRecepcionSchema,
      required: false,
    },
  },
  { timestamps: true }
);

export const Expediente = model<IExpediente>('Expediente', ExpedienteSchema);
