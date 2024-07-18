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
            docker.image('mcr.microsoft.com/azure-cli').inside('--entrypoint=""') {
            withEnv([
                "AZURE_CONFIG_DIR=/tmp/.azure",
                "KUBECONFIG=/tmp/.kube/config",
                "PATH=/tmp/bin:$PATH"
            ]) {
                sh '''
                set -e
                mkdir -p /tmp/.azure /tmp/.kube /tmp/bin
                
                az --version
                az login --service-principal -u $AZURE_CLIENT_ID -p $AZURE_CLIENT_SECRET --tenant $AZURE_TENANT_ID
                az aks get-credentials --resource-group ${RESOURCE_GROUP} --name ${AKS_CLUSTER_NAME} --file ${KUBECONFIG}
                
                # Install kubectl
                echo "Installing kubectl..."
                az aks install-cli --install-location /tmp/bin/kubectl
                kubectl version --client
                
                # Install kubelogin manually
                echo "Installing kubelogin..."
                KUBELOGIN_VERSION=$(curl -s https://api.github.com/repos/Azure/kubelogin/releases/latest | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\\1/')
                curl -Lo /tmp/bin/kubelogin.zip "https://github.com/Azure/kubelogin/releases/download/${KUBELOGIN_VERSION}/kubelogin-linux-amd64.zip"
                unzip /tmp/bin/kubelogin.zip -d /tmp/bin
                mv /tmp/bin/bin/linux_amd64/kubelogin /tmp/bin/kubelogin
                rm -rf /tmp/bin/bin /tmp/bin/kubelogin.zip
                chmod +x /tmp/bin/kubelogin
                
                echo "PATH: $PATH"
                ls -la /tmp/bin
                
                # Create ConfigMap
                kubectl create configmap alchemy-config --from-literal=ALCHEMY_API_KEY=$ALCHEMY_API_KEY -o yaml --dry-run=client | kubectl apply -f -
                
                # Apply Kubernetes manifests
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