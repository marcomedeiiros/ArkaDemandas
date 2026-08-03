import { Router } from 'express';
import { AuthController } from '../controllers/AuthController.js';

const router = Router();
const controller = new AuthController();

// E-mail / senha
router.post('/register', controller.register);
router.post('/login', controller.login);
router.get('/me', controller.me);
router.put('/me', controller.updateMe);
router.delete('/me', controller.deleteMe);
router.put('/password', controller.changePassword);
router.post('/logout', controller.logout);

// Colaboradores (lista de usuários) para supervisão
router.get('/users', controller.listUsers);
router.put('/users/:id/role', controller.setUserRole);

// Login social (Google / Microsoft)
router.get('/providers', controller.providers);
router.get('/oauth/:provider', controller.oauthStart);
router.get('/oauth/:provider/callback', controller.oauthCallback);

export default router;
