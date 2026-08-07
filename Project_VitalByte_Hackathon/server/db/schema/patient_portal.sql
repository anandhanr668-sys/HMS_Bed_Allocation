-- Secure credentials for Patient Portal access
CREATE TABLE IF NOT EXISTS patient_credentials (
    patient_id VARCHAR(50) REFERENCES patients(patient_id_str) ON DELETE CASCADE PRIMARY KEY,
    password_hash VARCHAR(255) NOT NULL,
    -- Initial password can be set to Mobile Number
    otp_secret VARCHAR(50),
    -- For future 2FA
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Index for fast lookup during login
CREATE INDEX IF NOT EXISTS idx_patient_creds_id ON patient_credentials(patient_id);