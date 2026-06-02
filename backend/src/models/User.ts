import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  nombre: string;
  email: string;
  password: string;
  rfc?: string;
  telefono?: string;
  status: 'activo' | 'deshabilitado';
  tramitesPermitidos: string[];
  role: 'administrador' | 'usuario';
}

const UserSchema = new Schema<IUser>({
  nombre: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  rfc: {
    type: String,
    required: false,
  },
  telefono: {
    type: String,
    required: false,
  },
  status: {
    type: String,
    enum: ['activo', 'deshabilitado'],
    default: 'activo',
  },
  tramitesPermitidos: {
    type: [String],
    default: [],
  },
  role: {
    type: String,
    enum: ['administrador', 'usuario'],
    default: 'usuario',
  }
}, { timestamps: true });

export const User = mongoose.model<IUser>('User', UserSchema);
