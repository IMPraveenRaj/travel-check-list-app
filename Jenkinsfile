stage('UI Automation Tests') {
  agent {
    docker {
      image 'mcr.microsoft.com/playwright:v1.47.2-focal'
      args '--add-host=host.docker.internal:host-gateway -v /dev/shm:/dev/shm'
    }
  }
  environment {
    APP_URL = "http://host.docker.internal:9090"
  }
  steps {
    sh '''
      echo "🧪 Running Playwright UI tests..."

      # Use a cache directory inside the container workspace
      export NPM_CONFIG_CACHE="$PWD/.npm"
      mkdir -p "$NPM_CONFIG_CACHE"

      if [ -f package-lock.json ]; then
        npm ci
      else
        npm install
      fi

      TEST_DIR="tests"; [ -d test ] && TEST_DIR="test"
      mkdir -p test-results

      APP_URL="$APP_URL" npx playwright test \
        --reporter=junit,line \
        --output=test-results

      # Normalize junit output location if needed
      [ -f results.xml ] && mv results.xml test-results/

      # Generate HTML report (optional)
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
