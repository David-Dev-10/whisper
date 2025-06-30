import express from 'express';
import {
  addComment,
  editComment,
  deleteComment,
  reactToComment,
  getCommentsByConfessionId
} from '../controllers/commentController.js';

const router = express.Router();

router.post('/add', addComment);
router.put('/:id', editComment);
router.delete('/:id', deleteComment);
router.post('/react', reactToComment);
router.get('/confession/:confessionId', getCommentsByConfessionId);

export default router;
