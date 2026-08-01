# k8s-auth-demo — Quickstart

This project contains a frontend container, a Spring Boot backend container, and Keycloak running in Kubernetes — three containers in total. See the [repo root README](../README.md) for the architecture overview, [`DEPLOYMENT.md`](DEPLOYMENT.md) for full deployment details, and [`HELM.md`](HELM.md) for the Helm chart workflow.

## Images

```bash
chmod +x build-images.sh
./build-images.sh
```

The Kubernetes manifests use these exact image names:

```text
k8-sample-backend:1.0.0
k8-sample-frontend:1.0.0
k8-sample-keycloak:1.0.0
```

## Run with Kubernetes

For Docker Desktop Kubernetes:

```bash
./build-images.sh
kubectl apply -f k8s/
```

Open the UI at:

```text
http://localhost:30080
```

Keycloak is available at:

```text
http://localhost:30081
```

Demo app login:

```text
username: demo
password: demo123
```

Backend API:

```text
http://localhost:30080/api/greeting
```

Direct backend access for local testing:

```text
http://localhost:30082/api/greeting
```

Backend function endpoint used by the UI:

```text
POST http://localhost:30080/api/execute
```

This endpoint requires a successful Keycloak sign-in. The backend validates the authenticated user before running the function.

## Minikube

```bash
eval $(minikube docker-env)
./build-images.sh
kubectl apply -f k8s/
minikube service frontend
minikube service keycloak
```

If `localhost:30080` and `localhost:30081` are not available in your Kubernetes environment, use the URLs printed by the `minikube service` commands.

## Kind

```bash
docker build -t k8-sample-backend:1.0.0 ./backend
docker build -t k8-sample-frontend:1.0.0 ./frontend
docker build -t k8-sample-keycloak:1.0.0 ./keycloak
kind load docker-image k8-sample-backend:1.0.0
kind load docker-image k8-sample-frontend:1.0.0
kind load docker-image k8-sample-keycloak:1.0.0
kubectl apply -f k8s/
```

## Useful Kubernetes Commands

```bash
kubectl get pods
kubectl get svc
kubectl logs -f deploy/sample-backend
kubectl logs -f deploy/keycloak
kubectl rollout restart deploy/sample-backend deploy/sample-frontend
kubectl delete -f k8s/
```

## Optional Docker Compose

The project still includes `docker-compose.yml` for local comparison. Compose uses `http://localhost:3000` for the UI and `http://localhost:8081` for Keycloak.
