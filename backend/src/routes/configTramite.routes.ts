import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import { configTramiteController } from '../controllers/configTramite.controller';

const router = Router();
router.use(requireAuth);

router.get('/',      configTramiteController.listar);
router.post('/',     configTramiteController.crear);
router.put('/:id',   configTramiteController.actualizar);
router.put('/:id/deshabilitar', configTramiteController.deshabilitar);

export default router;