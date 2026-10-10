---
title: Homelab Docker stack
summary: A Raspberry Pi running a Compose stack with a reverse proxy, monitoring and automatic backups.
stack: [Docker, Compose, Linux, Caddy, Prometheus]
skills: [docker, linux, networking, security]
tags: [homelab, infrastructure]
role: Everything (it is my basement)
status: done
period: 2025
links:
  github: https://github.com/vurado0
featured: true
---

> PLACEHOLDER project — replace with your own.

## Problem

Self-hosting a few services at home without exposing more than necessary to the internet.

## Solution

A single `compose.yaml` with Caddy as reverse proxy, services on an internal network and only ports 80/443 published. Read the [Docker networking notes](/knowhow/docker/docker-networking-basics) for the details.

## Lessons learned

- Bind admin UIs to `127.0.0.1` and use an SSH tunnel.
- Test the backup **restore**, not just the backup.
