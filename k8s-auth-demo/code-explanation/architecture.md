# Project Architecture

This document explains the architecture of the sample app and how the pieces fit together.

## Components

The project has three main components:

1. **Frontend**
   - Static UI served by Nginx.
   - Runs in the `frontend` container.
   - Proxies API and OAuth paths to the backend.

2. **Backend**
   - Spring Boot application.
   - Runs in the `backend` container.
   - Handles REST endpoints, OAuth2 login flow, and session validation.

3. **Keycloak**
   - Identity provider for OAuth2.
   - Runs in the `keycloak` container.
   - Manages the `demo` realm, client, and user credentials.

## Kubernetes resources

Each component is deployed as:

- A `Deployment` for the container.
- A `Service` for access.

### Services

- `frontend` service
  - Type: `NodePort`
  - Exposes port `80` externally as `30080`

- `backend` service
  - Type: `NodePort`
  - Exposes port `8080` externally as `30082`

- `keycloak` service
  - Type: `NodePort`
  - Exposes port `8080` externally as `30081`

## Traffic flow

### Browser to frontend

- The user opens the app in a browser.
- The browser sends requests to the frontend host.
- For example: `http://localhost:30080` or the URL returned by `minikube service frontend --url`.

### Frontend to backend

- The frontend proxies requests like `/api/` and `/oauth2/` to the backend.
- Nginx forwards these requests to `http://backend:8080/` inside the cluster.

### Backend to Keycloak

- The backend uses Keycloak for authentication.
- It sends token, userinfo, and JWK requests to `http://keycloak:8080/`.
- These calls happen internally inside Kubernetes.

### Browser to Keycloak

- When the user clicks "Sign In", the backend redirects the browser to Keycloak.
- The login URL must be reachable from the browser, e.g. `http://localhost:30081` or the URL returned by `minikube service keycloak --url`.

## Important design rules

### Internal vs external addresses

- `http://keycloak:8080` is correct for backend-to-Keycloak calls inside the cluster.
- `http://localhost:30081` or the Minikube service URL is required for browser-facing login.
- The frontend must not expose internal hostnames directly to the browser.

### Service separation

- Frontend and backend communicate through a cluster service name, not via public ports.
- Keycloak may be accessed externally for login, but the backend still uses the internal service name.

## Diagram

```mermaid
flowchart LR
  Browser[Browser]
  Frontend[Frontend (Nginx)]
  Backend[Backend (Spring Boot)]
  Keycloak[Keycloak]

  Browser -->|HTTP/HTTPS| Frontend
  Frontend -->|API / OAuth proxy| Backend
  Backend -->|token/userinfo/jwks| Keycloak
  Browser -->|login redirect| Keycloak
```

## Why this architecture works

- It keeps the frontend lightweight and static.
- The backend handles all security and authorization logic.
- Keycloak is isolated as a separate identity service.
- External browser access is separated from internal service communication.

## Local testing notes

- Use `build-images.sh` to build all images.
- Use `kubectl apply -f k8s/` to deploy.
- Use `minikube service ... --url` or port-forwarding for stable browser access.
- Keep internal service names in the backend config, and use browser-accessible hostnames only for login redirects.
