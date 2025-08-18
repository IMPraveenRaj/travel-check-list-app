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
          args '--add-host=host.docker.internal:host-gateway -v /dev/shm:/dev/shm'
        }
      }
      steps {
        sh '''
          echo "🧪 Running Playwright UI tests..."
          echo "Workspace (container PWD): $PWD"

          PW_HTML_DIR="$PWD/playwright-report"
          PW_HTML_SAFE="$PWD/playwright-report-safe"
          PW_JUNIT_DIR="$PWD/test-results"
          PW_JUNIT_FILE="$PW_JUNIT_DIR/results.xml"

          export NPM_CONFIG_CACHE="$PWD/.npm"
          mkdir -p "$NPM_CONFIG_CACHE" "$PW_JUNIT_DIR" "$PW_HTML_DIR"

          if [ -f package-lock.json ]; then
            npm ci --no-audit --no-fund
          else
            npm install --no-audit --no-fund
          fi

          # CI Playwright config -> writes exactly where we want
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

          # Sanity: prove index.html exists
          [ -f "$PW_HTML_DIR/index.html" ] || { echo "❌ Missing $PW_HTML_DIR/index.html"; exit 2; }
          [ -f "$PW_JUNIT_FILE" ]          || { echo "❌ Missing $PW_JUNIT_FILE"; exit 3; }

          echo "🔎 Original report listing:"
          ls -lah "$PW_HTML_DIR" | sed 's/^/  /'

          # ---- Make a clean, symlink‑free, readable copy for the publisher ----
          rm -rf "$PW_HTML_SAFE"
          mkdir -p "$PW_HTML_SAFE"
          # -L follows symlinks, ensuring plain files get copied
          cp -a -L "$PW_HTML_DIR"/. "$PW_HTML_SAFE"/

          # Relax perms so Jenkins can traverse/copy
          chmod -R a+rX "$PW_HTML_SAFE" "$PW_JUNIT_DIR" || true

          echo "🔎 Safe report listing:"
          ls -lah "$PW_HTML_SAFE" | sed 's/^/  /'
          # --------------------------------------------------------------------
        '''
      }
      post {
        always {
          // JUnit tab + trends
          junit allowEmptyResults: true, testResults: 'test-results/results.xml'

          // Keep both original + safe copies as artifacts
          archiveArtifacts artifacts: 'test-results/**,playwright-report/**,playwright-report-safe/**', onlyIfSuccessful: false

          // ✅ Publish the SAFE copy so HTML Publisher never chokes
          publishHTML([
            reportDir: 'playwright-report-safe',
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
