import { Router } from 'express';
import { register, login, getEmpresas, deshabilitarEmpresa, updateEmpresa } from '../controllers/auth.controller';
import { requireAuth, AuthRequest } from '../middlewares/auth.middleware';
import configTramiteRoutes from './configTramite.routes';

const router = Router();

router.post('/register', register);
router.post('/login', login);

// Ruta de prueba protegida
router.get('/me', requireAuth, (req: AuthRequest, res) => {
  res.json({ ok: true, user: req.user });
});

// Ruta para listar empresas
router.get('/empresas', requireAuth, getEmpresas);

// Ruta para deshabilitar una empresa (eliminación lógica)
router.put('/empresas/:id/deshabilitar', requireAuth, deshabilitarEmpresa);

// Ruta para actualizar una empresa
router.put('/empresas/:id', requireAuth, updateEmpresa);

export default router;
