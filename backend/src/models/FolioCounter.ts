import { Document, Schema, model } from 'mongoose';

export interface IFolioCounter extends Document {
  clave: string;
  secuencia: number;
}

const FolioCounterSchema = new Schema<IFolioCounter>(
  {
    clave: {
      type: String,
      required: true,
      unique: true,
    },
    secuencia: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { timestamps: true }
);

export const FolioCounter = model<IFolioCounter>('FolioCounter', FolioCounterSchema);
