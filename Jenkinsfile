pipeline {
  agent any

  stages {
    stage('Install') {
      steps {
        sh '''
          npm ci || npm install
          npx playwright install --with-deps
        '''
      }
    }

    stage('Test') {
      steps {
        sh 'npx playwright test --reporter=html'
        sh 'ls -la && ls -la playwright-report || true'
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
