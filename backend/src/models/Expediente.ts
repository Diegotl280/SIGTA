import { Schema, model, Document, Types } from 'mongoose';

export type TipoTramite = string;
export type EstadoExpediente = 'borrador' | 'enviado' | 'en_revision' | 'con_observaciones' | 'validado' | 'cerrado' | 'cancelado';

export interface IExpediente extends Document {
  folio: string;
  tipo: TipoTramite;
  usuario: Types.ObjectId;
  periodo: number;
  estado: EstadoExpediente;
  vigente: boolean;
  fechaEnvio?: Date;
  fechaLimiteCorreccion?: Date;
  diasParaCorreccion?: number;
  correccionReenviada: boolean;
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
    periodo: {
      type: Number,
      required: true,
      default: () => new Date().getFullYear(),
    },
    estado: {
      type: String,
      enum: ['borrador', 'enviado', 'en_revision', 'con_observaciones', 'validado', 'cerrado', 'cancelado'],
      default: 'borrador',
    },
    vigente: {
      type: Boolean,
      default: true,
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
    correccionReenviada: {
      type: Boolean,
      default: false,
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

ExpedienteSchema.index(
  { usuario: 1, tipo: 1, periodo: 1 },
  {
    unique: true,
    name: 'expediente_vigente_unico_por_usuario_tipo_periodo',
    partialFilterExpression: { vigente: true },
  }
);

export const Expediente = model<IExpediente>('Expediente', ExpedienteSchema);
