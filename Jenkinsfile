pipeline {


    agent {
        label 'docker-agent'
    }

environment {

    DOCKER_USER = credentials('dockerhub-creds')

    IMAGE_PREFIX = "yourdockerusername/shopsphere"

}

stages {


stage('Checkout') {

steps {

checkout scm

}

}



stage('Install Dependencies') {

steps {

dir('microservices') {

sh 'npm ci'

}

}

}



stage('Test') {

steps {

dir('microservices') {

sh 'npm test || true'

}

}

}



stage('Build Images') {

steps {

dir('microservices') {


sh """

docker build \
-t ${IMAGE_PREFIX}-auth:${BUILD_NUMBER} \
-f services/auth/Dockerfile .


docker build \
-t ${IMAGE_PREFIX}-product:${BUILD_NUMBER} \
-f services/product/Dockerfile .


docker build \
-t ${IMAGE_PREFIX}-gateway:${BUILD_NUMBER} \
-f services/api-gateway/Dockerfile .


"""

}

}

}



stage('Docker Login') {

steps {

sh """

echo $DOCKER_USER_PSW | docker login \
-u $DOCKER_USER_USR \
--password-stdin

"""

}

}



stage('Push Images') {

steps {

sh """

docker push ${IMAGE_PREFIX}-auth:${BUILD_NUMBER}

docker push ${IMAGE_PREFIX}-product:${BUILD_NUMBER}

docker push ${IMAGE_PREFIX}-gateway:${BUILD_NUMBER}

"""

}

}


}

}



// pipeline {

//     agent any

//     options {
//         timestamps()
//         disableConcurrentBuilds()

//         skipDefaultCheckout(true)

//         buildDiscarder(
//             logRotator(
//                 numToKeepStr: '10',
//                 artifactNumToKeepStr: '10'
//             )
//         )
//     }

//     environment {

//         // ========================================================
//         // Docker Compose configuration
//         // ========================================================

//         COMPOSE_DIR = 'microservices'
//         COMPOSE_FILE = 'docker-compose.yml'
//         COMPOSE_PROJECT_NAME = 'shopsphere'

//         // ========================================================
//         // SonarQube
//         // ========================================================

//         SONAR_PROJECT_KEY = 'shopsphere-microservices'

//         // ========================================================
//         // Node.js
//         // ========================================================

//         PATH = "C:\\Program Files\\nodejs;${env.PATH}"
//     }


//     stages {

//         // ========================================================
//         // CHECKOUT
//         // ========================================================

//         stage('Checkout') {
//             steps {

//                 echo 'Checking out ShopSphere source code...'

//                 checkout scm
//             }
//         }


//         // ========================================================
//         // LOAD ENVIRONMENT FILE
//         // ========================================================

//         stage('Load Environment') {

//             steps {

//                 withCredentials([
//                     file(
//                         credentialsId: 'shopsphere-env',
//                         variable: 'SHOPSPHERE_ENV_FILE'
//                     )
//                 ]) {

//                     dir("${COMPOSE_DIR}") {

//                         bat '''
//                             @echo off

//                             echo ========================================
//                             echo Loading ShopSphere environment
//                             echo ========================================

//                             if not exist "%SHOPSPHERE_ENV_FILE%" (
//                                 echo ERROR: Jenkins environment credential file was not found.
//                                 exit /b 1
//                             )

//                             copy /Y "%SHOPSPHERE_ENV_FILE%" ".env" >nul

//                             if errorlevel 1 (
//                                 echo ERROR: Failed to copy Jenkins environment file.
//                                 exit /b 1
//                             )

//                             if not exist ".env" (
//                                 echo ERROR: .env file was not created.
//                                 exit /b 1
//                             )

//                             echo ShopSphere environment file loaded successfully.
//                         '''
//                     }
//                 }
//             }
//         }


//         // ========================================================
//         // VERIFY ENVIRONMENT
//         // ========================================================

//         stage('Verify Environment') {

//             steps {

//                 bat '''
//                     @echo off

//                     echo ========================================
//                     echo Verifying Jenkins Environment
//                     echo ========================================

//                     echo.
//                     echo Docker:
//                     docker --version

//                     if errorlevel 1 exit /b 1


//                     echo.
//                     echo Docker Compose:
//                     docker compose version

//                     if errorlevel 1 exit /b 1


//                     echo.
//                     echo Node.js:
//                     where node

//                     if errorlevel 1 (
//                         echo ERROR: Node.js was not found in Jenkins PATH.
//                         exit /b 1
//                     )

//                     node --version

//                     if errorlevel 1 exit /b 1


//                     echo.
//                     echo npm:
//                     where npm

//                     if errorlevel 1 (
//                         echo ERROR: npm was not found in Jenkins PATH.
//                         exit /b 1
//                     )

//                     npm --version

//                     if errorlevel 1 exit /b 1


//                     echo.
//                     echo Git:
//                     git --version

//                     if errorlevel 1 exit /b 1


//                     echo.
//                     echo SonarScanner:
//                     sonar-scanner --version

//                     if errorlevel 1 exit /b 1


//                     echo.
//                     echo ========================================
//                     echo Environment verification completed.
//                     echo ========================================
//                 '''
//             }
//         }


//         // ========================================================
//         // VALIDATE DOCKER COMPOSE
//         // ========================================================

//         stage('Validate Docker Compose') {

//             steps {

//                 dir("${COMPOSE_DIR}") {

//                     bat '''
//                         @echo off

//                         echo ========================================
//                         echo Validating Docker Compose configuration
//                         echo ========================================

//                         if not exist "%COMPOSE_FILE%" (
//                             echo ERROR: %COMPOSE_FILE% was not found.
//                             echo Current directory:
//                             cd
//                             echo.
//                             echo Files:
//                             dir
//                             exit /b 1
//                         )


//                         echo.
//                         echo Checking environment variables...


//                         docker compose -f "%COMPOSE_FILE%" config -q

//                         if errorlevel 1 (
//                             echo ERROR: Docker Compose configuration is invalid.
//                             exit /b 1
//                         )


//                         echo.
//                         echo ========================================
//                         echo Docker Compose configuration is valid.
//                         echo ========================================
//                     '''
//                 }
//             }
//         }


//         // ========================================================
//         // VALIDATE NODE DEPENDENCIES / PACKAGE.JSON
//         // ========================================================

//         stage('Install / Validate Node Dependencies') {

//             steps {

//                 dir("${COMPOSE_DIR}") {

//                     bat '''
//                         @echo off

//                         echo ========================================
//                         echo Validating service package.json files
//                         echo ========================================

//                         for %%S in (
//                             api-gateway
//                             auth
//                             user
//                             product
//                             cart
//                             order
//                             payment
//                             address
//                             review
//                             rag
//                             support
//                             vendor
//                             admin
//                         ) do (

//                             echo.
//                             echo ========================================
//                             echo Checking %%S
//                             echo ========================================

//                             if not exist "services/%%S/package.json" (
//                                 echo ERROR: services/%%S/package.json not found.
//                                 exit /b 1
//                             )

//                             node -e "const p=require('./services/%%S/package.json'); console.log('Service:',p.name); console.log('Version:',p.version); console.log('Dependencies:',Object.keys(p.dependencies||{}).length);"

//                             if errorlevel 1 (
//                                 echo ERROR: Invalid package.json for %%S.
//                                 exit /b 1
//                             )
//                         )

//                         echo.
//                         echo ========================================
//                         echo All service package.json files are valid.
//                         echo ========================================
//                     '''
//                 }
//             }
//         }


//         // ========================================================
//         // BUILD DOCKER IMAGES
//         // ========================================================

//         stage('Build Docker Images') {

//             steps {

//                 dir("${COMPOSE_DIR}") {

//                     bat '''
//                         @echo off

//                         echo ========================================
//                         echo Building ShopSphere Docker images
//                         echo ========================================

//                         docker compose -f "%COMPOSE_FILE%" build --pull

//                         if errorlevel 1 (
//                             echo ERROR: Docker image build failed.
//                             exit /b 1
//                         )

//                         echo.
//                         echo ========================================
//                         echo Docker image build completed successfully.
//                         echo ========================================
//                     '''
//                 }
//             }
//         }


//         // ========================================================
//         // RUN TESTS
//         // ========================================================

//         stage('Run Tests') {

//             steps {

//                 dir("${COMPOSE_DIR}") {

//                     bat '''
//                         @echo off

//                         echo ========================================
//                         echo Running service tests
//                         echo ========================================

//                         for %%S in (
//                             api-gateway
//                             auth
//                             user
//                             product
//                             cart
//                             order
//                             payment
//                             address
//                             review
//                             rag
//                             support
//                             vendor
//                             admin
//                         ) do (

//                             echo.
//                             echo ========================================
//                             echo Testing %%S
//                             echo ========================================

//                             if not exist "services/%%S/package.json" (

//                                 echo package.json not found for %%S - skipping.

//                             ) else (

//                                 node -e "const p=require('./services/%%S/package.json'); process.exit(p.scripts && p.scripts.test ? 0 : 1);"

//                                 if errorlevel 1 (

//                                     echo No test script defined for %%S - skipping.

//                                 ) else (

//                                     echo Test script found for %%S.
//                                     echo Running npm test inside Docker container...

//                                     docker compose -f "%COMPOSE_FILE%" run --rm --no-deps %%S npm test

//                                     if errorlevel 1 (
//                                         echo ERROR: Tests failed for %%S.
//                                         exit /b 1
//                                     )
//                                 )
//                             )
//                         )

//                         echo.
//                         echo ========================================
//                         echo Test stage completed successfully.
//                         echo ========================================
//                     '''
//                 }
//             }
//         }


//         // ========================================================
//         // SONARQUBE ANALYSIS
//         // ========================================================

//         stage('SonarQube Analysis') {

//             steps {

//                 withCredentials([
//                     string(
//                         credentialsId: 'sonarqube-token',
//                         variable: 'SONAR_TOKEN'
//                     )
//                 ]) {

//                     withSonarQubeEnv('SonarQube') {

//                         dir("${COMPOSE_DIR}") {

//                             bat '''
//                                 @echo off

//                                 echo ========================================
//                                 echo Running SonarQube analysis
//                                 echo ========================================

//                                 sonar-scanner ^
//                                     -Dsonar.projectKey="%SONAR_PROJECT_KEY%" ^
//                                     -Dsonar.projectName="ShopSphere-Microservices" ^
//                                     -Dsonar.sources="services,packages" ^
//                                     -Dsonar.exclusions="**/node_modules/**,**/coverage/**,**/tests/**" ^
//                                     -Dsonar.token="%SONAR_TOKEN%"

//                                 if errorlevel 1 (
//                                     echo ERROR: SonarQube analysis failed.
//                                     exit /b 1
//                                 )

//                                 echo.
//                                 echo ========================================
//                                 echo SonarQube analysis completed successfully.
//                                 echo ========================================
//                             '''
//                         }
//                     }
//                 }
//             }
//         }


//         // ========================================================
//         // START INFRASTRUCTURE
//         // ========================================================

//         stage('Start Infrastructure') {

//             steps {

//                 dir("${COMPOSE_DIR}") {

//                     bat '''
//                         @echo off

//                         echo ========================================
//                         echo Starting ShopSphere infrastructure
//                         echo ========================================

//                         if not exist ".env" (
//                             echo ERROR: .env file is missing.
//                             echo The Load Environment stage should have created it.
//                             exit /b 1
//                         )

//                         echo.
//                         echo Starting Docker Compose services...

//                         docker compose -f "%COMPOSE_FILE%" up -d

//                         if errorlevel 1 (
//                             echo ERROR: Docker Compose failed to start.
//                             exit /b 1
//                         }

//                         echo.
//                         echo ========================================
//                         echo ShopSphere infrastructure started successfully.
//                         echo ========================================
//                     '''
//                 }
//             }
//         }


//         // ========================================================
//         // WAIT FOR SERVICES
//         // ========================================================

//         stage('Wait For Services') {

//             steps {

//                 dir("${COMPOSE_DIR}") {

//                     bat '''
//                         @echo off

//                         echo ========================================
//                         echo Waiting for services to start
//                         echo ========================================

//                         timeout /t 20 /nobreak >nul


//                         echo.
//                         echo ========================================
//                         echo Container Status
//                         echo ========================================

//                         docker compose -f "%COMPOSE_FILE%" ps

//                         if errorlevel 1 (
//                             echo WARNING: Could not retrieve Compose status.
//                         )


//                         echo.
//                         echo ========================================
//                         echo Docker Container Health / Status
//                         echo ========================================

//                         docker ps ^
//                             --filter "name=shopsphere" ^
//                             --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}"


//                         echo.
//                         echo Service startup check completed.
//                     '''
//                 }
//             }
//         }


//         // ========================================================
//         // SMOKE CHECK
//         // ========================================================

//         stage('Smoke Check') {

//             steps {

//                 dir("${COMPOSE_DIR}") {

//                     bat '''
//                         @echo off

//                         echo ========================================
//                         echo Running API Gateway smoke check
//                         echo ========================================

//                         echo Checking http://localhost:5001/health ...

//                         curl.exe -fsS http://localhost:5001/health >nul 2>&1

//                         if errorlevel 1 (

//                             echo.
//                             echo WARNING: /health endpoint was not available.

//                             echo.
//                             echo Checking API Gateway container logs...

//                             echo.

//                             docker compose -f "%COMPOSE_FILE%" logs --tail=50 api-gateway

//                             echo.
//                             echo Smoke check did not pass.

//                             exit /b 1
//                         )

//                         echo.
//                         echo API Gateway health check passed.
//                     '''
//                 }
//             }
//         }
//     }


//     // ============================================================
//     // POST ACTIONS
//     // ============================================================

//     post {

//         success {

//             echo '''
//             ============================================
//             ShopSphere Jenkins Build SUCCESS
//             ============================================
//             Docker images built successfully.
//             Tests completed.
//             SonarQube analysis completed.
//             Docker Compose deployment completed.
//             '''
//         }


//         failure {

//             echo '''
//             ============================================
//             ShopSphere Jenkins Build FAILED
//             ============================================
//             Collecting Docker Compose information...
//             '''

//             dir("${COMPOSE_DIR}") {

//                 bat '''
//                     @echo off

//                     echo.
//                     echo ========================================
//                     echo Docker Compose Container Status
//                     echo ========================================

//                     docker compose -f "%COMPOSE_FILE%" ps


//                     echo.
//                     echo ========================================
//                     echo Docker Compose Logs
//                     echo ========================================

//                     docker compose -f "%COMPOSE_FILE%" logs --tail=100

//                     exit /b 0
//                 '''
//             }
//         }


//         always {

//             dir("${COMPOSE_DIR}") {

//                 bat '''
//                     @echo off

//                     echo.
//                     echo ========================================
//                     echo Cleaning ShopSphere environment file
//                     echo ========================================

//                     if exist ".env" (
//                         del /F /Q ".env"
//                         echo Jenkins .env file removed.
//                     ) else (
//                         echo No .env file found.
//                     )


//                     echo.
//                     echo ========================================
//                     echo Cleaning unused Docker resources
//                     echo ========================================

//                     docker image prune -f

//                     echo Docker cleanup completed.

//                     exit /b 0
//                 '''
//             }
//         }
//     }
// }