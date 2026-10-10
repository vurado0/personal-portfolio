---
title: Docker networking basics
category: docker
tags: [docker, networking, compose]
skills: [docker, networking, linux]
summary: Bridge vs host networks, published ports, and how containers find each other by name in Compose.
updated: 2026-10-05
difficulty: intermediate
---

> PLACEHOLDER article — replace with your own notes.

## The default bridge

Every container joins the `bridge` network unless told otherwise. Containers on the *default* bridge can't resolve each other by name.

```bash
docker network ls
docker network inspect bridge
```

## User-defined networks

Create your own network to get built-in DNS:

```bash
docker network create app-net
docker run -d --name db --network app-net postgres:16
docker run -d --name api --network app-net -p 8080:8080 my-api
# inside "api", the database is reachable at db:5432
```

## Publishing ports

`-p 8080:8080` binds on **all** interfaces. Bind to localhost when the port is only for you:

```bash
docker run -p 127.0.0.1:5432:5432 postgres:16
```

## Compose does it for you

```yaml
services:
  api:
    build: .
    ports: ["8080:8080"]
    depends_on: [db]
  db:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: example
```

Compose creates a project network, so `api` reaches `db` by its service name.
