import { Schema, model, Document, Types } from 'mongoose';

export type EstadoDocumento = 'pendiente' | 'validado' | 'con_observaciones';

export interface IDocumento extends Document {
  expediente: Types.ObjectId;
  tipoRequisito: string;       // ej. "Memoria descriptiva", "Plano de ubicación"
  nombreArchivo: string;
  rutaArchivo: string;         // ruta donde se almacena el PDF
  obligatorio: boolean;
  estado: EstadoDocumento;
  observacion?: string;        // comentario del administrador al rechazar
  fechaCorreccion?: Date;      // cuándo fue corregido por el usuario
}

const DocumentoSchema = new Schema<IDocumento>(
  {
    expediente: {
      type: Schema.Types.ObjectId,
      ref: 'Expediente',
      required: true,
    },
    tipoRequisito: {
      type: String,
      required: true,
    },
    nombreArchivo: {
      type: String,
      required: true,
    },
    rutaArchivo: {
      type: String,
      required: true,
    },
    obligatorio: {
      type: Boolean,
      default: true,
    },
    estado: {
      type: String,
      enum: ['pendiente', 'validado', 'con_observaciones'],
      default: 'pendiente',
    },
    observacion: {
      type: String,
    },
    fechaCorreccion: {
      type: Date,
    },
  },
  { timestamps: true }
);

export const Documento = model<IDocumento>('Documento', DocumentoSchema);