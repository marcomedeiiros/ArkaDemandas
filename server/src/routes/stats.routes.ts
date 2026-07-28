import { Router } from 'express';
import { StatsController } from '../controllers/StatsController.js';

const router = Router();
const controller = new StatsController();

router.get('/', controller.getStats);

export default router;
