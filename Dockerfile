FROM maven:3.9.6-eclipse-temurin-17 AS build

WORKDIR /app

# Copy only backend folder
COPY hrms-backend ./hrms-backend

# Move into backend folder
WORKDIR /app/hrms-backend

# Build project
RUN mvn clean package -DskipTests

FROM eclipse-temurin:17-jdk

WORKDIR /app

# Copy built jar
COPY --from=build /app/hrms-backend/target/*.jar app.jar

EXPOSE 8080

CMD ["java", "-jar", "app.jar"]