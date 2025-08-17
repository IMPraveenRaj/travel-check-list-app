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
          # Stop and remove if exists
          docker stop travel-check-list || true
          docker rm travel-check-list || true

          # Run new container
          docker run -d --name travel-check-list -p 9090:80 impraveenraj/travel-check-list:latest
        '''
    }
}
    }
}
