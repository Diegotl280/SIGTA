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
  role: {
    type: String,
    enum: ['administrador', 'usuario'],
    default: 'usuario',
  }
}, { timestamps: true });

export const User = mongoose.model('User', UserSchema);