pipeline {
  agent any

  environment {
    // App runs on the Jenkins node at 9090
    APP_URL = "http://host.docker.internal:9090"
  }

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
          docker run -d --name travel-check-list -p 9090:80 \
            --restart unless-stopped \
            impraveenraj/travel-check-list:latest
        '''
      }
    }

    stage('Smoke Check') {
      steps {
        sh '''
          echo "🔍 Checking if app is running..."
          for i in {1..12}; do
            if curl -sSf -o /dev/null http://localhost:9090; then
              echo "✅ App is up!"
              exit 0
            fi
            echo "…waiting ($i)"
            sleep 5
          done
          echo "❌ App did not become ready on :9090"
          exit 1
        '''
      }
    }

    stage('UI Automation Tests') {
      agent {
        docker {
          image 'mcr.microsoft.com/playwright:v1.47.2-focal'
          // allow Playwright container to reach host app + give Chromium enough shm
          args '--add-host=host.docker.internal:host-gateway -v /dev/shm:/dev/shm'
        }
      }
      steps {
        sh '''
          echo "🧪 Running Playwright UI tests..."

          # Safe npm cache path inside the container workspace
          export NPM_CONFIG_CACHE="$PWD/.npm"
          mkdir -p "$NPM_CONFIG_CACHE"

          if [ -f package-lock.json ]; then
            npm ci
          else
            npm install
          fi

          # detect tests directory (test/ or tests/)
          TEST_DIR="tests"
          [ -d test ] && TEST_DIR="test"

          mkdir -p test-results

          # run tests with APP_URL passed
          APP_URL="$APP_URL" npx playwright test \
            --reporter=junit,line \
            --output=test-results

          # normalize junit file if Playwright drops it at root
          [ -f results.xml ] && mv results.xml test-results/

          # generate html report too
          npx playwright show-report --output=test-results/html || true
        '''
      }
      post {
        always {
          junit allowEmptyResults: true, testResults: 'test-results/**/*.xml'
          archiveArtifacts artifacts: 'test-results/**', onlyIfSuccessful: false
        }
      }
    }
  }

  post {
    always {
      echo "🧹 Cleaning workspace..."
      cleanWs()
    }
  }
}
