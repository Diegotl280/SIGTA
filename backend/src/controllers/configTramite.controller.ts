import { Request, Response, NextFunction } from 'express';
import { ConfigTramite } from '../models/ConfigTramite';
import { AuthRequest } from '../middlewares/auth.middleware';

export const configTramiteController = {

  listar: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const tramites = await ConfigTramite.find().sort({ tipo: 1 });
      res.json({ ok: true, tramites });
    } catch (err) { next(err); }
  },

  crear: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (req.user.role !== 'administrador') {
        res.status(403).json({ ok: false, msg: 'Solo el administrador puede crear trámites' });
        return;
      }
      const tramite = await ConfigTramite.create(req.body);
      res.status(201).json({ ok: true, tramite });
    } catch (err) { next(err); }
  },

  actualizar: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (req.user.role !== 'administrador') {
        res.status(403).json({ ok: false, msg: 'Solo el administrador puede editar trámites' });
        return;
      }
      const tramite = await ConfigTramite.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );
      if (!tramite) {
        res.status(404).json({ ok: false, msg: 'Trámite no encontrado' });
        return;
      }
      res.json({ ok: true, tramite });
    } catch (err) { next(err); }
  },
};