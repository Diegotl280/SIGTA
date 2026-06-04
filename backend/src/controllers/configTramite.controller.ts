import { Request, Response, NextFunction } from 'express';
import { ConfigTramite } from '../models/ConfigTramite';
import { User } from '../models/User';
import { AuthRequest } from '../middlewares/auth.middleware';
import { maxWords } from '../utils/validation';

export const configTramiteController = {

  listar: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const tramites = await ConfigTramite.find({ activo: { $ne: false } }).sort({ tipo: 1 });
      res.json({ ok: true, tramites });
    } catch (err) { next(err); }
  },

  listarArchivados: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (req.user.role !== 'administrador') {
        res.status(403).json({ ok: false, msg: 'Solo el administrador puede ver trámites archivados' });
        return;
      }

      const tramites = await ConfigTramite.find({ activo: false }).sort({ updatedAt: -1 });
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

      const duplicado = await ConfigTramite.findOne({
        $or: [
          { tipo: req.body.tipo },
          { nombre: req.body.nombre },
        ],
      });

      if (duplicado) {
        if (duplicado.activo === false) {
          res.status(400).json({
            ok: false,
            msg: 'Ya existe un trámite archivado con ese nombre o abreviación. Restáuralo o elimínalo definitivamente para volver a usar esos datos.',
          });
          return;
        }

        res.status(400).json({ ok: false, msg: 'Ya existe un trámite con ese nombre o abreviación' });
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

      if (req.body.tipo !== undefined && !maxWords(req.body.tipo)) {
        res.status(400).json({ ok: false, msg: 'La abreviación excede las 500 palabras' });
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

      if (req.body.historialTipos !== undefined && !Array.isArray(req.body.historialTipos)) {
        res.status(400).json({ ok: false, msg: 'El historial de abreviaciones debe ser una lista' });
        return;
      }

      const tramiteId = String(req.params.id);
      const tramiteActual = await ConfigTramite.findById(tramiteId);
      if (!tramiteActual) {
        res.status(404).json({ ok: false, msg: 'Trámite no encontrado' });
        return;
      }

      const condicionesDuplicado: Array<Record<string, string>> = [];
      if (req.body.tipo !== undefined && req.body.tipo !== tramiteActual.tipo) {
        condicionesDuplicado.push({ tipo: req.body.tipo });
      }
      if (req.body.nombre !== undefined && req.body.nombre !== tramiteActual.nombre) {
        condicionesDuplicado.push({ nombre: req.body.nombre });
      }

      if (condicionesDuplicado.length > 0) {
        const duplicado = await ConfigTramite.findOne({
          _id: { $ne: tramiteId },
          $or: condicionesDuplicado,
        });

        if (duplicado) {
          if (duplicado.activo === false) {
            res.status(400).json({
              ok: false,
              msg: 'Ya existe un trámite archivado con ese nombre o abreviación. Restáuralo o elimínalo definitivamente para volver a usar esos datos.',
            });
            return;
          }

          res.status(400).json({ ok: false, msg: 'Ya existe un trámite con ese nombre o abreviación' });
          return;
        }
      }

      const tipoAnterior = tramiteActual.tipo;
      const tiposHistoricosActuales = Array.isArray(tramiteActual.historialTipos)
        ? tramiteActual.historialTipos
        : [];
      if (req.body.historialTipos !== undefined) {
        req.body.historialTipos = Array.from(
          new Set(
            req.body.historialTipos
              .map((tipo: string) => tipo.trim().toUpperCase())
              .filter((tipo: string) => tipo && tipo !== req.body.tipo && tipo !== tramiteActual.tipo)
          )
        );
      }
      Object.assign(tramiteActual, req.body);

      if (req.body.tipo !== undefined && req.body.tipo !== tipoAnterior) {
        tramiteActual.historialTipos = Array.from(
          new Set([
            ...tiposHistoricosActuales,
            tipoAnterior,
          ].filter((tipo) => tipo && tipo !== req.body.tipo))
        );
      }

      const tramite = await tramiteActual.save();

      if (req.body.tipo !== undefined && req.body.tipo !== tipoAnterior) {
        await User.updateMany(
          { tramitesPermitidos: tipoAnterior },
          { $addToSet: { tramitesPermitidos: req.body.tipo } }
        );
        await User.updateMany(
          { tramitesPermitidos: tipoAnterior },
          { $pull: { tramitesPermitidos: tipoAnterior } }
        );
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

  archivar: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (req.user.role !== 'administrador') {
        res.status(403).json({ ok: false, msg: 'Solo el administrador puede archivar trámites' });
        return;
      }

      const tramite = await ConfigTramite.findByIdAndUpdate(
        req.params.id,
        { activo: false },
        { returnDocument: 'after', runValidators: true }
      );

      if (!tramite) {
        res.status(404).json({ ok: false, msg: 'Trámite no encontrado' });
        return;
      }

      res.json({ ok: true, msg: 'Trámite archivado correctamente', tramite });
    } catch (err) { next(err); }
  },

  restaurar: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (req.user.role !== 'administrador') {
        res.status(403).json({ ok: false, msg: 'Solo el administrador puede restaurar trámites' });
        return;
      }

      const tramite = await ConfigTramite.findByIdAndUpdate(
        req.params.id,
        { activo: true },
        { returnDocument: 'after', runValidators: true }
      );

      if (!tramite) {
        res.status(404).json({ ok: false, msg: 'Trámite no encontrado' });
        return;
      }

      res.json({ ok: true, msg: 'Trámite restaurado correctamente', tramite });
    } catch (err) { next(err); }
  },

  eliminarDefinitivamente: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (req.user.role !== 'administrador') {
        res.status(403).json({ ok: false, msg: 'Solo el administrador puede eliminar trámites definitivamente' });
        return;
      }

      const tramite = await ConfigTramite.findOne({ _id: req.params.id, activo: false });

      if (!tramite) {
        res.status(404).json({ ok: false, msg: 'Trámite archivado no encontrado' });
        return;
      }

      await tramite.deleteOne();
      res.json({ ok: true, msg: 'Trámite eliminado definitivamente' });
    } catch (err) { next(err); }
  },
};
