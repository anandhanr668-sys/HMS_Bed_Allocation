-- Database Schema for Admin & No-Code Config
-- 1. Form Schemas (Enhanced for LCNC)
CREATE TABLE IF NOT EXISTS form_schemas (
    id SERIAL PRIMARY KEY,
    form_id VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    -- Registration, Clinical, Lab, Nursing
    schema_json JSONB NOT NULL,
    -- The Draggable field data
    ui_config JSONB,
    -- Colors, fonts, layout settings
    target_roles TEXT [],
    -- ['DOCTOR', 'NURSE', 'FRONT_DESK']
    is_active BOOLEAN DEFAULT TRUE,
    version INT DEFAULT 1,
    created_by INT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- 2. Clinical Protocol Rules
CREATE TABLE IF NOT EXISTS protocol_rules (
    id SERIAL PRIMARY KEY,
    protocol_name VARCHAR(100) NOT NULL,
    description TEXT,
    vitals_conditions JSONB NOT NULL,
    -- { "spo2": { "min": 90, "severity": "HIGH" } }
    alert_config JSONB,
    -- { "notify": ["DOCTOR", "NURSE"], "channel": "DASHBOARD" }
    is_enabled BOOLEAN DEFAULT TRUE,
    version INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- 3. Audit Logging
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    action VARCHAR(255) NOT NULL,
    module VARCHAR(50),
    -- 'FORMS', 'BEDS', 'STAFF', 'PROTOCOLS'
    entity_id VARCHAR(100),
    details JSONB,
    ip_address VARCHAR(45),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- 4. Wards & Units
CREATE TABLE IF NOT EXISTS wards (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    -- OPD, General, ICU, Emergency
    type VARCHAR(50),
    floor VARCHAR(20),
    capacity INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- 5. Staff Permission Overrides (Optional granular control)
CREATE TABLE IF NOT EXISTS user_permissions (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    permission_key VARCHAR(100) NOT NULL,
    is_allowed BOOLEAN DEFAULT TRUE,
    UNIQUE(user_id, permission_key)
);