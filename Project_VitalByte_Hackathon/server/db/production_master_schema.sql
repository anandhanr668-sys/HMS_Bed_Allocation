-- ============================================================
-- MEDIBED ENTERPRISE HOSPITAL MANAGEMENT SYSTEM
-- MASTER PRODUCTION SCHEMA v1.1 (Robust Update Version)
-- ============================================================
-- 0. Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
-- 1. Departments Master
CREATE TABLE IF NOT EXISTS departments (
    dept_id VARCHAR(50) PRIMARY KEY,
    dept_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- 2. Staff / Users (RBAC)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL,
    -- ADMIN, DOCTOR, NURSE, FRONT_DESK, LAB_ASSISTANT
    full_name VARCHAR(100),
    email VARCHAR(100),
    phone_number VARCHAR(20),
    staff_id VARCHAR(50),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    department_id VARCHAR(50),
    specialization VARCHAR(100),
    license_number VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE users
ADD COLUMN IF NOT EXISTS department_id VARCHAR(50) REFERENCES departments(dept_id);
ALTER TABLE users
ADD COLUMN IF NOT EXISTS staff_id VARCHAR(50) UNIQUE;
ALTER TABLE users
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);
ALTER TABLE users
ADD COLUMN IF NOT EXISTS specialization VARCHAR(100);
ALTER TABLE users
ADD COLUMN IF NOT EXISTS license_number VARCHAR(100);
-- 3. Patients Master
CREATE TABLE IF NOT EXISTS patients (
    id SERIAL PRIMARY KEY,
    patient_id_str VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    age INT,
    gender VARCHAR(20),
    contact VARCHAR(20),
    email VARCHAR(100),
    status VARCHAR(50) DEFAULT 'REGISTERED',
    risk_level VARCHAR(20),
    allocated_bed_id VARCHAR(50),
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE patients
ADD COLUMN IF NOT EXISTS email VARCHAR(100);
-- 4. Ward & Bed Management
CREATE TABLE IF NOT EXISTS ward_configuration (
    ward_id VARCHAR(50) PRIMARY KEY,
    ward_name VARCHAR(100) NOT NULL,
    ward_type VARCHAR(50) NOT NULL,
    floor_number INT,
    total_capacity INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    config JSONB,
    created_by INT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS bed_types (
    bed_type_id VARCHAR(50) PRIMARY KEY,
    bed_type_name VARCHAR(100) NOT NULL,
    description TEXT,
    base_price DECIMAL(10, 2),
    features JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS beds (
    bed_id_str VARCHAR(50) PRIMARY KEY,
    ward_name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    floor_number INT,
    status VARCHAR(20) DEFAULT 'AVAILABLE',
    patient_id VARCHAR(50) REFERENCES patients(patient_id_str),
    features JSONB,
    maintenance_notes TEXT,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE beds
ADD COLUMN IF NOT EXISTS floor_number INT;
ALTER TABLE beds
ADD COLUMN IF NOT EXISTS features JSONB;
ALTER TABLE beds
ADD COLUMN IF NOT EXISTS maintenance_notes TEXT;
-- 5. Workflow: Visits
CREATE TABLE IF NOT EXISTS visits (
    visit_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id VARCHAR(50) REFERENCES patients(patient_id_str) NOT NULL,
    doctor_id INT REFERENCES users(id),
    visit_type VARCHAR(50) NOT NULL,
    priority VARCHAR(20) DEFAULT 'NORMAL',
    status VARCHAR(50) DEFAULT 'REGISTERED',
    queue_number SERIAL,
    check_in_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    discharge_time TIMESTAMP,
    created_by INT REFERENCES users(id)
);
-- 6. Clinical Data
CREATE TABLE IF NOT EXISTS nursing_assessments (
    assessment_id SERIAL PRIMARY KEY,
    visit_id UUID REFERENCES visits(visit_id) NOT NULL,
    nurse_id INT REFERENCES users(id) NOT NULL,
    vitals JSONB NOT NULL,
    notes TEXT,
    consciousness_level VARCHAR(50),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS doctor_notes (
    note_id SERIAL PRIMARY KEY,
    visit_id UUID REFERENCES visits(visit_id) NOT NULL,
    doctor_id INT REFERENCES users(id) NOT NULL,
    chief_complaint TEXT,
    diagnosis TEXT,
    treatment_plan TEXT,
    prescription_data JSONB,
    follow_up_date DATE,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- 7. Laboratory Module
CREATE TABLE IF NOT EXISTS lab_test_catalog (
    test_code VARCHAR(50) PRIMARY KEY,
    test_name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    base_price DECIMAL(10, 2),
    turnaround_time_hours INT DEFAULT 24,
    is_active BOOLEAN DEFAULT TRUE
);
ALTER TABLE lab_test_catalog
ADD COLUMN IF NOT EXISTS base_price DECIMAL(10, 2);
CREATE TABLE IF NOT EXISTS lab_orders (
    order_id VARCHAR(50) PRIMARY KEY,
    visit_id UUID REFERENCES visits(visit_id) NOT NULL,
    patient_id VARCHAR(50) REFERENCES patients(patient_id_str),
    test_code VARCHAR(50) REFERENCES lab_test_catalog(test_code),
    ordered_by INT REFERENCES users(id) NOT NULL,
    assigned_technician_id INT REFERENCES users(id),
    status VARCHAR(30) DEFAULT 'PENDING',
    priority VARCHAR(20) DEFAULT 'ROUTINE',
    results JSONB,
    report_file_path TEXT,
    is_sensitive BOOLEAN DEFAULT FALSE,
    ordered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);
-- 8. Billing & Finance
CREATE TABLE IF NOT EXISTS invoices (
    invoice_id SERIAL PRIMARY KEY,
    visit_id UUID REFERENCES visits(visit_id) NOT NULL,
    patient_id VARCHAR(50) REFERENCES patients(patient_id_str),
    generated_by INT REFERENCES users(id),
    total_amount DECIMAL(10, 2) NOT NULL,
    discount DECIMAL(10, 2) DEFAULT 0,
    final_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING',
    payment_method VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP
);
-- 10. Admin Configuration (Persistence)
CREATE TABLE IF NOT EXISTS form_templates (
    form_id VARCHAR(100) PRIMARY KEY,
    form_name VARCHAR(100) NOT NULL,
    form_type VARCHAR(50) NOT NULL,
    version VARCHAR(20) DEFAULT '1.0',
    schema JSONB NOT NULL,
    ui_config JSONB,
    published_to JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS clinical_protocols (
    protocol_id VARCHAR(100) PRIMARY KEY,
    protocol_name VARCHAR(100) NOT NULL,
    rules JSONB NOT NULL,
    severity VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS protocol_executions (
    id SERIAL PRIMARY KEY,
    protocol_id VARCHAR(100) REFERENCES clinical_protocols(protocol_id),
    patient_id VARCHAR(50) REFERENCES patients(patient_id_str),
    visit_id UUID REFERENCES visits(visit_id),
    triggered_by VARCHAR(50),
    trigger_data JSONB,
    alert_level VARCHAR(20),
    alert_sent_to JSONB,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolution_status VARCHAR(50) DEFAULT 'PENDING',
    resolved_by INT REFERENCES users(id),
    resolved_at TIMESTAMP
);
CREATE TABLE IF NOT EXISTS staff_credentials (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    credential_type VARCHAR(50) NOT NULL,
    credential_value VARCHAR(100) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    UNIQUE(credential_type, credential_value)
);
CREATE TABLE IF NOT EXISTS staff_permissions (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    module VARCHAR(50) NOT NULL,
    permission VARCHAR(50) NOT NULL,
    granted_by INT REFERENCES users(id),
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, module, permission)
);
CREATE TABLE IF NOT EXISTS hospital_config (
    id SERIAL PRIMARY KEY,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value JSONB NOT NULL,
    description TEXT,
    updated_by INT REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS emergency_overrides (
    id SERIAL PRIMARY KEY,
    override_type VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    activated_by INT REFERENCES users(id),
    activated_at TIMESTAMP,
    deactivated_at TIMESTAMP,
    reason TEXT,
    affected_entities JSONB
);
-- 11. Audit Logging (System-wide Integrity)
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    module VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100),
    before_state JSONB,
    after_state JSONB,
    details JSONB,
    ip_address VARCHAR(45),
    severity VARCHAR(20) DEFAULT 'INFO',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE audit_logs
ADD COLUMN IF NOT EXISTS before_state JSONB;
ALTER TABLE audit_logs
ADD COLUMN IF NOT EXISTS after_state JSONB;
ALTER TABLE audit_logs
ADD COLUMN IF NOT EXISTS severity VARCHAR(20) DEFAULT 'INFO';
-- ============================================================
-- SEED DATA: CORE DEPARTMENTS & ROLES
-- ============================================================
INSERT INTO departments (dept_id, dept_name, description)
VALUES (
        'DEPT_EMERGENCY',
        'Emergency & Trauma',
        'Critical emergency care'
    ),
    (
        'DEPT_GENERAL',
        'General Medicine',
        'Standard outpatient care'
    ),
    (
        'DEPT_CARDIOLOGY',
        'Cardiology',
        'Heart health specialized'
    ),
    (
        'DEPT_ADMIN',
        'Administration',
        'Hospital operations'
    ) ON CONFLICT (dept_id) DO NOTHING;
INSERT INTO lab_test_catalog (test_code, test_name, category, base_price)
VALUES (
        'CBC',
        'Complete Blood Count',
        'HEMATOLOGY',
        250.00
    ),
    (
        'LFT',
        'Liver Function Test',
        'BIOCHEMISTRY',
        800.00
    ),
    (
        'RFT',
        'Renal Function Test',
        'BIOCHEMISTRY',
        700.00
    ),
    (
        'SEMEN_ANALYSIS',
        'Semen Analysis',
        'ANDROLOGY',
        1200.00
    ) ON CONFLICT (test_code) DO NOTHING;