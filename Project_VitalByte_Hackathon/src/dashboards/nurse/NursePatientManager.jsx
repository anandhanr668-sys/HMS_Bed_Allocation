import React, { useState, useContext, useMemo, useEffect } from 'react';
import { PatientContext, PatientStatus } from '../../context/PatientContext';
import { HospitalLayoutContext } from '../../context/HospitalLayoutContext';
import { useNotification } from '../../context/NotificationContext';
import apiClient from '../../api/apiClient';
import { evaluateRisk, allocateBed as findBedForRisk } from '../../services/lcncAllocationService';

// Extracted Components
import WardCensus from './components/WardCensus';
import NurseClinicalHeader from './components/NurseClinicalHeader';
import NurseTabs from './components/NurseTabs';
import {
    Activity, HeartPulse, Thermometer, Gauge, Search, AlertCircle,
    ChevronRight, BedDouble, Stethoscope, ListTodo, ClipboardCheck,
    Pill, MessageSquare, Clock, Plus, PenTool
} from 'lucide-react';

const VitalInput = ({ label, icon: Icon, value, onChange, unit, ...props }) => (
    <div className="relative group">
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 mb-1.5 block group-focus-within:text-blue-500 transition-colors">{label}</label>
        <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                <Icon size={16} />
            </div>
            <input
                {...props}
                value={value}
                onChange={onChange}
                autoComplete="off"
                className="block w-full pl-10 pr-12 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm group-hover:border-gray-300"
                placeholder="--"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-xs font-bold text-gray-400">{unit}</span>
            </div>
        </div>
    </div>
);


const NursePatientManager = () => {
    const { addNotification } = useNotification();
    const {
        patients,
        recordVitals,
        addNursingNote,
        updateMedicationStatus,
        updatePatientStatus
    } = useContext(PatientContext);

    // Bed & Layout Context
    const {
        allBeds,
        allocateBed,
        releaseBed,
        wardTypes,
        conditionMapping,
        getBedByPatientId,
        allocationHistory,
        medicalProtocols // INJECTED
    } = useContext(HospitalLayoutContext);


    // Sidebar States
    const [selectedPatientId, setSelectedPatientId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');

    // UI & Form States
    const [activeTab, setActiveTab] = useState('overview');
    const [vitalsForm, setVitalsForm] = useState({
        spo2: '',
        bpm: '',
        bp_systolic: '',
        bp_diastolic: '',
        temperature: '',
        respiratoryRate: ''
    });
    const [noteContent, setNoteContent] = useState('');
    const [noteCategory, setNoteCategory] = useState('General');

    // LCNC Form States
    const [vitalsForms, setVitalsForms] = useState([]);
    const [selectedVitalsForm, setSelectedVitalsForm] = useState(null);

    // Memoized Data
    const selectedPatient = useMemo(() => patients.find(p => p.patientId === selectedPatientId), [patients, selectedPatientId]);

    const activePatients = useMemo(() => {
        return patients.filter(p => {
            // Queue Enforcement: Only show patients pending vitals
            if (p.visitStatus !== 'AT_NURSE') return false;

            const matchesSearch = (p.firstName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                (p.patientId?.toLowerCase() || '').includes(searchTerm.toLowerCase());

            if (filterStatus === 'All') return matchesSearch;
            if (filterStatus === 'CRITICAL') return matchesSearch && (p.riskLevel === 'CRITICAL' || p.riskLevel === 'HIGH');
            return matchesSearch && p.status === filterStatus;
        });
    }, [patients, searchTerm, filterStatus]);

    // Fetch Custom Vitals Forms
    useEffect(() => {
        const fetchForms = async () => {
            try {
                const response = await apiClient.get('/admin/forms/role/NURSE');
                // Filter specifically for vitals or generic labels if needed
                setVitalsForms(response.data);
            } catch (err) {
                console.error('Failed to load dynamic nurse forms', err);
            }
        };
        fetchForms();
    }, []);

    // Handlers
    const handleSelectPatient = (id) => {
        setSelectedPatientId(id);
        setActiveTab('overview');
        setVitalsForm({ spo2: '', bpm: '', bp_systolic: '', bp_diastolic: '', temperature: '', respiratoryRate: '' });
        setNoteContent('');
    };

    const handleSubmitVitals = (e) => {
        e.preventDefault();
        saveVitals(vitalsForm);
    };

    const handleDynamicVitalsSubmit = (data) => {
        const mappedData = {
            spo2: data.spo2 || data.Oxygen || data.SpO2 || '',
            bpm: data.bpm || data.HeartRate || data.BPM || '',
            bp_systolic: data.bp_systolic || data.Systolic || '',
            bp_diastolic: data.bp_diastolic || data.Diastolic || '',
            temperature: data.temperature || data.Temp || '',
            respiratoryRate: data.respiratoryRate || data.RespRate || '',
            ...data
        };
        saveVitals(mappedData);
    };

    const saveVitals = (data) => {
        if (!selectedPatientId) return;

        // 1. Calculate Risk immediately using ADMIN PROTOCOLS
        const riskLevel = evaluateRisk(selectedPatient, {
            spo2: parseFloat(data.spo2),
            bpm: parseFloat(data.bpm),
            temperature: parseFloat(data.temperature),
            bp_systolic: parseFloat(data.bp_systolic)
        }, medicalProtocols);

        // 2. Interactive Safety Check
        if (data.spo2 && (data.spo2 < 70 || data.spo2 > 100)) {
            if (!confirm('SpO2 value looks abnormal. Are you sure?')) return;
        }

        // 3. Save Vitals & Risk to Context
        recordVitals(selectedPatientId, { ...data, riskLevel }); // Ensure recordVitals accepts/merges riskLevel
        addNotification(`Vitals recorded. Risk Assessment: ${riskLevel}`, riskLevel === 'CRITICAL' ? 'error' : 'success');

        // 4. AUTO-ALLOCATION LOGIC
        // Only allocate if patient doesn't have a bed OR if they are CRITICAL (Safety Net)
        const currentBed = getBedByPatientId(selectedPatientId);

        if (!currentBed) {
            // Use the service to find the best bed
            const allocationResult = findBedForRisk(
                riskLevel,
                selectedPatient.condition,
                conditionMapping,
                (wardId, bedTypeId) => {
                    // Filter beds from allBeds context
                    return allBeds.filter(b => {
                        if (b.status !== 'Available') return false;
                        if (wardId && b.wardId !== wardId && b.wardName !== wardId) return false;
                        if (bedTypeId && b.bedTypeId !== bedTypeId) return false;
                        return true;
                    });
                }
            );

            if (allocationResult.success && allocationResult.bed) {
                // Auto-Allocate
                allocateBed(
                    allocationResult.bed.bedId,
                    selectedPatient.patientId,
                    `${selectedPatient.firstName} ${selectedPatient.lastName}`,
                    'SYSTEM-AUTO'
                );

                // Update Patient Status
                updatePatientStatus(selectedPatient.patientId, 'ADMITTED', allocationResult.bed.bedId);

                addNotification(
                    `AUTO-ALLOCATION: Assigned to ${allocationResult.bed.wardName} (Bed ${allocationResult.bed.bedNumber}) based on ${riskLevel} risk.`,
                    'warning'
                );
            } else {
                if (riskLevel === 'CRITICAL' || riskLevel === 'HIGH') {
                    addNotification(`WARNING: Could not auto-allocate bed for ${riskLevel} patient! Please check Ward Capacity manually.`, 'error');
                }
            }
        }

        if ((data.spo2 && data.spo2 < 90) || (data.bpm && data.bpm > 120)) {
            addNotification('CRITICAL VITALS DETECTED: Alerting Doctor...', 'error');
        }
    };

    const handleMedicationAction = (scriptId, action) => {
        updateMedicationStatus(selectedPatientId, scriptId, action);
        addNotification(`Medication marked as ${action}`, action === 'GIVEN' ? 'success' : 'warning');
    };

    const handleAddNote = () => {
        if (!noteContent.trim()) return;
        addNursingNote(selectedPatientId, 'NURSE-CURRENT', noteContent, noteCategory);
        setNoteContent('');
        addNotification('Nursing note added to clinical record', 'success');
    };

    const getRiskBadge = (level) => {
        switch (level) {
            case 'CRITICAL': return 'bg-red-50 text-red-600 border-red-100 ring-1 ring-red-100';
            case 'HIGH': return 'bg-orange-50 text-orange-600 border-orange-100 ring-1 ring-orange-100';
            case 'MODERATE': return 'bg-amber-50 text-amber-600 border-amber-100 ring-1 ring-amber-100';
            default: return 'bg-emerald-50 text-emerald-600 border-emerald-100 ring-1 ring-emerald-100';
        }
    };

    // Bed Handlers
    const handleAllocateBed = (bedId) => {
        if (!selectedPatient) return;
        allocateBed(bedId, selectedPatient.patientId, `${selectedPatient.firstName} ${selectedPatient.lastName}`, 'NURSE');
        addNotification('Bed allocated successfully', 'success');
    }

    const handleDischargeBed = (bedId) => {
        if (!confirm("Are you sure you want to release this bed? Ensure patient discharge summary is complete.")) return;
        releaseBed(bedId, 'NURSE');
        addNotification('Bed released and marked for cleaning', 'success');
    }

    return (
        <div className="flex h-[calc(100vh-6rem)] gap-6 animate-in fade-in duration-500 font-sans">
            <WardCensus
                patients={activePatients}
                selectedPatientId={selectedPatientId}
                handleSelectPatient={handleSelectPatient}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                filterStatus={filterStatus}
                setFilterStatus={setFilterStatus}
            />

            <div className="flex-1 flex flex-col min-w-0">
                {selectedPatient ? (
                    <>
                        <NurseClinicalHeader
                            selectedPatient={selectedPatient}
                            getRiskBadge={getRiskBadge}
                            currentBed={getBedByPatientId(selectedPatient.patientId)}
                        />
                        <NurseTabs
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                            selectedPatient={selectedPatient}
                            vitalsForms={vitalsForms}
                            selectedVitalsForm={selectedVitalsForm}
                            setSelectedVitalsForm={setSelectedVitalsForm}
                            handleDynamicVitalsSubmit={handleDynamicVitalsSubmit}
                            handleSubmitVitals={handleSubmitVitals}
                            vitalsForm={vitalsForm}
                            setVitalsForm={setVitalsForm}
                            VitalInput={VitalInput}
                            handleMedicationAction={handleMedicationAction}
                            noteContent={noteContent}
                            setNoteContent={setNoteContent}
                            noteCategory={noteCategory}
                            setNoteCategory={setNoteCategory}
                            handleAddNote={handleAddNote}

                            // Bed Props
                            allBeds={allBeds}
                            wardTypes={wardTypes}
                            conditionMapping={conditionMapping}
                            currentBed={getBedByPatientId(selectedPatient.patientId)}
                            onAllocateBed={handleAllocateBed}
                            onReleaseBed={handleDischargeBed}
                            allocationHistory={allocationHistory.filter(h => h.patientId === selectedPatient.patientId)}
                        />
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100">
                        <div className="w-24 h-24 bg-blue-50 text-blue-500 rounded-3xl flex items-center justify-center mb-6 animate-bounce">
                            <Stethoscope size={48} />
                        </div>
                        <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Nurse Care Point</h2>
                        <p className="text-gray-500 font-medium text-center max-w-sm">Select a patient from the ward census to view clinical alerts, manage medications, and record real-time vitals.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NursePatientManager;
