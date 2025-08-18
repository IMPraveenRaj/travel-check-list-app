pipeline {
  agent any

  environment {
    APP_URL = "http://host.docker.internal:9090"
    // Absolute paths in the Jenkins host workspace
    PW_HTML_DIR = "${WORKSPACE}/playwright-report"
    PW_JUNIT_FILE = "${WORKSPACE}/test-results/results.xml"
    PW_JUNIT_DIR  = "${WORKSPACE}/test-results"
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
          image 'mcr.microsoft.com/playwright:v1.54.0-noble'
          // Mounts the workspace; allow container to reach host + bigger /dev/shm
          args '--add-host=host.docker.internal:host-gateway -v /dev/shm:/dev/shm'
        }
      }
      steps {
        sh '''
          echo "🧪 Running Playwright UI tests..."
          echo "Workspace (host): $WORKSPACE"
          echo "HTML report dir : $PW_HTML_DIR"
          echo "JUnit file      : $PW_JUNIT_FILE"

          # Safe npm cache path inside the container workspace
          export NPM_CONFIG_CACHE="$PWD/.npm"
          mkdir -p "$NPM_CONFIG_CACHE" "$PW_JUNIT_DIR" "$PW_HTML_DIR"

          if [ -f package-lock.json ]; then
            npm ci --no-audit --no-fund
          else
            npm install --no-audit --no-fund
          fi

          # Create a CI-specific Playwright config that uses ABSOLUTE paths
          cat > jenkins.playwright.config.ts <<'EOF'
          import { defineConfig } from '@playwright/test';
          export default defineConfig({
            use: {
              baseURL: process.env.APP_URL || 'http://localhost:9090',
              screenshot: 'only-on-failure',
              trace: 'retain-on-failure',
              video: 'retain-on-failure',
            },
            reporter: [
              ['line'],
              ['junit', { outputFile: process.env.PW_JUNIT_FILE }],
              ['html',  { outputFolder: process.env.PW_HTML_DIR, open: 'never' }],
            ],
          });
          EOF

          # Run tests (outputs go to absolute host-mounted paths)
          APP_URL="$APP_URL" PW_JUNIT_FILE="$PW_JUNIT_FILE" PW_HTML_DIR="$PW_HTML_DIR" \
            npx playwright test --config=jenkins.playwright.config.ts

          # Debug: show where things landed (host paths)
          echo "🔎 Listing test-results and playwright-report..."
          ls -lah "$PW_JUNIT_DIR" || true
          ls -lah "$PW_HTML_DIR"  || true

          # Guard so publishHTML won't fail silently
          [ -f "$PW_HTML_DIR/index.html" ] || { echo "❌ Missing $PW_HTML_DIR/index.html"; exit 2; }
          [ -f "$PW_JUNIT_FILE" ]          || { echo "❌ Missing $PW_JUNIT_FILE"; exit 3; }
        '''
      }
      post {
        always {
          // JUnit test tab in Jenkins
          junit allowEmptyResults: true, testResults: 'test-results/results.xml'

          // Keep raw artifacts (HTML report, traces, screenshots)
          archiveArtifacts artifacts: 'test-results/**,playwright-report/**', onlyIfSuccessful: false

          // Publish HTML report inside Jenkins UI (uses absolute dir in workspace)
          publishHTML([
            reportDir: 'playwright-report',
            reportFiles: 'index.html',
            reportName: 'Playwright Report',
            keepAll: true,
            alwaysLinkToLastBuild: true,
            allowMissing: false
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
