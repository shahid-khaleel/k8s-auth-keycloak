# Backend Code Explanation

This file explains the backend implementation in simple terms.

## Structure

- `backend/Dockerfile` - builds the Java app and packages it into a Docker image.
- `backend/pom.xml` - Maven build configuration and dependencies.
- `backend/src/main/java/com/demo/` - Java source code.
- `backend/src/main/resources/application.yml` - application configuration.

## What the backend does

1. Serves protected API endpoints under `/api/`.
2. Implements OAuth2 login with Keycloak.
3. Manages user session information.
4. Exposes health and actuator endpoints for readiness checks.

## OAuth2 configuration

### `application.yml`

- `server.port: 8080` - the backend listens on port 8080.
- `spring.security.oauth2.client.registration.keycloak` - client settings:
  - `client-id: sample-app`
  - `client-secret: sample-secret`
  - `authorization-grant-type: authorization_code`
  - `redirect-uri: "{baseUrl}/login/oauth2/code/{registrationId}"`
- `spring.security.oauth2.client.provider.keycloak` - provider settings:
  - `authorization-uri`
  - `token-uri`
  - `user-info-uri`
  - `jwk-set-uri`
  - `user-name-attribute`

### Runtime environment variables

In `k8s/backend.yaml`, the backend loads these environment variables:

- `SPRING_SECURITY_OAUTH2_CLIENT_PROVIDER_KEYCLOAK_AUTHORIZATION_URI`
- `SPRING_SECURITY_OAUTH2_CLIENT_PROVIDER_KEYCLOAK_TOKEN_URI`
- `SPRING_SECURITY_OAUTH2_CLIENT_PROVIDER_KEYCLOAK_USER_INFO_URI`
- `SPRING_SECURITY_OAUTH2_CLIENT_PROVIDER_KEYCLOAK_JWK_SET_URI`

This means the deployed app uses Kubernetes service addresses instead of local development addresses.

## Important networking rules

### Browser-facing endpoint

- `AUTHORIZATION_URI` is used by the browser to redirect to Keycloak.
- That URL must be reachable from the browser.
- In local Minikube tests, this often needs to be `http://localhost:30081` or a `minikube service` URL.

### Internal service endpoints

- `TOKEN_URI`, `USER_INFO_URI`, and `JWK_SET_URI` are called by the backend server.
- These should use internal cluster hostnames: `http://keycloak:8080/...`
- This keeps backend-to-Keycloak traffic inside Kubernetes.

## Why this split is important

- Browser redirect works only if the authorization URL is accessible externally.
- Backend token exchange and userinfo retrieval should remain internal.
- Using cluster hostnames for internal endpoints avoids exposing internal service ports.

## Backend container and deployment

### Dockerfile

The backend Dockerfile does two steps:

1. Build the app with Maven.
2. Copy the JAR into a Java runtime image.

This creates a small runtime container that only needs Java.

### Kubernetes deployment

`k8s/backend.yaml`:

- Deploys `k8-sample-backend:1.0.0`
- Sets the service type to NodePort for local testing (`30082`)
- Exposes container port `8080`
- Uses a readiness probe on `/actuator/health`

### NodePort vs ClusterIP

- `type: NodePort` exposes the backend on `localhost:30082` for local testing.
- The backend still receives internal traffic from the frontend via the service name `backend:8080`.

## Common backend changes

### Add a new API route

- Add a new controller class or update an existing one in `backend/src/main/java/com/demo/controller/`.
- Add frontend calls in `frontend/src/app.js` and proxy the path in `frontend/nginx.conf`.

### Change OAuth behavior

- Update `application.yml` or the environment variables in `k8s/backend.yaml`.
- If the login host changes, update the Keycloak realm redirect URIs as well.

## Debugging tips

- Check backend logs:
  - `kubectl logs deploy/sample-backend`
- Verify environment variables in the running pod:
  - `kubectl exec -it deploy/sample-backend -- printenv | grep KEYCLOAK`
- Confirm internal connectivity from inside the backend pod if needed.

## Summary

- The backend handles security, API logic, and Keycloak token exchange.
- The frontend is mainly static UI and proxies requests.
- The backend must use internal Keycloak service addresses for backend calls.
- Only the authorization endpoint needs a browser-accessible host.
