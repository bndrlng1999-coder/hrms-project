FROM maven:3.9.6-eclipse-temurin-17 AS build

WORKDIR /app

COPY hrms-backend ./hrms-backend

WORKDIR /app/hrms-backend

RUN mvn clean package -DskipTests

FROM eclipse-temurin:17-jdk

WORKDIR /app

COPY --from=build /app/hrms-backend/target/*.jar app.jar

ENV PORT=10000

EXPOSE 10000

ENTRYPOINT ["java","-Dserver.port=10000","-Dserver.address=0.0.0.0","-jar","app.jar"]