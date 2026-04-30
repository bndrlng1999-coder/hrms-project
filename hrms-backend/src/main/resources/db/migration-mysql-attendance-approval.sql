ALTER TABLE attendance
    ADD COLUMN IF NOT EXISTS approved_by BIGINT NULL,
    ADD COLUMN IF NOT EXISTS approved_at DATETIME NULL,
    ADD COLUMN IF NOT EXISTS rejection_reason VARCHAR(1000) NULL;

ALTER TABLE attendance
    MODIFY status VARCHAR(40) NOT NULL;

UPDATE attendance
SET status = 'APPROVED'
WHERE status = 'PRESENT';

UPDATE attendance
SET status = 'PENDING_APPROVAL'
WHERE status IS NULL;

DELETE a1 FROM attendance a1
INNER JOIN attendance a2
    ON a1.employee_id = a2.employee_id
    AND a1.attendance_date = a2.attendance_date
    AND a1.id > a2.id;

ALTER TABLE attendance
    ADD CONSTRAINT uk_attendance_employee_date UNIQUE (employee_id, attendance_date);

ALTER TABLE attendance
    ADD CONSTRAINT fk_attendance_approved_by FOREIGN KEY (approved_by) REFERENCES users(id);
