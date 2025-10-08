import { Router } from 'express';
import { CustomerController } from '../controllers/customer.js';
import { verificaRule } from '../middlewares/rules.js';

const router = Router();

router.post('/', verificaRule("ADM"), CustomerController.store);
router.get('/', verificaRule("ADM"), CustomerController.index);
router.put('/:id', verificaRule("ADM"), CustomerController.update);
router.delete('/:id', verificaRule("ADM"), CustomerController.delete);

export default router;