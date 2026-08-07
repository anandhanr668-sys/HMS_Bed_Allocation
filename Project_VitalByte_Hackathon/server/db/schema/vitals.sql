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