import { Router } from 'express';
import { DemandController } from '../controllers/DemandController.js';
import { DemandRepository } from '../repositories/DemandRepository.js';

const router = Router();
const controller = new DemandController();

router.get('/meta/values', (_req, res) => {
  const repo = new DemandRepository();
  const all = repo.findAll();
  const responsaveis = [...new Set(all.map(d => d.responsavel))].sort();
  const categorias = [...new Set(all.map(d => d.categoria))].sort();
  res.json({ responsaveis, categorias });
});

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id', controller.update);

router.patch('/:id/status', controller.updateStatus);
router.patch('/:id/move', controller.updateStatus);
router.patch('/:id/complete', controller.complete);
router.post('/:id/duplicate', controller.duplicate);
router.delete('/:id', controller.delete);

export default router;
