import { maxWords } from '../utils/validation';
import { Response, NextFunction } from 'express';
import { Documento } from '../models/Documento';
import { Expediente } from '../models/Expediente';
import { ConfigTramite } from '../models/ConfigTramite';
import { AuthRequest } from '../middlewares/auth.middleware';
import fs from 'fs';
import path from 'path';

export const documentoController = {

  // Subir un PDF a un expediente
  subir: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { expedienteId } = req.params;
      const tipoRequisito: string  = req.body.tipoRequisito;

      if (!req.file) {
        res.status(400).json({ ok: false, msg: 'No se recibió ningún archivo PDF' });
        return;
      }

      if (!tipoRequisito) {
        // Eliminar el archivo subido si falta el tipo
        fs.unlinkSync(req.file.path);
        res.status(400).json({ ok: false, msg: 'Debes indicar el tipo Requisito del documento' });
        return;
      }

      // Verificar que el expediente existe y pertenece al usuario
      const expediente = await Expediente.findById(expedienteId);
      if (!expediente) {
        fs.unlinkSync(req.file.path);
        res.status(404).json({ ok: false, msg: 'Expediente no encontrado' });
        return;
      }

      if (expediente.usuario.toString() !== req.user.uid) {
        fs.unlinkSync(req.file.path);
        res.status(403).json({ ok: false, msg: 'No tienes acceso a este expediente' });
        return;
      }

      // Solo se pueden subir documentos si el expediente está en borrador o con_observaciones
      if (!['borrador', 'con_observaciones'].includes(expediente.estado)) {
        fs.unlinkSync(req.file.path);
        res.status(400).json({
          ok: false,
          msg: `No se pueden subir documentos a un expediente en estado: ${expediente.estado}`,
        });
        return;
      }
      // HACER FUNCIONES PARA IRLAS RECICLANDO DENTRO DEL CODIGO Y QUE SE OPTIMICE
      // Si el expediente tiene observaciones, verificar que no venció el plazo
      if (expediente.estado === 'con_observaciones' && expediente.fechaLimiteCorreccion) {
        if (new Date() > expediente.fechaLimiteCorreccion) {
          fs.unlinkSync(req.file.path);
          res.status(400).json({
            ok: false,
            msg: `El plazo de corrección de ${expediente.diasParaCorreccion || 10} días ha vencido`,
            fechaLimite: expediente.fechaLimiteCorreccion,
          });
          return;
        }
      }

      // Verificar que el tipoRequisito es válido para este trámite
      const config = await ConfigTramite.findOne({ tipo: expediente.tipo });
      if (config) {
        const requisitosValidos = config.requisitos.map(r => r.nombre);
        if (!requisitosValidos.includes(tipoRequisito)) {
          fs.unlinkSync(req.file.path);
          res.status(400).json({
            ok: false,
            msg: `El requisito "${tipoRequisito}" no corresponde al trámite ${expediente.tipo}`,
            requisitosValidos,
          });
          return;
        }
      }

      // Si ya existe un documento de ese tipo, reemplazarlo
      const docExistente = await Documento.findOne({ expediente: expedienteId as string, tipoRequisito });
      if (docExistente) {
        // Eliminar archivo anterior del disco
        const rutaAnterior = path.join(process.cwd(), docExistente.rutaArchivo);
        if (fs.existsSync(rutaAnterior)) fs.unlinkSync(rutaAnterior);
        await docExistente.deleteOne();
      }

      const documento = await Documento.create({
        expediente: expedienteId as string,
        tipoRequisito,
        nombreArchivo: req.file.originalname,
        rutaArchivo: `uploads/${req.file.filename}`,
        obligatorio: config?.requisitos.find(r => r.nombre === tipoRequisito)?.obligatorio ?? true,
        estado: 'pendiente',
        fechaCorreccion: docExistente ? new Date() : undefined,
      });

      res.status(201).json({ ok: true, msg: 'Documento subido correctamente', documento });
    } catch (err) { next(err); }
  },

  // Listar documentos de un expediente
  listar: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { expedienteId } = req.params;

      const expediente = await Expediente.findById(expedienteId);
      if (!expediente) {
        res.status(404).json({ ok: false, msg: 'Expediente no encontrado' });
        return;
      }

      // Usuario solo ve sus expedientes, admin ve todos
      if (
        req.user.role !== 'administrador' &&
        expediente.usuario.toString() !== req.user.uid
      ) {
        res.status(403).json({ ok: false, msg: 'No tienes acceso a este expediente' });
        return;
      }

      const documentos = await Documento.find({ expediente: expedienteId });

      // Obtener checklist completo del trámite para ver qué falta
      const config = await ConfigTramite.findOne({ tipo: expediente.tipo });
      const checklist = config?.requisitos.map(req => {
        const doc = documentos.find(d => d.tipoRequisito === req.nombre);
        return {
          requisito: req.nombre,
          obligatorio: req.obligatorio,
          descripcion: req.descripcion,
          estado: doc ? doc.estado : 'no_subido',
          documento: doc || null,
        };
      }) || [];

      res.json({ ok: true, checklist, documentos });
    } catch (err) { next(err); }
  },

  // Validar o rechazar un documento (solo administrador)
  validar: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (req.user.role !== 'administrador') {
        res.status(403).json({ ok: false, msg: 'Solo el administrador puede validar documentos' });
        return;
      }

      const { estado, observacion } = req.body;

      if (!['validado', 'con_observaciones'].includes(estado)) {
        res.status(400).json({ ok: false, msg: 'Estado inválido. Usa: validado | con_observaciones' });
        return;
      }

      if (observacion && !maxWords(observacion)) {
        res.status(400).json({ ok: false, msg: 'La observación excede las 500 palabras' });
        return;
      }

      const documento = await Documento.findById(req.params.documentoId);
      if (!documento) {
        res.status(404).json({ ok: false, msg: 'Documento no encontrado' });
        return;
      }

      documento.estado = estado;
      if (observacion) documento.observacion = observacion;
      await documento.save();

      // Si el documento tiene observaciones, actualizar automáticamente el expediente
      if (estado === 'con_observaciones') {
        const expediente = await Expediente.findById(documento.expediente);
        if (expediente && expediente.estado !== 'con_observaciones') {
          expediente.estado = 'con_observaciones';
          
          const configTramite = await ConfigTramite.findOne({ tipo: expediente.tipo });
          const dias = configTramite?.diasCorreccion || 10;
          
          const plazo = new Date();
          plazo.setDate(plazo.getDate() + dias);
          expediente.fechaLimiteCorreccion = plazo;
          expediente.diasParaCorreccion = dias;
          
          // Borramos el acuse para que el usuario no lo vea y el admin deba subir uno nuevo
          expediente.acuseRecepcion = undefined;
          
          await expediente.save();
        }
      } else if (estado === 'validado') {
        // Verificar si todos los documentos requeridos están validados
        const expediente = await Expediente.findById(documento.expediente);
        if (expediente) {
          const configTramite = await ConfigTramite.findOne({ tipo: expediente.tipo });
          if (configTramite) {
            const requisitosObligatorios = configTramite.requisitos.filter(r => r.obligatorio).map(r => r.nombre);
            const todosDocs = await Documento.find({ expediente: expediente._id });
            
            // Verificar que todos los documentos subidos estén validados
            const todosSubidosValidados = todosDocs.length > 0 && todosDocs.every(d => d.estado === 'validado');
            
            // Verificar que estén todos los obligatorios
            const tieneTodosObligatorios = requisitosObligatorios.every(reqNombre => 
              todosDocs.some(d => d.tipoRequisito === reqNombre)
            );

            if (todosSubidosValidados && tieneTodosObligatorios && expediente.estado !== 'validado') {
              expediente.estado = 'validado';
              await expediente.save();
            }
          }
        }
      }

      res.json({ ok: true, msg: `Documento marcado como: ${estado}`, documento });
    } catch (err) { next(err); }
  },

  // Descargar un documento de forma segura
  descargar: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { documentoId } = req.params;
      const documento = await Documento.findById(documentoId).populate('expediente');

      if (!documento) {
        res.status(404).json({ ok: false, msg: 'Documento no encontrado' });
        return;
      }

      const expediente: any = documento.expediente;

      // Verificar permisos: administrador o el dueño del expediente
      if (
        req.user.role !== 'administrador' &&
        expediente.usuario.toString() !== req.user.uid
      ) {
        res.status(403).json({ ok: false, msg: 'No tienes permiso para descargar este documento' });
        return;
      }

      const fileRuta = path.join(process.cwd(), documento.rutaArchivo);

      if (!fs.existsSync(fileRuta)) {
        res.status(404).json({ ok: false, msg: 'El archivo físico no existe en el servidor' });
        return;
      }

      res.download(fileRuta, documento.nombreArchivo);
    } catch (err) { next(err); }
  },
};