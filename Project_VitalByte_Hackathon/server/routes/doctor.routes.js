import express from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { getTreatmentHistory, addHistoryItem } from '../controllers/doctor/doctor.controller.js';

const router = express.Router();

// Role-based access control for all doctor routes
const doctorAccess = authorize(['DOCTOR', 'ADMIN']);

// @route   GET /api/doctor/patients/:id/history
// @desc    Get patient treatment history
router.get('/patients/:id/history', authenticate, doctorAccess, getTreatmentHistory);

// @route   POST /api/doctor/patients/:id/history
// @desc    Add new treatment history entry
router.post('/patients/:id/history', authenticate, doctorAccess, addHistoryItem);

export default router;
