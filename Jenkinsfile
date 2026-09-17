pipeline {
    agent any

    stages {

        stage('Frontend Build') {
            steps {
                dir('ecommerce-frontend-react-corrected') {
                    sh 'npm ci'
                    sh 'npm run build'
                }
            }
        }

        stage('Backend Install') {
            steps {
                dir('microservices') {
                    sh 'npm ci'
                }

                dir('microservices/services/rag') {
                    sh 'npm install --legacy-peer-deps'
                }
            }
        }

        stage('Backend Unit Tests') {
            steps {

                stage('Admin Tests') {
                    dir('microservices/services/admin') {
                        sh 'npm run test:coverage'
                    }
                }

                stage('Auth Tests') {
                    dir('microservices/services/auth') {
                        sh 'npm run test:coverage'
                    }
                }

                stage('Address Tests') {
                    dir('microservices/services/address') {
                        sh 'npm run test:coverage'
                    }
                }

                stage('Cart Tests') {
                    dir('microservices/services/cart') {
                        sh 'npm run test:coverage'
                    }
                }

                stage('Order Tests') {
                    dir('microservices/services/order') {
                        sh 'npm run test:coverage'
                    }
                }

                stage('Payment Tests') {
                    dir('microservices/services/payment') {
                        sh 'npm run test:coverage'
                    }
                }

                stage('Product Tests') {
                    dir('microservices/services/product') {
                        sh 'npm run test:coverage'
                    }
                }

                stage('RAG Tests') {
                    dir('microservices/services/rag') {
                        sh 'npm run test:coverage'
                    }
                }

                stage('Review Tests') {
                    dir('microservices/services/review') {
                        sh 'npm run test:coverage'
                    }
                }

                stage('API Gateway Tests') {
                    dir('microservices/services/api-gateway') {
                        sh 'npm run test:coverage'
                    }
                }
            }
        }
    }

    post {
        success {
            echo 'ShopSphere CI pipeline completed successfully!'
        }

        failure {
            echo 'ShopSphere CI pipeline failed.'
        }
    }
}