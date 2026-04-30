# Quick Start Guide - Tanvox HRMS

## Prerequisites
- MySQL Server 8.0+
- Java 21 JDK
- Node.js 18+ with npm
- Git
- Any IDE (VS Code, IntelliJ IDEA recommended)

## Step 1: Database Setup (5 minutes)

1. **Create Database**
   ```bash
   mysql -u root -p
   CREATE DATABASE nikhil_hrms;
   EXIT;
   ```

2. **Add Seed Data**
   ```bash
   mysql -u root -p nikhil_hrms < hrms-backend/src/main/resources/seed-data.sql
   ```

3. **Verify Database**
   ```bash
   mysql -u root -p -e "USE nikhil_hrms; SHOW TABLES;"
   ```

## Step 2: Backend Setup (2 minutes)

1. **Navigate to Backend**
   ```bash
   cd hrms-backend
   ```

2. **Update Database Credentials** (if needed)
   - Edit: `src/main/resources/application.properties`
   - Set: `spring.datasource.password=your_mysql_password`

3. **Run Backend**
   ```bash
   mvn clean install
   mvn spring-boot:run
   ```

4. **Verify Backend**
   - Open: http://localhost:8080/api/auth/validate
   - Should return: `{"success":true,"message":"Token is valid"}`

## Step 3: Frontend Setup (3 minutes)

1. **Navigate to Frontend**
   ```bash
   cd hrms-frontend
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Open Application**
   - URL: http://localhost:5173
   - Should see Tanvox HRMS login page

## Step 4: Login and Test

### Admin Account
- Email: `nikhil@tanvox.com`
- Password: `password123`
- Features: Dashboard, Employee Management, Attendance, Leave Approval

### Employee Account
- Email: `emp1@tanvox.com`
- Password: `password123`
- Features: Dashboard, Apply Leave, View Attendance, Download Payslips

### Manager Account
- Email: `manager1@tanvox.com`
- Password: `password123`
- Features: Dashboard, Team Management, Approve Leaves

## Common Issues

### "Cannot connect to database"
```
Solution: 
1. Verify MySQL is running: mysql --version
2. Check credentials in application.properties
3. Ensure database exists: SHOW DATABASES;
```

### "Port 8080 already in use"
```
Solution:
1. Find process: lsof -i :8080 (Mac/Linux)
2. Kill process: kill -9 <PID>
3. Or change port in application.properties: server.port=8081
```

### "Port 5173 already in use"
```
Solution:
1. Kill process using port 5173
2. Or specify different port: npm run dev -- --port 3000
```

### "CORS error"
```
Solution:
1. Verify backend is running on http://localhost:8080
2. Check frontend API URL in src/services/api.js
3. Restart both servers
```

## Production Deployment

### Backend
```bash
mvn clean package
java -jar target/tanvox-hrms-1.0.0.jar
```

### Frontend
```bash
npm run build
# Deploy 'dist' folder to web server
```

## File Locations

- Backend Source: `hrms-backend/src/main/java/com/nikhilhrms/`
- Frontend Source: `hrms-frontend/src/`
- Database Config: `hrms-backend/src/main/resources/application.properties`
- Tailwind Config: `hrms-frontend/tailwind.config.js`

## Useful Commands

```bash
# Backend
mvn clean install      # Build backend
mvn spring-boot:run    # Run backend
mvn test              # Run tests

# Frontend
npm install           # Install dependencies
npm run dev          # Development server
npm run build        # Production build
npm run lint         # Check code quality
npm run preview      # Preview production build
```

## Next Steps

1. ✅ Access dashboard at http://localhost:5173
2. ✅ Test login with provided credentials
3. ✅ Explore all modules
4. ✅ Create new employees
5. ✅ Test leave management
6. ✅ View payslips

## Customization

### Change Branding
- Edit `hrms-frontend/src/components/Navbar.jsx` - Title
- Edit `hrms-frontend/src/pages/LoginPage.jsx` - Logo & Title
- Edit `hrms-frontend/tailwind.config.js` - Colors

### Change Port
- Backend: `application.properties` - `server.port=8080`
- Frontend: `vite.config.js` - `port: 5173`

## Support

For issues:
1. Check error messages in console
2. Verify all prerequisites are installed
3. Ensure ports 8080 and 5173 are available
4. Check database connection

---

**Ready to go? Start the backend and frontend, then login and explore! 🚀**
