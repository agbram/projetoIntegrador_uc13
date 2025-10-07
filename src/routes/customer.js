pimport { Router } from 'express';
import { CustomerController } from '../controllers/customer.js';

const router = Router();

router.post('/', CustomerController.store);
router.get('/', CustomerController.index);
router.put('/:id', CustomerController.update);
router.delete('/:id', CustomerController.delete);

export default router;