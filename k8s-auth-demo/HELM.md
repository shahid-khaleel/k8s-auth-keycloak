# Helm guide — poc-k8s-auth-demo

This repository includes a Helm chart at `helm/poc-k8s-auth-demo` to deploy the demo application (backend, frontend, keycloak). This document provides a step-by-step guide for developers and CI.

1) Quick sanity checks

```bash
helm lint helm/poc-k8s-auth-demo
helm template demo helm/poc-k8s-auth-demo --values helm/poc-k8s-auth-demo/values.yaml | less
```

2) Local deploy (minikube/kind)

```bash
helm upgrade --install demo helm/poc-k8s-auth-demo --namespace demo --create-namespace
kubectl get pods,svc -n demo
```

3) Debugging tips

- If `helm upgrade` fails with NodePort allocation issues, remove `nodePort` values or set the services to `ClusterIP`:

```bash
helm upgrade --install demo helm/poc-k8s-auth-demo --set service.backend.type=ClusterIP -n demo
```

- If frontend container logs show `host not found in upstream "backend"`, ensure short-name Services exist (chart provides `compat-services.yaml`). If you prefer only chart-prefixed service names, either disable compat services and adjust the `nginx.conf` in the frontend image, or keep the compatibility services enabled for local testing.

4) Making the chart CI-ready

- Add linting and templating steps to CI. Example GitHub Actions snippet:

```yaml
jobs:
  helm:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install Helm
        run: curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
      - name: Lint chart
        run: helm lint helm/poc-k8s-auth-demo
      - name: Render manifests
        run: helm template ci helm/poc-k8s-auth-demo --values helm/poc-k8s-auth-demo/values.yaml
```

5) Want changes done for you?

- I can make `compat-services` optional, add Secrets templates, or create `helm test` jobs. Tell me which and I'll implement it.
