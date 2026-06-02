import { maxWords } from '../utils/validation';
import { Response, NextFunction } from 'express';
import { Documento } from '../models/Documento';
import { Expediente } from '../models/Expediente';
import { ConfigTramite } from '../models/ConfigTramite';
import { User } from '../models/User';
import { AuthRequest } from '../middlewares/auth.middleware';
import fs from 'fs';
import path from 'path';

function eliminarArchivoSiExiste(ruta?: string) {
  if (!ruta || !fs.existsSync(ruta)) return;

  try {
    fs.unlinkSync(ruta);
  } catch (err) {
    console.error('No fue posible eliminar el archivo físico:', ruta, err);
  }
}

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
        eliminarArchivoSiExiste(req.file.path);
        res.status(400).json({ ok: false, msg: 'Debes indicar el tipo Requisito del documento' });
        return;
      }

      // Verificar que el expediente existe y pertenece al usuario
      const expediente = await Expediente.findById(expedienteId);
      if (!expediente) {
        eliminarArchivoSiExiste(req.file.path);
        res.status(404).json({ ok: false, msg: 'Expediente no encontrado' });
        return;
      }

      if (expediente.usuario.toString() !== req.user.uid) {
        eliminarArchivoSiExiste(req.file.path);
        res.status(403).json({ ok: false, msg: 'No tienes acceso a este expediente' });
        return;
      }

      // Solo se pueden subir documentos si el expediente está en borrador o con_observaciones
      if (!['borrador', 'con_observaciones'].includes(expediente.estado)) {
        eliminarArchivoSiExiste(req.file.path);
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
          eliminarArchivoSiExiste(req.file.path);
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
          eliminarArchivoSiExiste(req.file.path);
          res.status(400).json({
            ok: false,
            msg: `El requisito "${tipoRequisito}" no corresponde al trámite ${expediente.tipo}`,
            requisitosValidos,
          });
          return;
        }
      }

      // Si ya existe un documento de ese tipo, actualizarlo sin borrar primero
      // el registro anterior. Así no se pierde información si falla la escritura.
      const docExistente = await Documento.findOne({ expediente: expedienteId as string, tipoRequisito });
      if (
        expediente.estado === 'con_observaciones' &&
        docExistente &&
        docExistente.estado !== 'con_observaciones'
      ) {
        eliminarArchivoSiExiste(req.file.path);
        res.status(400).json({
          ok: false,
          msg: 'Solo puedes reemplazar los documentos que tienen observaciones',
        });
        return;
      }

      let rutaAnterior = docExistente?.rutaArchivo;
      const rutaNueva = `uploads/${req.file.filename}`;
      const corrigiendoObservacion =
        expediente.estado === 'con_observaciones' &&
        docExistente?.estado === 'con_observaciones';
      const datosDocumento = {
        nombreArchivo: req.file.originalname,
        rutaArchivo: rutaNueva,
        obligatorio: config?.requisitos.find(r => r.nombre === tipoRequisito)?.obligatorio ?? true,
        estado: corrigiendoObservacion ? 'con_observaciones' as const : 'pendiente' as const,
        observacion: corrigiendoObservacion ? docExistente?.observacion : undefined,
        fechaCorreccion: docExistente ? new Date() : undefined,
        corregidoPendienteEnvio: corrigiendoObservacion,
      };

      let documento;
      try {
        documento = await Documento.findOneAndUpdate(
          { expediente: expedienteId as string, tipoRequisito },
          {
            $set: datosDocumento,
            $setOnInsert: {
              expediente: expedienteId as string,
              tipoRequisito,
            },
          },
          { returnDocument: 'after', upsert: true, runValidators: true, setDefaultsOnInsert: true }
        );
      } catch (err: any) {
        if (err.code !== 11000) throw err;

        const documentoCreadoEnParalelo = await Documento.findOne({
          expediente: expedienteId as string,
          tipoRequisito,
        });
        rutaAnterior = documentoCreadoEnParalelo?.rutaArchivo;

        documento = await Documento.findOneAndUpdate(
          { expediente: expedienteId as string, tipoRequisito },
          { $set: datosDocumento },
          { returnDocument: 'after', runValidators: true }
        );
      }

      if (!documento) {
        throw new Error('No fue posible guardar el documento');
      }

      if (rutaAnterior && rutaAnterior !== rutaNueva) {
        eliminarArchivoSiExiste(path.join(process.cwd(), rutaAnterior));
      }

      res.status(201).json({ ok: true, msg: 'Documento subido correctamente', documento });
    } catch (err) {
      if (req.file) eliminarArchivoSiExiste(req.file.path);
      next(err);
    }
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

      const filtroDocumentos: Record<string, unknown> = { expediente: expedienteId };

      if (req.user.role === 'administrador') {
        if (expediente.estado === 'borrador') {
          res.json({
            ok: true,
            checklist: [],
            documentos: [],
            entregaPendiente: true,
          });
          return;
        }

        filtroDocumentos.corregidoPendienteEnvio = { $ne: true };
      }

      const documentos = await Documento.find(filtroDocumentos);

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

      const expediente = await Expediente.findById(documento.expediente);
      if (!expediente) {
        res.status(404).json({ ok: false, msg: 'Expediente no encontrado' });
        return;
      }

      if (expediente.estado === 'borrador' || documento.corregidoPendienteEnvio) {
        res.status(400).json({
          ok: false,
          msg: 'El usuario todavía no ha completado el envío de este documento',
        });
        return;
      }

      if (expediente.estado === 'cancelado') {
        res.status(400).json({ ok: false, msg: 'El trámite está cancelado y ya no admite cambios' });
        return;
      }

      documento.estado = estado;
      documento.corregidoPendienteEnvio = false;
      documento.observacion = estado === 'con_observaciones' ? observacion : undefined;
      await documento.save();

      // Si el documento tiene observaciones, actualizar automáticamente el expediente
      if (estado === 'con_observaciones') {
        if (expediente.correccionReenviada) {
          expediente.estado = 'cancelado';
          expediente.vigente = false;
          expediente.fechaLimiteCorreccion = undefined;
          expediente.diasParaCorreccion = undefined;

          if (expediente.acuseRecepcion?.rutaArchivo) {
            eliminarArchivoSiExiste(path.join(process.cwd(), expediente.acuseRecepcion.rutaArchivo));
          }
          expediente.acuseRecepcion = undefined;

          await expediente.save();
          await User.updateOne(
            { _id: expediente.usuario },
            { $pull: { tramitesPermitidos: expediente.tipo } }
          );

          res.json({
            ok: true,
            msg: 'El documento volvió a presentar observaciones. El trámite fue cancelado',
            documento,
            expediente,
          });
          return;
        }

        if (expediente && expediente.estado !== 'con_observaciones') {
          expediente.estado = 'con_observaciones';
          
          const configTramite = await ConfigTramite.findOne({ tipo: expediente.tipo });
          const dias = configTramite?.diasCorreccion || 10;
          
          const plazo = new Date();
          plazo.setDate(plazo.getDate() + dias);
          expediente.fechaLimiteCorreccion = plazo;
          expediente.diasParaCorreccion = dias;
          
          // Borramos el acuse para que el usuario no lo vea y el admin deba subir uno nuevo
          if (expediente.acuseRecepcion?.rutaArchivo) {
            eliminarArchivoSiExiste(path.join(process.cwd(), expediente.acuseRecepcion.rutaArchivo));
          }
          expediente.acuseRecepcion = undefined;
          
          await expediente.save();
        }
      } else if (estado === 'validado') {
        // Verificar si todos los documentos requeridos están validados
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

      if (
        req.user.role === 'administrador' &&
        (expediente.estado === 'borrador' || documento.corregidoPendienteEnvio)
      ) {
        res.status(403).json({
          ok: false,
          msg: 'El usuario todavía no ha completado el envío de este documento',
        });
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
