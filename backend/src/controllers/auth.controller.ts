import { NextFunction, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

import { maxWords } from '../utils/validation';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('Falta JWT_SECRET en variables de entorno');
}

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nombre, email, password, rfc, telefono } = req.body;

    if (!nombre || !email || !password) {
      res.status(400).json({ ok: false, msg: 'Nombre, email y contraseña son requeridos' });
      return;
    }

    if (typeof nombre !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
      res.status(400).json({ ok: false, msg: 'Formato de datos inválido' });
      return;
    }

    if (!maxWords(nombre) || !maxWords(rfc)) {
      res.status(400).json({ ok: false, msg: 'Los textos ingresados exceden las 500 palabras' });
      return;
    }

    const existingUser = await User.findOne({ $or: [{ email }, { nombre }] });
    if (existingUser) {
      if (existingUser.status === 'deshabilitado') {
        res.status(400).json({
          ok: false,
          msg: 'Ya existe una empresa archivada con ese nombre o correo. Restaúrala o elimínala definitivamente para volver a usar esos datos.',
        });
        return;
      }

      res.status(400).json({ ok: false, msg: 'Ya existe una empresa con ese nombre o correo' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      nombre,
      email,
      password: hashedPassword,
      role: 'usuario', // Forzado por seguridad (escalada de privilegios evitada)
      rfc: rfc || '',
      telefono: telefono || '',
      tramitesPermitidos: [] // Un usuario nuevo no debe tener trámites asignados automáticamente
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
      user : newUser,
      token
    });
  } catch (error) {
    console.error('Error en register:', error);
    res.status(500).json({ ok: false, msg: 'Error de servidor' });
  }
};

export const createEmpresa = async (req: any, res: Response): Promise<void> => {
  try {
    if (req.user.role !== 'administrador') {
      res.status(403).json({ ok: false, msg: 'Solo el administrador puede crear empresas' });
      return;
    }

    const { nombre, email, password, rfc, telefono, tramitesPermitidos } = req.body;

    if (!nombre || !email || !password) {
      res.status(400).json({ ok: false, msg: 'Nombre, email y contraseña son requeridos' });
      return;
    }

    if (typeof nombre !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
      res.status(400).json({ ok: false, msg: 'Formato de datos inválido' });
      return;
    }

    if (!maxWords(nombre) || !maxWords(rfc)) {
      res.status(400).json({ ok: false, msg: 'Los textos ingresados exceden las 500 palabras' });
      return;
    }

    const existingUser = await User.findOne({ $or: [{ email }, { nombre }] });
    if (existingUser) {
      if (existingUser.status === 'deshabilitado') {
        res.status(400).json({
          ok: false,
          msg: 'Ya existe una empresa archivada con ese nombre o correo. Restaúrala o elimínala definitivamente para volver a usar esos datos.',
        });
        return;
      }

      res.status(400).json({ ok: false, msg: 'Ya existe una empresa con ese nombre o correo' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      nombre,
      email,
      password: hashedPassword,
      role: 'usuario',
      rfc: rfc || '',
      telefono: telefono || '',
      tramitesPermitidos: Array.isArray(tramitesPermitidos) ? tramitesPermitidos : [],
    });

    await newUser.save();

    res.status(201).json({
      ok: true,
      msg: 'Empresa registrada con éxito',
      user: newUser,
    });
  } catch (error) {
    console.error('Error en createEmpresa:', error);
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

    if (typeof email !== 'string' || typeof password !== 'string') {
      res.status(400).json({ ok: false, msg: 'Formato de datos inválido' });
      return;
    }

    const user = await User.findOne({ email });
    if (!user) {
      res.status(400).json({ ok: false, msg: 'Credenciales inválidas' });
      return;
    }

    if (user.status === 'deshabilitado') {
      res.status(403).json({ ok: false, msg: 'Esta cuenta ha sido deshabilitada' });
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
    console.error('Error en login:', error);
    res.status(500).json({ ok: false, msg: 'Error de servidor' });
  }
};

export const getMe = async (req: any, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user.uid).select('-password');
    if (!user) {
      res.status(404).json({ ok: false, msg: 'Usuario no encontrado' });
      return;
    }
    
    res.json({ ok: true, usuario: user });
  } catch (error) {
    console.error('Error en getMe:', error);
    res.status(500).json({ ok: false, msg: 'Error de servidor' });
  }
};

export const getEmpresas = async (req: any, res: Response): Promise<void> => {
  try {
    if (req.user.role !== 'administrador') {
      res.status(403).json({ ok: false, msg: 'No tienes permiso para ver esta información' });
      return;
    }
    const empresas = await User.find({ role: 'usuario', status: { $ne: 'deshabilitado' } }, 'nombre email rfc telefono tramitesPermitidos _id').sort({ nombre: 1 });
    res.json({ ok: true, empresas });
  } catch (error) {
    console.error('Error in getEmpresas:', error);
    res.status(500).json({ ok: false, msg: 'Error al obtener empresas' });
  }
};

export const getEmpresasArchivadas = async (req: any, res: Response): Promise<void> => {
  try {
    if (req.user.role !== 'administrador') {
      res.status(403).json({ ok: false, msg: 'No tienes permiso para ver esta información' });
      return;
    }

    const empresas = await User.find(
      { role: 'usuario', status: 'deshabilitado' },
      'nombre email rfc telefono tramitesPermitidos _id updatedAt'
    ).sort({ updatedAt: -1 });

    res.json({ ok: true, empresas });
  } catch (error) {
    console.error('Error in getEmpresasArchivadas:', error);
    res.status(500).json({ ok: false, msg: 'Error al obtener empresas archivadas' });
  }
};

export const deshabilitarEmpresa = async (req: any, res: Response): Promise<void> => {
  try {
    if (req.user.role !== 'administrador') {
      res.status(403).json({ ok: false, msg: 'Solo el administrador puede deshabilitar empresas' });
      return;
    }
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      res.status(404).json({ ok: false, msg: 'Empresa no encontrada' });
      return;
    }

    user.status = 'deshabilitado';
    await user.save();

    res.json({ ok: true, msg: 'Empresa archivada correctamente' });
  } catch (error) {
    console.error('Error en deshabilitarEmpresa:', error);
    res.status(500).json({ ok: false, msg: 'Error de servidor al deshabilitar empresa' });
  }
};

export const restaurarEmpresa = async (req: any, res: Response): Promise<void> => {
  try {
    if (req.user.role !== 'administrador') {
      res.status(403).json({ ok: false, msg: 'Solo el administrador puede restaurar empresas' });
      return;
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404).json({ ok: false, msg: 'Empresa no encontrada' });
      return;
    }

    user.status = 'activo';
    await user.save();

    res.json({ ok: true, msg: 'Empresa restaurada correctamente', user });
  } catch (error) {
    console.error('Error en restaurarEmpresa:', error);
    res.status(500).json({ ok: false, msg: 'Error de servidor al restaurar empresa' });
  }
};

export const eliminarEmpresaDefinitivamente = async (req: any, res: Response): Promise<void> => {
  try {
    if (req.user.role !== 'administrador') {
      res.status(403).json({ ok: false, msg: 'Solo el administrador puede eliminar empresas definitivamente' });
      return;
    }

    const user = await User.findOne({ _id: req.params.id, role: 'usuario', status: 'deshabilitado' });

    if (!user) {
      res.status(404).json({ ok: false, msg: 'Empresa archivada no encontrada' });
      return;
    }

    await user.deleteOne();

    res.json({ ok: true, msg: 'Empresa eliminada definitivamente' });
  } catch (error) {
    console.error('Error en eliminarEmpresaDefinitivamente:', error);
    res.status(500).json({ ok: false, msg: 'Error de servidor al eliminar empresa definitivamente' });
  }
};

export const updateEmpresa = async (req: any, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (req.user.role !== 'administrador' && req.user.uid !== id) {
      res.status(403).json({ ok: false, msg: 'No tienes permiso para modificar esta empresa' });
      return;
    }

    const { nombre, email, password, rfc, telefono, tramitesPermitidos } = req.body;

    if ((nombre && !maxWords(nombre)) || (rfc && !maxWords(rfc))) {
      res.status(400).json({ ok: false, msg: 'Los textos ingresados exceden las 500 palabras' });
      return;
    }

    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ ok: false, msg: 'Empresa no encontrada' });
      return;
    }

    const datosDuplicados: Array<Record<string, string>> = [];
    if (email && email !== user.email) {
      if (typeof email !== 'string') {
        res.status(400).json({ ok: false, msg: 'Formato de correo inválido' });
        return;
      }
      datosDuplicados.push({ email });
    }
    if (nombre && nombre !== user.nombre) datosDuplicados.push({ nombre });

    if (datosDuplicados.length > 0) {
      const existingUser = await User.findOne({
        _id: { $ne: id },
        role: 'usuario',
        $or: datosDuplicados,
      });

      if (existingUser) {
        if (existingUser.status === 'deshabilitado') {
          res.status(400).json({
            ok: false,
            msg: 'Ya existe una empresa archivada con ese nombre o correo. Restaúrala o elimínala definitivamente para volver a usar esos datos.',
          });
          return;
        }

        res.status(400).json({ ok: false, msg: 'Ya existe una empresa con ese nombre o correo' });
        return;
      }
    }

    if (email && email !== user.email) user.email = email;

    if (nombre) user.nombre = nombre;
    if (rfc !== undefined) user.rfc = rfc;
    if (telefono !== undefined) user.telefono = telefono;
    
    // Solo el administrador puede modificar los trámites permitidos de una empresa
    if (tramitesPermitidos !== undefined && req.user.role === 'administrador') {
      user.tramitesPermitidos = Array.isArray(tramitesPermitidos) ? tramitesPermitidos : [];
    }

    if (password && password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();

    res.json({ ok: true, msg: 'Empresa actualizada correctamente', user });
  } catch (error) {
    console.error('Error en updateEmpresa:', error);
    res.status(500).json({ ok: false, msg: 'Error de servidor al actualizar empresa' });
  }
};
