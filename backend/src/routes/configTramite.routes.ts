import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import { configTramiteController } from '../controllers/configTramite.controller';

const router = Router();
router.use(requireAuth);

router.get('/',      configTramiteController.listar);
router.get('/archivados', configTramiteController.listarArchivados);
router.post('/',     configTramiteController.crear);
router.put('/:id',   configTramiteController.actualizar);
router.put('/:id/archivar', configTramiteController.archivar);
router.put('/:id/restaurar', configTramiteController.restaurar);
router.delete('/:id', configTramiteController.eliminarDefinitivamente);

export default router;
