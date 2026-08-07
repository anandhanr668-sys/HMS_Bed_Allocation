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