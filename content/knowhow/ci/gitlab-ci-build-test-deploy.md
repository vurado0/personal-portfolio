---
title: "GitLab CI/CD: build, test, deploy to Kubernetes"
category: ci
tags: [ci-cd, gitlab, docker, kubernetes]
skills: [ci-cd, docker, kubernetes, git]
summary: A pipeline that builds a Docker image, pushes it to the registry, runs the tests and deploys to a Kubernetes cluster — and the pitfalls on a shared runner.
updated: 2026-06-12
difficulty: intermediate
---

From the CI/CD tutorial in *Cloud Technologies 2* (summer 2026). The goal: every push to `main` ends up running in the cluster without anyone touching it by hand.

## The stages

```yaml
stages: [build, test, deploy]

build:
  stage: build
  image: docker:27
  services: [docker:27-dind]
  script:
    - docker login -u "$CI_REGISTRY_USER" -p "$CI_REGISTRY_PASSWORD" "$CI_REGISTRY"
    - docker build -t "$CI_REGISTRY_IMAGE:$CI_COMMIT_SHORT_SHA" .
    - docker push "$CI_REGISTRY_IMAGE:$CI_COMMIT_SHORT_SHA"

test:
  stage: test
  image: "$CI_REGISTRY_IMAGE:$CI_COMMIT_SHORT_SHA"
  script:
    - ./run-tests.sh

deploy:
  stage: deploy
  image: bitnami/kubectl
  script:
    - kubectl set image deploy/web web="$CI_REGISTRY_IMAGE:$CI_COMMIT_SHORT_SHA"
    - kubectl rollout status deploy/web
  only: [main]
```

## What I learned

- **Tag images with the commit SHA**, not only `latest`. Then you always know what is running and can roll back.
- **Secrets never go in the repo.** The registry login and the kubeconfig come from masked CI/CD variables.
- **Test the image you ship.** The test job runs inside the freshly built image, not on the runner.
- **Shared runners are slow.** All students used one runner, so jobs queued for minutes. Keep pipelines small and cache dependencies.

The same idea runs this website: a push to `main` triggers a Vercel build that validates the content, type-checks, prerenders and deploys.
