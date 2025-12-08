# Stage 1: Build using Maven Wrapper
FROM maven:3.9.6-eclipse-temurin-21 as build

WORKDIR /app

# Copy Maven wrapper files first (for better caching)
COPY .mvn/ .mvn
COPY mvnw pom.xml ./

# Make sure mvnw is executable
RUN chmod +x mvnw

# Pre-download dependencies (optional, speeds up build)
RUN ./mvnw dependency:go-offline

# Now copy the full source and build the app
COPY . .
RUN ./mvnw clean package -DskipTests

# Stage 2: Run the application using OpenJDK 21
FROM eclipse-temurin:21-jdk-alpine

WORKDIR /app

# Copy only the built jar from the previous stage
COPY --from=build /app/target/*.jar app.jar

# Expose the port (same as in application.properties or Render PORT)
EXPOSE 8080

# Run the app
ENTRYPOINT ["java", "-jar", "app.jar"]
