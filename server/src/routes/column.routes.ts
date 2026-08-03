import { Router } from 'express';
import { ColumnController } from '../controllers/ColumnController.js';

const router = Router();
const controller = new ColumnController();

router.get('/', controller.getAll);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

export default router;
