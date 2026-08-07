import express from 'express';
import { getAllPatients, registerPatient, updatePatientVitals, updatePatientStatus } from '../controllers/frontdesk/patient.controller.js';
import { createTransaction, getPatientTransactions } from '../controllers/frontdesk/billing.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Front Desk routes with role protection
router.get('/patients', authenticate, authorize(['FRONT_DESK', 'ADMIN', 'DOCTOR', 'NURSE']), getAllPatients);
router.post('/patients', authenticate, authorize(['FRONT_DESK', 'ADMIN']), registerPatient);
router.post('/patients/:id/vitals', authenticate, authorize(['NURSE', 'DOCTOR', 'ADMIN']), updatePatientVitals);
router.put('/patients/:id/status', authenticate, authorize(['FRONT_DESK', 'ADMIN', 'DOCTOR', 'NURSE']), updatePatientStatus);

// Billing
router.post('/billing/transaction', authenticate, authorize(['FRONT_DESK', 'ADMIN']), createTransaction);
router.get('/billing/patient/:patientId', authenticate, authorize(['FRONT_DESK', 'ADMIN']), getPatientTransactions);

export default router;
