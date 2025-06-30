import express from 'express';
import {
  createConfessionCategory,
  getConfessionCategories
} from '../controllers/confessionCategoryController.js';

const router = express.Router();

router.post('/admin/create', createConfessionCategory);
router.get('/', getConfessionCategories);

export default router;