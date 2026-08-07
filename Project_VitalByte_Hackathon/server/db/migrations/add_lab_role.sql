-- Update Users table to support LAB_ASSISTANT role
-- Run this migration to add lab assistant capabilities
-- Add LAB_ASSISTANT role support
ALTER TABLE users
ADD COLUMN IF NOT EXISTS department VARCHAR(100);
ALTER TABLE users
ADD COLUMN IF NOT EXISTS specialization VARCHAR(100);
ALTER TABLE users
ADD COLUMN IF NOT EXISTS license_number VARCHAR(50);
-- Update role constraint to include LAB_ASSISTANT
-- Note: This is a conceptual update. Actual implementation depends on your constraint setup.
-- Insert sample Lab Assistants (for testing)
INSERT INTO users (
        username,
        password_hash,
        role,
        full_name,
        email,
        department,
        status
    )
VALUES (
        'lab_assistant1',
        '$2a$10$examplehash1',
        'LAB_ASSISTANT',
        'John Lab Tech',
        'john.lab@hospital.com',
        'Andrology Lab',
        'ACTIVE'
    ),
    (
        'lab_assistant2',
        '$2a$10$examplehash2',
        'LAB_ASSISTANT',
        'Sarah Micro',
        'sarah.micro@hospital.com',
        'Microbiology Lab',
        'ACTIVE'
    ) ON CONFLICT (username) DO NOTHING;
-- Grant permissions (conceptual - implement based on your auth system)
COMMENT ON TABLE lab_orders IS 'Lab orders can be created by DOCTOR role';
COMMENT ON TABLE lab_reports IS 'Lab reports can be filled by LAB_ASSISTANT role';