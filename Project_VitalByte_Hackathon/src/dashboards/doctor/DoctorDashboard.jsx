import React, { useState, useMemo, useContext, useRef } from 'react';
import { Stethoscope } from 'lucide-react';
import { PatientContext } from '../../context/PatientContext';
import { useNotification } from '../../context/NotificationContext';
import { HospitalLayoutContext } from '../../context/HospitalLayoutContext';
import { FrontDeskContext } from '../../context/FrontDeskContext';

// Extracted Components
import PatientRoster from './components/PatientRoster';
import ClinicalHeader from './components/ClinicalHeader';
import DoctorTabs from './components/DoctorTabs';
import DoctorModals from './components/DoctorModals';
import apiClient from '../../api/apiClient';

const DoctorDashboard = () => {
    const { addNotification } = useNotification();
    const {
        patients,
        getPatientVitals,
        addConsultationNote,
        prescribeMedication,
        orderInvestigation,
        updatePatientStatus,
        updateClinicalHistory,
        deallocateBed
    } = useContext(PatientContext);

    const {
        getBedByPatientId,
        releaseBed
    } = useContext(HospitalLayoutContext);

    // UI Local States
    const [selectedPatientId, setSelectedPatientId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [rosterFilter, setRosterFilter] = useState('all');
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedReport, setSelectedReport] = useState(null);
    const [viewingReport, setViewingReport] = useState(false);

    // Clinical Form States
    const [provisionalDiagnosis, setProvisionalDiagnosis] = useState('');
    const [clinicalNote, setClinicalNote] = useState('');
    const [rxForm, setRxForm] = useState({ name: '', dosage: '', frequency: '', type: 'Oral' });
    const [labForm, setLabForm] = useState({ testName: '', type: 'Blood', urgency: 'Routine' });

    // Modal & Report States
    const [showSemenForm, setShowSemenForm] = useState(false);
    const [showReportPreview, setShowReportPreview] = useState(false);
    const [showConfigurator, setShowConfigurator] = useState(false);
    const [reportConfig, setReportConfig] = useState({
        demographics: true,
        visitDetails: true,
        caseSheet: true,
        investigations: true,
        medications: true,
        advice: true,
        billing: true,
        showAmounts: true,
        hideSensitive: false,
        hideDetailedHistory: false
    });
    const reportRef = useRef();

    // Memoized Data
    const selectedPatient = useMemo(() => patients.find(p => p.patientId === selectedPatientId), [patients, selectedPatientId]);
    const patientVitals = selectedPatientId ? getPatientVitals(selectedPatientId) : null;

    const filteredPatients = useMemo(() => {
        return patients.filter(p => {
            // Queue Enforcement: Show active patients across the pipeline for visibility
            // but strict workflow means only 'WAITING_DOCTOR' is actionable.
            const validStatuses = ['AT_NURSE', 'WAITING_DOCTOR', 'AT_DOCTOR', 'AT_LAB', 'BILLING_PENDING'];
            if (!validStatuses.includes(p.visitStatus)) return false;

            const matchesSearch = (p.firstName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                p.patientId.toLowerCase().includes(searchTerm.toLowerCase());

            if (rosterFilter === 'critical') return matchesSearch && (p.riskLevel === 'CRITICAL' || p.riskLevel === 'HIGH');
            return matchesSearch;
        });
    }, [patients, searchTerm, rosterFilter]);

    const criticalCount = patients.filter(p => p.riskLevel === 'CRITICAL' || p.riskLevel === 'HIGH').length;

    const existingCaseSheet = useMemo(() => {
        return selectedPatient?.treatmentHistory?.find(h => h.type === 'FERTILITY_CASE_SHEET')?.data || null;
    }, [selectedPatient]);

    const existingSemenAnalysis = useMemo(() => {
        const inv = selectedPatient?.investigations?.find(i => i.testCode === 'SEMEN_ANALYSIS' && i.data);
        return inv ? inv.data : null;
    }, [selectedPatient]);

    const billingData = useMemo(() => {
        if (!selectedPatient) return [];
        const items = [
            { description: 'Hospital Registration Fee', amount: 50.00 },
            { description: 'Specialist Consultation (Fertility)', amount: 150.00 }
        ];
        if (existingSemenAnalysis) {
            items.push({ description: 'Semen Analysis Test', amount: 45.00 });
        }
        if (selectedPatient.investigations?.length > (existingSemenAnalysis ? 1 : 0)) {
            items.push({ description: `Other Lab Tests (${selectedPatient.investigations.length - (existingSemenAnalysis ? 1 : 0)})`, amount: 80.00 });
        }
        return items;
    }, [selectedPatient, existingSemenAnalysis]);

    // Actions
    const handleSelectPatient = (id) => {
        setSelectedPatientId(id);
        setActiveTab('overview');
        setClinicalNote('');
        setProvisionalDiagnosis('');
        setShowReportPreview(false);
    };

    const handleSaveNote = () => {
        if (!clinicalNote.trim()) return;
        addConsultationNote(selectedPatientId, 'DR-CURRENT', `[${provisionalDiagnosis}] ${clinicalNote}`);
        setClinicalNote('');
        addNotification('Clinical note saved securely.', 'success');
    };

    const handlePrescribe = (e) => {
        e.preventDefault();
        prescribeMedication(selectedPatientId, {
            ...rxForm,
            prescribedBy: 'Dr. Current User'
        });
        setRxForm({ name: '', dosage: '', frequency: '', type: 'Oral' });
        addNotification(`Prescription for ${rxForm.name} added.`, 'success');
    };

    const handleOrderLab = async (e, testNameOverride) => {
        if (e && e.preventDefault) e.preventDefault();

        const finalTestName = testNameOverride || labForm.testName;
        if (!finalTestName) return;

        const success = await orderInvestigation(selectedPatientId, {
            ...labForm,
            testName: finalTestName,
            orderedBy: 'Dr. Current User'
        });

        if (success) {
            if (!testNameOverride) {
                setLabForm({ testName: '', type: 'Blood', urgency: 'Routine' });
            }
            addNotification(`Laboratory investigation [${finalTestName}] requested.`, 'success');
        } else {
            addNotification(`Failed to request investigation [${finalTestName}].`, 'error');
        }
    };

    const handleDischargePatient = () => {
        if (confirm('Finalize discharge and clear bed allocation? This will generate the Discharge Summary.')) {
            const currentBed = getBedByPatientId(selectedPatientId);

            // 1. Release Bed / Update Status
            updatePatientStatus(selectedPatientId, 'DISCHARGED');
            deallocateBed(selectedPatientId);

            if (currentBed) {
                releaseBed(currentBed.bedId, 'DOCTOR');
            }

            // 2. Trigger Report Generation (Backend)
            // Use window.open to prompt download
            const token = localStorage.getItem('hms_token');
            const reportUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/shared/patients/${selectedPatientId}/discharge-report?token=${token}`; // Pass token if needed for query param auth or handle via cookie/header

            // Note: Since JWT usually in Header, window.open might not work for secured endpoints directly unless we use a temporary signed URL or cookie.
            // For this implementation, we will assume we can use the apiClient to download Blob or prompt user from the UI.

            // Better approach: Call API to ensure discharge logic runs server side, then download.
            // But for now, let's just open the link and assume specific public/token handling or just use the download helper.
            downloadDischargeReport(selectedPatientId);

            addNotification('Patient discharged. Report downloading...', 'success');
            setSelectedPatientId(null);
        }
    };

    const downloadDischargeReport = async (id) => {
        try {
            const response = await apiClient.get(`/shared/patients/${id}/discharge-report`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Discharge_Summary_${id}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (e) {
            console.error("Report download failed", e);
            addNotification('Failed to download discharge report', 'error');
        }
    };

    const handleViewReport = async (reportId) => {
        try {
            const response = await apiClient.get(`/lab/report/${reportId}`);
            setSelectedReport(response.data);
            setViewingReport(true);
        } catch (err) {
            console.error('Failed to fetch report:', err);
            addNotification('Failed to load lab report.', 'error');
        }
    };

    const handleGenerateReport = () => {
        downloadDischargeReport(selectedPatientId);
    };
    const handleFinalizeReport = () => {
        setShowConfigurator(false);
        setTimeout(() => setShowReportPreview(true), 100);
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="flex h-[calc(100vh-6rem)] gap-6 animate-in fade-in duration-500 font-sans print:hidden">
            <PatientRoster
                patients={filteredPatients}
                selectedPatientId={selectedPatientId}
                handleSelectPatient={handleSelectPatient}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                rosterFilter={rosterFilter}
                setRosterFilter={setRosterFilter}
                criticalCount={criticalCount}
            />

            <div className="flex-1 flex flex-col bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden relative">
                {selectedPatient ? (
                    <>
                        <ClinicalHeader
                            selectedPatient={selectedPatient}
                            existingCaseSheet={existingCaseSheet}
                            handleGenerateReport={handleGenerateReport}
                            handleDischargePatient={handleDischargePatient}
                        />

                        <DoctorTabs
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                            selectedPatient={selectedPatient}
                            patientVitals={patientVitals}
                            provisionalDiagnosis={provisionalDiagnosis}
                            setProvisionalDiagnosis={setProvisionalDiagnosis}
                            clinicalNote={clinicalNote}
                            setClinicalNote={setClinicalNote}
                            handleSaveNote={handleSaveNote}
                            rxForm={rxForm}
                            setRxForm={setRxForm}
                            handlePrescribe={handlePrescribe}
                            labForm={labForm}
                            setLabForm={setLabForm}
                            handleOrderLab={handleOrderLab}
                            setShowSemenForm={setShowSemenForm}
                            existingCaseSheet={existingCaseSheet}
                            handleViewReport={handleViewReport}
                            updateClinicalHistory={updateClinicalHistory}
                        />
                    </>
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50/30">
                        <div className="w-32 h-32 bg-white rounded-[2.5rem] flex items-center justify-center mb-6 shadow-2xl shadow-gray-200/50 animate-pulse">
                            <Stethoscope size={64} className="text-blue-500 opacity-80" />
                        </div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Doctor Workspace</h1>
                        <p className="text-gray-500 font-bold max-w-sm text-center">Select a patient from the clinical roster to begin consultation, diagnosis, and prescription management.</p>
                    </div>
                )}
            </div>

            <DoctorModals
                showSemenForm={showSemenForm}
                setShowSemenForm={setShowSemenForm}
                selectedPatient={selectedPatient}
                showConfigurator={showConfigurator}
                setShowConfigurator={setShowConfigurator}
                reportConfig={reportConfig}
                setReportConfig={setReportConfig}
                handleFinalizeReport={handleFinalizeReport}
                showReportPreview={showReportPreview}
                setShowReportPreview={setShowReportPreview}
                handlePrint={handlePrint}
                reportRef={reportRef}
                existingCaseSheet={existingCaseSheet}
                billingData={billingData}
                selectedReport={selectedReport}
                viewingReport={viewingReport}
                setViewingReport={setViewingReport}
            />
        </div>
    );
};

export default DoctorDashboard;
