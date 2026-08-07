import express from 'express';
import { getPublishedFormsByRole } from '../controllers/admin/config.controller.js';
import { generateDischargeReport } from '../controllers/shared/report.controller.js';
import * as clinicalFormController from '../controllers/shared/clinicalForm.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public route for fetched published forms by role (protected by auth, but accessible to all roles)
router.get('/forms/published/:role', authenticate, getPublishedFormsByRole);

// Clinical Forms System (Single Source of Truth)
router.get('/clinical-forms/:formCode', authenticate, clinicalFormController.getClinicalFormByCode);
router.post('/clinical-forms/submit', authenticate, clinicalFormController.submitClinicalForm);
router.get('/clinical-forms/submission', authenticate, clinicalFormController.getSubmission);

// Reports
router.get('/patients/:patientId/discharge-report', authenticate, generateDischargeReport);

export default router;
