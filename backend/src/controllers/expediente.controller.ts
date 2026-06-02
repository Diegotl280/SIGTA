import { Response, NextFunction } from 'express';
import { maxWords } from '../utils/validation';
import { Expediente } from '../models/Expediente';
import { FolioCounter } from '../models/FolioCounter';
import { ConfigTramite } from '../models/ConfigTramite';
import { Documento } from '../models/Documento';
import { AuthRequest } from '../middlewares/auth.middleware';
import fs from 'fs';
import path from 'path';

// Generar folio único: SIGTA-LAU-2026-0001
async function generarFolio(tipo: string, periodo: number): Promise<string> {
  const contador = await FolioCounter.findOneAndUpdate(
    { clave: `${tipo}-${periodo}` },
    { $inc: { secuencia: 1 } },
    { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true }
  );

  if (!contador) {
    throw new Error('No fue posible generar el folio del expediente');
  }

  const numero = String(contador.secuencia).padStart(4, '0');
  return `SIGTA-${tipo}-${periodo}-${numero}`;
}

export const expedienteController = {

  // Crear expediente (solo usuarios)
  crear: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { tipo } = req.body;
      const periodoActual = new Date().getFullYear();

      // Verificar que el trámite existe y está activo
      const config = await ConfigTramite.findOne({ tipo, activo: true });
      if (!config) {
        res.status(400).json({ ok: false, msg: `El trámite ${tipo} no está disponible` });
        return;
      }

      // Prevenir múltiples expedientes del mismo trámite para el mismo usuario y periodo.
      const existente = await Expediente.findOne({ 
        tipo, 
        usuario: req.user.uid, 
        periodo: periodoActual,
        vigente: true,
      });
      
      if (existente) {
        // Si ya existe uno del periodo actual, lo devolvemos en lugar de crear otro.
        res.status(200).json({ ok: true, msg: `Ya existe un expediente de ${tipo} para el periodo ${periodoActual}`, expediente: existente });
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

      while (retries < 10) {
        try {
          const folio = await generarFolio(tipo, periodoActual);
          expediente = await Expediente.create({
            folio,
            tipo,
            usuario: req.user.uid,
            periodo: periodoActual,
            estado: 'borrador',
          });
          break;
        } catch (error: any) {
          if (error.code === 11000 && error.keyPattern?.folio) {
            retries++;
            if (retries === 10) throw error;
          } else {
            throw error;
          }
        }
      }

      res.status(201).json({ ok: true, expediente });
    } catch (err: any) {
      if (err.code === 11000) {
        const existente = await Expediente.findOne({
          tipo: req.body.tipo,
          usuario: req.user.uid,
          periodo: new Date().getFullYear(),
          vigente: true,
        });

        if (existente) {
          res.status(200).json({
            ok: true,
            msg: `Ya existe un expediente de ${req.body.tipo} para el periodo ${new Date().getFullYear()}`,
            expediente: existente,
          });
          return;
        }
      }

      next(err);
    }
  },

  // Ver mis expedientes (usuario ve los suyos, admin ve todos)
  listar: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const filtro = req.user.role === 'administrador'
        ? {}
        : { usuario: req.user.uid, periodo: new Date().getFullYear() };

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

      if (expediente.estado === 'con_observaciones') {
        const observacionesSinCorregir = await Documento.exists({
          expediente: expediente._id,
          estado: 'con_observaciones',
          corregidoPendienteEnvio: false,
        });

        if (observacionesSinCorregir) {
          res.status(400).json({ ok: false, msg: 'Debes corregir todos los documentos con observaciones antes de completar el trámite' });
          return;
        }

        await Documento.updateMany(
          {
            expediente: expediente._id,
            estado: 'con_observaciones',
            corregidoPendienteEnvio: true,
          },
          {
            $set: {
              estado: 'pendiente',
              corregidoPendienteEnvio: false,
            },
            $unset: { observacion: 1 },
          }
        );

        expediente.correccionReenviada = true;
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

  // Subir o reemplazar acuse de recepción (solo administrador)
  subirAcuse: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (req.user.role !== 'administrador') {
        if (req.file) fs.unlinkSync(req.file.path);
        res.status(403).json({ ok: false, msg: 'Solo el administrador puede subir acuses' });
        return;
      }

      if (!req.file) {
        res.status(400).json({ ok: false, msg: 'No se recibió ningún archivo PDF de acuse' });
        return;
      }

      const expediente = await Expediente.findById(req.params.id);

      if (!expediente) {
        fs.unlinkSync(req.file.path);
        res.status(404).json({ ok: false, msg: 'Expediente no encontrado' });
        return;
      }

      if (expediente.acuseRecepcion?.rutaArchivo) {
        const rutaAnterior = path.join(process.cwd(), expediente.acuseRecepcion.rutaArchivo);
        if (fs.existsSync(rutaAnterior)) fs.unlinkSync(rutaAnterior);
      }

      expediente.acuseRecepcion = {
        nombreArchivo: req.file.originalname,
        rutaArchivo: `uploads/${req.file.filename}`,
        fechaCarga: new Date(),
        subidoPor: req.user.uid,
      };

      await expediente.save();

      res.status(201).json({
        ok: true,
        msg: 'Acuse de recepción cargado correctamente',
        acuseRecepcion: expediente.acuseRecepcion,
        expediente,
      });
    } catch (err) { next(err); }
  },

  // Descargar acuse de recepción (administrador o dueño del expediente)
  descargarAcuse: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const expediente = await Expediente.findById(req.params.id);

      if (!expediente) {
        res.status(404).json({ ok: false, msg: 'Expediente no encontrado' });
        return;
      }

      if (
        req.user.role !== 'administrador' &&
        expediente.usuario.toString() !== req.user.uid
      ) {
        res.status(403).json({ ok: false, msg: 'No tienes permiso para descargar este acuse' });
        return;
      }

      if (!expediente.acuseRecepcion) {
        res.status(404).json({ ok: false, msg: 'Este expediente aún no tiene acuse de recepción' });
        return;
      }

      const fileRuta = path.join(process.cwd(), expediente.acuseRecepcion.rutaArchivo);

      if (!fs.existsSync(fileRuta)) {
        res.status(404).json({ ok: false, msg: 'El archivo físico del acuse no existe en el servidor' });
        return;
      }

      res.download(fileRuta, expediente.acuseRecepcion.nombreArchivo);
    } catch (err) { next(err); }
  },
};
