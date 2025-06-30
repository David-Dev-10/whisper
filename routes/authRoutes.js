import express from 'express';
import { registerAnonymous } from "../controllers/authController.js";

const router = express.Router();

router.post('/register', registerAnonymous);

export default router;