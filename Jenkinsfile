pipeline {
  agent any

  environment {
    // Your app runs on the Jenkins node at 9090
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
          // Valid Playwright image tag
          image 'mcr.microsoft.com/playwright:v1.54.0-noble'
          // Let container reach host app + enough shared memory for Chromium
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
            npm ci --no-audit --no-fund
          else
            npm install --no-audit --no-fund
          fi

          # Write a Playwright config specifically for CI so reports go to known paths
          cat > jenkins.playwright.config.ts <<'EOF'
          import { defineConfig } from '@playwright/test';
          export default defineConfig({
            use: {
              baseURL: process.env.APP_URL || 'http://localhost:9090',
            },
            reporter: [
              ['line'],
              ['junit', { outputFile: 'test-results/results.xml' }],
              ['html',  { outputFolder: 'playwright-report', open: 'never' }],
            ],
          });
          EOF

          # Ensure results folders exist
          mkdir -p test-results

          # Run tests with the CI config
          APP_URL="$APP_URL" npx playwright test --config=jenkins.playwright.config.ts
        '''
      }
      post {
        always {
          // JUnit test results (enables "Test Result" & trend)
          junit allowEmptyResults: true, testResults: 'test-results/results.xml'

          // Keep raw artifacts too
          archiveArtifacts artifacts: 'test-results/**,playwright-report/**', onlyIfSuccessful: false

          // Publish Playwright HTML report inside Jenkins UI
          publishHTML([
            reportDir: 'playwright-report',
            reportFiles: 'index.html',
            reportName: 'Playwright Report',
            keepAll: true,
            alwaysLinkToLastBuild: true,
            allowMissing: true
          ])
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
