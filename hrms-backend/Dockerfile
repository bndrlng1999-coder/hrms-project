FROM maven:3.9.6-eclipse-temurin-17 AS build

WORKDIR /app
COPY hrms-backend ./hrms-backend

WORKDIR /app/hrms-backend
RUN mvn clean package -DskipTests

FROM eclipse-temurin:17-jdk

WORKDIR /app
COPY --from=build /app/hrms-backend/target/*.jar app.jar

EXPOSE 10000

CMD ["sh", "-c", "java -jar app.jar --server.address=0.0.0.0 --server.port=${PORT:-8080}"]