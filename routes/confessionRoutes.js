import express from 'express';
import {
  createConfession,
  getAllConfessions,
  getConfessionsByAuthor,
  getConfessionById,
  updateConfession,
  deleteConfession,
  reactToConfession,
  getNearbyConfessions
} from '../controllers/confessionController.js';

const router = express.Router();

router.post('/create', createConfession);
router.get('/', getAllConfessions);
router.get('/:id', getConfessionById);
router.get('/author/:authorId', getConfessionsByAuthor);
router.put('/:id', updateConfession);
router.delete('/:id', deleteConfession);
router.post("/react", reactToConfession);
router.get('/nearby', getNearbyConfessions);

export default router;
