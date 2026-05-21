import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  register,
  login,
  getEmpresas,
  getEmpresasArchivadas,
  deshabilitarEmpresa,
  restaurarEmpresa,
  eliminarEmpresaDefinitivamente,
  updateEmpresa,
  getMe,
  createEmpresa
} from '../controllers/auth.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

// Límite de intentos de inicio de sesión (prevenir ataques de fuerza bruta)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 30, // Limita cada IP a 5 peticiones por ventana de tiempo (Se ajusto el límite a 30)
  message: { ok: false, msg: 'Demasiados intentos fallidos, por favor intenta de nuevo en 15 minutos.' },
  standardHeaders: true, // Retorna los encabezados 'RateLimit-*' en la respuesta
  legacyHeaders: false, // Deshabilita los encabezados 'X-RateLimit-*'
});

router.post('/register', register);
router.post('/login', loginLimiter, login);

// Ruta de perfil
router.get('/me', requireAuth, getMe);

// Ruta para listar empresas
router.get('/empresas', requireAuth, getEmpresas);

// Ruta para listar empresas archivadas
router.get('/empresas/archivadas', requireAuth, getEmpresasArchivadas);

// Ruta para crear empresas desde el panel administrativo
router.post('/empresas', requireAuth, createEmpresa);

// Ruta para deshabilitar una empresa (eliminación lógica)
router.put('/empresas/:id/deshabilitar', requireAuth, deshabilitarEmpresa);

// Ruta para restaurar una empresa archivada
router.put('/empresas/:id/restaurar', requireAuth, restaurarEmpresa);

// Ruta para eliminar definitivamente una empresa archivada
router.delete('/empresas/:id', requireAuth, eliminarEmpresaDefinitivamente);

// Ruta para actualizar una empresa
router.put('/empresas/:id', requireAuth, updateEmpresa);

export default router;
