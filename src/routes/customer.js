import { Router } from 'express';
import { customerController } from '../controllers/customer.js';

const router = Router();

router.post('/', customerController.store);

router.get('/', customerController.index);

router.put('/:id', customerController.update);

router.delete('/:id', customerController.delete);




export default router;