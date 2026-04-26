import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_sigta_2026';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nombre, email, password, role } = req.body;

    if (!nombre || !email || !password) {
      res.status(400).json({ ok: false, msg: 'Nombre, email y contraseña son requeridos' });
      return;
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(400).json({ ok: false, msg: 'ese correo ya existe' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      nombre,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role && ['administrador', 'usuario'].includes(role) ? role : 'usuario'
    });

    await newUser.save();

    const token = jwt.sign(
      { uid: newUser._id, nombre: newUser.nombre, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      ok: true,
      msg: 'Usuario registrado con éxito',
      user: {
        uid: newUser._id,
        nombre: newUser.nombre,
        email: newUser.email,
        role: newUser.role
      },
      token
    });
  } catch (error) {
    console.error('Error in register:', error);
    res.status(500).json({ ok: false, msg: 'Error de servidor' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ ok: false, msg: 'Email y contraseña son requeridos' });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(400).json({ ok: false, msg: 'Credenciales inválidas' });
      return;
    }

    const validPassword = await bcrypt.compare(password, user.password as string);
    if (!validPassword) {
      res.status(400).json({ ok: false, msg: 'Credenciales inválidas' });
      return;
    }

    const token = jwt.sign(
      { uid: user._id, nombre: user.nombre, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      ok: true,
      user: {
        uid: user._id,
        nombre: user.nombre,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Error in login:', error);
    res.status(500).json({ ok: false, msg: 'Error de servidor' });
  }
};

export const getEmpresas = async (req: Request, res: Response): Promise<void> => {
  try {
    const empresas = await User.find({ role: 'usuario' }, 'nombre email _id').sort({ nombre: 1 });
    res.json({ ok: true, empresas });
  } catch (error) {
    console.error('Error in getEmpresas:', error);
    res.status(500).json({ ok: false, msg: 'Error al obtener empresas' });
  }
};
