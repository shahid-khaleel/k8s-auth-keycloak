#!/usr/bin/env sh
set -eu

BACKEND_IMAGE="${BACKEND_IMAGE:-k8-sample-backend:1.0.0}"
FRONTEND_IMAGE="${FRONTEND_IMAGE:-k8-sample-frontend:1.0.0}"
KEYCLOAK_IMAGE="${KEYCLOAK_IMAGE:-k8-sample-keycloak:1.0.0}"

docker build -t "$BACKEND_IMAGE" ./backend
docker build -t "$FRONTEND_IMAGE" ./frontend
docker build -t "$KEYCLOAK_IMAGE" ./keycloak

echo "Built images:"
echo "  $BACKEND_IMAGE"
echo "  $FRONTEND_IMAGE"
echo "  $KEYCLOAK_IMAGE"
