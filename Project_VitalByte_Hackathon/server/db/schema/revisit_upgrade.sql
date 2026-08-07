-- Enhance Lab Orders to support specific assignment and sensitive tests
ALTER TABLE lab_orders
ADD COLUMN IF NOT EXISTS assigned_technician_id INT REFERENCES users(id),
    ADD COLUMN IF NOT EXISTS is_sensitive BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS instructions TEXT;
-- Index for faster lookup of assigned tasks
CREATE INDEX IF NOT EXISTS idx_lab_assigned ON lab_orders(assigned_technician_id);
-- Ensure Visits table tracks the permanent patient ID correctly (already done, but good to verify constraints)
-- Just adding a comment here effectively.