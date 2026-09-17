pipeline {
    agent any

    stages {

        stage('Frontend Build') {
            steps {
                dir('ecommerce-frontend-react-corrected') {
                    sh 'npm install'
                    sh 'npm run build'
                }
            }
        }

        stage('Backend Install') {
            steps {
                dir('microservices') {
                    sh 'npm install'
                }

                dir('microservices/services/rag') {
                    sh 'npm install --legacy-peer-deps'
                }
            }
        }

        stage('Admin Tests') {
            steps {
                dir('microservices/services/admin') {
                    sh 'npm run test:coverage'
                }
            }
        }

        stage('Auth Tests') {
            steps {
                dir('microservices/services/auth') {
                    sh 'npm run test:coverage'
                }
            }
        }

        stage('Address Tests') {
            steps {
                dir('microservices/services/address') {
                    sh 'npm run test:coverage'
                }
            }
        }

        stage('Cart Tests') {
            steps {
                dir('microservices/services/cart') {
                    sh 'npm run test:coverage'
                }
            }
        }

        stage('Order Tests') {
            steps {
                dir('microservices/services/order') {
                    sh 'npm run test:coverage'
                }
            }
        }

        stage('Payment Tests') {
            steps {
                dir('microservices/services/payment') {
                    sh 'npm run test:coverage'
                }
            }
        }

        stage('Product Tests') {
            steps {
                dir('microservices/services/product') {
                    sh 'npm run test:coverage'
                }
            }
        }

        stage('RAG Tests') {
            steps {
                dir('microservices/services/rag') {
                    sh 'npm run test:coverage'
                }
            }
        }

        stage('Review Tests') {
            steps {
                dir('microservices/services/review') {
                    sh 'npm run test:coverage'
                }
            }
        }

        stage('API Gateway Tests') {
            steps {
                dir('microservices/services/api-gateway') {
                    sh 'npm run test:coverage'
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