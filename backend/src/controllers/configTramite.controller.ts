import { Request, Response, NextFunction } from 'express';
import { ConfigTramite } from '../models/ConfigTramite';
import { AuthRequest } from '../middlewares/auth.middleware';
import { maxWords } from '../utils/validation';

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

      if (!maxWords(req.body.nombre) || !maxWords(req.body.tipo)) {
        res.status(400).json({ ok: false, msg: 'El nombre o la abreviación excede las 500 palabras' });
        return;
      }

      if (req.body.requisitos) {
        for (const reqItem of req.body.requisitos) {
          if (!maxWords(reqItem.nombre)) {
            res.status(400).json({ ok: false, msg: 'El nombre de un requisito excede las 500 palabras' });
            return;
          }
        }
      }

      if (req.body.fechaApertura && req.body.fechaCierre) {
        const fInicio = new Date(req.body.fechaApertura);
        const fCierre = new Date(req.body.fechaCierre);
        if (fCierre < fInicio) {
          res.status(400).json({ ok: false, msg: 'La fecha de cierre no puede ser anterior a la de inicio' });
          return;
        }
        const diffTime = Math.abs(fCierre.getTime() - fInicio.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (req.body.diasCorreccion > diffDays) {
          res.status(400).json({ ok: false, msg: 'Los días de corrección no pueden ser mayores al lapso entre inicio y cierre' });
          return;
        }
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

      if (req.body.nombre !== undefined && !maxWords(req.body.nombre)) {
        res.status(400).json({ ok: false, msg: 'El nombre excede las 500 palabras' });
        return;
      }

      if (req.body.requisitos) {
        for (const reqItem of req.body.requisitos) {
          if (!maxWords(reqItem.nombre)) {
            res.status(400).json({ ok: false, msg: 'El nombre de un requisito excede las 500 palabras' });
            return;
          }
        }
      }

      if (req.body.fechaApertura && req.body.fechaCierre) {
        const fInicio = new Date(req.body.fechaApertura);
        const fCierre = new Date(req.body.fechaCierre);
        if (fCierre < fInicio) {
          res.status(400).json({ ok: false, msg: 'La fecha de cierre no puede ser anterior a la de inicio' });
          return;
        }
        const diffTime = Math.abs(fCierre.getTime() - fInicio.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (req.body.diasCorreccion > diffDays) {
          res.status(400).json({ ok: false, msg: 'Los días de corrección no pueden ser mayores al lapso entre inicio y cierre' });
          return;
        }
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

      // Si se actualizaron los días de corrección, actualizar los expedientes afectados
      if (req.body.diasCorreccion !== undefined) {
        const { Expediente } = await import('../models/Expediente');
        const expedientes = await Expediente.find({
          tipo: tramite.tipo,
          estado: 'con_observaciones'
        });

        for (const exp of expedientes) {
          const oldDias = exp.diasParaCorreccion || 10;
          const newDias = tramite.diasCorreccion;

          if (oldDias !== newDias && exp.fechaLimiteCorreccion) {
            const fechaBase = new Date(exp.fechaLimiteCorreccion);
            fechaBase.setDate(fechaBase.getDate() - oldDias); // Fecha en la que se le puso la observación
            fechaBase.setDate(fechaBase.getDate() + newDias); // Nueva fecha límite

            exp.fechaLimiteCorreccion = fechaBase;
            exp.diasParaCorreccion = newDias;
            await exp.save();
          }
        }
      }

      // Si se actualizaron los requisitos (ej. se agregaron nuevos obligatorios)
      if (req.body.requisitos) {
        const { Expediente } = await import('../models/Expediente');
        const { Documento } = await import('../models/Documento');
        
        // Buscar expedientes validados o en revisión
        const expedientes = await Expediente.find({ 
          tipo: tramite.tipo, 
          estado: { $in: ['validado', 'en_revision'] } 
        });

        for (const exp of expedientes) {
          let incompleto = false;
          for (const reqItem of tramite.requisitos) {
            if (reqItem.obligatorio) {
              const doc = await Documento.findOne({ expediente: exp._id, tipoRequisito: reqItem.nombre });
              if (!doc) {
                incompleto = true;
                break;
              }
            }
          }

          if (incompleto && exp.estado === 'validado') {
            exp.estado = 'con_observaciones';
            exp.observacionesGenerales = 'Se han agregado o modificado requisitos obligatorios para este trámite. Por favor, suba la documentación faltante.';
            exp.acuseRecepcion = undefined;
            await exp.save();
          }
        }
      }

      res.json({ ok: true, tramite });
    } catch (err) { next(err); }
  },

  deshabilitar: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (req.user.role !== 'administrador') {
        res.status(403).json({ ok: false, msg: 'Solo el administrador puede deshabilitar trámites' });
        return;
      }
      const tramite = await ConfigTramite.findById(req.params.id);
      if (!tramite) {
        res.status(404).json({ ok: false, msg: 'Trámite no encontrado' });
        return;
      }
      tramite.activo = false;
      await tramite.save();
      res.json({ ok: true, msg: 'Trámite deshabilitado exitosamente', tramite });
    } catch (err) { next(err); }
  }
};