FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /build
COPY java-common java-common
COPY project-service project-service
WORKDIR /build/project-service
RUN --mount=type=cache,target=/root/.m2 mvn -q -B package
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /build/project-service/target/project-service-1.0.0.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
