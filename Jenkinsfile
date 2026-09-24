pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
        skipDefaultCheckout(true)
        buildDiscarder(
            logRotator(
                numToKeepStr: '10',
                artifactNumToKeepStr: '10'
            )
        )
    }

    parameters {
        string(
            name: 'REGISTRY',
            defaultValue: 'docker.io',
            description: 'Container registry hostname'
        )

        string(
            name: 'REGISTRY_NAMESPACE',
            defaultValue: '',
            description: 'Docker Hub username or registry project/namespace'
        )

        booleanParam(
            name: 'DEPLOY_TO_KUBERNETES',
            defaultValue: true,
            description: 'Deploy the pushed images to Kubernetes'
        )
    }

    environment {
        COMPOSE_DIR = 'microservices'
        COMPOSE_FILE = 'docker-compose.yml'
        SONAR_PROJECT_KEY = 'shopsphere-microservices'
        IMAGE_TAG = "build-${BUILD_NUMBER}"
    }

    stages {

        /*
         * ------------------------------------------------------------
         * CHECKOUT
         * ------------------------------------------------------------
         */
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        /*
         * ------------------------------------------------------------
         * VALIDATE CONFIGURATION
         * ------------------------------------------------------------
         */
        stage('Validate Configuration') {
            steps {
                withCredentials([
                    file(
                        credentialsId: 'shopsphere-env',
                        variable: 'SHOPSPHERE_ENV_FILE'
                    )
                ]) {
                    dir("${COMPOSE_DIR}") {

                        withEnv([
                            "REGISTRY=${params.REGISTRY}",
                            "REGISTRY_NAMESPACE=${params.REGISTRY_NAMESPACE}"
                        ]) {
                            sh '''
                                set -eu

                                echo "========================================"
                                echo "Validating Jenkins configuration"
                                echo "========================================"

                                test -n "${REGISTRY:-}" || {
                                    echo "ERROR: REGISTRY is required"
                                    exit 1
                                }

                                test -n "${REGISTRY_NAMESPACE:-}" || {
                                    echo "ERROR: REGISTRY_NAMESPACE is required"
                                    echo "Set REGISTRY_NAMESPACE in the Jenkins build parameters."
                                    exit 1
                                }

                                echo "Registry: ${REGISTRY}"
                                echo "Registry namespace: ${REGISTRY_NAMESPACE}"
                                echo "Image tag: ${IMAGE_TAG}"

                                echo ""
                                echo "Copying environment file..."
                                cp "$SHOPSPHERE_ENV_FILE" .env

                                echo ""
                                echo "Validating Docker Compose configuration..."
                                docker compose -f "$COMPOSE_FILE" config -q

                                echo ""
                                echo "Validating microservice directories..."

                                for service in \
                                    api-gateway \
                                    auth \
                                    user \
                                    product \
                                    cart \
                                    order \
                                    payment \
                                    address \
                                    review \
                                    rag \
                                    support \
                                    vendor \
                                    admin
                                do
                                    echo "Checking $service..."

                                    test -f "services/$service/package.json" || {
                                        echo "ERROR: Missing services/$service/package.json"
                                        exit 1
                                    }

                                    test -f "services/$service/Dockerfile" || {
                                        echo "ERROR: Missing services/$service/Dockerfile"
                                        exit 1
                                    }
                                done

                                echo ""
                                echo "Configuration validation successful."
                            '''
                        }
                    }
                }
            }
        }

        /*
         * ------------------------------------------------------------
         * BUILD AND TEST
         * ------------------------------------------------------------
         */
        stage('Build and Test Images') {
            steps {
                dir("${COMPOSE_DIR}") {

                    withEnv([
                        "REGISTRY=${params.REGISTRY}",
                        "REGISTRY_NAMESPACE=${params.REGISTRY_NAMESPACE}"
                    ]) {
                        sh '''
                            set -eu

                            test -n "${REGISTRY:-}" || {
                                echo "ERROR: REGISTRY is required"
                                exit 1
                            }

                            test -n "${REGISTRY_NAMESPACE:-}" || {
                                echo "ERROR: REGISTRY_NAMESPACE is required"
                                exit 1
                            }

                            echo "========================================"
                            echo "Building Docker images"
                            echo "========================================"

                            for service in \
                                api-gateway \
                                auth \
                                user \
                                product \
                                cart \
                                order \
                                payment \
                                address \
                                review \
                                rag \
                                support \
                                vendor \
                                admin
                            do
                                image="${REGISTRY}/${REGISTRY_NAMESPACE}/shopsphere-${service}:${IMAGE_TAG}"

                                echo ""
                                echo "----------------------------------------"
                                echo "Building: ${image}"
                                echo "----------------------------------------"

                                docker build \
                                    --pull \
                                    -t "$image" \
                                    -f "services/$service/Dockerfile" \
                                    .

                                echo "Checking whether $service has a test script..."

                                if docker run --rm "$image" \
                                    node -e "const p=require('./package.json'); process.exit(p.scripts?.test ? 0 : 1)"
                                then
                                    echo "Running tests for $service..."

                                    docker run --rm \
                                        --env-file .env \
                                        "$image" \
                                        npm test
                                else
                                    echo "No test script for $service; skipping tests."
                                fi
                            done

                            echo ""
                            echo "All Docker images built successfully."
                        '''
                    }
                }
            }
        }

        /*
         * ------------------------------------------------------------
         * SONARQUBE
         * ------------------------------------------------------------
         */
        stage('SonarQube Analysis') {
            steps {
                withCredentials([
                    string(
                        credentialsId: 'sonarqube-token',
                        variable: 'SONAR_TOKEN'
                    )
                ]) {
                    withSonarQubeEnv('SonarQube') {
                        dir("${COMPOSE_DIR}") {
                            sh '''
                                set -eu

                                echo "========================================"
                                echo "Running SonarQube analysis"
                                echo "========================================"

                                sonar-scanner \
                                    -Dsonar.projectKey="$SONAR_PROJECT_KEY" \
                                    -Dsonar.projectName="ShopSphere-Microservices" \
                                    -Dsonar.sources="services,packages" \
                                    -Dsonar.exclusions="**/node_modules/**,**/coverage/**,**/tests/**" \
                                    -Dsonar.token="$SONAR_TOKEN"

                                echo "SonarQube analysis completed."
                            '''
                        }
                    }
                }
            }
        }

        /*
         * ------------------------------------------------------------
         * PUSH IMAGES
         * ------------------------------------------------------------
         */
        stage('Push Images') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'docker-registry-credentials',
                        usernameVariable: 'REGISTRY_USERNAME',
                        passwordVariable: 'REGISTRY_PASSWORD'
                    )
                ]) {
                    dir("${COMPOSE_DIR}") {

                        withEnv([
                            "REGISTRY=${params.REGISTRY}",
                            "REGISTRY_NAMESPACE=${params.REGISTRY_NAMESPACE}"
                        ]) {
                            sh '''
                                set -eu

                                test -n "${REGISTRY:-}" || {
                                    echo "ERROR: REGISTRY is required"
                                    exit 1
                                }

                                test -n "${REGISTRY_NAMESPACE:-}" || {
                                    echo "ERROR: REGISTRY_NAMESPACE is required"
                                    exit 1
                                }

                                echo "========================================"
                                echo "Logging into container registry"
                                echo "========================================"

                                printf '%s' "$REGISTRY_PASSWORD" | \
                                    docker login "$REGISTRY" \
                                    -u "$REGISTRY_USERNAME" \
                                    --password-stdin

                                echo ""
                                echo "Pushing images..."

                                for service in \
                                    api-gateway \
                                    auth \
                                    user \
                                    product \
                                    cart \
                                    order \
                                    payment \
                                    address \
                                    review \
                                    rag \
                                    support \
                                    vendor \
                                    admin
                                do
                                    image="${REGISTRY}/${REGISTRY_NAMESPACE}/shopsphere-${service}"

                                    echo ""
                                    echo "----------------------------------------"
                                    echo "Pushing ${image}:${IMAGE_TAG}"
                                    echo "----------------------------------------"

                                    docker push "${image}:${IMAGE_TAG}"

                                    echo "Tagging ${image}:latest..."

                                    docker tag \
                                        "${image}:${IMAGE_TAG}" \
                                        "${image}:latest"

                                    echo "Pushing ${image}:latest..."

                                    docker push "${image}:latest"
                                done

                                echo ""
                                echo "All images pushed successfully."

                                docker logout "$REGISTRY"
                            '''
                        }
                    }
                }
            }
        }

        /*
         * ------------------------------------------------------------
         * DEPLOY TO KUBERNETES
         * ------------------------------------------------------------
         */
        stage('Deploy to Kubernetes') {
            when {
                expression {
                    return params.DEPLOY_TO_KUBERNETES
                }
            }

            steps {
                withCredentials([
                    file(
                        credentialsId: 'shopsphere-kubeconfig',
                        variable: 'KUBECONFIG_FILE'
                    ),
                    file(
                        credentialsId: 'shopsphere-env',
                        variable: 'SHOPSPHERE_ENV_FILE'
                    ),
                    usernamePassword(
                        credentialsId: 'docker-registry-credentials',
                        usernameVariable: 'REGISTRY_USERNAME',
                        passwordVariable: 'REGISTRY_PASSWORD'
                    )
                ]) {
                    dir("${COMPOSE_DIR}") {

                        withEnv([
                            "REGISTRY=${params.REGISTRY}",
                            "REGISTRY_NAMESPACE=${params.REGISTRY_NAMESPACE}"
                        ]) {
                            sh '''
                                set -eu

                                test -n "${REGISTRY:-}" || {
                                    echo "ERROR: REGISTRY is required"
                                    exit 1
                                }

                                test -n "${REGISTRY_NAMESPACE:-}" || {
                                    echo "ERROR: REGISTRY_NAMESPACE is required"
                                    exit 1
                                }

                                echo "========================================"
                                echo "Preparing Kubernetes deployment"
                                echo "========================================"

                                /*
                                 * ------------------------------------------------
                                 * Configure kubeconfig
                                 * ------------------------------------------------
                                 */

                                cp "$KUBECONFIG_FILE" .jenkins-kubeconfig

                                export KUBECONFIG="$PWD/.jenkins-kubeconfig"

                                cluster="$(
                                    kubectl config view \
                                        --minify \
                                        -o jsonpath='{.clusters[0].name}'
                                )"

                                server="$(
                                    kubectl config view \
                                        --minify \
                                        -o jsonpath='{.clusters[0].cluster.server}'
                                )"

                                echo "Kubernetes cluster: $cluster"
                                echo "Kubernetes server: $server"

                                /*
                                 * ------------------------------------------------
                                 * Handle Minikube running on Docker/Windows
                                 * ------------------------------------------------
                                 */

                                case "$server" in
                                    https://127.0.0.1:*|https://localhost:*)
                                        port="${server##*:}"

                                        echo "Detected localhost Kubernetes endpoint."
                                        echo "Changing endpoint to host.docker.internal:$port"

                                        kubectl config set-cluster "$cluster" \
                                            --server="https://host.docker.internal:$port" \
                                            --tls-server-name=minikube
                                        ;;
                                esac

                                /*
                                 * ------------------------------------------------
                                 * Create namespace
                                 * ------------------------------------------------
                                 */

                                echo ""
                                echo "Applying namespace..."

                                kubectl apply \
                                    -f k8s/00-namespace.yaml

                                /*
                                 * ------------------------------------------------
                                 * Application secrets
                                 * ------------------------------------------------
                                 */

                                echo ""
                                echo "Creating/updating application secrets..."

                                kubectl create secret generic shopsphere-secrets \
                                    --namespace shopsphere \
                                    --from-env-file="$SHOPSPHERE_ENV_FILE" \
                                    --dry-run=client \
                                    -o yaml | \
                                    kubectl apply -f -

                                /*
                                 * ------------------------------------------------
                                 * Docker registry secret
                                 * ------------------------------------------------
                                 */

                                echo ""
                                echo "Creating/updating registry secret..."

                                kubectl create secret docker-registry registry-credentials \
                                    --namespace shopsphere \
                                    --docker-server="$REGISTRY" \
                                    --docker-username="$REGISTRY_USERNAME" \
                                    --docker-password="$REGISTRY_PASSWORD" \
                                    --dry-run=client \
                                    -o yaml | \
                                    kubectl apply -f -

                                /*
                                 * ------------------------------------------------
                                 * Prepare Kustomize directory
                                 * ------------------------------------------------
                                 */

                                echo ""
                                echo "Preparing Kubernetes manifests..."

                                rm -rf .k8s-render

                                cp -R k8s .k8s-render

                                cd .k8s-render

                                /*
                                 * ------------------------------------------------
                                 * Add image overrides
                                 * ------------------------------------------------
                                 */

                                printf '\\nimages:\\n' >> kustomization.yaml

                                for service in \
                                    api-gateway \
                                    auth \
                                    user \
                                    product \
                                    cart \
                                    order \
                                    payment \
                                    address \
                                    review \
                                    rag \
                                    support \
                                    vendor \
                                    admin
                                do
                                    base="shopsphere/${service}-service"

                                    if [ "$service" = "api-gateway" ]; then
                                        base="shopsphere/api-gateway"
                                    fi

                                    printf \
                                        '  - name: %s\\n    newName: %s/%s/shopsphere-%s\\n    newTag: %s\\n' \
                                        "$base" \
                                        "$REGISTRY" \
                                        "$REGISTRY_NAMESPACE" \
                                        "$service" \
                                        "$IMAGE_TAG" \
                                        >> kustomization.yaml
                                done

                                /*
                                 * ------------------------------------------------
                                 * Deploy
                                 * ------------------------------------------------
                                 */

                                echo ""
                                echo "Applying Kubernetes manifests..."

                                kubectl kustomize . | \
                                    kubectl apply -f -

                                /*
                                 * ------------------------------------------------
                                 * Wait for deployments
                                 * ------------------------------------------------
                                 */

                                echo ""
                                echo "Waiting for Kubernetes deployments..."

                                kubectl rollout status \
                                    deployment \
                                    --all \
                                    --namespace shopsphere \
                                    --timeout=5m

                                echo ""
                                echo "========================================"
                                echo "Kubernetes deployment successful"
                                echo "========================================"

                                kubectl get deployments \
                                    --namespace shopsphere

                                kubectl get pods \
                                    --namespace shopsphere \
                                    -o wide
                            '''
                        }
                    }
                }
            }
        }
    }

    /*
     * ------------------------------------------------------------
     * POST ACTIONS
     * ------------------------------------------------------------
     */
    post {

        failure {
            script {
                if (fileExists("${COMPOSE_DIR}")) {
                    dir("${COMPOSE_DIR}") {
                        sh '''
                            set +e

                            echo ""
                            echo "========================================"
                            echo "Build failed - collecting diagnostics"
                            echo "========================================"

                            if [ -n "${KUBECONFIG_FILE:-}" ]; then
                                export KUBECONFIG="$KUBECONFIG_FILE"

                                kubectl get pods \
                                    -n shopsphere \
                                    -o wide || true

                                kubectl get deployments \
                                    -n shopsphere || true
                            fi
                        '''
                    }
                }
            }
        }

        always {
            script {
                if (fileExists("${COMPOSE_DIR}")) {
                    dir("${COMPOSE_DIR}") {
                        sh '''
                            set +e

                            echo ""
                            echo "Cleaning workspace..."

                            rm -f .env
                            rm -f .jenkins-kubeconfig
                            rm -rf .k8s-render

                            docker image prune -f || true
                        '''
                    }
                }
            }
        }
    }
}