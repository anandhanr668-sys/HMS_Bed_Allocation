-- ============================================================
-- MEDIBED ENTERPRISE HOSPITAL MANAGEMENT SYSTEM (HMS)
-- ADVANCED POSTGRESQL SCHEMA v2.0 (Enterprise Standard)
-- ============================================================
-- Design: Senior Healthcare Architect
-- Compliance: RBAC, Data Integrity, Clinical Workflow Integration
-- EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- ============================================================
-- 1. FOUNDATION: DEPARTMENTS & RBAC
-- ============================================================
CREATE TABLE IF NOT EXISTS departments (
    dept_id VARCHAR(50) PRIMARY KEY,
    dept_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (
        role IN (
            'ADMIN',
            'DOCTOR',
            'NURSE',
            'FRONT_DESK',
            'LAB_ASSISTANT',
            'PATIENT'
        )
    ),
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone_number VARCHAR(20),
    staff_id VARCHAR(50) UNIQUE,
    -- Internal Hospital Staff ID
    department_id VARCHAR(50) REFERENCES departments(dept_id),
    specialization VARCHAR(100),
    license_number VARCHAR(100),
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- ============================================================
-- 2. PATIENT MANAGEMENT
-- ============================================================
CREATE TABLE IF NOT EXISTS patients (
    patient_id_str VARCHAR(50) PRIMARY KEY,
    -- Primary Key for Clinical Reference (e.g., MED-12345)
    user_id INT REFERENCES users(user_id),
    -- Linked to Patient Portal account if exists
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    dob DATE NOT NULL,
    gender VARCHAR(20) NOT NULL CHECK (gender IN ('MALE', 'FEMALE', 'OTHER')),
    blood_group VARCHAR(5),
    contact_number VARCHAR(20) NOT NULL,
    emergency_contact VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    insurance_details JSONB,
    aadhaar_number VARCHAR(12) UNIQUE,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    -- ACTIVE, DECEASED, ARCHIVED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- ============================================================
-- 3. WARD & BED MANAGEMENT (REAL-TIME)
-- ============================================================
CREATE TABLE IF NOT EXISTS wards (
    ward_id VARCHAR(50) PRIMARY KEY,
    ward_name VARCHAR(100) NOT NULL,
    ward_type VARCHAR(50) NOT NULL,
    -- ICU, GENERAL, SEMI-PRIVATE, SUITE, TRAUMA
    floor_number INT,
    total_capacity INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);
CREATE TABLE IF NOT EXISTS beds (
    bed_id_str VARCHAR(50) PRIMARY KEY,
    ward_id VARCHAR(50) REFERENCES wards(ward_id) NOT NULL,
    bed_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'AVAILABLE' CHECK (
        status IN (
            'AVAILABLE',
            'OCCUPIED',
            'MAINTENANCE',
            'RESERVED'
        )
    ),
    current_patient_id VARCHAR(50) REFERENCES patients(patient_id_str),
    daily_charge DECIMAL(10, 2) DEFAULT 0.00,
    last_sanitized_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- ============================================================
-- 4. CLINICAL WORKFLOW: VISITS & ASSESSMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS visits (
    visit_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    patient_id VARCHAR(50) REFERENCES patients(patient_id_str) NOT NULL,
    doctor_id INT REFERENCES users(user_id) NOT NULL,
    visit_type VARCHAR(50) NOT NULL CHECK (
        visit_type IN ('OPD', 'IPD', 'EMERGENCY', 'FOLLOW_UP')
    ),
    priority VARCHAR(20) DEFAULT 'NORMAL' CHECK (priority IN ('NORMAL', 'URGENT', 'CRITICAL')),
    chief_complaint TEXT,
    status VARCHAR(50) DEFAULT 'ADMITTED' CHECK (
        status IN (
            'REGISTERED',
            'TRIAGE',
            'CONSULTATION',
            'ADMITTED',
            'DISCHARGED',
            'CLOSED'
        )
    ),
    admission_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    discharge_time TIMESTAMP WITH TIME ZONE,
    created_by INT REFERENCES users(user_id),
    -- Front Desk ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS vitals_log (
    vitals_id SERIAL PRIMARY KEY,
    visit_id UUID REFERENCES visits(visit_id) NOT NULL,
    nurse_id INT REFERENCES users(user_id) NOT NULL,
    bp_sys INT,
    -- Systolic
    bp_dia INT,
    -- Diastolic
    heart_rate INT,
    spO2 INT,
    temperature DECIMAL(4, 1),
    respiratory_rate INT,
    weight_kg DECIMAL(5, 2),
    notes TEXT,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS doctor_clinical_notes (
    note_id SERIAL PRIMARY KEY,
    visit_id UUID REFERENCES visits(visit_id) NOT NULL,
    doctor_id INT REFERENCES users(user_id) NOT NULL,
    diagnosis TEXT NOT NULL,
    clinical_findings TEXT,
    treatment_plan TEXT,
    prescription_data JSONB,
    -- Array of meds, dosage, duration
    follow_up_date DATE,
    is_finalized BOOLEAN DEFAULT FALSE,
    -- Once finalized, cannot be edited
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- ============================================================
-- 5. INVESTIGATIONS: LABS & RADIOLOGY
-- ============================================================
CREATE TABLE IF NOT EXISTS lab_catalogue (
    test_code VARCHAR(50) PRIMARY KEY,
    test_name VARCHAR(200) NOT NULL,
    department VARCHAR(50),
    -- Pathology, Radiology, Cardiology
    category VARCHAR(50),
    -- HORMONAL, BLOOD, IMAGING, etc.
    sample_type VARCHAR(50),
    -- Blood, Urine, etc.
    normal_ranges JSONB,
    -- { "MALE": "...", "FEMALE": "..." }
    price DECIMAL(10, 2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);
CREATE TABLE IF NOT EXISTS lab_orders (
    order_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    visit_id UUID REFERENCES visits(visit_id) NOT NULL,
    test_code VARCHAR(50) REFERENCES lab_catalogue(test_code) NOT NULL,
    ordered_by INT REFERENCES users(user_id) NOT NULL,
    -- Doctor
    assigned_staff_id INT REFERENCES users(user_id),
    -- Lab Tech
    priority VARCHAR(20) DEFAULT 'ROUTINE',
    status VARCHAR(30) DEFAULT 'PENDING' CHECK (
        status IN (
            'PENDING',
            'SAMPLE_COLLECTED',
            'PROCESSING',
            'COMPLETED',
            'CANCELLED'
        )
    ),
    clinical_history TEXT,
    -- Note from doctor for lab
    ordered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS lab_results (
    result_id SERIAL PRIMARY KEY,
    order_id UUID REFERENCES lab_orders(order_id) UNIQUE NOT NULL,
    technician_id INT REFERENCES users(user_id) NOT NULL,
    findings JSONB NOT NULL,
    -- { "FSH": 5.2, "LH": 3.1, "flag": "NORMAL" }
    imaging_url TEXT,
    -- For HSG / Follicular study images
    radiology_report TEXT,
    -- Descriptive report for imaging
    observation_notes TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    verified_by INT REFERENCES users(user_id),
    -- Senior Pathologist
    result_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_read_only BOOLEAN DEFAULT FALSE -- Locked after verification
);
-- ============================================================
-- 6. DISCHARGE & FINAL REPORTING
-- ============================================================
CREATE TABLE IF NOT EXISTS discharge_summaries (
    discharge_id SERIAL PRIMARY KEY,
    visit_id UUID REFERENCES visits(visit_id) UNIQUE NOT NULL,
    doctor_id INT REFERENCES users(user_id) NOT NULL,
    final_diagnosis TEXT NOT NULL,
    hospital_course TEXT,
    -- Summary of stay
    medication_on_discharge JSONB,
    advice_on_discharge TEXT,
    follow_up_instructions TEXT,
    discharge_condition VARCHAR(50),
    is_finalized BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS patient_reports (
    report_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    patient_id VARCHAR(50) REFERENCES patients(patient_id_str) NOT NULL,
    visit_id UUID REFERENCES visits(visit_id),
    report_type VARCHAR(50) NOT NULL,
    -- LAB_REPORT, DISCHARGE_SUMMARY, FULL_VISIT_HISTORY
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    -- Cloud/Server storage path
    hash_checksum TEXT,
    -- For medical document integrity
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    generated_by INT REFERENCES users(user_id)
);
-- ============================================================
-- 7. INFRASTRUCTURE & MONITORING
-- ============================================================
CREATE TABLE IF NOT EXISTS billing_transactions (
    transaction_id SERIAL PRIMARY KEY,
    patient_id VARCHAR(50) REFERENCES patients(patient_id_str) NOT NULL,
    visit_id UUID REFERENCES visits(visit_id),
    amount DECIMAL(12, 2) NOT NULL,
    type VARCHAR(50) NOT NULL,
    -- CONSULTATION, BED_CHARGE, LAB_TEST, PHARMACY
    description TEXT,
    status VARCHAR(20) DEFAULT 'PAID',
    payment_mode VARCHAR(50),
    -- CASH, CARD, INSURANCE, UPI
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS audit_logs (
    log_id BIGSERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id),
    action VARCHAR(100) NOT NULL,
    module VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100),
    before_state JSONB,
    after_state JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- ============================================================
-- INDEXING FOR PERFORMANCE (Enterprise Optimization)
-- ============================================================
CREATE INDEX idx_patients_name ON patients(first_name, last_name);
CREATE INDEX idx_visits_patient ON visits(patient_id);
CREATE INDEX idx_visits_status ON visits(status);
CREATE INDEX idx_lab_orders_visit ON lab_orders(visit_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(created_at);
CREATE INDEX idx_vitals_visit ON vitals_log(visit_id);
-- ============================================================
-- CORE INITIAL DATA
-- ============================================================
INSERT INTO departments (dept_id, dept_name, description)
VALUES (
        'ADMIN',
        'Administration',
        'Hospital governance and setup'
    ),
    (
        'GEN_MED',
        'General Medicine',
        'Outdoor Patient Department'
    ),
    (
        'GYNE',
        'Gynecology & Obstetrics',
        'Fertility and Women Health'
    ),
    (
        'CARDIOLOGY',
        'Cardiology',
        'Heart and vascular specialized'
    ),
    (
        'PATHOLOGY',
        'Pathology Lab',
        'Blood and tissue analysis'
    ),
    (
        'RADIOLOGY',
        'Radiology',
        'Imaging and Diagnostic sets'
    ) ON CONFLICT (dept_id) DO NOTHING;
INSERT INTO lab_catalogue (
        test_code,
        test_name,
        department,
        category,
        sample_type,
        price
    )
VALUES (
        'FSH',
        'Follicle Stimulating Hormone',
        'GYNE',
        'HORMONAL',
        'Blood',
        550.00
    ),
    (
        'LH',
        'Luteinizing Hormone',
        'GYNE',
        'HORMONAL',
        'Blood',
        550.00
    ),
    (
        'TSH',
        'Thyroid Stimulating Hormone',
        'PATHOLOGY',
        'HORMONAL',
        'Blood',
        450.00
    ),
    (
        'AMH',
        'Anti-Mullerian Hormone',
        'GYNE',
        'HORMONAL',
        'Blood',
        2500.00
    ),
    (
        'HSG',
        'Hysterosalpingogram',
        'RADIOLOGY',
        'IMAGING',
        'Radiography',
        3500.00
    ),
    (
        'FOL_STUDY',
        'Follicular Study (Serial USG)',
        'RADIOLOGY',
        'IMAGING',
        'USG',
        4500.00
    ) ON CONFLICT (test_code) DO NOTHING;