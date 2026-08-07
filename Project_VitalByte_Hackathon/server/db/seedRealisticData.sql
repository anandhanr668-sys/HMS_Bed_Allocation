-- Seed Dynamic Data for Admin Dashboard Testing
-- Correcting Database for live visual testing
-- 1. Ensure Wards exist for the Bed Monitor
INSERT INTO hospital_config (config_key, config_value, description)
VALUES (
        'WARD_LIST',
        '["ICU", "General Ward", "Emergency", "IPD First Floor"]',
        'List of active hospital wards'
    ) ON CONFLICT (config_key) DO
UPDATE
SET config_value = EXCLUDED.config_value;
-- 2. Clean and Insert Data
TRUNCATE TABLE patients CASCADE;
TRUNCATE TABLE visits CASCADE;
TRUNCATE TABLE beds CASCADE;
INSERT INTO beds (
        bed_id_str,
        ward_name,
        type,
        status,
        floor_number
    )
VALUES ('ICU-01', 'ICU', 'CRITICAL_CARE', 'OCCUPIED', 1),
    ('ICU-02', 'ICU', 'CRITICAL_CARE', 'AVAILABLE', 1),
    (
        'GW-101',
        'General Ward',
        'STANDARD',
        'OCCUPIED',
        2
    ),
    (
        'GW-102',
        'General Ward',
        'STANDARD',
        'OCCUPIED',
        2
    ),
    (
        'GW-103',
        'General Ward',
        'STANDARD',
        'AVAILABLE',
        2
    ),
    ('ER-01', 'Emergency', 'TRAUMA', 'OCCUPIED', 0),
    (
        'IPD-201',
        'IPD First Floor',
        'DELUXE',
        'AVAILABLE',
        3
    );
-- 3. Insert Patients across different timeframes
INSERT INTO patients (
        patient_id_str,
        first_name,
        last_name,
        age,
        gender,
        contact,
        registered_at,
        status,
        risk_level
    )
VALUES (
        'P-TODAY-01',
        'John',
        'Doe',
        34,
        'Male',
        '9876543210',
        CURRENT_TIMESTAMP,
        'ADMITTED',
        'MEDIUM'
    ),
    (
        'P-TODAY-02',
        'Jane',
        'Smith',
        28,
        'Female',
        '9876543211',
        CURRENT_TIMESTAMP - INTERVAL '2 hours',
        'ADMITTED',
        'HIGH'
    ),
    (
        'P-YEST-01',
        'Alice',
        'Brown',
        45,
        'Female',
        '9876543212',
        CURRENT_TIMESTAMP - INTERVAL '1 day',
        'DISCHARGED',
        'LOW'
    ),
    (
        'P-LW-01',
        'Bob',
        'Wilson',
        60,
        'Male',
        '9876543213',
        CURRENT_TIMESTAMP - INTERVAL '4 days',
        'ADMITTED',
        'CRITICAL'
    ),
    (
        'P-LW-02',
        'Charlie',
        'Davis',
        19,
        'Male',
        '9876543214',
        CURRENT_TIMESTAMP - INTERVAL '6 days',
        'DISCHARGED',
        'LOW'
    );
-- 4. Insert Visits to match the patient registered times
-- Using patient_id_str directly since visits.patient_id references patients.patient_id_str
INSERT INTO visits (
        visit_id,
        patient_id,
        visit_type,
        check_in_time,
        status
    )
VALUES (
        gen_random_uuid(),
        'P-TODAY-01',
        'OPD',
        CURRENT_TIMESTAMP - INTERVAL '1 hour',
        'ACTIVE'
    ),
    (
        gen_random_uuid(),
        'P-TODAY-02',
        'EMERGENCY',
        CURRENT_TIMESTAMP - INTERVAL '3 hours',
        'ACTIVE'
    ),
    (
        gen_random_uuid(),
        'P-YEST-01',
        'OPD',
        CURRENT_TIMESTAMP - INTERVAL '24 hours',
        'CLOSED'
    ),
    (
        gen_random_uuid(),
        'P-LW-01',
        'IPD',
        CURRENT_TIMESTAMP - INTERVAL '4 days',
        'ACTIVE'
    );
-- 5. Trigger some high-risk alerts for the dashboard
INSERT INTO protocol_executions (alert_level, resolution_status, executed_at)
VALUES (
        'CRITICAL',
        'PENDING',
        CURRENT_TIMESTAMP - INTERVAL '10 minutes'
    ),
    (
        'HIGH',
        'PENDING',
        CURRENT_TIMESTAMP - INTERVAL '1 hour'
    ),
    (
        'MEDIUM',
        'PENDING',
        CURRENT_TIMESTAMP - INTERVAL '2 days'
    );
-- 6. Add some mock audit logs for the "Recent Activity" sidebar
INSERT INTO audit_logs (action, module, details, timestamp)
VALUES (
        'ADMIT_PATIENT',
        'FRONT_DESK',
        '{"patient": "John Doe"}',
        CURRENT_TIMESTAMP - INTERVAL '5 minutes'
    ),
    (
        'BED_ASSIGNMENT',
        'WARD',
        '{"bed": "ICU-01"}',
        CURRENT_TIMESTAMP - INTERVAL '15 minutes'
    ),
    (
        'UPDATE_VITALS',
        'NURSE',
        '{"vitals": "BP: 120/80"}',
        CURRENT_TIMESTAMP - INTERVAL '30 minutes'
    ),
    (
        'LAB_ORDER',
        'DOCTOR',
        '{"test": "CBC"}',
        CURRENT_TIMESTAMP - INTERVAL '4 hours'
    ),
    (
        'STAFF_CREATED',
        'ADMIN',
        '{"user": "dr_smith"}',
        CURRENT_TIMESTAMP - INTERVAL '1 day'
    );