# ---- Build stage: compile with the full JDK + Maven, nothing from here ships in the final image ----
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

# Dependencies first so they're cached across builds when only src/ changes.
COPY pom.xml .
RUN mvn -q -B dependency:go-offline

COPY src ./src
RUN mvn -q -B package -DskipTests

# ---- Run stage: just a JRE and the built jar ----
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

RUN addgroup -S bika && adduser -S bika -G bika
COPY --from=build /app/target/app.jar app.jar
USER bika

EXPOSE 8090
ENTRYPOINT ["java", "-jar", "app.jar"]
