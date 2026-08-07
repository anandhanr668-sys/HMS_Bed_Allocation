import express from 'express';

// Import all admin controllers
import * as adminController from '../controllers/admin/admin.controller.js';
import * as formBuilderController from '../controllers/admin/formBuilder.controller.js';
import * as protocolBuilderController from '../controllers/admin/protocolBuilder.controller.js';
import * as bedManagementController from '../controllers/admin/bedManagement.controller.js';
import * as staffManagementController from '../controllers/admin/staffManagement.controller.js';
import * as patientMonitoringController from '../controllers/admin/patientMonitoring.controller.js';
import * as reportsController from '../controllers/admin/reports.controller.js';

const router = express.Router();

// ============================================================
// ADMIN DASHBOARD & SYSTEM
// ============================================================

// Dashboard Statistics
router.get('/stats', adminController.getAdminStats);
router.get('/system-health', adminController.getSystemHealth);
router.get('/audit-logs', adminController.getRecentAuditLogs);

// Hospital Configuration
router.get('/config', adminController.getHospitalConfig);
router.put('/config', adminController.updateHospitalConfig);

// Emergency Overrides
router.get('/emergency-overrides', adminController.getEmergencyOverrides);
router.post('/emergency-overrides', adminController.activateEmergencyOverride);
router.put('/emergency-overrides/:overrideId/deactivate', adminController.deactivateEmergencyOverride);

// ============================================================
// FORM BUILDER (NO-CODE)
// ============================================================

// Form Templates
router.get('/forms', formBuilderController.getAllFormTemplates);
router.get('/forms/:formId', formBuilderController.getFormTemplateById);
router.post('/forms', formBuilderController.createFormTemplate);
router.put('/forms/:formId', formBuilderController.updateFormTemplate);
router.delete('/forms/:formId', formBuilderController.deleteFormTemplate);

// Form Publishing
router.post('/forms/:formId/publish', formBuilderController.publishFormTemplate);
router.post('/forms/:formId/archive-version', formBuilderController.archiveFormVersion);
router.get('/forms/:formId/preview', formBuilderController.previewForm);

// Form Submissions
router.get('/forms/submissions', formBuilderController.getFormSubmissions);

// Field Types
router.get('/forms/field-types', formBuilderController.getFieldTypes);

// ============================================================
// PROTOCOL BUILDER (NO-CODE CLINICAL RULES)
// ============================================================

// Clinical Protocols
router.get('/protocols', protocolBuilderController.getAllProtocols);
router.get('/protocols/:protocolId', protocolBuilderController.getProtocolById);
router.post('/protocols', protocolBuilderController.createProtocol);
router.put('/protocols/:protocolId', protocolBuilderController.updateProtocol);
router.delete('/protocols/:protocolId', protocolBuilderController.deleteProtocol);

// Protocol Publishing & Execution
router.post('/protocols/:protocolId/publish', protocolBuilderController.publishProtocol);
router.post('/protocols/:protocolId/execute', protocolBuilderController.executeProtocol);

// Protocol Executions (Alerts)
router.get('/protocols/executions', protocolBuilderController.getProtocolExecutions);
router.put('/protocols/executions/:executionId/resolve', protocolBuilderController.resolveProtocolAlert);
router.get('/protocols/alerts/active', protocolBuilderController.getActiveAlerts);

// ============================================================
// BED & WARD MANAGEMENT
// ============================================================

// Wards
router.get('/wards', bedManagementController.getAllWards);
router.post('/wards', bedManagementController.createWard);
router.put('/wards/:wardId', bedManagementController.updateWard);

// Beds
router.get('/beds', bedManagementController.getAllBeds);
router.post('/beds', bedManagementController.createBed);
router.put('/beds/:bedId', bedManagementController.updateBed);
router.delete('/beds/:bedId', bedManagementController.deleteBed);

// Bed Availability
router.get('/beds/availability', bedManagementController.getBedAvailability);

// Bed Types
router.get('/bed-types', bedManagementController.getBedTypes);
router.post('/bed-types', bedManagementController.createBedType);

// Bed Assignment Rules
router.get('/bed-rules', bedManagementController.getBedAssignmentRules);
router.post('/bed-rules', bedManagementController.createBedAssignmentRule);
router.put('/bed-rules/:ruleId', bedManagementController.updateBedAssignmentRule);

// Bed Assignment History
router.get('/bed-assignments', bedManagementController.getBedAssignmentHistory);

// ============================================================
// STAFF MANAGEMENT
// ============================================================

// Staff CRUD
router.get('/staff', staffManagementController.getAllStaff);
router.get('/staff/:staffId', staffManagementController.getStaffById);
router.post('/staff', staffManagementController.createStaff);
router.put('/staff/:staffId', staffManagementController.updateStaff);
router.delete('/staff/:staffId', staffManagementController.deleteStaff);

// Staff Status & Password
router.put('/staff/:staffId/status', staffManagementController.toggleStaffStatus);
router.put('/staff/:staffId/reset-password', staffManagementController.resetStaffPassword);

// Departments
router.get('/departments', staffManagementController.getAllDepartments);
router.post('/departments', staffManagementController.createDepartment);

// Staff Permissions
router.get('/staff/:staffId/permissions', staffManagementController.getStaffPermissions);
router.post('/staff/:staffId/permissions', staffManagementController.grantStaffPermission);
router.delete('/staff/:staffId/permissions/:permissionId', staffManagementController.revokeStaffPermission);

// Staff Credentials
router.get('/staff/:staffId/credentials', staffManagementController.getStaffCredentials);

// Staff Statistics
router.get('/staff/statistics', staffManagementController.getStaffStatistics);

// ============================================================
// PATIENT MONITORING (READ-ONLY)
// ============================================================

// Patient Lists
router.get('/patients', patientMonitoringController.getAllPatients);
router.get('/patients/:patientId', patientMonitoringController.getPatientById);
router.get('/patients/category/:category', patientMonitoringController.getPatientsByCategory);

// Patient Details
router.get('/patients/:patientId/status-history', patientMonitoringController.getPatientStatusHistory);
router.get('/patients/:patientId/vitals', patientMonitoringController.getPatientVitals);
router.get('/patients/:patientId/visit-history', patientMonitoringController.getPatientVisitHistory);

// High Risk Patients
router.get('/patients/high-risk', patientMonitoringController.getHighRiskPatients);

// Patient Statistics
router.get('/patients/statistics', patientMonitoringController.getPatientStatistics);

// Patient Search
router.get('/patients/search', patientMonitoringController.searchPatients);

// Audit Log
router.post('/patients/:patientId/log-view', patientMonitoringController.logPatientView);

// ============================================================
// REPORTS & ANALYTICS
// ============================================================

// Report Generation
router.get('/reports/daily-patient', reportsController.generateDailyPatientReport);
router.get('/reports/bed-utilization', reportsController.generateBedUtilizationReport);
router.get('/reports/emergency-cases', reportsController.generateEmergencyCasesReport);
router.get('/reports/doctor-consultation', reportsController.generateDoctorConsultationReport);
router.get('/reports/patient-history/:patientId', reportsController.generatePatientVisitHistoryReport);

// Report Templates
router.get('/reports/templates', reportsController.getReportTemplates);

// Report History
router.get('/reports/history', reportsController.getReportExecutionHistory);

// Export
router.post('/reports/export/csv', reportsController.exportReportAsCSV);

// ============================================================

export default router;
