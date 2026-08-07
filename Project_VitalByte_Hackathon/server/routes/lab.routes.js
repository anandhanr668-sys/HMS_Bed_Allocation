import express from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import * as labOrdersController from '../controllers/lab/labOrders.controller.js';
import * as labReportsController from '../controllers/lab/labReports.controller.js';

const router = express.Router();

// ===== DOCTOR ROUTES =====
// Lab Test Catalog
router.get(
    '/catalog',
    authenticate,
    authorize(['DOCTOR', 'ADMIN']),
    labOrdersController.getLabTestCatalog
);

// Create Lab Order
router.post(
    '/orders',
    authenticate,
    authorize(['DOCTOR']),
    labOrdersController.createLabOrder
);

// Get Patient Lab Orders
router.get(
    '/orders/patient/:patientId',
    authenticate,
    authorize(['DOCTOR', 'ADMIN']),
    labOrdersController.getPatientLabOrders
);

// Get Patient Lab Reports
router.get(
    '/reports/patient/:patientId',
    authenticate,
    authorize(['DOCTOR', 'ADMIN']),
    labOrdersController.getPatientLabReports
);

// Get Lab Assistants (for assignment)
router.get(
    '/assistants',
    authenticate,
    authorize(['DOCTOR', 'ADMIN']),
    labOrdersController.getLabAssistants
);

// ===== LAB ASSISTANT ROUTES =====
// Get My Assignments
router.get(
    '/my-assignments',
    authenticate,
    authorize(['LAB_ASSISTANT']),
    labReportsController.getMyAssignments
);

// Get Order Details
router.get(
    '/order/:orderId',
    authenticate,
    authorize(['LAB_ASSISTANT']),
    labReportsController.getOrderDetails
);

// Submit Lab Report
router.post(
    '/submit-report',
    authenticate,
    authorize(['LAB_ASSISTANT']),
    labReportsController.submitReport
);

// ===== SHARED ROUTES =====
// Get Specific Report (Doctor, Lab Assistant, Admin can view)
router.get(
    '/report/:reportId',
    authenticate,
    authorize(['DOCTOR', 'LAB_ASSISTANT', 'ADMIN']),
    labReportsController.getReport
);

export default router;
