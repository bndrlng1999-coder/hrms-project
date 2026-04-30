ALTER TABLE attendance
    ADD COLUMN IF NOT EXISTS approved_by BIGINT,
    ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS rejection_reason VARCHAR(1000);

ALTER TABLE attendance
    ALTER COLUMN status TYPE VARCHAR(40);

UPDATE attendance
SET status = 'APPROVED'
WHERE status = 'PRESENT';

UPDATE attendance
SET status = 'PENDING_APPROVAL'
WHERE status IS NULL;

DELETE FROM attendance a
USING attendance b
WHERE a.employee_id = b.employee_id
  AND a.attendance_date = b.attendance_date
  AND a.id > b.id;

ALTER TABLE attendance
    ADD CONSTRAINT uk_attendance_employee_date UNIQUE (employee_id, attendance_date);

ALTER TABLE attendance
    ADD CONSTRAINT fk_attendance_approved_by FOREIGN KEY (approved_by) REFERENCES users(id);
