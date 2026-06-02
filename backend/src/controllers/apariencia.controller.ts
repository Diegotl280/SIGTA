import { Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { AparienciaSistema, COLORES_OFICIALES } from '../models/AparienciaSistema';
import { AuthRequest } from '../middlewares/auth.middleware';

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;
const COLOR_KEYS = Object.keys(COLORES_OFICIALES) as Array<keyof typeof COLORES_OFICIALES>;

async function obtenerOAsegurarApariencia() {
  const existente = await AparienciaSistema.findOne();
  if (existente) return existente;

  return AparienciaSistema.create({
    colores: COLORES_OFICIALES,
  });
}

function serializarApariencia(apariencia: any) {
  return {
    _id: apariencia._id,
    logoInstitucional: apariencia.logoInstitucional || null,
    logoInstitucionalUrl: apariencia.logoInstitucional ? '/api/apariencia/logo' : null,
    colores: {
      ...COLORES_OFICIALES,
      ...(apariencia.colores?.toObject?.() || apariencia.colores || {}),
    },
    updatedAt: apariencia.updatedAt,
  };
}

export const aparienciaController = {
  obtener: async (_req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const apariencia = await obtenerOAsegurarApariencia();
      res.json({ ok: true, apariencia: serializarApariencia(apariencia) });
    } catch (err) { next(err); }
  },

  actualizarColores: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (req.user.role !== 'administrador') {
        res.status(403).json({ ok: false, msg: 'Solo el administrador puede modificar la apariencia' });
        return;
      }

      const apariencia = await obtenerOAsegurarApariencia();
      const colores = req.body?.colores || {};

      for (const key of COLOR_KEYS) {
        if (colores[key] !== undefined) {
          if (typeof colores[key] !== 'string' || !HEX_COLOR.test(colores[key])) {
            res.status(400).json({ ok: false, msg: `El color ${key} debe tener formato hexadecimal, por ejemplo #bb4433` });
            return;
          }

          apariencia.colores[key] = colores[key];
        }
      }

      await apariencia.save();
      res.json({ ok: true, msg: 'Apariencia actualizada correctamente', apariencia: serializarApariencia(apariencia) });
    } catch (err) { next(err); }
  },

  subirLogo: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (req.user.role !== 'administrador') {
        if (req.file) fs.unlinkSync(req.file.path);
        res.status(403).json({ ok: false, msg: 'Solo el administrador puede cambiar el logo institucional' });
        return;
      }

      if (!req.file) {
        res.status(400).json({ ok: false, msg: 'No se recibió ningún logo' });
        return;
      }

      const apariencia = await obtenerOAsegurarApariencia();

      if (apariencia.logoInstitucional?.rutaArchivo) {
        const rutaAnterior = path.join(process.cwd(), apariencia.logoInstitucional.rutaArchivo);
        if (fs.existsSync(rutaAnterior)) fs.unlinkSync(rutaAnterior);
      }

      apariencia.logoInstitucional = {
        nombreArchivo: req.file.originalname,
        rutaArchivo: `uploads/${req.file.filename}`,
        fechaCarga: new Date(),
      };

      await apariencia.save();
      res.status(201).json({ ok: true, msg: 'Logo institucional actualizado', apariencia: serializarApariencia(apariencia) });
    } catch (err) { next(err); }
  },

  restaurarOficial: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (req.user.role !== 'administrador') {
        res.status(403).json({ ok: false, msg: 'Solo el administrador puede restaurar la apariencia' });
        return;
      }

      const apariencia = await obtenerOAsegurarApariencia();

      if (apariencia.logoInstitucional?.rutaArchivo) {
        const rutaAnterior = path.join(process.cwd(), apariencia.logoInstitucional.rutaArchivo);
        if (fs.existsSync(rutaAnterior)) fs.unlinkSync(rutaAnterior);
      }

      apariencia.logoInstitucional = undefined;
      apariencia.colores = COLORES_OFICIALES;
      await apariencia.save();

      res.json({ ok: true, msg: 'Apariencia oficial restaurada', apariencia: serializarApariencia(apariencia) });
    } catch (err) { next(err); }
  },

  descargarLogo: async (_req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const apariencia = await obtenerOAsegurarApariencia();

      if (!apariencia.logoInstitucional?.rutaArchivo) {
        res.status(404).json({ ok: false, msg: 'No hay logo personalizado cargado' });
        return;
      }

      const fileRuta = path.join(process.cwd(), apariencia.logoInstitucional.rutaArchivo);
      if (!fs.existsSync(fileRuta)) {
        res.status(404).json({ ok: false, msg: 'El archivo físico del logo no existe en el servidor' });
        return;
      }

      res.sendFile(fileRuta);
    } catch (err) { next(err); }
  },
};
