import express from 'express';
import { ProductController } from '../controllers/product.js';

const router = express.Router();

router.post('/', ProductController.store);
router.get('/', ProductController.index);
router.get('/:id', ProductController.show);
router.put('/:id', ProductController.update);

export default router;