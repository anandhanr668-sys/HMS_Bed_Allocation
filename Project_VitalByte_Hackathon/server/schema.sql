-- Database Schema for MediBed Hospital Management System
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
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- 2. Staff / Users Table (RBAC)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL,
    -- ADMIN, DOCTOR, NURSE, FRONT_DESK
    full_name VARCHAR(100),
    email VARCHAR(100),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- 3. Form Schemas (LCNC Data)
CREATE TABLE IF NOT EXISTS form_schemas (
    id SERIAL PRIMARY KEY,
    form_id VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(100) NOT NULL,
    schema JSONB NOT NULL,
    version VARCHAR(20) DEFAULT '1.0',
    created_by INT REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- 4. Protocols / Clinical Rules
CREATE TABLE IF NOT EXISTS protocols (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    version VARCHAR(20) DEFAULT '1.0',
    rules JSONB NOT NULL,
    severity VARCHAR(20),
    -- CRITICAL, STABLE, OBSERVATION
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- 5. Bed Management
CREATE TABLE IF NOT EXISTS beds (
    id SERIAL PRIMARY KEY,
    bed_id_str VARCHAR(50) UNIQUE NOT NULL,
    ward_name VARCHAR(50) NOT NULL,
    type VARCHAR(30) NOT NULL,
    -- ICU, VENTILATOR, GENERAL, SEMI-PRIVATE
    status VARCHAR(20) DEFAULT 'AVAILABLE',
    -- AVAILABLE, OCCUPIED, MAINTENANCE
    patient_id VARCHAR(50) REFERENCES patients(patient_id_str),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- 6. Clinical History (Links LCNC Forms to Patients)
CREATE TABLE IF NOT EXISTS treatment_history (
    id SERIAL PRIMARY KEY,
    patient_id VARCHAR(50) REFERENCES patients(patient_id_str),
    form_id VARCHAR(50) REFERENCES form_schemas(form_id),
    data JSONB,
    summary TEXT,
    captured_by INT REFERENCES users(id),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- 7. Vitals Log
CREATE TABLE IF NOT EXISTS vitals (
    id SERIAL PRIMARY KEY,
    patient_id VARCHAR(50) REFERENCES patients(patient_id_str),
    spo2 FLOAT,
    bpm INT,
    bp_systolic INT,
    bp_diastolic INT,
    temperature FLOAT,
    respiratory_rate INT,
    captured_by INT REFERENCES users(id),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- 8. Billing Transactions
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    patient_id VARCHAR(50) REFERENCES patients(patient_id_str),
    amount DECIMAL(10, 2) NOT NULL,
    type VARCHAR(100),
    -- Registration, Consultation, Lab, Pharmacy
    description TEXT,
    status VARCHAR(20) DEFAULT 'PAID',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- 9. Visits / Encounters
CREATE TABLE IF NOT EXISTS visits (
    visit_id SERIAL PRIMARY KEY,
    patient_id VARCHAR(50) REFERENCES patients(patient_id_str),
    doctor_id INT REFERENCES users(id),
    visit_type VARCHAR(50),
    -- OPD, IPD, EMERGENCY
    priority VARCHAR(20) DEFAULT 'NORMAL',
    -- NORMAL, URGENT, STAT
    status VARCHAR(50) DEFAULT 'AT_NURSE',
    -- AT_NURSE, AT_DOCTOR, AT_LAB, BILLING_PENDING, CLOSED
    check_in_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    check_out_time TIMESTAMP
);
-- 10. Nursing Assessments
CREATE TABLE IF NOT EXISTS nursing_assessments (
    assessment_id SERIAL PRIMARY KEY,
    visit_id INT REFERENCES visits(visit_id),
    nurse_id INT REFERENCES users(id),
    vitals JSONB,
    -- LCNC dynamic vitals or standard
    notes TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- 11. Doctor Consultation Notes
CREATE TABLE IF NOT EXISTS doctor_notes (
    note_id SERIAL PRIMARY KEY,
    visit_id INT REFERENCES visits(visit_id),
    doctor_id INT REFERENCES users(id),
    chief_complaint TEXT,
    diagnosis TEXT,
    treatment_plan TEXT,
    prescription_data JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- 12. Lab Orders
CREATE TABLE IF NOT EXISTS lab_orders (
    order_id SERIAL PRIMARY KEY,
    visit_id INT REFERENCES visits(visit_id),
    ordered_by INT REFERENCES users(id),
    test_type VARCHAR(100),
    assigned_technician_id INT REFERENCES users(id),
    status VARCHAR(30) DEFAULT 'PENDING',
    -- PENDING, COMPLETED, CANCELLED
    results JSONB,
    is_sensitive BOOLEAN DEFAULT FALSE,
    ordered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);
-- 13. Audit Logs (System-wide tracking)
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    module VARCHAR(50),
    -- PATIENT, STAFF, CONFIG, CLINICAL
    entity_id VARCHAR(50),
    details JSONB,
    ip_address VARCHAR(45),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);