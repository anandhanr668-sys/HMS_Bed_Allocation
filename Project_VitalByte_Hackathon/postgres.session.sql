-- MediBed Hospital Management System - Complete Database Setup
-- Run this script to create tables and insert sample data for all roles
-- 1. Patients Table
CREATE TABLE IF NOT EXISTS patients (
    id SERIAL PRIMARY KEY,
    patient_id_str VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    age INT,
    gender VARCHAR(20),
    contact VARCHAR(20),
    status VARCHAR(50) DEFAULT 'REGISTERED',
    risk_level VARCHAR(20),
    allocated_bed_id VARCHAR(50),
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    email VARCHAR(100)
);
-- 2. Staff / Users Table (RBAC)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL,
    -- ADMIN, DOCTOR, NURSE, FRONT_DESK, LAB_ASSISTANT
    full_name VARCHAR(100),
    email VARCHAR(100),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    department VARCHAR(50),
    specialization VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- 3. Bed Management
CREATE TABLE IF NOT EXISTS beds (
    id SERIAL PRIMARY KEY,
    bed_id_str VARCHAR(50) UNIQUE NOT NULL,
    ward_name VARCHAR(50) NOT NULL,
    type VARCHAR(30) NOT NULL,
    -- ICU, VENTILATOR, GENERAL, SEMI-PRIVATE
    status VARCHAR(20) DEFAULT 'AVAILABLE',
    patient_id VARCHAR(50) REFERENCES patients(patient_id_str),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- 4. Visits / Encounters
CREATE TABLE IF NOT EXISTS visits (
    visit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id VARCHAR(50) REFERENCES patients(patient_id_str),
    doctor_id INT REFERENCES users(id),
    visit_type VARCHAR(50),
    -- OPD, IPD, EMERGENCY
    priority VARCHAR(20) DEFAULT 'NORMAL',
    status VARCHAR(50) DEFAULT 'AT_NURSE',
    queue_number INT,
    check_in_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    discharge_time TIMESTAMP
);
-- 5. Lab Orders
CREATE TABLE IF NOT EXISTS lab_orders (
    order_id VARCHAR(50) PRIMARY KEY,
    patient_id VARCHAR(50) REFERENCES patients(patient_id_str),
    visit_id UUID REFERENCES visits(visit_id),
    ordered_by INT REFERENCES users(id),
    test_code VARCHAR(50),
    sample_type VARCHAR(100),
    status VARCHAR(30) DEFAULT 'PENDING',
    priority VARCHAR(20) DEFAULT 'ROUTINE',
    is_sensitive BOOLEAN DEFAULT FALSE,
    instructions TEXT,
    notes TEXT,
    assigned_to INT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ordered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);
-- ==========================================
-- SEED DATA (INSERTING USERS FOR ALL ROLES)
-- ==========================================
-- Password for 'admin' is 'admin'
-- Password for others is usually 'password' or inherited from setup
INSERT INTO users (username, password_hash, role, full_name, email)
VALUES (
        'admin_master',
        '$2b$10$ldhLSptaprws8r/eU5oXHub02hwB6cNHxmmMnPO1tyEyVVOBjAkBu',
        'ADMIN',
        'Master Administrator',
        'admin@hms.com'
    ),
    (
        'front_desk_user',
        '$2b$10$FUjFt8UIuc.mW8Gtqt7V9.fDvbc4nqw3X47Qa//tB9zWIYQNrtFme',
        'FRONT_DESK',
        'Front Desk Staff',
        'frontdesk@hms.com'
    ),
    (
        'nurse_staff',
        '$2b$10$FUjFt8UIuc.mW8Gtqt7V9.fDvbc4nqw3X47Qa//tB9zWIYQNrtFme',
        'NURSE',
        'Senior Nurse',
        'nurse@hms.com'
    ),
    (
        'doctor_pro',
        '$2b$10$FUjFt8UIuc.mW8Gtqt7V9.fDvbc4nqw3X47Qa//tB9zWIYQNrtFme',
        'DOCTOR',
        'Dr. Ramesh Kumar',
        'doctor@hms.com'
    ),
    (
        'lab_assistant_user',
        '$2b$10$FUjFt8UIuc.mW8Gtqt7V9.fDvbc4nqw3X47Qa//tB9zWIYQNrtFme',
        'LAB_ASSISTANT',
        'Lab Technician',
        'lab@hms.com'
    ) ON CONFLICT (username) DO NOTHING;
-- ==========================================
-- SAMPLE DATA (PATIENTS AND BEDS)
-- ==========================================
INSERT INTO patients (
        patient_id_str,
        first_name,
        last_name,
        age,
        gender,
        contact,
        status
    )
VALUES (
        'PAT-TEST-001',
        'John',
        'Doe',
        45,
        'Male',
        '9988776655',
        'REGISTERED'
    ),
    (
        'PAT-TEST-002',
        'Sarah',
        'Wilson',
        29,
        'Female',
        '8877665544',
        'STABLE'
    ) ON CONFLICT (patient_id_str) DO NOTHING;
INSERT INTO beds (bed_id_str, ward_name, type, status)
VALUES ('BED-ICU-101', 'ICU', 'ICU', 'AVAILABLE'),
    ('BED-GEN-201', 'General', 'GENERAL', 'AVAILABLE'),
    (
        'BED-SEM-301',
        'Semi-Private',
        'SEMI-PRIVATE',
        'AVAILABLE'
    ) ON CONFLICT (bed_id_str) DO NOTHING;
-- ==========================================
-- VERIFY THE DATA
-- ==========================================
SELECT *
FROM users;
SELECT *
FROM patients;
SELECT *
FROM beds;
SELECT id, patient_id_str, first_name, last_name, age, contact, registered_at 
FROM patients 
ORDER BY registered_at DESC;