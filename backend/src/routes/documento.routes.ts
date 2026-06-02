import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import { upload } from '../middlewares/upload.middleware';
import { documentoController } from '../controllers/documento.controller';

const router = Router({ mergeParams: true }); // mergeParams para acceder a expedienteId

router.use(requireAuth);

// POST /api/expedientes/:expedienteId/documentos
router.post('/', upload.single('archivo'), documentoController.subir);

// GET /api/expedientes/:expedienteId/documentos
router.get('/', documentoController.listar);

// PATCH /api/expedientes/:expedienteId/documentos/:documentoId/validar
router.patch('/:documentoId/validar', documentoController.validar);

// GET /api/expedientes/:expedienteId/documentos/:documentoId/descargar
router.get('/:documentoId/descargar', documentoController.descargar);

export default router;