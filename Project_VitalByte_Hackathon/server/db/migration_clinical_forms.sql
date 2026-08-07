-- ============================================================
-- CLINICAL FORM ARCHITECTURE (v2.0)
-- SINGLE SOURCE OF TRUTH MIGRATION
-- ============================================================
-- 1. Clinical Forms Master (Templates)
CREATE TABLE IF NOT EXISTS clinical_forms (
    id SERIAL PRIMARY KEY,
    form_code VARCHAR(100) UNIQUE NOT NULL,
    -- e.g. 'SEMEN_ANALYSIS'
    form_name VARCHAR(200) NOT NULL,
    form_type VARCHAR(50) DEFAULT 'LAB_REPORT',
    -- LAB_REPORT, CLINICAL_NOTE, NURSE_CHART
    version_id VARCHAR(20) DEFAULT '1.0',
    schema_json JSONB NOT NULL,
    ui_config JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- 2. Unified Form Submissions (Data)
CREATE TABLE IF NOT EXISTS form_submissions (
    id SERIAL PRIMARY KEY,
    submission_id VARCHAR(50) UNIQUE NOT NULL,
    -- e.g. 'SUB-1770744042687'
    form_code VARCHAR(100) REFERENCES clinical_forms(form_code),
    form_version_id VARCHAR(20) NOT NULL,
    patient_id VARCHAR(50) NOT NULL,
    order_id VARCHAR(50),
    -- Link to lab_orders if applicable
    visit_id UUID,
    -- Link to visits if applicable
    submitted_by INT NOT NULL,
    field_values_json JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'SUBMITTED',
    -- SUBMITTED, DRAFT, VOID
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- 3. Link Catalog to Forms
ALTER TABLE lab_test_catalog
ADD COLUMN IF NOT EXISTS form_code VARCHAR(100) REFERENCES clinical_forms(form_code);
-- 4. Initial Seed for Semen Analysis
-- (We will populate the schema_json using the existing builder data)