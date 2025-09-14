pipeline {
  agent any

  environment {
    APP_URL = "http://40.76.118.177:9090"
  }

  stages {
    stage('Install') {
      steps {
        sh '''
          npm ci || npm install
          npx playwright install --with-deps
        '''
      }
    }

    stage('Run Playwright Tests') {
      steps {
        sh '''
          echo "Running Playwright tests against $APP_URL ..."
          APP_URL="$APP_URL" npx playwright test --reporter=html
          ls -la playwright-report || true
        '''
      }
    }

    stage('Publish Report') {
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
