-- ============================================================
-- ADMIN MODULE DATABASE SETUP SCRIPT
-- Run this script to set up the complete admin module
-- ============================================================
-- Step 1: Run the main admin module schema
\ i server / db / schema / admin_module_schema.sql -- Step 2: Verify table creation
SELECT schemaname,
    tablename
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN (
        'form_templates',
        'form_field_types',
        'form_submissions',
        'clinical_protocols',
        'protocol_executions',
        'ward_configuration',
        'bed_types',
        'bed_assignment_rules',
        'bed_assignments',
        'departments',
        'staff_permissions',
        'staff_credentials',
        'patient_status_history',
        'report_templates',
        'report_executions',
        'hospital_config',
        'emergency_overrides',
        'admin_action_types'
    )
ORDER BY tablename;
-- Step 3: Verify initial data seeding
SELECT 'Form Field Types' as category,
    COUNT(*) as count
FROM form_field_types
UNION ALL
SELECT 'Departments',
    COUNT(*)
FROM departments
UNION ALL
SELECT 'Admin Action Types',
    COUNT(*)
FROM admin_action_types
UNION ALL
SELECT 'Bed Types',
    COUNT(*)
FROM bed_types;
-- Step 4: Create a test admin user (if not exists)
INSERT INTO users (
        username,
        password_hash,
        role,
        full_name,
        email,
        status
    )
VALUES (
        'admin',
        '$2a$10$YourHashedPasswordHere',
        -- Replace with actual bcrypt hash
        'ADMIN',
        'System Administrator',
        'admin@hospital.com',
        'ACTIVE'
    ) ON CONFLICT (username) DO NOTHING;
-- Step 5: Grant admin permissions (example)
-- This is handled by the application, but you can manually grant if needed
SELECT 'Admin Module Setup Complete!' as status;