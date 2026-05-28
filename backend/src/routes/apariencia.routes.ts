import { Router } from 'express';
import { aparienciaController } from '../controllers/apariencia.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { uploadImage } from '../middlewares/upload.middleware';

const router = Router();

router.get('/', aparienciaController.obtener);
router.get('/logo', aparienciaController.descargarLogo);
router.put('/', requireAuth, aparienciaController.actualizarColores);
router.post('/logo', requireAuth, uploadImage.single('logo'), aparienciaController.subirLogo);
router.post('/restaurar-oficial', requireAuth, aparienciaController.restaurarOficial);

export default router;
