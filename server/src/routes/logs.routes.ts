import { Router } from 'express';
import { ActivityLogController } from '../controllers/ActivityLogController.js';

const router = Router();
const controller = new ActivityLogController();

router.get('/', controller.getAll);
router.get('/demand/:demandId', controller.getByDemandId);

export default router;
