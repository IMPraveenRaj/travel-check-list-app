pipeline {
  agent any

  environment {
    // App runs on the Jenkins node at 9090
    // From inside the Playwright docker agent, use host.docker.internal to reach the host.
    APP_URL = "http://host.docker.internal:9090"
    NPM_CONFIG_CACHE = "${WORKSPACE}/.npm"
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
          # give container a moment to come up
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
          // needed so Chromium has enough shared memory, and to resolve host.docker.internal on Linux
          args '--add-host=host.docker.internal:host-gateway -v /dev/shm:/dev/shm'
        }
      }
      steps {
        sh '''
          echo "🧪 Running Playwright UI tests..."
          mkdir -p "$NPM_CONFIG_CACHE"

          # Install dependencies from package.json at repo root
          if [ -f package-lock.json ]; then
            npm ci
          else
            npm install
          fi

          # Where tests live (support either tests/ or test/)
          TEST_DIR="tests"
          [ -d test ] && TEST_DIR="test"

          # Run tests; write artifacts into test-results/
          mkdir -p test-results
          APP_URL="$APP_URL" npx playwright test \
            --reporter=junit,line \
            --output=test-results

          # If JUnit file isn't in test-results, move it there so Jenkins can find it
          # (Playwright's junit reporter defaults to results.xml in CWD)
          if [ -f results.xml ]; then
            mv results.xml test-results/
          fi

          # Also generate nice HTML report for debugging
          npx playwright show-report --output=test-results/html || true
        '''
      }
      post {
        always {
          // Publish JUnit results (won't fail job if none are found)
          junit allowEmptyResults: true, testResults: 'test-results/**/*.xml'

          // Archive Playwright HTML report (if present)
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
