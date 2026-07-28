import { Router } from 'express';
import { DemandController } from '../controllers/DemandController.js';

const router = Router();
const controller = new DemandController();

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.patch('/:id/status', controller.updateStatus);
router.patch('/:id/complete', controller.complete);
router.post('/:id/duplicate', controller.duplicate);
router.delete('/:id', controller.delete);

export default router;
