-- 1. Visits Table (The backbone of the workflow)
CREATE TABLE IF NOT EXISTS visits (
    visit_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id VARCHAR(50) REFERENCES patients(patient_id_str),
    doctor_id INT REFERENCES users(id),
    visit_type VARCHAR(20) NOT NULL,
    -- OPD, IPD, EMERGENCY
    priority VARCHAR(20) DEFAULT 'NORMAL',
    status VARCHAR(30) DEFAULT 'REGISTERED',
    -- Statuses: REGISTERED, AT_NURSE, AT_DOCTOR, AT_LAB, BILLING_PENDING, COMPLETED
    queue_number SERIAL,
    check_in_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    discharge_time TIMESTAMP
);
-- 2. Nursing Assessments (Linked to Visit)
CREATE TABLE IF NOT EXISTS nursing_assessments (
    assessment_id SERIAL PRIMARY KEY,
    visit_id UUID REFERENCES visits(visit_id),
    nurse_id INT REFERENCES users(id),
    vitals JSONB,
    -- { "bp": "120/80", "temp": 37.5, "spo2": 98 }
    notes TEXT,
    consciousness_level VARCHAR(50),
    -- Alert, Drowsy, Unconscious
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- 3. Doctor Notes (Linked to Visit)
CREATE TABLE IF NOT EXISTS doctor_notes (
    note_id SERIAL PRIMARY KEY,
    visit_id UUID REFERENCES visits(visit_id),
    doctor_id INT REFERENCES users(id),
    chief_complaint TEXT,
    diagnosis TEXT,
    treatment_plan TEXT,
    prescription_data JSONB,
    -- [{ "drug": "Paracetamol", "dosage": "500mg", "freq": "BD" }]
    follow_up_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- 4. Lab Orders (Linked to Visit)
CREATE TABLE IF NOT EXISTS lab_orders (
    order_id SERIAL PRIMARY KEY,
    visit_id UUID REFERENCES visits(visit_id),
    ordered_by INT REFERENCES users(id),
    test_type VARCHAR(100) NOT NULL,
    sample_type VARCHAR(50),
    status VARCHAR(20) DEFAULT 'ORDERED',
    -- ORDERED, COLLECTED, COMPLETED
    results JSONB,
    -- { "count": "4500", "unit": "cells/mcL" }
    report_file_path VARCHAR(255),
    technician_id INT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);
-- 5. Invoices (Linked to Visit)
CREATE TABLE IF NOT EXISTS invoices (
    invoice_id SERIAL PRIMARY KEY,
    visit_id UUID REFERENCES visits(visit_id),
    generated_by INT REFERENCES users(id),
    line_items JSONB,
    -- [{ "item": "Consultation", "cost": 500 }, { "item": "CBC", "cost": 200 }]
    total_amount DECIMAL(10, 2),
    discount DECIMAL(10, 2) DEFAULT 0,
    final_amount DECIMAL(10, 2),
    status VARCHAR(20) DEFAULT 'PENDING',
    -- PENDING, PAID
    payment_method VARCHAR(50),
    paid_at TIMESTAMP
);
-- 6. Add Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_visits_status ON visits(status);
CREATE INDEX IF NOT EXISTS idx_visits_patient ON visits(patient_id);
CREATE INDEX IF NOT EXISTS idx_lab_status ON lab_orders(status);