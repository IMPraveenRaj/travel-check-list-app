pipeline {
  agent any

  environment {
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
          image 'mcr.microsoft.com/playwright:v1.54.0-noble'
          // reach host app + bigger /dev/shm for Chromium
          args '--add-host=host.docker.internal:host-gateway -v /dev/shm:/dev/shm'
        }
      }
      steps {
        sh '''
          echo "🧪 Running Playwright UI tests..."
          echo "Workspace (container PWD): $PWD"

          PW_HTML_DIR="$PWD/playwright-report"
          PW_JUNIT_DIR="$PWD/test-results"
          PW_JUNIT_FILE="$PW_JUNIT_DIR/results.xml"

          export NPM_CONFIG_CACHE="$PWD/.npm"
          mkdir -p "$NPM_CONFIG_CACHE" "$PW_JUNIT_DIR" "$PW_HTML_DIR"

          if [ -f package-lock.json ]; then
            npm ci --no-audit --no-fund
          else
            npm install --no-audit --no-fund
          fi

          # CI Playwright config (forces outputs to mounted workspace)
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

          # Run tests
          APP_URL="$APP_URL" PW_JUNIT_FILE="$PW_JUNIT_FILE" PW_HTML_DIR="$PW_HTML_DIR" \
            npx playwright test --config=jenkins.playwright.config.ts

          # Prove where the HTML landed (debug)
          echo "Searching for index.html..."
          find "$PWD" -maxdepth 4 -path "*/playwright-report/index.html" -print || true

          # Ensure Jenkins can copy (ownership/permissions)
          HOST_UID=$(stat -c '%u' . || id -u)
          HOST_GID=$(stat -c '%g' . || id -g)
          chown -R "${HOST_UID}:${HOST_GID}" "$PW_HTML_DIR" "$PW_JUNIT_DIR" || true
          chmod -R a+rX "$PW_HTML_DIR" "$PW_JUNIT_DIR" || true

          # Guards (clear errors if missing)
          [ -f "$PW_JUNIT_FILE" ] || { echo "❌ Missing $PW_JUNIT_FILE"; exit 3; }
          [ -f "$PW_HTML_DIR/index.html" ] || { echo "❌ Missing $PW_HTML_DIR/index.html (HTML report not generated)"; exit 2; }

          echo "✅ Reports ready:"
          ls -lah "$PW_JUNIT_DIR"
          ls -lah "$PW_HTML_DIR"
        '''
      }
      post {
        always {
          // Pre-clean this build's publish target (avoids leftover perms)
          sh '''
            if [ -n "$JENKINS_HOME" ] && [ -n "$JOB_NAME" ] && [ -n "$BUILD_NUMBER" ]; then
              TARGET_DIR="$JENKINS_HOME/jobs/$JOB_NAME/builds/$BUILD_NUMBER/htmlreports/Playwright_20Report"
              rm -rf "$TARGET_DIR" || true
            fi
          '''

          // JUnit tab + trends
          junit allowEmptyResults: true, testResults: 'test-results/results.xml'

          // Keep artifacts for download (HTML report, traces, screenshots)
          archiveArtifacts artifacts: 'test-results/**,playwright-report/**', onlyIfSuccessful: false

          // Publish Playwright HTML report inside Jenkins
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
