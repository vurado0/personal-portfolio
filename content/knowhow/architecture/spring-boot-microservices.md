---
title: Spring Boot microservices in practice
category: architecture
tags: [spring-boot, microservices, java, docker]
skills: [spring-boot, java, sql, docker]
summary: Splitting an app into services with Spring Boot — REST + database per service, a config server, monitoring and service-to-service calls — and what changed when we upgraded Spring PetClinic.
updated: 2026-06-12
difficulty: intermediate
---

From *Software Architecture* (FH JOANNEUM, summer 2026). There were three labs and a team project, in which we upgraded **Spring PetClinic** and split it into services.

## Lab 1: one service, one database

- Generate the project with Spring Initializr (Web, Data JPA, H2).
- `@Entity` + `JpaRepository` give you CRUD without SQL; `@RestController` exposes it.
- Start with **H2** in memory, then switch to PostgreSQL or **MongoDB Atlas** only by changing configuration. The code stays the same.

## Lab 2: an architecture around the services

- **Config server**: every service reads its `application.yml` from one central place.
- **Monitoring**: an admin server shows health, metrics and logs of all registered clients (Spring Boot Actuator).
- **Inter-service communication**: services call each other over REST by name instead of hard-coded URLs.

## Security: login with JWT (Linto, Kotlin)

In our startup project **Linto** (a vocabulary app), the backend is Spring Boot in **Kotlin** with Spring Security:

- `POST /auth/register` and `/auth/login` are public. Passwords are hashed with BCrypt, and login returns a signed JWT.
- A `JwtAuthenticationFilter` (`OncePerRequestFilter`) reads `Authorization: Bearer …`, checks the token and sets the user in the `SecurityContext`.
- The `SecurityConfig` is stateless (`SessionCreationPolicy.STATELESS`), lets only `/auth/**` through without a token and sets CORS for the React frontend.
- The database schema is versioned with **Flyway** migrations, and GitLab CI runs build, tests, SAST and secret detection.

## Lessons from the PetClinic upgrade

- Upgrade in small steps (Java version, then Spring Boot, then dependencies) and run the tests after each one.
- A service boundary should follow the **domain** (owners, vets, visits), not the technical layers.
- Every service owns **its own data**. Sharing one database between services couples them again.
- Microservices add network calls, deployment work and monitoring. For a small app, a well-structured monolith is often the better choice.
