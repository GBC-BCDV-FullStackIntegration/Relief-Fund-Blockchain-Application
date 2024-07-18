pipeline {
  agent any

environment {
  ACR_NAME = 'gbcfullstack'
  ACR_LOGIN_SERVER = 'gbcfullstack.azurecr.io'
  ACR_CREDENTIALS_ID = 'acr-credentials'
  DOCKER_IMAGE_NAME = "${env.ACR_LOGIN_SERVER}/relief-fund-dapp"
  ALCHEMY_API_KEY = credentials('alchemy-api-key')
  RESOURCE_GROUP = 'myResourceGroup'
  AKS_CLUSTER_NAME = 'myAKSCluster'
}

  stages {
    stage('Clone Repository') {
      steps {
        checkout([$class: 'GitSCM', 
                branches: [[name: 'main']], 
                userRemoteConfigs: [[url: 'https://github.com/GBC-BCDV-FullStackIntegration/Relief-Fund-Blockchain-Application.git']]])
      }
    }

    stage('Build and Push Images') {
      steps {
        script {
          docker.withRegistry("https://${env.ACR_LOGIN_SERVER}", env.ACR_CREDENTIALS_ID) {
            def backendImage = docker.build("${env.ACR_LOGIN_SERVER}/backend:latest", 'relief-fund-backend')
            def frontendImage = docker.build("${env.ACR_LOGIN_SERVER}/frontend:latest", 'relief-fund-frontend')
            backendImage.push()
            frontendImage.push()
          }
        }
      }
    }

    stage('Deploy to AKS') {
    steps {
        withCredentials([azureServicePrincipal('azure-service-principal')]) {
        script {
            docker.image('mcr.microsoft.com/azure-cli').inside('--entrypoint=""') {
            sh """
                set -e
                az --version
                az login --service-principal -u $AZURE_CLIENT_ID -p $AZURE_CLIENT_SECRET --tenant $AZURE_TENANT_ID
                az aks get-credentials --resource-group ${RESOURCE_GROUP} --name ${AKS_CLUSTER_NAME}
                
                # Install kubectl
                az aks install-cli
                
                # Create ConfigMap
                kubectl create configmap alchemy-config --from-literal=ALCHEMY_API_KEY=${ALCHEMY_API_KEY} -o yaml --dry-run=client | kubectl apply -f -
                
                # Apply Kubernetes manifests
                kubectl apply -f kubernetes/deployment.yaml
                kubectl apply -f kubernetes/ingress.yaml
                kubectl apply -f kubernetes/monitoring/prometheus-config.yaml
                kubectl apply -f kubernetes/monitoring/prometheus-deployment.yaml
                kubectl apply -f kubernetes/monitoring/grafana-deployment.yaml
            """
            }
        }
        }
    }
    }
  }
}