# Tanvox HRMS - Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Client Browser                             │
│                   (http://localhost:5173)                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    React + Vite Frontend                         │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Components: Navbar, Sidebar                             │   │
│  │ Pages: Login, Dashboard, Employees, Attendance, etc.   │   │
│  │ State Management: React Context (Auth)                  │   │
│  │ HTTP Client: Axios with interceptors                    │   │
│  │ UI: Tailwind CSS (Blue/Gray/White theme)               │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                        HTTP/REST
                        JWT Token
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                  Spring Boot Backend                            │
│               (http://localhost:8080/api)                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Controllers: Auth, Employee, Attendance, Leave, etc.   │   │
│  │ Services: Business logic layer                          │   │
│  │ Repositories: Database access (JPA)                     │   │
│  │ Security: JWT + Role-Based Access Control              │   │
│  │ Framework: Spring Boot 3.2                             │   │
│  │ Java Version: 21                                        │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                        JDBC Driver
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    MySQL Database                               │
│               (localhost:3306/nikhil_hrms)                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Tables: Users, Employees, Departments, Attendance,      │   │
│  │         LeaveRequests, Payroll, Payslips, Documents,    │   │
│  │         Announcements, HelpdeskTickets                  │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Request Flow

1. User enters credentials on login page
2. Frontend sends POST request to `/api/auth/login`
3. Backend validates credentials and generates JWT token
4. Frontend stores token in localStorage
5. Subsequent requests include token in Authorization header
6. Backend validates token and processes request
7. Response returned to frontend with data
8. Frontend updates state and re-renders UI

## Authentication Flow

```
User Login Form
       ↓
Axios POST /api/auth/login
       ↓
Backend validates email & password
       ↓
Generate JWT Token
       ↓
Return Token + User Info
       ↓
Store in localStorage
       ↓
Add to Authorization header for future requests
       ↓
JwtAuthenticationFilter validates token
       ↓
Grant access or redirect to login
```

## Role-Based Access Control

```
Admin/HR Role:
├── Dashboard (Full Statistics)
├── Employee Management (CRUD)
├── Attendance Management
├── Leave Approval
├── Payroll Management
├── Announcements
└── Document Management

Manager Role:
├── Dashboard (Team View)
├── Employee List (Team Only)
├── Attendance Tracking
├── Leave Approval
├── Helpdesk
└── View Announcements

Employee Role:
├── Personal Dashboard
├── Apply Leave
├── Mark Attendance
├── View Payslips
├── Helpdesk Support
├── View Announcements
└── View Documents
```

## Database Schema

### Users Table
- user_id (PK)
- email (UNIQUE)
- password (hashed)
- role (ENUM: ADMIN, MANAGER, EMPLOYEE)
- is_active
- created_at, updated_at

### Employees Table
- employee_id (PK)
- user_id (FK)
- first_name, last_name
- employee_code (UNIQUE)
- department_id (FK)
- designation
- joining_date, dob
- contact info, address
- basic_salary
- manager_id
- is_active

### Departments Table
- department_id (PK)
- name
- head_id
- is_active

### Attendance Table
- attendance_id (PK)
- employee_id (FK)
- attendance_date
- status (PRESENT, ABSENT, LEAVE, REGULARIZATION_PENDING)
- check_in_time, check_out_time
- remarks

### LeaveRequests Table
- leave_request_id (PK)
- employee_id (FK)
- leave_type (CASUAL, SICK, EARNED)
- from_date, to_date
- number_of_days
- reason
- status (PENDING, APPROVED, REJECTED)
- approved_by, approval_date

### LeaveBalance Table
- leave_balance_id (PK)
- employee_id (FK)
- leave_type
- total_days
- used_days
- balance_days
- year

### Payroll Table
- payroll_id (PK)
- employee_id (FK)
- month, year
- basic_salary, hra, allowances, deductions
- gross_salary, net_salary
- paid_date

### Payslips Table
- payslip_id (PK)
- payroll_id (FK)
- employee_id (FK)
- month, year
- pdf_path
- issued_date

### HelpdeskTickets Table
- ticket_id (PK)
- employee_id (FK)
- ticket_number (UNIQUE)
- title, description
- category (PAYROLL, ATTENDANCE, LEAVE, DOCUMENTS, GENERAL)
- status (OPEN, IN_PROGRESS, RESOLVED)
- priority, assigned_to
- resolution_notes
- resolved_at

### Documents Table
- document_id (PK)
- name, description
- document_type (POLICY, HR_LETTER, EMPLOYEE_DOCUMENT, OTHER)
- file_path
- uploaded_by

### Announcements Table
- announcement_id (PK)
- title, content
- posted_by
- is_active

## API Endpoints

### Authentication
- POST /auth/login - Login
- POST /auth/register - Register Employee
- GET /auth/validate - Validate Token

### Employees
- GET /employees - List all
- GET /employees/{id} - Get by ID
- GET /employees/user/{userId} - Get by User ID
- GET /employees/department/{deptId} - Get by Department
- PUT /employees/{id} - Update
- DELETE /employees/{id} - Delete (soft)

### Attendance
- GET /attendance - Get all
- GET /attendance/employee/{empId} - Get employee attendance
- POST /attendance - Mark attendance

### Leave
- POST /leave/apply - Apply leave
- GET /leave/employee/{empId} - Get employee leaves
- GET /leave/pending - Get pending leaves
- PUT /leave/{id}/approve - Approve leave
- PUT /leave/{id}/reject - Reject leave

### Payslips
- GET /payslips - Get all
- GET /payslips/employee/{empId} - Get employee payslips

### Announcements
- GET /announcements - Get all
- POST /announcements - Create
- GET /announcements/{id} - Get by ID
- PUT /announcements/{id} - Update
- DELETE /announcements/{id} - Delete

### Dashboard
- GET /dashboard/stats - Get statistics

### Departments
- GET /departments - Get all

### Helpdesk & Documents
- GET /helpdesk/tickets - Get tickets
- POST /helpdesk/tickets - Create ticket
- GET /documents - Get all documents
- POST /documents - Upload document

## Deployment Architecture

### Production Setup
```
Domain: hrms.example.com

Frontend (Static Site)
├── Hosted on: Nginx/Apache/CloudFront
├── Port: 80/443 (HTTPS)
├── Build: Vite production build
└── Environment: Production API URL

Backend (Application Server)
├── Server: AWS EC2/Azure VM/DigitalOcean
├── Container: Java 21 runtime
├── Port: 8080 (behind reverse proxy)
├── Database: AWS RDS MySQL / Azure Database
└── Environment: Kubernetes/Docker (optional)

Database (Managed Service)
├── AWS RDS MySQL 8.0
├── Automated backups
├── Read replicas (optional)
└── Monitoring & Alerts

CDN & Security
├── CloudFront/CDN for static files
├── SSL/TLS encryption
├── WAF (Web Application Firewall)
└── DDoS protection
```

## Security Considerations

1. **Authentication**
   - JWT tokens expire after 24 hours
   - Tokens stored in localStorage (consider using HttpOnly cookies)
   - Refresh token mechanism (future enhancement)

2. **Authorization**
   - Role-based access control
   - Method-level security annotations
   - CORS configuration

3. **Data Protection**
   - Passwords hashed with BCrypt
   - HTTPS/TLS for all communications
   - SQL injection prevention via JPA
   - XSS protection via React

4. **Database**
   - Connection pooling
   - Prepared statements
   - Encrypted passwords
   - User data isolation by role

## Performance Optimization

1. **Frontend**
   - Code splitting with React Router
   - Lazy loading for components
   - Image optimization
   - Minification and bundling with Vite

2. **Backend**
   - Database indexing on frequently queried columns
   - Connection pooling (HikariCP)
   - Caching with Redis (future)
   - Pagination for large datasets

3. **Database**
   - Proper indexing
   - Query optimization
   - Backup strategy
   - Read replicas for scaling

## Monitoring & Logging

- Backend logs: Spring Boot logs (SLF4J/Logback)
- Frontend errors: Browser console + error boundaries
- Database: MySQL error logs
- Application metrics: Spring Boot Actuator (future)
- Performance monitoring: APM tools (New Relic, DataDog - future)

## Disaster Recovery

1. **Backup Strategy**
   - Daily automated MySQL backups
   - Point-in-time recovery capability
   - Code repository backup (GitHub)

2. **High Availability**
   - Load balancer for backend
   - Database failover
   - CDN for frontend

3. **Incident Response**
   - Error alerting via email/Slack
   - Runbooks for common issues
   - Regular backup restoration testing

---

This architecture provides a scalable, secure, and maintainable HRMS system that can grow with your organization's needs.
