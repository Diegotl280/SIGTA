import { Schema, model, Document, Types } from 'mongoose';

export type TipoTramite = 'LAU' | 'COA' | 'MIA' | 'PSE' | 'RRME';
export type EstadoExpediente = 'borrador' | 'enviado' | 'en_revision' | 'con_observaciones' | 'validado' | 'cerrado';

export interface IExpediente extends Document {
  folio: string;
  tipo: TipoTramite;
  usuario: Types.ObjectId;
  estado: EstadoExpediente;
  fechaEnvio?: Date;
  fechaLimiteCorreccion?: Date;
  observacionesGenerales?: string;
}

const ExpedienteSchema = new Schema<IExpediente>(
  {
    folio: {
      type: String,
      required: true,
      unique: true,
    },
    tipo: {
      type: String,
      enum: ['LAU', 'COA', 'MIA', 'PSE', 'RRME'],
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
    observacionesGenerales: {
      type: String,
    },
  },
  { timestamps: true }
);

export const Expediente = model<IExpediente>('Expediente', ExpedienteSchema);