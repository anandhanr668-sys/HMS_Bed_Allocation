import React, { createContext, useState, useCallback, useEffect, useContext } from 'react';
import { PatientContext } from './PatientContext';

export const FrontDeskContext = createContext();

export const FrontDeskProvider = ({ children }) => {
    const { patients, registerPatient } = useContext(PatientContext);

    // State for Appointments
    const [appointments, setAppointments] = useState(() => {
        try {
            const saved = localStorage.getItem('hospital_appointments');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error("Failed to parse appointments", e);
            return [];
        }
    });

    // State for Queue
    const [queue, setQueue] = useState(() => {
        try {
            const saved = localStorage.getItem('hospital_queue');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error("Failed to parse queue", e);
            return [];
        }
    });

    // State for Billing
    const [transactions, setTransactions] = useState(() => {
        try {
            const saved = localStorage.getItem('hospital_transactions');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error("Failed to parse transactions", e);
            return [];
        }
    });

    // State for Audit Logs
    const [auditLogs, setAuditLogs] = useState(() => {
        try {
            const saved = localStorage.getItem('hospital_audit_logs');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error("Failed to parse audit logs", e);
            return [];
        }
    });

    // Persist data
    useEffect(() => {
        localStorage.setItem('hospital_appointments', JSON.stringify(appointments));
    }, [appointments]);

    useEffect(() => {
        localStorage.setItem('hospital_queue', JSON.stringify(queue));
    }, [queue]);

    useEffect(() => {
        localStorage.setItem('hospital_transactions', JSON.stringify(transactions));
    }, [transactions]);

    useEffect(() => {
        localStorage.setItem('hospital_audit_logs', JSON.stringify(auditLogs));
    }, [auditLogs]);

    // Audit logger
    const logAction = useCallback((action, details, user = 'FrontDesk_Exec') => {
        const log = {
            id: `LOG-${Date.now()}`,
            timestamp: new Date().toISOString(),
            user,
            action,
            details
        };
        setAuditLogs(prev => [log, ...prev].slice(0, 500)); // Keep last 500 logs
    }, []);

    // Appointment Booking
    const bookAppointment = useCallback((appointmentData) => {
        const newAppt = {
            id: `APT-${Date.now()}`,
            ...appointmentData,
            status: 'Scheduled',
            createdAt: new Date().toISOString()
        };
        setAppointments(prev => [...prev, newAppt]);
        logAction('APPOINTMENT_BOOKED', `Booked appointment for ${appointmentData.patientName} with ${appointmentData.doctorName}`);

        // Mock Notification
        console.log(`[SMS/WhatsApp] Notification sent to ${appointmentData.contact}: Your appointment with ${appointmentData.doctorName} is confirmed for ${appointmentData.date} at ${appointmentData.time}.`);

        return newAppt;
    }, [logAction]);

    // Queue Management
    const addToQueue = useCallback((patientId, patientName, priority = 'Normal', type = 'Consultation') => {
        const tokenNumber = queue.length + 101; // Start tokens from 101
        const queueItem = {
            id: `Q-${Date.now()}`,
            patientId,
            patientName,
            tokenNumber,
            priority, // Normal, Emergency
            type, // Consultation, Vitals, Billing
            status: 'Waiting',
            joinedAt: new Date().toISOString()
        };

        if (priority === 'Emergency') {
            setQueue(prev => [queueItem, ...prev]);
        } else {
            setQueue(prev => [...prev, queueItem]);
        }

        logAction('QUEUE_ADD', `Added ${patientName} to queue with token #${tokenNumber} (Priority: ${priority})`);
        return queueItem;
    }, [queue.length, logAction]);

    const updateQueueStatus = useCallback((queueId, status) => {
        setQueue(prev => prev.map(item =>
            item.id === queueId ? { ...item, status } : item
        ));
        logAction('QUEUE_UPDATE', `Updated queue item ${queueId} status to ${status}`);
    }, [logAction]);

    // Billing
    const createTransaction = useCallback((patientId, amount, type, description) => {
        const transaction = {
            id: `TXN-${Date.now()}`,
            patientId,
            amount,
            type, // Registration, Consultation, Emergency
            description,
            status: 'Paid',
            timestamp: new Date().toISOString()
        };
        setTransactions(prev => [...prev, transaction]);
        logAction('BILLING_PAID', `Recorded payment of ${amount} from patient ${patientId} for ${type}`);
        return transaction;
    }, [logAction]);

    // Emergency Quick Registration
    const emergencyRegister = useCallback(async (data) => {
        const patient = await registerPatient({
            ...data,
            condition: data.condition || 'Emergency',
            riskLevel: 'CRITICAL',
            isEmergency: true
        });

        // Auto-add to queue with high priority
        addToQueue(patient.patientId, `${patient.firstName} ${patient.lastName}`, 'Emergency', 'Triage');

        logAction('EMERGENCY_REG', `Emergency registration for ${patient.firstName} ${patient.lastName}`);
        return patient;
    }, [registerPatient, addToQueue, logAction]);

    const value = {
        appointments,
        queue,
        transactions,
        auditLogs,
        bookAppointment,
        addToQueue,
        updateQueueStatus,
        createTransaction,
        emergencyRegister,
        logAction
    };

    return (
        <FrontDeskContext.Provider value={value}>
            {children}
        </FrontDeskContext.Provider>
    );
};
