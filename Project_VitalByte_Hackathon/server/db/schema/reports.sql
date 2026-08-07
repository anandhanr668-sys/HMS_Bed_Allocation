CREATE TABLE IF NOT EXISTS treatment_history (
    id SERIAL PRIMARY KEY,
    patient_id VARCHAR(50) REFERENCES patients(patient_id_str),
    form_id VARCHAR(50),
    data JSONB,
    summary TEXT,
    captured_by INT REFERENCES users(id),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);