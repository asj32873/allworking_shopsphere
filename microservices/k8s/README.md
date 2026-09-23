# ShopSphere Kubernetes Manifests

Kubernetes equivalent of `docker-compose.yml`, adding replica sets, health probes,
`PodDisruptionBudget`s, and `HorizontalPodAutoscaler`s for availability, plus
`Service`/`Ingress` objects for internal and external communication.

## Layout

```
k8s/
  00-namespace.yaml        # shopsphere namespace
  01-configmap.yaml        # non-secret config + internal service URLs
  02-secrets.example.yaml  # template for shopsphere-secrets (copy -> 02-secrets.yaml)
  03-redis.yaml            # Redis Deployment + PVC + Service
  services/                # one Deployment+Service+PDB+HPA per microservice
  kustomization.yaml
```

## Why this maps 1:1 with docker-compose

- Every service keeps its docker-compose hostname as its Kubernetes `Service`
  name (`auth-service`, `product-service`, ...), so `AUTH_SERVICE_URL: http://auth-service:5002`
  style env vars work unchanged — Kubernetes DNS resolves the Service name the
  same way Docker's embedded DNS resolves the compose service name.
- `envFrom: configMapRef/secretRef` replaces the `environment:` blocks.
- `depends_on` has no direct Kubernetes equivalent; readiness probes on `/health`
  and each service's own retry/reconnect logic (mongoose, etc.) take its place.

## Availability features added beyond docker-compose

- 2 replicas per service (single replica for `redis`, since it uses local
  AOF persistence and isn't clustered).
- Readiness/liveness probes against the existing `/health` endpoint.
- `RollingUpdate` with `maxUnavailable: 0` so deploys never drop below capacity.
- `PodDisruptionBudget` (`minAvailable: 1`) so voluntary disruptions (node
  drains, cluster upgrades) always leave at least one pod running.
- `HorizontalPodAutoscaler` (CPU-based, 2-8 replicas depending on service) for
  automatic scale-out under load.
- `podAntiAffinity` (preferred) to spread replicas of the same service across
  nodes so a single node failure doesn't take out every replica.

## Before applying

1. Build and push images for each service, tagged to match the manifests
   (`shopsphere/<service>:latest`), e.g.:
   ```powershell
   docker build -t shopsphere/auth-service:latest -f services/auth/Dockerfile .
   ```
   For local clusters (kind/minikube) load images instead of pushing:
   `kind load docker-image shopsphere/auth-service:latest`.
2. Create the real secrets file (don't commit it):
   ```powershell
   Copy-Item k8s/02-secrets.example.yaml k8s/02-secrets.yaml
   # edit k8s/02-secrets.yaml with real values
   ```
   or generate directly from an `.env` file:
   ```powershell
   kubectl create secret generic shopsphere-secrets -n shopsphere --from-env-file=.env --dry-run=client -o yaml > k8s/02-secrets.yaml
   ```
3. Install an ingress controller if you want external access via `Ingress`
   (e.g. `ingress-nginx`), or switch the `api-gateway` Service to `type: LoadBalancer`.

## Apply

```powershell
kubectl apply -k k8s
```

## Verify

```powershell
kubectl get pods -n shopsphere -w
kubectl get svc,ingress,hpa,pdb -n shopsphere
```
