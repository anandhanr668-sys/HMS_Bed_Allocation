import React, { createContext, useState, useCallback, useEffect } from 'react';
import apiClient from '../api/apiClient';

export const HospitalLayoutContext = createContext();

export const HospitalLayoutProvider = ({ children }) => {
  // Ward Types with their Bed Types
  const [wardTypes, setWardTypes] = useState([
    {
      id: 'OPD',
      name: 'OPD',
      description: 'Out Patient Department',
      bedTypes: [
        { id: 'opd_bed', name: 'OPD Observation Bed', totalBeds: 10, availableBeds: 10 }
      ]
    },
    {
      id: 'GENERAL',
      name: 'General Ward',
      description: 'General Ward for normal patients',
      bedTypes: [
        { id: 'general_bed', name: 'General Bed', totalBeds: 20, availableBeds: 20 }
      ]
    },
    {
      id: 'EMERGENCY',
      name: 'Emergency',
      description: 'Emergency Ward',
      bedTypes: [
        { id: 'first_aid_bed', name: 'First Aid / Trauma Bed', totalBeds: 8, availableBeds: 8 },
        { id: 'ventilator_bed', name: 'Ventilator Bed', totalBeds: 4, availableBeds: 4 }
      ]
    },
    {
      id: 'ICU',
      name: 'ICU',
      description: 'Intensive Care Unit',
      bedTypes: [
        { id: 'icu_bed', name: 'ICU Bed', totalBeds: 6, availableBeds: 6 }
      ]
    }
  ]);

  // Condition to Bed Mapping
  const [conditionMapping, setConditionMapping] = useState([
    {
      id: 'accident',
      condition: 'Accident',
      riskLevel: 'HIGH',
      ward: 'EMERGENCY',
      bedType: 'first_aid_bed'
    },
    {
      id: 'fever',
      condition: 'Fever',
      riskLevel: 'LOW',
      ward: 'GENERAL',
      bedType: 'general_bed'
    },
    {
      id: 'stomach_pain',
      condition: 'Stomach Pain',
      riskLevel: 'LOW',
      ward: 'OPD',
      bedType: 'opd_bed'
    },
    {
      id: 'chest_pain',
      condition: 'Chest Pain',
      riskLevel: 'HIGH',
      ward: 'EMERGENCY',
      bedType: 'first_aid_bed'
    },
    {
      id: 'surgery',
      condition: 'Surgery',
      riskLevel: 'HIGH',
      ward: 'ICU',
      bedType: 'icu_bed'
    },
    {
      id: 'critical',
      condition: 'Critical',
      riskLevel: 'HIGH',
      ward: 'EMERGENCY',
      bedType: 'ventilator_bed'
    }
  ]);

  // Medical Protocols (Admin Configured)
  const [medicalProtocols, setMedicalProtocols] = useState(() => {
    try {
      const saved = localStorage.getItem('protocol_rules');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const updateMedicalProtocols = useCallback((newProtocols) => {
    setMedicalProtocols(newProtocols);
    localStorage.setItem('protocol_rules', JSON.stringify(newProtocols));
  }, []);

  // All beds in the hospital (persisted)
  const [allBeds, setAllBeds] = useState(() => {
    try {
      const saved = localStorage.getItem('allBeds');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore and initialize fresh
    }
    return initializeBeds(wardTypes);
  });

  // Allocation History (Audit Trail)
  const [allocationHistory, setAllocationHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('bedAllocationHistory');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  // Persist allBeds, history and keep wardTypes.availableBeds in sync
  useEffect(() => {
    try {
      localStorage.setItem('allBeds', JSON.stringify(allBeds));
      localStorage.setItem('bedAllocationHistory', JSON.stringify(allocationHistory));
    } catch (e) {
      // ignore storage errors
    }

    // Recompute availableBeds counts from allBeds
    setWardTypes(prevWards => prevWards.map(w => ({
      ...w,
      bedTypes: w.bedTypes.map(bt => ({
        ...bt,
        availableBeds: allBeds.filter(b => b.wardId === w.id && b.bedTypeId === bt.id && b.status === 'Available').length
      }))
    })));
  }, [allBeds, allocationHistory]);

  // Reconcile persisted bed assignments with persisted patients on startup
  useEffect(() => {
    try {
      const savedPatients = localStorage.getItem('patients');
      if (!savedPatients) return;
      const parsed = JSON.parse(savedPatients);
      const patientIds = new Set(parsed.map(p => p.patientId));

      setAllBeds(beds => {
        let changed = false;
        const newBeds = beds.map(b => {
          if (b.assignedPatientId && !patientIds.has(b.assignedPatientId)) {
            changed = true;
            return { ...b, status: 'Available', assignedPatientId: null, assignedPatientName: null, lastUpdated: new Date().toISOString() };
          }
          return b;
        });
        return newBeds;
      });
    } catch (e) {
      // ignore parse errors
    }
  }, []);

  // Fetch beds from database on mount
  useEffect(() => {
    const fetchBedsFromDB = async () => {
      try {
        const response = await apiClient.get('/admin/beds');
        const dbBeds = response.data;

        // Transform DB beds to frontend format
        const transformedBeds = dbBeds.map((bed, index) => ({
          bedId: bed.bed_id_str || bed.bed_id || bed.bedId || `BED-${bed.id}`,
          bedNumber: bed.bed_number || bed.bedNumber || index + 1,
          wardId: bed.ward_id || bed.wardId || bed.ward_name,
          wardName: bed.ward_name || bed.wardName || 'Unknown Ward',
          bedTypeId: bed.bed_type_id || bed.bedTypeId || 'general',
          bedTypeName: bed.bed_type_name || bed.bedTypeName || 'General Bed',
          status: bed.status || 'Available', // Available, Occupied, Cleaning, Maintenance
          assignedPatientId: bed.patient_id || bed.assigned_patient_id || bed.assignedPatientId || null,
          assignedPatientName: bed.first_name ? `${bed.first_name} ${bed.last_name}` : (bed.assigned_patient_name || bed.assignedPatientName || null),
          lastUpdated: bed.last_updated || bed.lastUpdated || new Date().toISOString()
        }));

        setAllBeds(transformedBeds);
        console.log(`HospitalLayoutContext: Loaded ${transformedBeds.length} beds from database`);
      } catch (err) {
        console.error('Failed to fetch beds from database:', err);
        // Keep the existing beds (from localStorage or initialization)
      }
    };

    fetchBedsFromDB();
  }, []);

  function initializeBeds(wards) {
    const beds = [];
    let bedCounter = 1;
    wards.forEach(ward => {
      ward.bedTypes.forEach(bedType => {
        for (let i = 0; i < bedType.totalBeds; i++) {
          beds.push({
            bedId: `${ward.id}-${bedType.id}-${i + 1}`,
            bedNumber: bedCounter++,
            wardId: ward.id,
            wardName: ward.name,
            bedTypeId: bedType.id,
            bedTypeName: bedType.name,
            status: 'Available', // Available, Occupied, Cleaning, Maintenance
            assignedPatientId: null,
            assignedPatientName: null,
            lastUpdated: new Date().toISOString()
          });
        }
      });
    });
    return beds;
  }

  const updateBedLayout = useCallback((newWards) => {
    setWardTypes(newWards);
    setAllBeds(initializeBeds(newWards));
  }, []);

  const updateConditionMapping = useCallback((newMapping) => {
    setConditionMapping(newMapping);
  }, []);

  const getAvailableBeds = useCallback((wardId, bedTypeId) => {
    return allBeds.filter(bed => {
      if (bed.status !== 'Available') return false;
      if (wardId && bed.wardId !== wardId) return false;
      if (bedTypeId && bed.bedTypeId !== bedTypeId) return false;
      return true;
    });
  }, [allBeds]);

  // CORE WORKFLOW: Allocate Bed (Admit or Transfer)
  const allocateBed = useCallback((bedId, patientId, patientName, actorId = 'SYSTEM') => {
    setAllBeds(beds => {
      // Check if patient already has a bed (Transfer Scenario)
      const currentBed = beds.find(b => b.assignedPatientId === patientId);

      let newBeds = [...beds];

      // If transferring, free the old bed first
      if (currentBed && currentBed.bedId !== bedId) {
        newBeds = newBeds.map(b =>
          b.bedId === currentBed.bedId
            ? { ...b, status: 'Cleaning', assignedPatientId: null, assignedPatientName: null, lastUpdated: new Date().toISOString() }
            : b
        );

        // Log Transfer Out
        addToHistory({
          patientId,
          bedId: currentBed.bedId,
          action: 'TRANSFER_OUT',
          actorId,
          details: `Transferred to ${bedId}`
        });
      }

      // Allocate new bed
      newBeds = newBeds.map(bed =>
        bed.bedId === bedId
          ? { ...bed, status: 'Occupied', assignedPatientId: patientId, assignedPatientName: patientName, lastUpdated: new Date().toISOString() }
          : bed
      );

      // Log Allocation
      addToHistory({
        patientId,
        bedId,
        action: currentBed ? 'TRANSFER_IN' : 'ADMIT',
        actorId,
        details: currentBed ? `Transferred from ${currentBed.bedId}` : 'New Admission'
      });

      return newBeds;
    });

    // Persist to Database (Async)
    try {
      // We only update the NEW bed status. 
      // If there was a transfer, we logically should also update the OLD bed.
      // However, strictly sticking to allocating the *target* bed for this operation context.
      // Ideally, the backend handle transfer logic, but here we are doing it client-side.

      // Update Target Bed
      apiClient.put(`/admin/beds/${bedId}`, {
        status: 'Occupied',
        assigned_patient_id: patientId,
        assigned_patient_name: patientName
      }).catch(err => console.error("Failed to sync bed allocation to DB", err));

      // If it was a transfer, update the OLD bed to 'Cleaning' in DB
      if (currentBed && currentBed.bedId !== bedId) {
        apiClient.put(`/admin/beds/${currentBed.bedId}`, {
          status: 'Cleaning',
          assigned_patient_id: null,
          assigned_patient_name: null
        }).catch(err => console.error("Failed to sync transfer release to DB", err));
      }

    } catch (e) {
      console.error(e);
    }

  }, [allBeds]); // Dependency on allBeds needed? No, purely async side effect.

  const releaseBed = useCallback((bedId, actorId = 'SYSTEM') => {
    setAllBeds(beds => {
      const bed = beds.find(b => b.bedId === bedId);
      if (bed && bed.assignedPatientId) {
        addToHistory({
          patientId: bed.assignedPatientId,
          bedId: bed.bedId,
          action: 'DISCHARGE',
          actorId,
          details: 'Patient Discharged'
        });
      }

      const newBeds = beds.map(b =>
        b.bedId === bedId
          ? { ...b, status: 'Cleaning', assignedPatientId: null, assignedPatientName: null, lastUpdated: new Date().toISOString() }
          : b
      );
      return newBeds;
    });

    // Sync to DB
    apiClient.put(`/admin/beds/${bedId}`, {
      status: 'Cleaning',
      assigned_patient_id: null,
      assigned_patient_name: null
    }).catch(err => console.error("Failed to sync bed release to DB", err));
  }, []);

  const markBedClean = useCallback((bedId, actorId = 'SYSTEM') => {
    setAllBeds(beds => beds.map(b =>
      b.bedId === bedId ? { ...b, status: 'Available', lastUpdated: new Date().toISOString() } : b
    ));

    addToHistory({
      bedId,
      action: 'CLEANED',
      actorId,
      details: 'Bed marked ready'
    });

    // Sync to DB
    apiClient.put(`/admin/beds/${bedId}`, {
      status: 'Available'
    }).catch(err => console.error("Failed to sync cleaning status to DB", err));
  }, []);

  const addToHistory = (entry) => {
    setAllocationHistory(prev => [{
      id: `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      ...entry
    }, ...prev]);
  };

  const getBedByPatientId = useCallback((patientId) => {
    return allBeds.find(bed => bed.assignedPatientId === patientId);
  }, [allBeds]);

  const getConditionMapping = useCallback((condition) => {
    return conditionMapping.find(cm => cm.condition?.toLowerCase() === condition?.toLowerCase());
  }, [conditionMapping]);

  const value = {
    wardTypes,
    conditionMapping,
    medicalProtocols, // Admin Configured Protocols
    updateMedicalProtocols, // ACTION to update protocols
    allBeds,
    allocationHistory,
    updateBedLayout,
    updateConditionMapping,
    getAvailableBeds,
    allocateBed,
    releaseBed,
    markBedClean,
    deallocateBedFromContext: releaseBed, // Alias
    getBedByPatientId,
    getConditionMapping,
    getBedStats: () => {
      // Calculate total capacity from CONFIG (wardTypes) not just existent DB rows
      const configuredCapacity = wardTypes.reduce((acc, ward) =>
        acc + ward.bedTypes.reduce((sum, bt) => sum + (parseInt(bt.totalBeds) || 0), 0)
        , 0);

      const occupied = allBeds.filter(b => b.status === 'Occupied').length;
      const maintenance = allBeds.filter(b => b.status === 'Maintenance' || b.status === 'Cleaning').length;

      return {
        totalBeds: configuredCapacity,
        occupiedBeds: occupied,
        availableBeds: Math.max(0, configuredCapacity - occupied - maintenance)
      };
    }
  };

  return (
    <HospitalLayoutContext.Provider value={value}>
      {children}
    </HospitalLayoutContext.Provider>
  );
};
