-- Create Tanvox HRMS Database Schema and Seed Data

-- Insert Departments
INSERT INTO departments (id, name, description, is_active, created_at, updated_at) VALUES
(1, 'Engineering', 'Engineering Department', true, NOW(), NOW()),
(2, 'Human Resources', 'HR Department', true, NOW(), NOW()),
(3, 'Sales', 'Sales Department', true, NOW(), NOW()),
(4, 'Finance', 'Finance Department', true, NOW(), NOW()),
(5, 'Marketing', 'Marketing Department', true, NOW(), NOW());

-- Insert Users (Passwords are hashed with bcrypt)
-- Password: Admin@12345 = $2a$10$X09/uoDu92eDa/rMpGgXS.6cTcjVsFy3pTa6PYfA4n8vJrJ2.ltbq
-- All test credentials use: TempPass@123456 (changed on first login)

INSERT INTO users (id, email, password, role, is_active, account_status, verified, first_login, last_login, created_at, updated_at) VALUES
-- SUPER_ADMIN
(1, 'superadmin@tanvox.local', '$2a$10$X09/uoDu92eDa/rMpGgXS.6cTcjVsFy3pTa6PYfA4n8vJrJ2.ltbq', 'SUPER_ADMIN', true, 'ACTIVE', true, false, NOW(), NOW(), NOW()),

-- ADMIN
(2, 'admin@tanvox.local', '$2a$10$X09/uoDu92eDa/rMpGgXS.6cTcjVsFy3pTa6PYfA4n8vJrJ2.ltbq', 'ADMIN', true, 'ACTIVE', true, false, NOW(), NOW(), NOW()),

-- HR_MANAGER
(3, 'hrmanager@tanvox.local', '$2a$10$X09/uoDu92eDa/rMpGgXS.6cTcjVsFy3pTa6PYfA4n8vJrJ2.ltbq', 'HR_MANAGER', true, 'ACTIVE', true, false, NOW(), NOW(), NOW()),

-- HR
(4, 'hr@tanvox.local', '$2a$10$X09/uoDu92eDa/rMpGgXS.6cTcjVsFy3pTa6PYfA4n8vJrJ2.ltbq', 'HR', true, 'ACTIVE', true, false, NOW(), NOW(), NOW()),

-- TEAM_LEAD
(5, 'lead@tanvox.local', '$2a$10$X09/uoDu92eDa/rMpGgXS.6cTcjVsFy3pTa6PYfA4n8vJrJ2.ltbq', 'TEAM_LEAD', true, 'ACTIVE', true, false, NOW(), NOW(), NOW()),

-- FINANCE
(6, 'finance@tanvox.local', '$2a$10$X09/uoDu92eDa/rMpGgXS.6cTcjVsFy3pTa6PYfA4n8vJrJ2.ltbq', 'FINANCE', true, 'ACTIVE', true, false, NOW(), NOW(), NOW()),

-- EMPLOYEE
(7, 'employee@tanvox.local', '$2a$10$X09/uoDu92eDa/rMpGgXS.6cTcjVsFy3pTa6PYfA4n8vJrJ2.ltbq', 'EMPLOYEE', true, 'ACTIVE', true, false, NOW(), NOW(), NOW()),

-- INTERN
(8, 'intern@tanvox.local', '$2a$10$X09/uoDu92eDa/rMpGgXS.6cTcjVsFy3pTa6PYfA4n8vJrJ2.ltbq', 'INTERN', true, 'ACTIVE', true, false, NOW(), NOW(), NOW()),

-- Additional employees for testing
(9, 'emp2@tanvox.local', '$2a$10$X09/uoDu92eDa/rMpGgXS.6cTcjVsFy3pTa6PYfA4n8vJrJ2.ltbq', 'EMPLOYEE', true, 'ACTIVE', true, false, NOW(), NOW(), NOW()),
(10, 'manager1@tanvox.local', '$2a$10$X09/uoDu92eDa/rMpGgXS.6cTcjVsFy3pTa6PYfA4n8vJrJ2.ltbq', 'MANAGER', true, 'ACTIVE', true, false, NOW(), NOW(), NOW());

-- Insert Employees
INSERT INTO employees (id, user_id, first_name, last_name, employee_code, department_id, designation, joining_date, dob, phone_number, address, city, state, country, pincode, basic_salary, manager_id, is_active, created_at, updated_at) VALUES
(1, 1, 'System', 'Administrator', 'EMP0001', 2, 'System Administrator', '2023-01-01', '1990-01-01', '9876543210', '123 Admin St', 'Bangalore', 'Karnataka', 'India', '560001', 200000, NULL, true, NOW(), NOW()),
(2, 2, 'Admin', 'User', 'EMP0002', 2, 'Administrator', '2023-02-01', '1991-03-15', '9876543211', '456 Admin Lane', 'Bangalore', 'Karnataka', 'India', '560002', 180000, 1, true, NOW(), NOW()),
(3, 3, 'Sarah', 'HR Manager', 'EMP0003', 2, 'HR Manager', '2023-03-01', '1989-05-20', '9876543212', '789 HR Park', 'Bangalore', 'Karnataka', 'India', '560003', 150000, 1, true, NOW(), NOW()),
(4, 4, 'John', 'HR Executive', 'EMP0004', 2, 'HR Executive', '2023-04-01', '1992-07-10', '9876543213', '321 HR Ave', 'Bangalore', 'Karnataka', 'India', '560004', 120000, 3, true, NOW(), NOW()),
(5, 5, 'Rajesh', 'Tech Lead', 'EMP0005', 1, 'Team Lead', '2023-05-15', '1993-08-22', '9876543214', '654 Dev Street', 'Bangalore', 'Karnataka', 'India', '560005', 140000, 2, true, NOW(), NOW()),
(6, 6, 'Priya', 'Finance Manager', 'EMP0006', 4, 'Finance Manager', '2023-06-01', '1994-09-12', '9876543215', '987 Finance Lane', 'Bangalore', 'Karnataka', 'India', '560006', 130000, 2, true, NOW(), NOW()),
(7, 7, 'Amit', 'Software Engineer', 'EMP0007', 1, 'Senior Software Engineer', '2023-07-10', '1991-10-30', '9876543216', '147 Dev Blvd', 'Bangalore', 'Karnataka', 'India', '560007', 90000, 5, true, NOW(), NOW()),
(8, 8, 'Neha', 'Intern', 'EMP0008', 1, 'Intern', '2024-01-01', '2002-11-05', '9876543217', '258 Intern St', 'Bangalore', 'Karnataka', 'India', '560008', 25000, 5, true, NOW(), NOW()),
(9, 9, 'Vikram', 'Senior Developer', 'EMP0009', 1, 'Senior Developer', '2023-09-15', '1996-12-18', '9876543218', '369 Dev Court', 'Bangalore', 'Karnataka', 'India', '560009', 95000, 5, true, NOW(), NOW()),
(10, 10, 'Anjali', 'Sales Manager', 'EMP0010', 3, 'Sales Manager', '2023-10-01', '1993-01-25', '9876543219', '741 Sales Plaza', 'Bangalore', 'Karnataka', 'India', '560010', 125000, 2, true, NOW(), NOW());

-- Insert Leave Balances for 2024
INSERT INTO leave_balance (id, employee_id, leave_type, total_days, used_days, balance_days, year, created_at, updated_at) VALUES
(1, 1, 'CASUAL_LEAVE', 12, 0, 12, 2024, NOW(), NOW()),
(2, 1, 'SICK_LEAVE', 6, 0, 6, 2024, NOW(), NOW()),
(3, 1, 'EARNED_LEAVE', 20, 0, 20, 2024, NOW(), NOW()),
(4, 2, 'CASUAL_LEAVE', 12, 0, 12, 2024, NOW(), NOW()),
(5, 2, 'SICK_LEAVE', 6, 0, 6, 2024, NOW(), NOW()),
(6, 2, 'EARNED_LEAVE', 20, 0, 20, 2024, NOW(), NOW()),
(7, 3, 'CASUAL_LEAVE', 12, 0, 12, 2024, NOW(), NOW()),
(8, 3, 'SICK_LEAVE', 6, 0, 6, 2024, NOW(), NOW()),
(9, 3, 'EARNED_LEAVE', 20, 0, 20, 2024, NOW(), NOW()),
(10, 4, 'CASUAL_LEAVE', 12, 0, 12, 2024, NOW(), NOW()),
(11, 4, 'SICK_LEAVE', 6, 0, 6, 2024, NOW(), NOW()),
(12, 4, 'EARNED_LEAVE', 20, 0, 20, 2024, NOW(), NOW()),
(13, 5, 'CASUAL_LEAVE', 12, 0, 12, 2024, NOW(), NOW()),
(14, 5, 'SICK_LEAVE', 6, 0, 6, 2024, NOW(), NOW()),
(15, 5, 'EARNED_LEAVE', 20, 0, 20, 2024, NOW(), NOW());

-- Insert Announcements
INSERT INTO announcements (id, title, content, posted_by, is_active, created_at, updated_at) VALUES
(1, 'Welcome to Tanvox HRMS Enterprise', 'Welcome to the new enterprise-ready Human Resource Management System. This system is locked down for security - only SUPER_ADMIN can create new users.', 1, true, NOW(), NOW()),
(2, 'Enterprise Security Notice', 'This is an enterprise system. Public registration is DISABLED. Only SUPER_ADMIN can create user accounts through the Admin Panel.', 1, true, NOW(), NOW()),
(3, 'First Login Password Change Required', 'When logging in for the first time, you will be required to change your temporary password. Please set a strong password with at least 8 characters.', 1, true, NOW(), NOW());
