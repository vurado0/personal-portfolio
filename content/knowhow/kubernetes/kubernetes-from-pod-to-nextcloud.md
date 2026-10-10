---
title: "Kubernetes: from a single pod to Nextcloud"
category: kubernetes
tags: [kubernetes, minikube, ingress, storage]
skills: [kubernetes, docker, linux]
summary: "What I built step by step on a Minikube cluster — deployments, services, ingress routing, init containers, persistent volumes and a multi-container Nextcloud stack."
updated: 2026-07-07
difficulty: intermediate
---

From *Cloud Technologies 2* (FH JOANNEUM, summer 2026). I ran everything on a Minikube cluster with its own profile (`tutorial`) on a university server and showed every milestone live.

## 1. Pods, deployments and services

- A **Deployment** keeps N replicas of a pod alive and handles rolling updates; a pod on its own just dies.
- **ClusterIP** services are for traffic inside the cluster, **NodePort** opens a port on the node for outside access.
- Database credentials go into a **Secret**, the rest of the config into a **ConfigMap**. Both are injected as environment variables.

```bash
kubectl get all -o wide
kubectl scale deploy/hello --replicas=3
kubectl rollout status deploy/hello
```

## 2. Ingress: one host, several services

An NGINX ingress routes by path: `hello.info/` goes to one service, `hello.info/world` to another.

```bash
kubectl describe ingress hello-ingress
curl --resolve "hello.info:80:$(minikube ip)" -i http://hello.info/world
```

## 3. Init containers and shared volumes

An **init container** runs before the main container. Mine downloaded the app from GitLab with `curl`, using a token from a Secret and a URL from a ConfigMap. It wrote the app into an `emptyDir` volume that the main container then served.

## 4. Persistent storage

A **PersistentVolume** (NFS) plus a **PersistentVolumeClaim** keep data across pod restarts. To prove it, I restarted the pod and checked the log file was still there:

```bash
kubectl rollout restart deploy/python-httpd
kubectl exec deploy/python-httpd -- df /mnt
```

## 5. Putting it together: Nextcloud

Nextcloud, MariaDB and Redis, each with its own deployment and service. Nextcloud finds the database and the cache by **service name** (cluster DNS), so no IPs are hard-coded.

## Takeaways

- Debug with `kubectl describe` and `kubectl logs` first. Most problems are typos in labels or selectors.
- Never put secrets in the YAML you commit; create them with `kubectl create secret`.
