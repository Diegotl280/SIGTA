import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import { upload } from '../middlewares/upload.middleware';
import { expedienteController } from '../controllers/expediente.controller';

const router = Router();

// Todas las rutas requieren estar autenticado
router.use(requireAuth);

router.post('/', expedienteController.crear);
router.get('/', expedienteController.listar);
router.get('/usuario/:usuarioId', expedienteController.listarPorUsuario);
router.get('/:id', expedienteController.obtener);
router.patch('/:id/enviar', expedienteController.enviar);
router.patch('/:id/estado', expedienteController.cambiarEstado);
router.post('/:id/acuse', upload.single('archivo'), expedienteController.subirAcuse);
router.get('/:id/acuse/descargar', expedienteController.descargarAcuse);

export default router;
