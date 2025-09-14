pipeline {
  agent any

  environment {
    APP_URL = "http://40.76.118.177:9090"   // your app endpoint
  }

  stages {
    stage('Install dependencies') {
      steps {
        sh '''
          echo "📦 Installing npm deps..."
          npm ci || npm install
          echo "🌐 Installing Playwright browsers..."
          npx playwright install chromium
        '''
      }
    }

    stage('Run Playwright tests') {
      steps {
        sh '''
          echo "🧪 Running Playwright tests against $APP_URL ..."
          APP_URL="$APP_URL" npx playwright test --reporter=html
          echo "📂 Listing report files:"
          ls -la playwright-report || true
        '''
      }
    }

    stage('Publish HTML report') {
      steps {
        publishHTML(target: [
          reportDir: 'playwright-report',
          reportFiles: 'index.html',
          reportName: 'Playwright Report',
          keepAll: true,
          alwaysLinkToLastBuild: true
        ])
      }
    }
  }
}
