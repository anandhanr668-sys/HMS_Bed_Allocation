
import express from 'express';
import { patientLogin, getPatientDashboard } from '../controllers/portal/portal.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/login', patientLogin);

// Protected Routes
router.use(authenticate); // Apply CheckAuth here for subsequent routes
router.get('/dashboard', getPatientDashboard);

export default router;
