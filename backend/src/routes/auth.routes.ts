import { Router } from 'express';
import { register, login } from '../controllers/auth.controller';
import { requireAuth, AuthRequest } from '../middlewares/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);

// Ruta de prueba protegida
router.get('/me', requireAuth, (req: AuthRequest, res) => {
  res.json({ ok: true, user: req.user });
});

export default router;
