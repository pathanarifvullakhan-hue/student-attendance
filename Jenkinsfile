pipeline {
    agent any

    stages {
        stage('Checkout Source') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }

        stage('Build Docker Image') {
            steps {
                sh 'docker build -t attendance-app:${BUILD_NUMBER} .'
            }
        }

        stage('Run Selenium Tests') {
            steps {
                sh 'npm start &'
                sh 'sleep 3'
                sh 'npm test'
            }
        }
    }
}
