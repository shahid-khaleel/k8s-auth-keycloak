poc-k8s-auth-demo Helm Chart — Fantastic Quickstart
===============================================

This chart deploys the k8s-auth-demo application: the `backend`, `frontend`, and `keycloak` components. It's designed to work well for local clusters (minikube/kind) and to be easy to adapt for cloud environments.

Quick start
-----------

1. (Optional) Build images and push to a registry reachable by your cluster, or use the defaults in `values.yaml`.
2. Lint and render to validate locally:

```bash
helm lint ./helm/poc-k8s-auth-demo
helm template demo ./helm/poc-k8s-auth-demo --values ./helm/poc-k8s-auth-demo/values.yaml
```

3. Install the chart (creates `demo` namespace):

```bash
helm install demo ./helm/poc-k8s-auth-demo --namespace demo --create-namespace
```

4. Verify resources:

```bash
kubectl get pods,svc -n demo
```

Why this chart is great
-----------------------

- Includes compatibility Services (`backend`, `frontend`, `keycloak`) so images that reference short DNS names work out-of-the-box.
- Values are split by component for easy overrides.
- Templates include readiness probes and simple init logic for robust local testing.

Primary configuration (high level)
---------------------------------

Key values in `values.yaml` you'll likely change:

- `replicaCount.backend|frontend|keycloak` — replica counts.
- `image.<component>.repository` / `tag` / `pullPolicy` — change to your image registry and tag.
- `service.<component>.type` — `ClusterIP` or `NodePort` (NodePort default is convenient for Minikube).
- `service.<component>.port` — service port inside cluster.
- `backend.env`, `keycloak.env` — maps of environment variables injected into pods.
- `ingress.enabled` / `ingress.hosts` — enable ingress and configure host/path rules.

Example: install with custom backend image and ClusterIP services

```bash
helm upgrade --install demo ./helm/poc-k8s-auth-demo \
	--namespace demo --create-namespace \
	--set image.backend.repository=myregistry/my-backend --set image.backend.tag=1.2.3 \
	--set service.backend.type=ClusterIP --set service.frontend.type=ClusterIP --set service.keycloak.type=ClusterIP
```

Port-forwarding and quick HTTP test
----------------------------------

```bash
kubectl port-forward svc/poc-k8s-auth-demo-demo-frontend 8080:80 -n demo
curl -I http://localhost:8080/
```

Enabling/disabling compatibility Services
----------------------------------------

By default the chart emits short-name Services named `backend`, `frontend`, and `keycloak` to support images which make requests to those hostnames. If you prefer to avoid duplicates or keep only chart-scoped names, make these services conditional (recommended next step). For now you can safely remove `templates/compat-services.yaml` or override `service.*.type` to `ClusterIP` and use DNS within the `demo` namespace.

Helm tests (recommended)
------------------------

Add a test Job in `templates/tests/` (example below) to verify the frontend can reach the backend. Once added, run:

```bash
helm test demo -n demo
```

Example test Job (place in `templates/tests/test-frontend-connection.yaml`):

```yaml
apiVersion: batch/v1
kind: Job
metadata:
	name: "{{ include \"poc.fullname\" . }}-test-frontend-connection"
	annotations:
		"helm.sh/hook": test
spec:
	template:
		spec:
			restartPolicy: Never
			containers:
				- name: curl
					image: curlimages/curl:8.2.1
					command: ["sh","-c","curl -sf http://backend:{{ .Values.service.backend.port }} || exit 1"]

```

Secrets and sensitive values
----------------------------

Do not store secrets directly in `values.yaml`. Create a `Secret` and reference it from templates. Example approach:

- Add `secrets.enabled` and `secrets.names` into `values.yaml`.
- Render `templates/secret.yaml` when `secrets.enabled`.

Troubleshooting
---------------

- NodePort conflicts: remove explicit `nodePort` values or switch to `ClusterIP`.
- `host not found in upstream "backend"`: ensure compatibility Services are present, or change the application config to use the full DNS name for the service (e.g., `poc-k8s-auth-demo-demo-backend` or `backend.demo.svc.cluster.local`).
- Image pull errors: confirm images exist in registry and node can access them.

CI recommendations
------------------

- Add `helm lint` and `helm template` to CI pipeline. Optionally validate with `kubeval`.

Want me to:
- make `compat-services` conditional with `compatibilityServices.enabled: true|false`,
- add the `templates/tests` Job and enable `helm test`, or
- add a `templates/secret.yaml` and sample `values.secret.yaml` to demonstrate secure password handling?

If yes — tell me which one and I'll implement it.

