-- ============================================================
-- ENTERPRISE ADMIN MODULE - DATABASE SCHEMA
-- Hospital Management System - No-Code Configuration Platform
-- ============================================================
-- ============================================================
-- 1. FORM BUILDER ENHANCEMENTS
-- ============================================================
-- Form Templates with Version Control
CREATE TABLE IF NOT EXISTS form_templates (
    id SERIAL PRIMARY KEY,
    form_id VARCHAR(100) UNIQUE NOT NULL,
    form_name VARCHAR(200) NOT NULL,
    form_type VARCHAR(50) NOT NULL,
    -- REGISTRATION, VITALS, CASE_SHEET, LAB_REQUEST, CUSTOM
    version VARCHAR(20) NOT NULL DEFAULT '1.0',
    is_active BOOLEAN DEFAULT TRUE,
    -- Form Schema (JSON structure)
    schema JSONB NOT NULL,
    -- UI Configuration
    ui_config JSONB,
    -- colors, fonts, layout settings
    -- Publishing Configuration
    published_to JSONB,
    -- ["DOCTOR", "NURSE", "FRONT_DESK"]
    -- Metadata
    created_by INT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP,
    -- Validation Rules
    validation_rules JSONB,
    -- Conditional Logic
    conditional_rules JSONB,
    CONSTRAINT unique_form_version UNIQUE(form_id, version)
);
-- Form Field Types Master
CREATE TABLE IF NOT EXISTS form_field_types (
    id SERIAL PRIMARY KEY,
    field_type VARCHAR(50) UNIQUE NOT NULL,
    -- TEXT, NUMBER, DROPDOWN, DATE, CHECKBOX, TABLE, SIGNATURE
    config_schema JSONB,
    -- Default configuration for this field type
    is_active BOOLEAN DEFAULT TRUE
);
-- Form Submissions (Actual Data)
CREATE TABLE IF NOT EXISTS form_submissions (
    id SERIAL PRIMARY KEY,
    form_id VARCHAR(100) REFERENCES form_templates(form_id),
    patient_id VARCHAR(50) REFERENCES patients(patient_id_str),
    visit_id INT REFERENCES visits(visit_id),
    -- Submitted Data
    data JSONB NOT NULL,
    -- Metadata
    submitted_by INT REFERENCES users(id),
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Version tracking
    form_version VARCHAR(20),
    -- Status
    status VARCHAR(50) DEFAULT 'SUBMITTED' -- DRAFT, SUBMITTED, APPROVED, ARCHIVED
);
-- ============================================================
-- 2. CLINICAL PROTOCOL BUILDER
-- ============================================================
CREATE TABLE IF NOT EXISTS clinical_protocols (
    id SERIAL PRIMARY KEY,
    protocol_id VARCHAR(100) UNIQUE NOT NULL,
    protocol_name VARCHAR(200) NOT NULL,
    protocol_type VARCHAR(50) NOT NULL,
    -- VITALS, ICU, EMERGENCY, GENERAL
    version VARCHAR(20) NOT NULL DEFAULT '1.0',
    is_active BOOLEAN DEFAULT TRUE,
    -- Protocol Rules (JSON)
    rules JSONB NOT NULL,
    /*
     Example structure:
     {
     "vitals_thresholds": {
     "blood_pressure": {
     "systolic": { "low": 90, "medium": 140, "high": 160, "critical": 180 },
     "diastolic": { "low": 60, "medium": 90, "high": 100, "critical": 110 }
     },
     "heart_rate": { "low": 60, "medium": 100, "high": 120, "critical": 150 },
     "spo2": { "critical": 90, "high": 92, "medium": 95, "low": 100 },
     "temperature": { "low": 35, "medium": 37.5, "high": 38.5, "critical": 40 }
     },
     "alert_config": {
     "low": { "notify": ["NURSE"], "priority": "LOW" },
     "medium": { "notify": ["NURSE", "DOCTOR"], "priority": "MEDIUM" },
     "high": { "notify": ["DOCTOR", "ADMIN"], "priority": "HIGH" },
     "critical": { "notify": ["DOCTOR", "ADMIN", "EMERGENCY_TEAM"], "priority": "CRITICAL" }
     }
     }
     */
    -- Alert Configuration
    alert_levels JSONB,
    -- Assignment
    assigned_to JSONB,
    -- ["NURSE", "DOCTOR", "ADMIN"]
    applies_to VARCHAR(50),
    -- VITALS, ICU, EMERGENCY, ALL
    -- Metadata
    created_by INT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP,
    CONSTRAINT unique_protocol_version UNIQUE(protocol_id, version)
);
-- Protocol Execution Log
CREATE TABLE IF NOT EXISTS protocol_executions (
    id SERIAL PRIMARY KEY,
    protocol_id VARCHAR(100) REFERENCES clinical_protocols(protocol_id),
    patient_id VARCHAR(50) REFERENCES patients(patient_id_str),
    visit_id INT REFERENCES visits(visit_id),
    -- Trigger Information
    triggered_by VARCHAR(50),
    -- VITALS_CHECK, MANUAL, SCHEDULED
    trigger_data JSONB,
    -- Alert Information
    alert_level VARCHAR(20),
    -- LOW, MEDIUM, HIGH, CRITICAL
    alert_sent_to JSONB,
    -- Array of user IDs notified
    -- Execution Details
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolution_status VARCHAR(50) DEFAULT 'PENDING',
    -- PENDING, ACKNOWLEDGED, RESOLVED
    resolved_by INT REFERENCES users(id),
    resolved_at TIMESTAMP
);
-- ============================================================
-- 3. BED & WARD CONFIGURATION
-- ============================================================
-- Ward Master Configuration
CREATE TABLE IF NOT EXISTS ward_configuration (
    id SERIAL PRIMARY KEY,
    ward_id VARCHAR(50) UNIQUE NOT NULL,
    ward_name VARCHAR(100) NOT NULL,
    ward_type VARCHAR(50) NOT NULL,
    -- OPD, GENERAL, EMERGENCY, ICU, ISOLATION
    floor_number INT,
    -- Capacity
    total_capacity INT NOT NULL,
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    -- Configuration
    config JSONB,
    -- Additional settings like visiting hours, staff assignments
    -- Metadata
    created_by INT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Bed Types Configuration
CREATE TABLE IF NOT EXISTS bed_types (
    id SERIAL PRIMARY KEY,
    bed_type_id VARCHAR(50) UNIQUE NOT NULL,
    bed_type_name VARCHAR(100) NOT NULL,
    description TEXT,
    -- Pricing
    base_price DECIMAL(10, 2),
    -- Features
    features JSONB,
    -- ["VENTILATOR", "MONITOR", "OXYGEN"]
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Enhanced Beds Table (if not already exists with all fields)
-- This extends the existing beds table
ALTER TABLE beds
ADD COLUMN IF NOT EXISTS floor_number INT;
ALTER TABLE beds
ADD COLUMN IF NOT EXISTS features JSONB;
ALTER TABLE beds
ADD COLUMN IF NOT EXISTS maintenance_notes TEXT;
ALTER TABLE beds
ADD COLUMN IF NOT EXISTS last_sanitized TIMESTAMP;
-- ============================================================
-- 4. BED ASSIGNMENT RULES ENGINE
-- ============================================================
CREATE TABLE IF NOT EXISTS bed_assignment_rules (
    id SERIAL PRIMARY KEY,
    rule_id VARCHAR(100) UNIQUE NOT NULL,
    rule_name VARCHAR(200) NOT NULL,
    priority INT DEFAULT 0,
    -- Higher priority rules execute first
    is_active BOOLEAN DEFAULT TRUE,
    -- Rule Conditions (JSON)
    conditions JSONB NOT NULL,
    /*
     Example:
     {
     "patient_condition": ["CRITICAL", "SEVERE"],
     "risk_level": ["HIGH", "CRITICAL"],
     "visit_type": ["EMERGENCY", "ICU_ADMISSION"]
     }
     */
    -- Rule Actions (JSON)
    actions JSONB NOT NULL,
    /*
     Example:
     {
     "assign_ward_type": "ICU",
     "assign_bed_type": "VENTILATOR",
     "notify": ["DOCTOR", "ADMIN"],
     "priority": "URGENT"
     }
     */
    -- Metadata
    created_by INT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Bed Assignment History
CREATE TABLE IF NOT EXISTS bed_assignments (
    id SERIAL PRIMARY KEY,
    patient_id VARCHAR(50) REFERENCES patients(patient_id_str),
    bed_id VARCHAR(50) REFERENCES beds(bed_id_str),
    visit_id INT REFERENCES visits(visit_id),
    -- Assignment Details
    assigned_by INT REFERENCES users(id),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Rule Information
    rule_applied VARCHAR(100) REFERENCES bed_assignment_rules(rule_id),
    -- Release Details
    released_at TIMESTAMP,
    released_by INT REFERENCES users(id),
    release_reason TEXT,
    -- Status
    status VARCHAR(50) DEFAULT 'ACTIVE' -- ACTIVE, RELEASED, TRANSFERRED
);
-- ============================================================
-- 5. STAFF MANAGEMENT ENHANCEMENTS
-- ============================================================
-- Staff Departments
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    dept_id VARCHAR(50) UNIQUE NOT NULL,
    dept_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Staff Department Assignments
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
-- Staff Permissions (Granular Access Control)
CREATE TABLE IF NOT EXISTS staff_permissions (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    module VARCHAR(50) NOT NULL,
    -- FORMS, PROTOCOLS, BEDS, PATIENTS, BILLING
    permission VARCHAR(50) NOT NULL,
    -- READ, WRITE, DELETE, PUBLISH
    granted_by INT REFERENCES users(id),
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_module_permission UNIQUE(user_id, module, permission)
);
-- Staff Login Credentials (For multiple login options)
CREATE TABLE IF NOT EXISTS staff_credentials (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    credential_type VARCHAR(50) NOT NULL,
    -- STAFF_ID, USERNAME, PHONE
    credential_value VARCHAR(100) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    CONSTRAINT unique_credential UNIQUE(credential_type, credential_value)
);
-- ============================================================
-- 6. PATIENT MONITORING & HISTORY
-- ============================================================
-- Patient Status History
CREATE TABLE IF NOT EXISTS patient_status_history (
    id SERIAL PRIMARY KEY,
    patient_id VARCHAR(50) REFERENCES patients(patient_id_str),
    previous_status VARCHAR(50),
    new_status VARCHAR(50),
    changed_by INT REFERENCES users(id),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reason TEXT
);
-- Patient Visit Summary (For Admin Read-Only View)
CREATE VIEW admin_patient_summary AS
SELECT p.patient_id_str,
    p.first_name || ' ' || p.last_name AS patient_name,
    p.age,
    p.gender,
    p.status,
    p.risk_level,
    p.allocated_bed_id,
    v.visit_type,
    v.status AS visit_status,
    v.check_in_time,
    b.ward_name,
    b.type AS bed_type,
    u.full_name AS assigned_doctor
FROM patients p
    LEFT JOIN visits v ON p.patient_id_str = v.patient_id
    LEFT JOIN beds b ON p.allocated_bed_id = b.bed_id_str
    LEFT JOIN users u ON v.doctor_id = u.id;
-- ============================================================
-- 7. REPORTS & ANALYTICS
-- ============================================================
-- Report Templates
CREATE TABLE IF NOT EXISTS report_templates (
    id SERIAL PRIMARY KEY,
    report_id VARCHAR(100) UNIQUE NOT NULL,
    report_name VARCHAR(200) NOT NULL,
    report_type VARCHAR(50) NOT NULL,
    -- DAILY_PATIENT, BED_UTILIZATION, EMERGENCY_CASES, DOCTOR_CONSULTATION
    -- Query Configuration
    query_template TEXT,
    -- SQL template with parameters
    parameters JSONB,
    -- Parameter definitions
    -- Output Configuration
    output_format VARCHAR(50) DEFAULT 'PDF',
    -- PDF, CSV, EXCEL
    -- Scheduling
    is_scheduled BOOLEAN DEFAULT FALSE,
    schedule_config JSONB,
    -- Cron expression or schedule details
    -- Access Control
    accessible_by JSONB,
    -- ["ADMIN", "DOCTOR"]
    -- Metadata
    created_by INT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);
-- Report Execution History
CREATE TABLE IF NOT EXISTS report_executions (
    id SERIAL PRIMARY KEY,
    report_id VARCHAR(100) REFERENCES report_templates(report_id),
    executed_by INT REFERENCES users(id),
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Parameters Used
    parameters_used JSONB,
    -- Output
    file_path TEXT,
    file_format VARCHAR(50),
    -- Status
    status VARCHAR(50) DEFAULT 'COMPLETED',
    -- PENDING, COMPLETED, FAILED
    error_message TEXT
);
-- ============================================================
-- 8. ENHANCED AUDIT LOGGING
-- ============================================================
-- Extend audit_logs with more detailed tracking
ALTER TABLE audit_logs
ADD COLUMN IF NOT EXISTS before_state JSONB;
ALTER TABLE audit_logs
ADD COLUMN IF NOT EXISTS after_state JSONB;
ALTER TABLE audit_logs
ADD COLUMN IF NOT EXISTS severity VARCHAR(20) DEFAULT 'INFO';
-- INFO, WARNING, CRITICAL
ALTER TABLE audit_logs
ADD COLUMN IF NOT EXISTS session_id VARCHAR(100);
-- Admin Action Categories
CREATE TABLE IF NOT EXISTS admin_action_types (
    id SERIAL PRIMARY KEY,
    action_code VARCHAR(50) UNIQUE NOT NULL,
    action_name VARCHAR(100) NOT NULL,
    description TEXT,
    severity VARCHAR(20) DEFAULT 'INFO',
    requires_approval BOOLEAN DEFAULT FALSE
);
-- ============================================================
-- 9. SYSTEM CONFIGURATION
-- ============================================================
-- Hospital Configuration (Global Settings)
CREATE TABLE IF NOT EXISTS hospital_config (
    id SERIAL PRIMARY KEY,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value JSONB NOT NULL,
    description TEXT,
    updated_by INT REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Emergency Override Settings
CREATE TABLE IF NOT EXISTS emergency_overrides (
    id SERIAL PRIMARY KEY,
    override_type VARCHAR(50) NOT NULL,
    -- BED_ASSIGNMENT, PROTOCOL_BYPASS, EMERGENCY_ACCESS
    is_active BOOLEAN DEFAULT FALSE,
    activated_by INT REFERENCES users(id),
    activated_at TIMESTAMP,
    deactivated_at TIMESTAMP,
    reason TEXT,
    affected_entities JSONB -- What this override affects
);
-- ============================================================
-- 10. INDEXES FOR PERFORMANCE
-- ============================================================
-- Form Templates
CREATE INDEX IF NOT EXISTS idx_form_templates_active ON form_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_form_templates_type ON form_templates(form_type);
CREATE INDEX IF NOT EXISTS idx_form_submissions_patient ON form_submissions(patient_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_date ON form_submissions(submitted_at);
-- Protocols
CREATE INDEX IF NOT EXISTS idx_protocols_active ON clinical_protocols(is_active);
CREATE INDEX IF NOT EXISTS idx_protocol_executions_patient ON protocol_executions(patient_id);
CREATE INDEX IF NOT EXISTS idx_protocol_executions_status ON protocol_executions(resolution_status);
-- Beds
CREATE INDEX IF NOT EXISTS idx_beds_status ON beds(status);
CREATE INDEX IF NOT EXISTS idx_beds_ward ON beds(ward_name);
CREATE INDEX IF NOT EXISTS idx_bed_assignments_patient ON bed_assignments(patient_id);
CREATE INDEX IF NOT EXISTS idx_bed_assignments_status ON bed_assignments(status);
-- Staff
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_department ON users(department_id);
-- Audit
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_module ON audit_logs(module);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity);
-- ============================================================
-- 11. INITIAL DATA SEEDING
-- ============================================================
-- Insert default form field types
INSERT INTO form_field_types (field_type, config_schema)
VALUES (
        'TEXT',
        '{"maxLength": 255, "placeholder": "", "required": false}'
    ),
    (
        'NUMBER',
        '{"min": null, "max": null, "step": 1, "required": false}'
    ),
    (
        'DROPDOWN',
        '{"options": [], "multiple": false, "required": false}'
    ),
    (
        'DATE',
        '{"format": "YYYY-MM-DD", "minDate": null, "maxDate": null, "required": false}'
    ),
    ('CHECKBOX', '{"label": "", "required": false}'),
    (
        'TABLE',
        '{"columns": [], "rows": 1, "required": false}'
    ),
    ('SIGNATURE', '{"required": false}'),
    (
        'TEXTAREA',
        '{"maxLength": 1000, "rows": 4, "required": false}'
    ),
    ('RADIO', '{"options": [], "required": false}'),
    (
        'FILE',
        '{"accept": "*", "maxSize": 5242880, "required": false}'
    ) ON CONFLICT (field_type) DO NOTHING;
-- Insert default departments
INSERT INTO departments (dept_id, dept_name, description)
VALUES (
        'DEPT_EMERGENCY',
        'Emergency Department',
        'Emergency and trauma care'
    ),
    (
        'DEPT_ICU',
        'Intensive Care Unit',
        'Critical care and monitoring'
    ),
    (
        'DEPT_GENERAL',
        'General Medicine',
        'General medical consultations'
    ),
    (
        'DEPT_SURGERY',
        'Surgery',
        'Surgical procedures and care'
    ),
    (
        'DEPT_PEDIATRICS',
        'Pediatrics',
        'Child healthcare'
    ),
    (
        'DEPT_CARDIOLOGY',
        'Cardiology',
        'Heart and cardiovascular care'
    ),
    (
        'DEPT_ORTHOPEDICS',
        'Orthopedics',
        'Bone and joint care'
    ),
    (
        'DEPT_ADMIN',
        'Administration',
        'Hospital administration and management'
    ) ON CONFLICT (dept_id) DO NOTHING;
-- Insert default admin action types
INSERT INTO admin_action_types (action_code, action_name, description, severity)
VALUES (
        'CREATE_STAFF',
        'Create Staff Member',
        'New staff account created',
        'INFO'
    ),
    (
        'DELETE_STAFF',
        'Delete Staff Member',
        'Staff account deleted',
        'WARNING'
    ),
    (
        'MODIFY_STAFF',
        'Modify Staff Member',
        'Staff account modified',
        'INFO'
    ),
    (
        'PUBLISH_FORM',
        'Publish Form',
        'Form template published',
        'INFO'
    ),
    (
        'PUBLISH_PROTOCOL',
        'Publish Protocol',
        'Clinical protocol published',
        'WARNING'
    ),
    (
        'MODIFY_BED_CONFIG',
        'Modify Bed Configuration',
        'Bed or ward configuration changed',
        'INFO'
    ),
    (
        'EMERGENCY_OVERRIDE',
        'Emergency Override',
        'Emergency override activated',
        'CRITICAL'
    ),
    (
        'SYSTEM_CONFIG_CHANGE',
        'System Configuration Change',
        'System settings modified',
        'WARNING'
    ) ON CONFLICT (action_code) DO NOTHING;
-- Insert default bed types
INSERT INTO bed_types (
        bed_type_id,
        bed_type_name,
        description,
        features
    )
VALUES (
        'BED_GENERAL',
        'General Bed',
        'Standard hospital bed',
        '["BASIC_MONITORING"]'
    ),
    (
        'BED_ICU',
        'ICU Bed',
        'Intensive care bed with advanced monitoring',
        '["VENTILATOR", "ADVANCED_MONITORING", "OXYGEN"]'
    ),
    (
        'BED_VENTILATOR',
        'Ventilator Bed',
        'Bed with ventilator support',
        '["VENTILATOR", "OXYGEN", "ADVANCED_MONITORING"]'
    ),
    (
        'BED_ISOLATION',
        'Isolation Bed',
        'Isolation room bed',
        '["ISOLATION", "BASIC_MONITORING"]'
    ),
    (
        'BED_SEMI_PRIVATE',
        'Semi-Private Bed',
        'Semi-private room bed',
        '["BASIC_MONITORING"]'
    ) ON CONFLICT (bed_type_id) DO NOTHING;
-- ============================================================
-- END OF SCHEMA
-- ============================================================