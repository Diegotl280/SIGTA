import { Response, NextFunction } from 'express';
import { maxWords } from '../utils/validation';
import { Expediente } from '../models/Expediente';
import { ConfigTramite } from '../models/ConfigTramite';
import { AuthRequest } from '../middlewares/auth.middleware';

// Generar folio único: SIGTA-LAU-2026-0001
async function generarFolio(tipo: string): Promise<string> {
  const anio = new Date().getFullYear();
  const count = await Expediente.countDocuments({ tipo });
  const numero = String(count + 1).padStart(4, '0');
  return `SIGTA-${tipo}-${anio}-${numero}`;
}

export const expedienteController = {

  // Crear expediente (solo usuarios)
  crear: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { tipo } = req.body;

      // Verificar que el trámite existe y está activo
      const config = await ConfigTramite.findOne({ tipo, activo: true });
      if (!config) {
        res.status(400).json({ ok: false, msg: `El trámite ${tipo} no está disponible` });
        return;
      }

      // Prevenir múltiples expedientes activos del mismo tipo para el mismo usuario
      const existente = await Expediente.findOne({ 
        tipo, 
        usuario: req.user.uid, 
        estado: { $nin: ['aprobado', 'cerrado'] } 
      });
      
      if (existente) {
        // Si ya existe uno activo, lo devolvemos en lugar de crear otro
        res.status(200).json({ ok: true, expediente: existente });
        return;
      }

      // Verificar periodo de fechas si aplica (ej. COA enero–abril)
      if (config.fechaApertura && config.fechaCierre) {
        const ahora = new Date();
        if (ahora < config.fechaApertura || ahora > config.fechaCierre) {
          res.status(400).json({
            ok: false,
            msg: `El trámite ${tipo} no está en periodo de recepción`,
            apertura: config.fechaApertura,
            cierre: config.fechaCierre,
          });
          return;
        }
      }

      let expediente;
      let retries = 0;
      let folio;

      while (retries < 3) {
        try {
          folio = await generarFolio(tipo);
          expediente = await Expediente.create({
            folio,
            tipo,
            usuario: req.user.uid,
            estado: 'borrador',
          });
          break; // Si se crea exitosamente, salimos del bucle
        } catch (error: any) {
          if (error.code === 11000) {
            retries++;
            if (retries === 3) throw error; // Si falla 3 veces, lanzamos el error
          } else {
            throw error; // Cualquier otro error lo lanzamos
          }
        }
      }

      res.status(201).json({ ok: true, expediente });
    } catch (err) { next(err); }
  },

  // Ver mis expedientes (usuario ve los suyos, admin ve todos)
  listar: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const filtro = req.user.role === 'administrador'
        ? {}
        : { usuario: req.user.uid };

      const expedientes = await Expediente.find(filtro)
        .populate('usuario', 'email')
        .sort({ createdAt: -1 });

      res.json({ ok: true, expedientes });
    } catch (err) { next(err); }
  },

  // Ver expedientes de un usuario especifico (solo administrador)
  listarPorUsuario: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (req.user.role !== 'administrador') {
        res.status(403).json({ ok: false, msg: 'Solo el administrador puede ver expedientes de otros usuarios' });
        return;
      }

      const { usuarioId } = req.params;
      const expedientes = await Expediente.find({ usuario: usuarioId })
        .populate('usuario', 'email')
        .sort({ createdAt: -1 });

      res.json({ ok: true, expedientes });
    } catch (err) { next(err); }
  },

  // Ver un expediente por ID
  obtener: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const expediente = await Expediente.findById(req.params.id)
        .populate('usuario', 'email');

      if (!expediente) {
        res.status(404).json({ ok: false, msg: 'Expediente no encontrado' });
        return;
      }

      // Usuario solo puede ver sus propios expedientes
      if (
        req.user.role !== 'administrador' &&
        expediente.usuario._id.toString() !== req.user.uid
      ) {
        res.status(403).json({ ok: false, msg: 'No tienes acceso a este expediente' });
        return;
      }

      res.json({ ok: true, expediente });
    } catch (err) { next(err); }
  },

  // Enviar expediente (cambia estado de borrador a enviado)
  enviar: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const expediente = await Expediente.findById(req.params.id);

      if (!expediente) {
        res.status(404).json({ ok: false, msg: 'Expediente no encontrado' });
        return;
      }

      if (expediente.usuario.toString() !== req.user.uid) {
        res.status(403).json({ ok: false, msg: 'No tienes acceso a este expediente' });
        return;
      }

      if (expediente.estado !== 'borrador' && expediente.estado !== 'con_observaciones') {
        res.status(400).json({ ok: false, msg: `No se puede enviar un expediente en estado: ${expediente.estado}` });
        return;
      }

      expediente.estado = 'enviado';
      expediente.fechaEnvio = new Date();
      await expediente.save();

      res.json({ ok: true, msg: 'Expediente enviado correctamente', expediente });
    } catch (err) { next(err); }
  },

  // Cambiar estado (solo administrador)
  cambiarEstado: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (req.user.role !== 'administrador') {
        res.status(403).json({ ok: false, msg: 'Solo el administrador puede cambiar estados' });
        return;
      }

      const { estado, observacionesGenerales } = req.body;

      if (observacionesGenerales !== undefined && !maxWords(observacionesGenerales)) {
        res.status(400).json({ ok: false, msg: 'Las observaciones generales exceden las 500 palabras' });
        return;
      }

      const expediente = await Expediente.findById(req.params.id);

      if (!expediente) {
        res.status(404).json({ ok: false, msg: 'Expediente no encontrado' });
        return;
      }

      expediente.estado = estado;
      if (observacionesGenerales !== undefined) expediente.observacionesGenerales = observacionesGenerales;

      // Si tiene observaciones, calcular plazo para corrección basado en la configuración del trámite
      if (estado === 'con_observaciones') {
        const configTramite = await ConfigTramite.findOne({ tipo: expediente.tipo });
        const dias = configTramite?.diasCorreccion || 10;
        
        const plazo = new Date();
        plazo.setDate(plazo.getDate() + dias);
        
        expediente.fechaLimiteCorreccion = plazo;
        expediente.diasParaCorreccion = dias;
      }

      await expediente.save();
      res.json({ ok: true, msg: 'Estado actualizado', expediente });
    } catch (err) { next(err); }
  },
};