pipeline {
    agent any

    stages {
        stage('Pull Image') {
            steps {
                sh '''
                  docker pull impraveenraj/travel-check-list:latest
                '''
            }
        }

        stage('Run Container') {
            steps {
                sh '''
                  # Stop old container if running
                  docker rm -f kind_clarke || true

                  # Run on port 9090
                  docker run -d --name travel-check-list -p 9090:80 impraveenraj/travel-check-list:latest
                '''
            }
        }
    }
}
