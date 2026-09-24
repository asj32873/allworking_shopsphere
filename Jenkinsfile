pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
        skipDefaultCheckout(true)
        buildDiscarder(logRotator(numToKeepStr: '10', artifactNumToKeepStr: '10'))
    }

    parameters {
        string(name: 'REGISTRY', defaultValue: 'docker.io', description: 'Container registry hostname')
        string(name: 'REGISTRY_NAMESPACE', defaultValue: '', description: 'Docker Hub user or registry project')
        booleanParam(name: 'DEPLOY_TO_KUBERNETES', defaultValue: true, description: 'Deploy the pushed images')
    }

    environment {
        COMPOSE_DIR = 'microservices'
        COMPOSE_FILE = 'docker-compose.yml'
        SONAR_PROJECT_KEY = 'shopsphere-microservices'
        IMAGE_TAG = "build-${BUILD_NUMBER}"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Validate Configuration') {
            steps {
                withCredentials([file(credentialsId: 'shopsphere-env', variable: 'SHOPSPHERE_ENV_FILE')]) {
                    dir("${COMPOSE_DIR}") {
                        sh '''
                            set -eu
                            cp "$SHOPSPHERE_ENV_FILE" .env
                            docker compose -f "$COMPOSE_FILE" config -q
                            for service in api-gateway auth user product cart order payment address review rag support vendor admin; do
                                test -f "services/$service/package.json"
                                test -f "services/$service/Dockerfile"
                            done
                        '''
                    }
                }
            }
        }

        stage('Build and Test Images') {
            steps {
                dir("${COMPOSE_DIR}") {
                    sh '''
                        set -eu
                        test -n "$REGISTRY_NAMESPACE" || { echo "REGISTRY_NAMESPACE is required"; exit 1; }
                        for service in api-gateway auth user product cart order payment address review rag support vendor admin; do
                            image="$REGISTRY/$REGISTRY_NAMESPACE/shopsphere-$service:$IMAGE_TAG"
                            docker build --pull -t "$image" -f "services/$service/Dockerfile" .

                            if docker run --rm "$image" node -e "const p=require('./package.json'); process.exit(p.scripts?.test ? 0 : 1)"; then
                                docker run --rm --env-file .env "$image" npm test
                            else
                                echo "No test script for $service; skipping"
                            fi
                        done
                    '''
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                withCredentials([string(credentialsId: 'sonarqube-token', variable: 'SONAR_TOKEN')]) {
                    withSonarQubeEnv('SonarQube') {
                        dir("${COMPOSE_DIR}") {
                            sh '''
                                sonar-scanner \
                                    -Dsonar.projectKey="$SONAR_PROJECT_KEY" \
                                    -Dsonar.projectName=ShopSphere-Microservices \
                                    -Dsonar.sources=services,packages \
                                    -Dsonar.exclusions='**/node_modules/**,**/coverage/**,**/tests/**' \
                                    -Dsonar.token="$SONAR_TOKEN"
                            '''
                        }
                    }
                }
            }
        }

        stage('Push Images') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'docker-registry-credentials',
                    usernameVariable: 'REGISTRY_USERNAME',
                    passwordVariable: 'REGISTRY_PASSWORD'
                )]) {
                    dir("${COMPOSE_DIR}") {
                        sh '''
                            set -eu
                            printf '%s' "$REGISTRY_PASSWORD" | docker login "$REGISTRY" -u "$REGISTRY_USERNAME" --password-stdin
                            for service in api-gateway auth user product cart order payment address review rag support vendor admin; do
                                image="$REGISTRY/$REGISTRY_NAMESPACE/shopsphere-$service"
                                docker push "$image:$IMAGE_TAG"
                                docker tag "$image:$IMAGE_TAG" "$image:latest"
                                docker push "$image:latest"
                            done
                            docker logout "$REGISTRY"
                        '''
                    }
                }
            }
        }

        stage('Deploy to Kubernetes') {
            when {
                expression { params.DEPLOY_TO_KUBERNETES }
            }
            steps {
                withCredentials([
                    file(credentialsId: 'shopsphere-kubeconfig', variable: 'KUBECONFIG_FILE'),
                    file(credentialsId: 'shopsphere-env', variable: 'SHOPSPHERE_ENV_FILE'),
                    usernamePassword(
                        credentialsId: 'docker-registry-credentials',
                        usernameVariable: 'REGISTRY_USERNAME',
                        passwordVariable: 'REGISTRY_PASSWORD'
                    )
                ]) {
                    dir("${COMPOSE_DIR}") {
                        sh '''
                            set -eu
                            cp "$KUBECONFIG_FILE" .jenkins-kubeconfig
                            export KUBECONFIG="$PWD/.jenkins-kubeconfig"
                            cluster="$(kubectl config view --minify -o jsonpath='{.clusters[0].name}')"
                            server="$(kubectl config view --minify -o jsonpath='{.clusters[0].cluster.server}')"
                            case "$server" in
                                https://127.0.0.1:*|https://localhost:*)
                                    port="${server##*:}"
                                    kubectl config set-cluster "$cluster" \
                                        --server="https://host.docker.internal:$port" \
                                        --tls-server-name=minikube
                                    ;;
                            esac

                            kubectl apply -f k8s/00-namespace.yaml
                            kubectl create secret generic shopsphere-secrets \
                                --namespace shopsphere \
                                --from-env-file="$SHOPSPHERE_ENV_FILE" \
                                --dry-run=client -o yaml | kubectl apply -f -
                            kubectl create secret docker-registry registry-credentials \
                                --namespace shopsphere \
                                --docker-server="$REGISTRY" \
                                --docker-username="$REGISTRY_USERNAME" \
                                --docker-password="$REGISTRY_PASSWORD" \
                                --dry-run=client -o yaml | kubectl apply -f -

                            rm -rf .k8s-render
                            cp -R k8s .k8s-render
                            cd .k8s-render
                            printf '\nimages:\n' >> kustomization.yaml
                            for service in api-gateway auth user product cart order payment address review rag support vendor admin; do
                                base="shopsphere/$service-service"
                                test "$service" = api-gateway && base="shopsphere/api-gateway"
                                printf '  - name: %s\n    newName: %s/%s/shopsphere-%s\n    newTag: %s\n' \
                                    "$base" "$REGISTRY" "$REGISTRY_NAMESPACE" "$service" "$IMAGE_TAG" >> kustomization.yaml
                            done
                            kubectl kustomize . | kubectl apply -f -

                            kubectl rollout status deployment --all --namespace shopsphere --timeout=5m
                        '''
                    }
                }
            }
        }
    }

    post {
        failure {
            sh '''
                if [ -n "${KUBECONFIG_FILE:-}" ]; then
                    KUBECONFIG="$KUBECONFIG_FILE" kubectl get pods -n shopsphere -o wide || true
                fi
            '''
        }
        always {
            dir("${COMPOSE_DIR}") {
                sh 'rm -f .env .jenkins-kubeconfig; rm -rf .k8s-render; docker image prune -f || true'
            }
        }
    }
}
