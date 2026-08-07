import React, { createContext, useState, useCallback, useEffect } from 'react';
import apiClient from '../api/apiClient';
import { evaluateRisk } from '../services/lcncAllocationService';
import { useAuth } from './AuthContext';

export const PatientContext = createContext();

export const PatientStatus = {
  REGISTERED: 'REGISTERED',
  VITALS_PENDING: 'VITALS_PENDING',
  VITALS_RECORDED: 'VITALS_RECORDED',
  RISK_EVALUATED: 'RISK_EVALUATED',
  ADMITTED: 'ADMITTED',
  UNDER_TREATMENT: 'UNDER_TREATMENT',
  DISCHARGED: 'DISCHARGED'
};

export const PatientProvider = ({ children }) => {
  const auth = useAuth();
  const user = auth?.user;

  // Debugging: Warn if auth is missing (should not happen if wrapped correctly)
  useEffect(() => {
    if (!auth) console.warn("PatientProvider: AuthContext is missing! Make sure AuthProvider wraps App.");
  }, [auth]);

  const [patients, setPatients] = useState([]);
  const [patientVitals, setPatientVitals] = useState({});
  const [loading, setLoading] = useState(true);

  // Helper to map DB snake_case to Frontend camelCase
  // UPDATED: Carefully validated against typical tabular data issues
  const mapPatientData = (p) => {
    // Determine the Contact Number - support multiple potential keys
    const contactNum = p.contact_number || p.contactNumber || p.contact || p.phone || 'No Contact';

    // Determine DOB - Support date_of_birth, dob, dateOfBirth
    // Also handle potential date formatting if it comes as a timestamp
    const dobRaw = p.date_of_birth || p.dob || p.dateOfBirth;
    let dob = 'N/A';
    if (dobRaw) {
      try {
        // Check if it's already a clean string or needs new Date()
        dob = new Date(dobRaw).toISOString().split('T')[0];
      } catch (e) {
        dob = dobRaw; // Fallback to raw if date parse fails
      }
    }

    return {
      ...p,
      firstName: (p.first_name || p.firstName || 'Anonymous').trim(),
      lastName: (p.last_name || p.lastName || 'Patient').trim(),
      patientId: p.patient_id_str || p.patientId, // Ensure string ID is prioritized
      age: p.age || 'N/A', // Calculated age often useful
      gender: p.gender || 'Unknown',
      contactNumber: contactNum, // Standardized key for Frontend
      dateOfBirth: dob,
      bloodType: p.blood_type || p.bloodType || 'N/A', // Standardized key
      status: p.status || 'REGISTERED',
      riskLevel: p.risk_level || p.riskLevel,
      allocatedBedId: p.allocated_bed_id || p.allocatedBedId,
      registeredAt: p.registered_at || p.registeredAt,
      visitStatus: p.visit_status || p.visitStatus,
      visitId: p.visit_id || p.visitId,
      // Initialize arrays that components expect
      nursingNotes: p.nursingNotes || [],
      prescriptions: p.prescriptions || [],
      investigations: p.investigations || [],
      vitals: p.vitals || null,
      condition: p.condition || 'Not Specified',
      symptoms: p.symptoms || '',
      // Treatment History mapping from doctor_notes or history table
      clinicalHistory: (p.clinicalHistory || p.treatmentHistory || []).map(h => ({
        id: h.note_id || h.id,
        type: h.note_type || h.type,
        description: h.description || h.summary || h.note || 'Clinical Event',
        date: h.timestamp || h.date || new Date().toISOString()
      })),
      // Consultation Notes mapping
      consultationNotes: (p.consultationNotes || []).map(n => ({
        id: n.id,
        doctorName: n.doctor_name || n.doctorName || 'Doctor',
        note: n.note,
        date: n.timestamp || n.date
      }))
    };
  };

  // 1. Fetch patients from PostgreSQL on init
  const refreshPatients = useCallback(async () => {
    try {
      setLoading(true);
      console.log("PatientContext: Refreshing patients...");

      const response = await apiClient.get('/patients');

      // Support both direct array response and wrapped response { patients: [] }
      const rawData = response.data?.patients || (Array.isArray(response.data) ? response.data : []);

      console.log(`PatientContext: Received ${rawData.length} raw records`);

      // Transform incoming DB data to application model with individual safety
      const mappedPatients = rawData.map(p => {
        try {
          return mapPatientData(p);
        } catch (e) {
          console.error("Mapping failed for patient record:", p, e);
          // Return a minimal valid object instead of crashing the whole list
          return {
            patientId: p.patient_id_str || p.patientId || 'ERR-' + Math.random(),
            firstName: 'Data',
            lastName: 'Error',
            status: 'ERROR',
            clinicalHistory: [],
            consultationNotes: []
          };
        }
      });

      setPatients(mappedPatients);
      console.log(`PatientContext: Successfully mapped ${mappedPatients.length} patients`);
    } catch (err) {
      console.error('CRITICAL: Failed to fetch patients from DB', err);
      // If it's a 401/403, we might want to preserve last known patients if any
      // but for now we follow existing pattern of empty array
      setPatients([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Sync with user auth - fetch only when logged in
  useEffect(() => {
    if (user) {
      refreshPatients();
    }
  }, [user, refreshPatients]);

  const registerPatient = useCallback(async (patientData) => {
    try {
      // Ensure backend receives snake_case or expected keys if standardizing
      const payload = {
        firstName: patientData.firstName,
        lastName: patientData.lastName,
        age: patientData.age,
        gender: patientData.gender,
        contact: patientData.contact || patientData.contactNumber, // Map to backend 'contact' key
        riskLevel: patientData.riskLevel,
        email: patientData.email,
        dateOfBirth: patientData.dateOfBirth,
        bloodType: patientData.bloodType,
        condition: patientData.condition,
        symptoms: patientData.symptoms,
        address: patientData.address
      };

      const response = await apiClient.post('/patients', payload);
      const newPatientRaw = response.data;
      const newPatient = mapPatientData(newPatientRaw);

      setPatients(prev => [newPatient, ...prev]);
      return newPatient;
    } catch (err) {
      console.error('Registration failed:', err);
      throw err;
    }
  }, []);

  const updateClinicalHistory = useCallback(async (patientId, entry) => {
    try {
      const response = await apiClient.post(`/doctor/patients/${patientId}/history`, entry);
      const newNote = response.data;

      // Opt-in refresh or local update
      setPatients(prev => prev.map(p => {
        if (p.patientId === patientId || p.patient_id_str === patientId) {
          const newHistoryItem = {
            id: newNote.note_id || Date.now(),
            description: newNote.chief_complaint || entry.description,
            date: newNote.timestamp || new Date().toISOString()
          };
          return {
            ...p,
            clinicalHistory: [newHistoryItem, ...(p.clinicalHistory || [])]
          };
        }
        return p;
      }));

      return true;
    } catch (err) {
      console.error('Failed to update clinical history:', err);
      throw err;
    }
  }, []);

  const recordVitals = useCallback(async (patientId, vitals) => {
    try {
      // 1. Optimistic UI Update
      setPatientVitals(prev => ({
        ...prev,
        [patientId]: {
          ...vitals,
          timestamp: new Date().toISOString()
        }
      }));

      // 2. Persist to Backend (Vitals + Risk)
      // 2. Persist to Backend (Vitals + Risk)
      const payload = {
        ...vitals,
        respiratory_rate: vitals.respiratory_rate || vitals.respiratoryRate, // Fix key for backend logic
        riskLevel: vitals.riskLevel,
        visitId: (patients.find(p => p.patientId === patientId)?.visitId) || null,
        patientId // Ensure patientId is passed
      };

      // Use visit workflow endpoint if visitId exists, otherwise fallback to patient update
      if (payload.visitId) {
        await apiClient.post(`/visits/vitals`, payload);
      } else {
        await apiClient.post(`/patients/${patientId}/vitals`, payload);
      }

      setPatients(prev =>
        prev.map(p => {
          if (p.patientId === patientId || p.patient_id_str === patientId) {
            // Use provided riskLevel (from Nurse Dash with Protocols) or falback to default service
            const riskLevel = vitals.riskLevel || evaluateRisk(p, vitals);
            // Optimistically update status to likely next state
            return {
              ...p,
              vitals: { ...vitals, timestamp: new Date().toISOString() },
              riskLevel,
              visitStatus: 'WAITING_DOCTOR'
            };
          }
          return p;
        })
      );
    } catch (err) {
      console.error('Failed to record vitals:', err);
    }
  }, []);

  const prescribeMedication = useCallback(async (patientId, medication) => {
    setPatients(prev =>
      prev.map(p =>
        (p.patientId === patientId || p.patient_id_str === patientId)
          ? {
            ...p,
            prescriptions: [
              ...(p.prescriptions || []),
              {
                id: `RX-${Date.now()}`,
                status: 'PENDING',
                timestamp: new Date().toISOString(),
                ...medication
              }
            ]
          }
          : p
      )
    );
  }, []);

  const orderInvestigation = useCallback(async (patientId, investigation) => {
    try {
      const payload = {
        patientId: patientId,
        testCode: investigation.testCode || investigation.testName?.toUpperCase().replace(/ /g, '_') || 'GENERAL',
        priority: (investigation.urgency || investigation.priority || 'ROUTINE').split(' ')[0].toUpperCase(),
        notes: investigation.notes || `Ordered by ${investigation.orderedBy || 'Doctor'}`
      };
      await apiClient.post('/lab/orders', payload);
      await refreshPatients();
      return true;
    } catch (err) {
      console.error('Failed to order investigation:', err);
      return false;
    }
  }, [refreshPatients]);

  const updatePatientStatus = useCallback(async (patientId, newStatus, allocatedBedId) => {
    try {
      // Optimistic Update
      setPatients(prev =>
        prev.map(p =>
          (p.patientId === patientId || p.patient_id_str === patientId)
            ? { ...p, status: newStatus, allocated_bed_id: allocatedBedId || p.allocated_bed_id }
            : p
        )
      );

      await apiClient.put(`/patients/${patientId}/status`, { status: newStatus, allocatedBedId });
    } catch (err) {
      console.error('Status update failed', err);
    }
  }, []);

  const allocateBedToPatient = useCallback(async (patientId, bedId) => {
    setPatients(prev =>
      prev.map(p =>
        (p.patientId === patientId || p.patient_id_str === patientId)
          ? { ...p, allocated_bed_id: bedId, status: PatientStatus.ADMITTED }
          : p
      )
    );
  }, []);

  const deallocateBed = useCallback(async (patientId) => {
    setPatients(prev =>
      prev.map(p =>
        (p.patientId === patientId || p.patient_id_str === patientId)
          ? { ...p, allocated_bed_id: null, status: PatientStatus.DISCHARGED }
          : p
      )
    );
  }, []);

  const addConsultationNote = useCallback(async (patientId, doctorId, note) => {
    setPatients(prev =>
      prev.map(p =>
        (p.patientId === patientId || p.patient_id_str === patientId)
          ? {
            ...p,
            consultationNotes: [
              ...(p.consultationNotes || []),
              {
                id: `CONS-${Date.now()}`,
                doctorId,
                doctorName: 'Dr. Current User', // Placeholder if full user obj not avail
                note,
                date: new Date().toISOString()
              }
            ]
          }
          : p
      )
    );
  }, []);

  const addNursingNote = useCallback(async (patientId, nurseId, note, category = 'General') => {
    setPatients(prev =>
      prev.map(p =>
        (p.patientId === patientId || p.patient_id_str === patientId)
          ? {
            ...p,
            nursingNotes: [
              ...(p.nursingNotes || []),
              {
                id: `NURSE-${Date.now()}`,
                nurseId,
                note,
                category,
                timestamp: new Date().toISOString()
              }
            ]
          }
          : p
      )
    );
  }, []);

  const updateMedicationStatus = useCallback(async (patientId, scriptId, status) => {
    setPatients(prev =>
      prev.map(p =>
        (p.patientId === patientId || p.patient_id_str === patientId)
          ? {
            ...p,
            prescriptions: (p.prescriptions || []).map(script =>
              script.id === scriptId ? { ...script, status } : script
            )
          }
          : p
      )
    );
  }, []);

  const value = {
    patients,
    patientVitals,
    loading,
    refreshPatients,
    registerPatient,
    updatePatientStatus,
    updateClinicalHistory,
    allocateBedToPatient,
    deallocateBed,
    recordVitals,
    addConsultationNote,
    addNursingNote,
    updateMedicationStatus,
    prescribeMedication,
    orderInvestigation,
    dischargePatient: deallocateBed,
    getAllPatients: () => patients,
    getPatientVitals: (id) => patientVitals[id] || null,
    getPatient: (id) => patients.find(p => p.patientId === id || p.patient_id_str === id),
  };

  return (
    <PatientContext.Provider value={value}>
      {children}
    </PatientContext.Provider>
  );
};
