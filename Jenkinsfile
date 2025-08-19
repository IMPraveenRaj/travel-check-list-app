pipeline {
  agent any

  environment {
    APP_URL = "http://host.docker.internal:9090"
  }

  stages {
    stage('Pull Image') {
      steps {
        sh '''
          echo "📥 Pulling latest image...."
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
          set -e
          echo "🧪 Running Playwright UI tests..."
          echo "Workspace (container PWD): $PWD"
          echo "Host workspace (Jenkins thinks): $WORKSPACE"

          # Paths relative to the mounted workspace (handles @2 suffix)
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

          # CI Playwright config -> writes EXACTLY where we want
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

          # Prove where Playwright placed the report
          echo "🔎 Searching for index.html under workspace..."
          find "$PWD" -maxdepth 4 -path "*/playwright-report/index.html" -print || true

          # Guard: HTML + JUnit must exist
          [ -f "$PW_HTML_DIR/index.html" ] || { echo "❌ Missing $PW_HTML_DIR/index.html"; exit 2; }
          [ -f "$PW_JUNIT_FILE" ]          || { echo "❌ Missing $PW_JUNIT_FILE"; exit 3; }

          # Make a clean, symlink-free, readable copy for the publisher
          rm -rf "$PW_HTML_SAFE"
          mkdir -p "$PW_HTML_SAFE"

          # Use rsync to follow symlinks and keep a plain tree
          if command -v rsync >/dev/null 2>&1; then
            rsync -a --copy-links "$PW_HTML_DIR"/ "$PW_HTML_SAFE"/
          else
            cp -a -L "$PW_HTML_DIR"/. "$PW_HTML_SAFE"/
          fi

          # Ensure Jenkins can traverse
          chmod -R a+rX "$PW_HTML_SAFE" "$PW_JUNIT_DIR" || true

          echo "✅ Final listings before publish:"
          echo "  $(pwd)"
          ls -lah .
          echo "  playwright-report:"
          ls -lah "$PW_HTML_DIR"
          echo "  playwright-report-safe:"
          ls -lah "$PW_HTML_SAFE"
          echo "  test-results:"
          ls -lah "$PW_JUNIT_DIR"
        '''
      }
      post {
        always {
          // JUnit tab + trends
          junit allowEmptyResults: true, testResults: 'test-results/results.xml'

          // Keep artifacts (both original + safe copies)
          archiveArtifacts artifacts: 'test-results/**,playwright-report/**,playwright-report-safe/**', onlyIfSuccessful: false

          // Publish the SAFE copy so the plugin never chokes
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
