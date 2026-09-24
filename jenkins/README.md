# ShopSphere Jenkins

This Jenkins controller runs in Docker and uses the host Docker engine to build
and push ShopSphere images. The pipeline deploys the exact immutable
`build-<Jenkins build number>` tag to Kubernetes; `latest` is also published for
human convenience but is not used by the deployment.

## 1. Start Jenkins

From the repository root:

```powershell
docker compose -f jenkins/docker-compose.yml up -d --build
docker exec shopsphere-jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

Open <http://localhost:8081>, enter the initial password, and finish the setup
wizard. Jenkins state is retained in the `jenkins-home` Docker volume.

## 2. Add Jenkins credentials

In **Manage Jenkins > Credentials > System > Global credentials**, add:

| ID                            | Kind                   | Value                                                              |
| ----------------------------- | ---------------------- | ------------------------------------------------------------------ |
| `docker-registry-credentials` | Username with password | Registry username and access token (Docker Hub token recommended)  |
| `shopsphere-env`              | Secret file            | Production `.env` containing all application environment variables |
| `shopsphere-kubeconfig`       | Secret file            | Flattened kubeconfig generated below                               |
| `sonarqube-token`             | Secret text            | SonarQube analysis token                                           |

Generate a self-contained Minikube kubeconfig so certificates are embedded
instead of referring to Windows file paths:

```powershell
kubectl config view --minify --flatten --raw | Set-Content -Encoding ascii jenkins-kubeconfig.yaml
```

Upload `jenkins-kubeconfig.yaml` as `shopsphere-kubeconfig`, then delete the
local file. The pipeline changes a Minikube loopback API endpoint to
`host.docker.internal` when Jenkins runs inside Docker.

## 3. Configure SonarQube

In **Manage Jenkins > System > SonarQube servers**, add a server named exactly
`SonarQube`. Its URL must be reachable from the Jenkins container. For a server
running on this Windows host, use `http://host.docker.internal:<port>`.

## 4. Create the pipeline job

Create a **Pipeline** job and select **Pipeline script from SCM**. Point it to
this repository and use `Jenkinsfile` as the script path.

Build parameters:

- `REGISTRY`: use `docker.io` for Docker Hub.
- `REGISTRY_NAMESPACE`: your Docker Hub username or registry project.
- `DEPLOY_TO_KUBERNETES`: clear this to build and push without deploying.

The registry namespace must allow Jenkins to create these repositories:
`shopsphere-api-gateway`, `shopsphere-auth`, and one `shopsphere-<service>`
repository for each remaining service. Docker Hub creates them automatically
on first push when the account permits it.

## 5. Verify

```powershell
kubectl get pods -n shopsphere
kubectl get deployments -n shopsphere -o custom-columns=NAME:.metadata.name,IMAGE:.spec.template.spec.containers[0].image
kubectl get events -n shopsphere --sort-by=.lastTimestamp
```

For a private registry, the pipeline creates or updates the
`registry-credentials` image pull secret in the `shopsphere` namespace.
