-- Laboratory Module Schema for HMS
-- Supports Investigation Orders, Lab Reports, and Semen Analysis
-- 1. Lab Test Catalog
CREATE TABLE IF NOT EXISTS lab_test_catalog (
    id SERIAL PRIMARY KEY,
    test_code VARCHAR(50) UNIQUE NOT NULL,
    test_name VARCHAR(200) NOT NULL,
    category VARCHAR(100),
    -- HEMATOLOGY, BIOCHEMISTRY, MICROBIOLOGY, ANDROLOGY
    gender_restriction VARCHAR(10),
    -- MALE, FEMALE, ALL
    form_schema_id VARCHAR(50) REFERENCES form_schemas(form_id),
    turnaround_time_hours INT DEFAULT 24,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- 2. Lab Orders (Doctor creates these)
CREATE TABLE IF NOT EXISTS lab_orders (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(50) UNIQUE NOT NULL,
    patient_id VARCHAR(50) REFERENCES patients(patient_id_str),
    visit_id VARCHAR(50),
    test_code VARCHAR(50) REFERENCES lab_test_catalog(test_code),
    ordered_by INT REFERENCES users(id),
    -- Doctor ID
    assigned_to INT REFERENCES users(id),
    -- Lab Assistant ID
    priority VARCHAR(20) DEFAULT 'ROUTINE',
    -- ROUTINE, URGENT, STAT
    status VARCHAR(30) DEFAULT 'PENDING',
    -- PENDING, IN_PROGRESS, COMPLETED, CANCELLED
    sample_collected_at TIMESTAMP,
    ordered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    notes TEXT
);
-- 3. Lab Reports (Lab Assistant fills these)
CREATE TABLE IF NOT EXISTS lab_reports (
    id SERIAL PRIMARY KEY,
    report_id VARCHAR(50) UNIQUE NOT NULL,
    order_id VARCHAR(50) REFERENCES lab_orders(order_id),
    patient_id VARCHAR(50) REFERENCES patients(patient_id_str),
    test_code VARCHAR(50) REFERENCES lab_test_catalog(test_code),
    -- Report Data (JSONB for flexibility)
    report_data JSONB NOT NULL,
    -- Lab Authentication
    performed_by INT REFERENCES users(id),
    -- Lab Assistant
    verified_by INT REFERENCES users(id),
    -- Lab Supervisor (optional)
    -- Timestamps
    sample_collection_time TIMESTAMP,
    examination_time TIMESTAMP,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Status
    status VARCHAR(30) DEFAULT 'DRAFT',
    -- DRAFT, SUBMITTED, VERIFIED, CANCELLED
    is_abnormal BOOLEAN DEFAULT false,
    -- Audit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- 4. Semen Analysis Specific Table (Structured Data)
CREATE TABLE IF NOT EXISTS semen_analysis_reports (
    id SERIAL PRIMARY KEY,
    report_id VARCHAR(50) REFERENCES lab_reports(report_id),
    patient_id VARCHAR(50) REFERENCES patients(patient_id_str),
    -- Sample Information
    sample_collection_type VARCHAR(50),
    -- Masturbation, Condom Collection
    collection_time TIMESTAMP,
    examination_time TIMESTAMP,
    abstinence_period VARCHAR(50),
    -- "3 Days", "5 Days"
    -- Macroscopic Examination
    volume_ml DECIMAL(5, 2),
    appearance VARCHAR(50),
    -- Grey-white, Yellowish
    viscosity VARCHAR(50),
    -- Normal, Increased, Decreased
    ph DECIMAL(3, 1),
    liquefaction_time_min INT,
    -- Microscopic Examination
    sperm_concentration DECIMAL(10, 2),
    -- millions/ml
    total_sperm_count DECIMAL(10, 2),
    -- millions
    progressive_motility_pct DECIMAL(5, 2),
    non_progressive_motility_pct DECIMAL(5, 2),
    immotile_pct DECIMAL(5, 2),
    vitality_pct DECIMAL(5, 2),
    agglutination BOOLEAN,
    pus_cells_hpf VARCHAR(50),
    -- Morphology
    normal_forms_pct DECIMAL(5, 2),
    head_abnormalities_pct DECIMAL(5, 2),
    midpiece_abnormalities_pct DECIMAL(5, 2),
    tail_abnormalities_pct DECIMAL(5, 2),
    -- Lab Authentication
    technician_name VARCHAR(100),
    technician_signature TEXT,
    -- Base64 or signature path
    report_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- 5. Lab Audit Log
CREATE TABLE IF NOT EXISTS lab_audit_log (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(50),
    report_id VARCHAR(50),
    action VARCHAR(100),
    -- ORDER_CREATED, SAMPLE_COLLECTED, REPORT_SUBMITTED, etc.
    performed_by INT REFERENCES users(id),
    details JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Indexes for Performance
CREATE INDEX idx_lab_orders_patient ON lab_orders(patient_id);
CREATE INDEX idx_lab_orders_assigned ON lab_orders(assigned_to);
CREATE INDEX idx_lab_orders_status ON lab_orders(status);
CREATE INDEX idx_lab_reports_patient ON lab_reports(patient_id);
CREATE INDEX idx_lab_reports_order ON lab_reports(order_id);
CREATE INDEX idx_semen_reports_patient ON semen_analysis_reports(patient_id);
-- Insert Default Lab Tests
INSERT INTO lab_test_catalog (
        test_code,
        test_name,
        category,
        gender_restriction,
        turnaround_time_hours
    )
VALUES (
        'SEMEN_ANALYSIS',
        'Semen Analysis',
        'ANDROLOGY',
        'MALE',
        2
    ),
    (
        'CBC',
        'Complete Blood Count',
        'HEMATOLOGY',
        'ALL',
        4
    ),
    (
        'LFT',
        'Liver Function Test',
        'BIOCHEMISTRY',
        'ALL',
        6
    ),
    (
        'RFT',
        'Renal Function Test',
        'BIOCHEMISTRY',
        'ALL',
        6
    ),
    (
        'THYROID',
        'Thyroid Profile',
        'BIOCHEMISTRY',
        'ALL',
        24
    ),
    (
        'URINE_ROUTINE',
        'Urine Routine Examination',
        'MICROBIOLOGY',
        'ALL',
        2
    ) ON CONFLICT (test_code) DO NOTHING;