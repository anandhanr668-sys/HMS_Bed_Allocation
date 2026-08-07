import express from 'express';
import {
    createVisit,
    getVisitsByStatus,
    submitVitals,
    submitDoctorConsultation
} from '../controllers/shared/visit.controller.js';
import {
    getAssignedOrders,
    submitLabResult
} from '../controllers/shared/lab.controller.js';

const router = express.Router();

// Visit Lifecycle
router.post('/create', createVisit);
router.get('/queue', getVisitsByStatus);
router.post('/vitals', submitVitals);
router.post('/consultation', submitDoctorConsultation);

// Lab Workflow
router.get('/lab/assigned/:technicianId', getAssignedOrders);
router.post('/lab/results', submitLabResult);

export default router;
