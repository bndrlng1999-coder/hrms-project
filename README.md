# Tanvox HRMS - Full-Stack HRMS Application

A comprehensive Human Resource Management System built with modern technologies. Original branding, design, and layout inspired by professional SaaS HRMS solutions.

## Tech Stack

### Frontend
- **React 18** - UI library
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **React Hot Toast** - Notifications

### Backend
- **Spring Boot 3** - Framework
- **Java 21** - Programming language
- **MySQL 8** - Database
- **JWT** - Authentication
- **Spring Security** - Authorization
- **JPA/Hibernate** - ORM

## Project Structure

```
├── hrms-backend/          # Spring Boot Backend
│   ├── pom.xml
│   └── src/
│       └── main/
│           ├── java/com/nikhilhrms/
│           │   ├── entity/               # Database entities
│           │   ├── repository/           # Data access layer
│           │   ├── service/              # Business logic
│           │   ├── controller/           # REST endpoints
│           │   ├── dto/                  # Data transfer objects
│           │   ├── security/             # JWT & Security
│           │   ├── config/               # Configuration
│           │   └── TanvoxHrmsApplication.java
│           └── resources/
│               ├── application.properties
│               └── seed-data.sql
│
└── hrms-frontend/         # React + Vite Frontend
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css
        ├── services/
        │   └── api.js                  # API client
        ├── context/
        │   └── AuthContext.jsx         # Auth context
        ├── hooks/
        │   └── useNotification.js      # Toast notifications
        ├── components/
        │   ├── Navbar.jsx
        │   └── Sidebar.jsx
        └── pages/
            ├── LoginPage.jsx
            ├── DashboardPage.jsx
            ├── EmployeePage.jsx
            ├── AttendancePage.jsx
            ├── LeavePage.jsx
            ├── PayslipPage.jsx
            ├── AnnouncementPage.jsx
            ├── HelpdeskPage.jsx
            └── DocumentPage.jsx
```

## Features

### Authentication
- ✅ JWT-based login
- ✅ Role-based access control (Admin, Manager, Employee)
- ✅ Secure token management
- ✅ Auto-logout on token expiration

### Employee Management
- ✅ View all employees
- ✅ Employee details (personal, contact, salary info)
- ✅ Department-wise employee grouping
- ✅ Search and filter employees

### Attendance Management
- ✅ Mark attendance
- ✅ Check-in/Check-out tracking
- ✅ Attendance history
- ✅ Daily attendance statistics

### Leave Management
- ✅ Apply for leaves (Casual, Sick, Earned)
- ✅ Leave balance tracking
- ✅ Manager/HR approval workflow
- ✅ Leave history and status

### Payroll Module
- ✅ View payslips
- ✅ Download payslip PDFs
- ✅ Salary structure display
- ✅ Monthly payroll summary

### HR Dashboard
- ✅ Total employees count
- ✅ Present/Absent today
- ✅ Pending leave requests
- ✅ Payroll summary
- ✅ Quick statistics

### Additional Features
- ✅ Announcements management
- ✅ Helpdesk ticketing
- ✅ Company documents
- ✅ Responsive design
- ✅ Toast notifications
- ✅ Loading states

## Database Setup

### Prerequisites
- MySQL Server 8.0 or later
- Java 21
- Node.js 18+ and npm

### Create Database
```sql
CREATE DATABASE nikhil_hrms;
```

### Seed Data
The application automatically creates tables via JPA. To add seed data:
1. Copy contents of `hrms-backend/src/main/resources/seed-data.sql`
2. Run in MySQL client:
```sql
USE nikhil_hrms;
-- Paste seed-data.sql content here
```

## Backend Setup

### 1. Install Dependencies
```bash
cd hrms-backend
# Dependencies are managed by Maven
```

### 2. Configure Database
Edit `src/main/resources/application.properties`:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/nikhil_hrms
spring.datasource.username=root
spring.datasource.password=your_password
```

### 3. Update JWT Secret
Edit `application.properties`:
```properties
jwt.secret=your_secret_key_min_256_bits_long
jwt.expiration=86400000
```

### 4. Build & Run
```bash
mvn clean install
mvn spring-boot:run
```

Backend will run on: `http://localhost:8080`

### API Documentation
```
POST   /api/auth/login              - User login
POST   /api/auth/register           - Employee registration
GET    /api/employees               - List all employees
GET    /api/attendance              - Get attendance records
POST   /api/attendance              - Mark attendance
GET    /api/leave/pending           - Get pending leaves
POST   /api/leave/apply             - Apply for leave
GET    /api/payslips                - Get payslips
GET    /api/announcements           - Get announcements
GET    /api/dashboard/stats         - Dashboard statistics
```

## Frontend Setup

### 1. Install Dependencies
```bash
cd hrms-frontend
npm install
```

### 2. Configure Backend URL
Edit `src/services/api.js`:
```javascript
const API_BASE_URL = 'http://localhost:8080/api';
```

### 3. Development Server
```bash
npm run dev
```

Frontend will run on: `http://localhost:5173`

### 4. Production Build
```bash
npm run build
npm run preview
```

## Demo Credentials

### Admin
- Email: `nikhil@tanvox.com`
- Password: `password123`
- Role: Admin

### Manager
- Email: `manager1@tanvox.com`
- Password: `password123`
- Role: Manager

### Employee
- Email: `emp1@tanvox.com`
- Password: `password123`
- Role: Employee

## Key Database Entities

### Users
- Email, Password (bcrypt hashed)
- Role (ADMIN, MANAGER, EMPLOYEE)
- Active status

### Employees
- Personal details
- Contact information
- Department and designation
- Salary information
- Manager hierarchy

### Attendance
- Date and time tracking
- Status (PRESENT, ABSENT, LEAVE, etc.)
- Check-in/Check-out times

### Leave Requests
- Leave type (Casual, Sick, Earned)
- Date range
- Status (PENDING, APPROVED, REJECTED)
- Approval tracking

### Payroll
- Monthly salary structure
- Basic salary, HRA, allowances
- Deductions and net salary
- Payment tracking

### Helpdesk Tickets
- Category (Payroll, Attendance, Leave, etc.)
- Status tracking
- Priority levels
- Resolution notes

### Announcements
- Title and content
- Posted by tracking
- Active/Inactive status

## CORS Configuration

Backend CORS is configured to accept requests from:
- `http://localhost:5173` (Frontend dev)
- `http://localhost:3000` (Alternative dev port)

Update in `SecurityConfig.java` if deploying to different domains.

## Security Features

- ✅ JWT token-based authentication
- ✅ Password hashing with BCrypt
- ✅ Role-based access control
- ✅ CORS configuration
- ✅ Session management
- ✅ Auto-logout on token expiration

## Deployment Notes

### Backend (Spring Boot)
1. Build JAR: `mvn clean package`
2. Deploy: `java -jar target/tanvox-hrms-1.0.0.jar`
3. Configure: Set environment variables for database and JWT
4. Port: Default 8080 (configurable via `server.port`)

### Frontend (Vite)
1. Build: `npm run build`
2. Output: `dist/` folder
3. Deploy to: Nginx, Apache, Vercel, or any static host
4. Configure API endpoint to backend URL

## Troubleshooting

### Database Connection Error
- Verify MySQL is running
- Check credentials in `application.properties`
- Ensure database exists: `CREATE DATABASE nikhil_hrms;`

### Login Failed
- Clear browser cache and localStorage
- Verify user exists in database
- Check JWT secret configuration

### CORS Error
- Verify frontend URL in `SecurityConfig.java`
- Check API endpoint base URL in `src/services/api.js`

### Frontend not loading
- Clear node_modules: `rm -rf node_modules && npm install`
- Clear Vite cache: `rm -rf .vite`

## Performance Tips

- Use connection pooling in database
- Enable Redis for session caching
- Lazy load React components
- Implement pagination for large datasets
- Use CDN for static assets

## Future Enhancements

- [ ] Email notifications for leave approvals
- [ ] SMS alerts
- [ ] Advanced analytics and reporting
- [ ] Employee self-service portal
- [ ] Mobile app
- [ ] Integration with payroll software
- [ ] Attendance with biometric support
- [ ] Document digitization
- [ ] Performance management module

## License

This project is proprietary and developed as a custom HRMS solution.

## Support

For issues or questions, please contact the development team.

## Project Tracker Setup

Project Tracker adds internal project and task management to the HR portal without using Jira or Atlassian branding. It reuses the existing JWT login, users, employees, and role permissions.

### Features
- Projects with name, key, description, dates, lead, members, and ACTIVE, ON_HOLD, or COMPLETED status.
- Issues with TASK, BUG, STORY, and EPIC types; LOW, MEDIUM, HIGH, and CRITICAL priorities; workflow statuses TODO, IN_PROGRESS, IN_REVIEW, and DONE.
- Kanban board with drag-and-drop status updates saved to the backend.
- Backlog, sprint planning, sprint start/complete actions, issue comments, activity history, and in-app notifications.
- Reports for project totals, open/completed issues, bugs, overdue tasks, sprint progress, status counts, priority counts, and employee workload.

### Routes
- Frontend dashboard: `/project-tracker/dashboard`
- Projects: `/project-tracker/projects`
- Project detail: `/project-tracker/projects/:id`
- Board: `/project-tracker/board`
- Backlog: `/project-tracker/backlog`
- Sprints: `/project-tracker/sprints`
- Issues: `/project-tracker/issues`
- Issue detail: `/project-tracker/issues/:id`
- Reports: `/project-tracker/reports`

### APIs
- `/api/projects`
- `/api/projects/{id}`
- `/api/projects/{id}/members`
- `/api/issues`
- `/api/issues/{id}`
- `/api/issues/{id}/status`
- `/api/issues/{id}/comments`
- `/api/issues/{id}/activity`
- `/api/sprints`
- `/api/sprints/{id}`
- `/api/sprints/{id}/start`
- `/api/sprints/{id}/complete`
- `/api/reports/project-tracker`
- `/api/notifications`

### Local Run Commands

Backend:
```bash
cd hrms-backend
mvn clean package
java -jar target/tanvox-hrms-1.0.0.jar --server.port=8080
```

If port 8080 is already used by another local app, run:
```bash
java -jar target/tanvox-hrms-1.0.0.jar --server.port=8081
```

Frontend:
```bash
cd hrms-frontend
npm install
npm run dev -- --port 3000
```

Set the frontend API URL in `hrms-frontend/.env.local`:
```properties
VITE_API_BASE_URL=http://localhost:8080/api
```

Use `http://localhost:8081/api` here when the backend is running on 8081.

### Demo Credentials
- Admin: `nikhil@tanvox.com` / `password123`
- HR: `hr@tanvox.com` / `password123`
- Manager: `manager1@tanvox.com` / `password123`
- Manager 2: `manager2@tanvox.com` / `password123`
- Employee: `emp1@tanvox.com` / `password123`
- Employee 2: `emp2@tanvox.com` / `password123`

## Internal Mail Setup

Internal Mail is a free, local-only company mail system for communication inside Tanvox HRMS. It does not use Gmail, SMTP, Zoho, paid APIs, or any external email service. Internal addresses use the `@tanvox.local` domain and cannot send or receive internet email.

### Features
- Inbox, sent mail, drafts, trash, starred mail, compose, reply, and forward.
- Internal mailbox generation for employees, using names such as `nikhil@tanvox.local` or an employee code fallback.
- Role-based contacts: ADMIN and HR can mail everyone, managers can mail their team, and employees can mail HR, their manager, and teammates.
- Mark read/unread, star, important, search, date filter, and unread/starred/important filters.
- Local attachments stored under `hrms-backend/uploads/internal-mails`.
- New mail notifications are stored in the existing local notifications table.
- Internal mail audit logs are stored for admin review use cases.

### Routes
- Inbox: `/mail/inbox`
- Sent: `/mail/sent`
- Drafts: `/mail/drafts`
- Trash: `/mail/trash`
- Starred: `/mail/starred`
- Compose: `/mail/compose`
- Message detail: `/mail/message/:id`

### APIs
- `POST /api/internal-mails/compose`
- `POST /api/internal-mails/draft`
- `GET /api/internal-mails/inbox`
- `GET /api/internal-mails/sent`
- `GET /api/internal-mails/drafts`
- `GET /api/internal-mails/trash`
- `GET /api/internal-mails/{id}`
- `PUT /api/internal-mails/{id}/read`
- `PUT /api/internal-mails/{id}/unread`
- `PUT /api/internal-mails/{id}/star`
- `PUT /api/internal-mails/{id}/important`
- `POST /api/internal-mails/{id}/reply`
- `POST /api/internal-mails/{id}/forward`
- `DELETE /api/internal-mails/{id}`
- `GET /api/internal-mails/search?query=`
- `GET /api/internal-mails/contacts`
- `POST /api/internal-mails/mailboxes/{employeeId}`
- `POST /api/internal-mails/mailboxes/sync`

---

**Built with ❤️ using React, Spring Boot, and MySQL**
