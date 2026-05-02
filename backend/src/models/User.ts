import mongoose, { Schema } from 'mongoose';

const UserSchema = new Schema({
  nombre: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
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

export const User = mongoose.model('User', UserSchema);