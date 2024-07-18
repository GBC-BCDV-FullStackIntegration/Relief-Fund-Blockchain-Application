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
            def backendImage = docker.build("${env.ACR_LOGIN_SERVER}/backend:latest", 'relief-fund-backend', '--platform linux/arm64')
            def frontendImage = docker.build("${env.ACR_LOGIN_SERVER}/frontend:latest", 'relief-fund-frontend', '--platform linux/arm64')
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
                
                echo "Installing wget and unzip..."
                apt-get update && apt-get install -y wget unzip
                
                echo "Azure CLI version:"
                az --version
                
                echo "Logging in to Azure..."
                az login --service-principal -u $AZURE_CLIENT_ID -p $AZURE_CLIENT_SECRET --tenant $AZURE_TENANT_ID
                
                echo "Getting AKS credentials..."
                az aks get-credentials --resource-group ${RESOURCE_GROUP} --name ${AKS_CLUSTER_NAME} --file ${KUBECONFIG}
                
                echo "Downloading kubectl..."
                KUBECTL_VERSION=$(wget -qO- https://storage.googleapis.com/kubernetes-release/release/stable.txt)
                wget -O /tmp/bin/kubectl "https://storage.googleapis.com/kubernetes-release/release/${KUBECTL_VERSION}/bin/linux/arm64/kubectl"
                chmod +x /tmp/bin/kubectl
                
                echo "Downloading kubelogin..."
                KUBELOGIN_VERSION="v0.1.4"
                wget -O /tmp/bin/kubelogin.zip "https://github.com/Azure/kubelogin/releases/download/${KUBELOGIN_VERSION}/kubelogin-linux-arm64.zip"
                unzip /tmp/bin/kubelogin.zip -d /tmp/bin
                mv /tmp/bin/bin/linux_arm64/kubelogin /tmp/bin/kubelogin
                chmod +x /tmp/bin/kubelogin
                
                echo "PATH: $PATH"
                echo "Contents of /tmp/bin:"
                ls -la /tmp/bin
                
                echo "Creating ConfigMap..."
                /tmp/bin/kubectl create configmap alchemy-config --from-literal=ALCHEMY_API_KEY=$ALCHEMY_API_KEY -o yaml --dry-run=client | /tmp/bin/kubectl apply -f -
                
                echo "Applying Kubernetes manifests..."
                /tmp/bin/kubectl apply -f kubernetes/deployment.yaml
                /tmp/bin/kubectl apply -f kubernetes/ingress.yaml
                /tmp/bin/kubectl apply -f kubernetes/monitoring/prometheus-config.yaml
                /tmp/bin/kubectl apply -f kubernetes/monitoring/prometheus-deployment.yaml
                /tmp/bin/kubectl apply -f kubernetes/monitoring/grafana-deployment.yaml
                '''
              }
            }
          }
        }
        }
      }
    }
  }