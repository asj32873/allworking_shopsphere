pipeline {

    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
        skipDefaultCheckout(false)

        // Keep only the last 10 builds
        buildDiscarder(
            logRotator(
                numToKeepStr: '10',
                artifactNumToKeepStr: '10'
            )
        )
    }

    environment {
        COMPOSE_DIR = 'microservices'
        COMPOSE_FILE = 'docker-compose.yml'

        // Docker image/project name
        COMPOSE_PROJECT_NAME = 'shopsphere'

        // SonarQube project
        SONAR_PROJECT_KEY = 'shopsphere-microservices'
    }

    stages {

        stage('Checkout') {
            steps {
                echo 'Checking out ShopSphere source code...'
                checkout scm
            }
        }

        stage('Verify Environment') {
            steps {
                sh '''
                    set -e

                    echo "===== Tool Versions ====="

                    git --version
                    docker --version
                    docker compose version

                    echo ""
                    echo "===== Repository ====="
                    pwd
                    ls -la

                    echo ""
                    echo "===== Microservices ====="
                    ls -la microservices

                    test -f microservices/docker-compose.yml

                    echo "Environment verification successful."
                '''
            }
        }

        stage('Validate Docker Compose') {
            steps {
                dir("${COMPOSE_DIR}") {
                    sh '''
                        set -e

                        echo "Validating docker-compose.yml..."

                        docker compose \
                            -f ${COMPOSE_FILE} \
                            config -q

                        echo "Docker Compose configuration is valid."
                    '''
                }
            }
        }

        stage('Install / Validate Node Dependencies') {
            steps {
                dir("${COMPOSE_DIR}") {
                    sh '''
                        set -e

                        echo "Validating service package.json files..."

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
                            echo ""
                            echo "========================================"
                            echo "Checking $service"
                            echo "========================================"

                            test -f "services/$service/package.json"

                            node -e "
                                const p = require('./services/$service/package.json');
                                console.log('Service:', p.name);
                                console.log('Version:', p.version);
                                console.log('Dependencies:', Object.keys(p.dependencies || {}).length);
                            "
                        done

                        echo ""
                        echo "All service package.json files are valid."
                    '''
                }
            }
        }

        stage('Build Docker Images') {
            steps {
                dir("${COMPOSE_DIR}") {
                    sh '''
                        set -e

                        echo "Building all ShopSphere Docker images..."

                        docker compose \
                            -f ${COMPOSE_FILE} \
                            build \
                            --pull

                        echo "Docker image build completed."
                    '''
                }
            }
        }

        stage('Run Tests') {
            steps {
                dir("${COMPOSE_DIR}") {
                    sh '''
                        set -e

                        echo "Running tests for services that define a test script."

                        services="
                        api-gateway
                        auth
                        user
                        product
                        cart
                        order
                        payment
                        address
                        review
                        rag
                        support
                        vendor
                        admin
                        "

                        for service in $services
                        do
                            echo ""
                            echo "========================================"
                            echo "Testing $service"
                            echo "========================================"

                            if [ -f "services/$service/package.json" ]; then

                                has_test=$(node -e "
                                    const p = require('./services/$service/package.json');
                                    process.stdout.write(
                                        p.scripts && p.scripts.test ? 'yes' : 'no'
                                    );
                                ")

                                if [ "$has_test" = "yes" ]; then

                                    echo "Test script found for $service"

                                    docker compose \
                                        -f ${COMPOSE_FILE} \
                                        run \
                                        --rm \
                                        --no-deps \
                                        "$service" \
                                        npm test

                                else

                                    echo "No test script defined for $service - skipping."

                                fi

                            else
                                echo "package.json not found - skipping."
                            fi
                        done

                        echo ""
                        echo "Test stage completed."
                    '''
                }
            }
        }

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
                                set -e

                                echo "Running SonarQube analysis..."

                                sonar-scanner \
                                    -Dsonar.projectKey=${SONAR_PROJECT_KEY} \
                                    -Dsonar.projectName=ShopSphere-Microservices \
                                    -Dsonar.sources=services,packages \
                                    -Dsonar.exclusions="**/node_modules/**,**/coverage/**,**/tests/**" \
                                    -Dsonar.token=${SONAR_TOKEN}

                                echo "SonarQube analysis completed."
                            '''
                        }
                    }
                }
            }
        }

        stage('Start Infrastructure') {
            steps {
                withCredentials([
                    file(
                        credentialsId: 'shopsphere-env',
                        variable: 'SHOPSHPERE_ENV_FILE'
                    )
                ]) {

                    dir("${COMPOSE_DIR}") {
                        sh '''
                            set -e

                            cp "$SHOPSHPERE_ENV_FILE" .env

                            chmod 600 .env

                            docker compose \
                                -f docker-compose.yml \
                                up -d
                        '''
                    }
                }
            }
        }
        stage('Wait For Services') {
            steps {
                dir("${COMPOSE_DIR}") {
                    sh '''
                        set -e

                        echo "Waiting for services to start..."

                        sleep 20

                        echo ""
                        echo "===== Container Status ====="

                        docker compose \
                            -f ${COMPOSE_FILE} \
                            ps

                        echo ""
                        echo "===== Container Health / Status ====="

                        docker ps \
                            --filter "name=shopsphere" \
                            --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}"

                        echo ""
                        echo "Service startup check completed."
                    '''
                }
            }
        }

        stage('Smoke Check') {
            steps {
                dir("${COMPOSE_DIR}") {
                    sh '''
                        set -e

                        echo "Checking API Gateway..."

                        # Gateway is the externally exposed API.
                        # Adjust /health if your gateway uses another health endpoint.

                        if curl -fsS http://localhost:5001/health > /dev/null 2>&1; then
                            echo "API Gateway health check passed."
                        else
                            echo "WARNING: /health endpoint was not available."
                            echo "Checking container logs instead..."

                            docker compose \
                                -f ${COMPOSE_FILE} \
                                logs \
                                --tail=50 \
                                api-gateway
                        fi
                    '''
                }
            }
        }
    }

    post {

        success {
            echo '''
            ============================================
            ShopSphere Jenkins Build SUCCESS
            ============================================
            Docker images built successfully.
            Tests completed.
            SonarQube analysis completed.
            Docker Compose deployment completed.
            '''
        }

        failure {
            echo '''
            ============================================
            ShopSphere Jenkins Build FAILED
            ============================================
            Collecting Docker Compose logs...
            '''

            dir("${COMPOSE_DIR}") {
                sh '''
                    docker compose \
                        -f ${COMPOSE_FILE} \
                        ps || true

                    docker compose \
                        -f ${COMPOSE_FILE} \
                        logs \
                        --tail=100 || true
                '''
            }
        }

        always {
            dir("${COMPOSE_DIR}") {
                sh '''
                    echo "Cleaning unused Docker resources..."

                    docker image prune -f || true
                '''
            }
        }
    }
}

