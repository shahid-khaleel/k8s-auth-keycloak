# Kubernetes Deployment Documentation

See the [repo root README](../README.md) for the executive summary and architecture diagram, and [`README.md`](README.md) in this folder for the fastest path to running the app. This document explains the architecture, Docker builds, Kubernetes manifests, and local Minikube testing for this sample app.

## Overview

The project includes:

- `frontend`: static app served by Nginx
- `backend`: Spring Boot app with OAuth2 login via Keycloak
- `keycloak`: identity provider with a preloaded realm

The system is designed for Kubernetes local testing with Minikube.

## Architecture

1. `frontend` serves the UI and proxies API and login routes to the backend.
2. `backend` authenticates users with Keycloak and exposes protected REST endpoints.
3. `keycloak` stores the realm, client, and user configuration.

### Traffic flow

- Browser -> `frontend` via NodePort
- `frontend` -> `backend` inside the cluster over `backend:8080`
- `backend` -> `keycloak` inside the cluster over `keycloak:8080`
- Browser -> `keycloak` for login via an exposed NodePort or port-forwarded localhost URL

## Dockerfiles

### `backend/Dockerfile`

The backend Dockerfile is a multi-stage build:

- Build stage: uses Maven to compile and package the Spring Boot app
- Runtime stage: uses Eclipse Temurin JRE and runs the JAR

```dockerfile
FROM maven:3.9.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn -q -DskipTests package

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### `frontend/Dockerfile`

The frontend Dockerfile uses Nginx to serve static files and proxy API calls:

```dockerfile
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY src /usr/share/nginx/html
EXPOSE 80
```

### `keycloak/Dockerfile`

The Keycloak Dockerfile builds a custom Keycloak image and includes the realm JSON:

```dockerfile
FROM quay.io/keycloak/keycloak:26.2
COPY realm-export.json /opt/keycloak/data/import/realm-export.json
ENTRYPOINT ["/opt/keycloak/bin/kc.sh", "start-dev", "--import-realm"]
```

## Build script

`build-images.sh` builds all three images:

```sh
BACKEND_IMAGE="${BACKEND_IMAGE:-k8-sample-backend:1.0.0}"
FRONTEND_IMAGE="${FRONTEND_IMAGE:-k8-sample-frontend:1.0.0}"
KEYCLOAK_IMAGE="${KEYCLOAK_IMAGE:-k8-sample-keycloak:1.0.0}"

docker build -t "$BACKEND_IMAGE" ./backend
docker build -t "$FRONTEND_IMAGE" ./frontend
docker build -t "$KEYCLOAK_IMAGE" ./keycloak
```

Use this to build images locally:

```bash
chmod +x build-images.sh
./build-images.sh
```

## Kubernetes resources

The Kubernetes manifests live in `k8s/`.

### `k8s/frontend.yaml`

- Deployment: one replica of the frontend image
- Service: NodePort exposing `80` as `30080`

### `k8s/backend.yaml`

- Deployment: one replica of the backend image
- Service: NodePort exposing `8080` as `30082`

The backend receives OAuth configuration from environment variables.

### `k8s/keycloak.yaml`

- Deployment: one replica of the Keycloak image
- Service: NodePort exposing `8080` as `30081`

This manifest sets Keycloak to use `KC_HOSTNAME=http://localhost:30081` so generated login URLs match the browser host in local testing.

## Service addresses

### External access

When testing locally, use these addresses when possible:

- Frontend UI: `http://localhost:30080`
- Keycloak UI: `http://localhost:30081`
- Backend direct API: `http://localhost:30082/api/greeting`

### Internal cluster access

Inside Kubernetes, services should use cluster service names:

- Backend -> Keycloak: `http://keycloak:8080`
- Frontend -> Backend: `http://backend:8080`

This is important: the backend should use `keycloak:8080` internally, not a browser-facing host.

## Minikube specifics

### Docker driver on Linux

When Minikube runs with the Docker driver on Linux, `minikube ip` is usually not the browser access address. Instead, use the service URLs returned by:

```bash
minikube service frontend --url
minikube service keycloak --url
```

These may look like:

- `http://127.0.0.1:46425`
- `http://127.0.0.1:40473`

### Port-forwarding for stable localhost URLs

For predictable URLs, use port-forward:

```bash
kubectl port-forward svc/frontend 30080:80
kubectl port-forward svc/keycloak 30081:8080
```

Then open:

- `http://localhost:30080`
- `http://localhost:30081`

This method is reliable and avoids Minikube driver networking issues.

## Keycloak details

### Realm export

`keycloak/realm-export.json` defines the demo realm, client, and user:

- Realm: `demo`
- Client: `sample-app`
- Secret: `sample-secret`
- User: `demo` / `demo123`

### Redirect URIs

The Keycloak client must include the exact browser host and port used for login.

In this project, the client includes:

- `http://localhost:30080/login/oauth2/code/keycloak`
- `http://192.168.58.2:30080/login/oauth2/code/keycloak`

If you change the access host, update the redirect URIs accordingly.

### Hostname configuration

`KC_HOSTNAME` tells Keycloak what hostname to use for browser redirects.

For local testing with port-forward or localhost NodePort, use:

- `KC_HOSTNAME=http://localhost:30081`

This ensures the browser sees the correct host when Keycloak builds authorization URLs.

## Spring Boot backend configuration

The backend uses Spring Security OAuth2 settings.

### What should be internal vs external

- `SPRING_SECURITY_OAUTH2_CLIENT_PROVIDER_KEYCLOAK_AUTHORIZATION_URI`
  - Browser-facing login URL
  - Should be set to the reachable host and port for Keycloak, e.g. `http://localhost:30081/...`
- `SPRING_SECURITY_OAUTH2_CLIENT_PROVIDER_KEYCLOAK_TOKEN_URI`
- `SPRING_SECURITY_OAUTH2_CLIENT_PROVIDER_KEYCLOAK_USER_INFO_URI`
- `SPRING_SECURITY_OAUTH2_CLIENT_PROVIDER_KEYCLOAK_JWK_SET_URI`
  - Backend-to-Keycloak service calls
  - Should remain `http://keycloak:8080/...` inside the cluster

This split is important because only the authorization URL is used by the browser.

## Deploying the app

### Step 1: Build images

```bash
chmod +x build-images.sh
./build-images.sh
```

### Step 2: Load images into Minikube

If using the Docker driver, load images into Minikube:

```bash
minikube image load k8-sample-backend:1.0.0
minikube image load k8-sample-frontend:1.0.0
minikube image load k8-sample-keycloak:1.0.0
```

### Step 3: Apply manifests

```bash
kubectl apply -f k8s/
```

### Step 4: Verify pods

```bash
kubectl get pods
kubectl get svc
```

### Step 5: Access services

If using Docker driver service URLs:

```bash
minikube service frontend --url
minikube service keycloak --url
```

Or use port-forward for stable localhost access:

```bash
kubectl port-forward svc/frontend 30080:80
kubectl port-forward svc/keycloak 30081:8080
```

## Troubleshooting

### Problem: browser redirects to `keycloak:8080`

This means the authorization URI or Keycloak hostname is incorrect.

- `AUTHORIZATION_URI` should be browser reachable
- `KC_HOSTNAME` should match the host used by the browser
- `redirectUris` in `realm-export.json` must include the browser host

### Problem: `192.168.58.2:30080` does not work

This happens with Minikube Docker driver on Linux.

Use:

- `minikube service frontend --url`
- `kubectl port-forward svc/frontend 30080:80`

### Problem: login reloads forever

Likely cause:

- wrong redirect URI in Keycloak client
- wrong browser-facing authorization URL
- wrong Keycloak hostname

Verify all values in `keycloak/realm-export.json`, `k8s/backend.yaml`, and `k8s/keycloak.yaml`.

## Useful commands

```bash
kubectl get pods -o wide
kubectl get svc -o wide
kubectl logs deploy/keycloak --tail=50
kubectl logs deploy/sample-backend --tail=50
kubectl logs deploy/sample-frontend --tail=50
kubectl rollout status deployment/keycloak
kubectl rollout status deployment/sample-backend
kubectl rollout status deployment/sample-frontend
```

## Remember

- Use internal cluster service names for in-cluster traffic
- Use browser-accessible host/port for authorization redirects
- Minikube Docker driver may require `localhost` or `minikube service ... --url`
- Keep `frontend` and `backend` service traffic separate from Keycloak browser URLs
