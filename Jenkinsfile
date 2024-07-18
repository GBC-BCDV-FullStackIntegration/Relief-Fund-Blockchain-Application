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
        withCredentials([
        azureServicePrincipal('azure-service-principal'),
        string(credentialsId: 'alchemy-api-key', variable: 'ALCHEMY_API_KEY')
        ]) {
        script {
            docker.image('mcr.microsoft.com/azure-cli').inside('--user=root --entrypoint=""') {
            withEnv([
                "AZURE_CONFIG_DIR=/tmp/.azure",
                "KUBECONFIG=/tmp/.kube/config",
                "PATH=/tmp/bin:$PATH"
            ]) {
                sh '''
                set -e
                mkdir -p /tmp/.azure /tmp/.kube /tmp/bin
                
                echo "Installing curl and unzip..."
                apt-get update && apt-get install -y curl unzip
                
                echo "Azure CLI version:"
                az --version
                
                echo "Logging in to Azure..."
                az login --service-principal -u $AZURE_CLIENT_ID -p $AZURE_CLIENT_SECRET --tenant $AZURE_TENANT_ID
                
                echo "Getting AKS credentials..."
                az aks get-credentials --resource-group ${RESOURCE_GROUP} --name ${AKS_CLUSTER_NAME} --file ${KUBECONFIG}
                
                echo "Downloading kubectl..."
                KUBECTL_VERSION=$(curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt)
                curl -LO "https://storage.googleapis.com/kubernetes-release/release/${KUBECTL_VERSION}/bin/linux/amd64/kubectl"
                chmod +x kubectl
                mv kubectl /tmp/bin/kubectl
                
                echo "Downloading kubelogin..."
                KUBELOGIN_VERSION="v0.1.4"
                curl -LO "https://github.com/Azure/kubelogin/releases/download/${KUBELOGIN_VERSION}/kubelogin-linux-amd64.zip"
                unzip kubelogin-linux-amd64.zip -d /tmp/bin
                chmod +x /tmp/bin/kubelogin
                
                echo "PATH: $PATH"
                echo "Contents of /tmp/bin:"
                ls -la /tmp/bin
                
                echo "Creating ConfigMap..."
                kubectl create configmap alchemy-config --from-literal=ALCHEMY_API_KEY=$ALCHEMY_API_KEY -o yaml --dry-run=client | kubectl apply -f -
                
                echo "Applying Kubernetes manifests..."
                kubectl apply -f kubernetes/deployment.yaml
                kubectl apply -f kubernetes/ingress.yaml
                kubectl apply -f kubernetes/monitoring/prometheus-config.yaml
                kubectl apply -f kubernetes/monitoring/prometheus-deployment.yaml
                kubectl apply -f kubernetes/monitoring/grafana-deployment.yaml
                '''
            }
            }
        }
        }
    }
    }
  }
}