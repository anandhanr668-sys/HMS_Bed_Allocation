import express from 'express';
import { login, devLogin } from '../controllers/auth.controller.js';

const router = express.Router();

router.post('/login', login);
router.post('/dev-login', devLogin);

export default router;
