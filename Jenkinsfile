pipeline {
    agent any

    stages {
        stage('Pull Image') {
            steps {
                sh '''
                  echo "📥 Pulling latest image..."
                  docker pull impraveenraj/travel-check-list:latest
                '''
            }
        }

        stage('Run Container') {
            steps {
                sh '''
                  echo "🚀 Starting container..."
                  docker stop travel-check-list || true
                  docker rm travel-check-list || true
                  docker run -d --name travel-check-list -p 9090:80 impraveenraj/travel-check-list:latest
                '''
            }
        }

        stage('Test Deployment') {
            steps {
                sh '''
                  echo "🔍 Checking if app is running..."
                  sleep 5
                  curl -I http://localhost:9090 || exit 1
                  echo "✅ App is up and responding!"
                '''
            }
        }

        stage('UI Automation Tests') {
            agent {
                docker {
                    image 'mcr.microsoft.com/playwright:v1.47.2-focal'
                    args '-v /dev/shm:/dev/shm'
                }
            }
            steps {
                sh '''
                  echo "🧪 Running Playwright UI tests..."
                  npm ci || npm install
                  npx playwright test --reporter=line,junit --output=test-results
                '''
                junit 'test-results/*.xml'
            }
        }
    }
}
