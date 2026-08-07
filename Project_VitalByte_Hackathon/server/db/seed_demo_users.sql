-- ============================================================
-- SEED DEMO USERS FOR HOSPITAL MANAGEMENT SYSTEM
-- Run this script to create demo users for testing
-- ============================================================
-- Default password for all demo users: password123
-- Hashed using bcrypt with salt rounds = 10
-- Hash: $2a$10$8kF5p3K7QxYvK5h3K7QxYOK5h3K7QxYvK5h3K7QxYvK5h3K7QxYvKe
-- Note: You should run this with actual bcrypt hashes
-- For now, let's create a helper script to generate proper hashes
-- Admin User
INSERT INTO users (
        username,
        email,
        password_hash,
        role,
        full_name,
        status,
        specialization,
        phone_number
    )
VALUES (
        'admin',
        'admin@hospital.com',
        '$2a$10$YourActualBcryptHashHere',
        -- Replace with actual hash
        'ADMIN',
        'System Administrator',
        'ACTIVE',
        NULL,
        '+1234567890'
    ) ON CONFLICT (email) DO
UPDATE
SET username = EXCLUDED.username,
    password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role,
    full_name = EXCLUDED.full_name,
    status = EXCLUDED.status;
-- Doctor User
INSERT INTO users (
        username,
        email,
        password_hash,
        role,
        full_name,
        status,
        specialization,
        phone_number
    )
VALUES (
        'doctor',
        'doctor@hospital.com',
        '$2a$10$YourActualBcryptHashHere',
        -- Replace with actual hash
        'DOCTOR',
        'Dr. John Smith',
        'ACTIVE',
        'General Medicine',
        '+1234567891'
    ) ON CONFLICT (email) DO
UPDATE
SET username = EXCLUDED.username,
    password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role,
    full_name = EXCLUDED.full_name,
    status = EXCLUDED.status;
-- Nurse User
INSERT INTO users (
        username,
        email,
        password_hash,
        role,
        full_name,
        status,
        specialization,
        phone_number
    )
VALUES (
        'nurse',
        'nurse@hospital.com',
        '$2a$10$YourActualBcryptHashHere',
        -- Replace with actual hash
        'NURSE',
        'Sarah Johnson',
        'ACTIVE',
        NULL,
        '+1234567892'
    ) ON CONFLICT (email) DO
UPDATE
SET username = EXCLUDED.username,
    password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role,
    full_name = EXCLUDED.full_name,
    status = EXCLUDED.status;
-- Front Desk User
INSERT INTO users (
        username,
        email,
        password_hash,
        role,
        full_name,
        status,
        specialization,
        phone_number
    )
VALUES (
        'frontdesk',
        'frontdesk@hospital.com',
        '$2a$10$YourActualBcryptHashHere',
        -- Replace with actual hash
        'FRONT_DESK',
        'Michael Brown',
        'ACTIVE',
        NULL,
        '+1234567893'
    ) ON CONFLICT (email) DO
UPDATE
SET username = EXCLUDED.username,
    password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role,
    full_name = EXCLUDED.full_name,
    status = EXCLUDED.status;
-- Verify users were created
SELECT id,
    username,
    email,
    role,
    full_name,
    status
FROM users
WHERE email LIKE '%@hospital.com';