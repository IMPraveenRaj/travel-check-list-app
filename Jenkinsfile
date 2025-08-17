pipeline {
    agent any

    stages {
        stage('Pull Image') {
            steps {
                sh '''
                  docker pull impraveenraj/travel-check-list:latest
                '''
            }
        }

        stage('Run Container') {
            steps {
                sh '''
                  # Stop and remove if exists
                  docker stop travel-check-list || true
                  docker rm travel-check-list || true

                  # Run new container
                  docker run -d --name travel-check-list -p 9090:80 impraveenraj/travel-check-list:latest
                '''
            }
        }

        stage('Test Deployment') {
            steps {
                sh '''
                  echo "Testing if app is responding on port 9090..."
                  sleep 5
                  curl -I http://localhost:9090 || exit 1
                  echo "✅ App is up and responding!"
                '''
            }
        }

        stage('UI Automation Tests') {
            steps {
                sh '''
                  echo "Running Playwright UI tests..."
                  npm ci || npm install
                  npx playwright install --with-deps
                  npx playwright test --reporter=line,junit --output=test-results
                '''
                junit 'test-results/*.xml'
            }
        }
    }
}
