---
title: "Docker: small images and Compose stacks"
category: docker
tags: [docker, compose, containers]
skills: [docker, linux]
summary: "Writing Dockerfiles that produce small images with multi-stage builds, and wiring an app and its database together with Docker Compose — volumes, ports, service names and secrets."
updated: 2026-05-10
difficulty: beginner
---

From *Cloud Technologies 2* (FH JOANNEUM, summer 2026). These were the container basics before Kubernetes.

## Multi-stage builds

Build tools stay in the first stage; only the result goes into the final image.

```dockerfile
# Stage 1: build
FROM alpine:latest AS builder
RUN apk add --no-cache figlet
RUN figlet "FH JOANNEUM" > /index.html

# Stage 2: run (only the result)
FROM busybox:latest
COPY --from=builder /index.html /html/index.html
EXPOSE 80
CMD ["/bin/httpd", "-f", "-h", "/html", "-v"]
```

It works the same for Java (build with the JDK, run on a JRE) or Node (`npm ci && npm run build`, then serve `dist/`).

## Dockerfile habits

- Copy the dependency files first (`package*.json`, `pom.xml`) and the source later, so the dependency layer is cached.
- Use a `.dockerignore` (`node_modules`, `.git`, `.env`).
- Pin versions (`postgres:15`) instead of `latest`, and don't run as root (`USER app`).

## Compose: app + database

```yaml
services:
  db:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password
    secrets: [db_password]
    volumes:
      - db-data:/var/lib/postgresql/data
  web:
    build: .
    ports:
      - "8080:8000"     # host:container
    depends_on: [db]
    environment:
      DATABASE_HOST: db  # service name = hostname

volumes:
  db-data:
secrets:
  db_password:
    file: ./db_password.txt   # not committed
```

- Containers find each other by **service name** on the Compose network.
- A **named volume** keeps the data when the container is removed.
- `depends_on` only waits for the container to start, not for the DB to be ready. Use a healthcheck or retry in the app.
- Never put real passwords in the YAML you commit (my first version did).

```bash
docker compose up -d --build
docker compose logs -f web
docker compose down          # keeps volumes; add -v to delete them
```
