pipeline {
  agent any

  environment {
    ACR_NAME = 'gbcfullstack'
    ACR_LOGIN_SERVER = 'gbcfullstack.azurecr.io'
    ACR_CREDENTIALS_ID = 'acr-credentials'
    DOCKER_IMAGE_NAME = "${env.ACR_LOGIN_SERVER}/relief-fund-dapp"
    AZURE_CREDS = credentials('azure-service-principal')
    ALCHEMY_API_KEY = credentials('alchemy-api-key')
    RESOURCE_GROUP = 'myResourceGroup'
    AKS_CLUSTER_NAME = 'myAKSCluster'
  }

  stages {
    stage('Clone Repository') {
        steps {
            checkout([$class: 'GitSCM', 
                    branches: [[name: 'main']], 
                    doGenerateSubmoduleConfigurations: false, 
                    extensions: [], 
                    submoduleCfg: [], 
                    userRemoteConfigs: [[url: 'https://github.com/GBC-BCDV-FullStackIntegration/Relief-Fund-Blockchain-Application.git']]])
        }
    }

    stage('Build Backend') {
      steps {
        script {
          docker.build("${env.ACR_LOGIN_SERVER}/backend:latest", 'relief-fund-backend')
        }
      }
    }
    stage('Build Frontend') {
      steps {
        script {
          docker.build("${env.ACR_LOGIN_SERVER}/frontend:latest", 'relief-fund-frontend')
        }
      }
    }
    stage('Push Images') {
      steps {
        script {
          docker.withRegistry("https://${env.ACR_LOGIN_SERVER}", env.ACR_CREDENTIALS_ID) {
            docker.image("${env.ACR_LOGIN_SERVER}/backend:latest").push()
            docker.image("${env.ACR_LOGIN_SERVER}/frontend:latest").push()
          }
        }
      }
    }
    stage('Configure Azure CLI') {
      steps {
        script {
          sh '''
            az login --service-principal -u ${AZURE_CREDS_USR} -p ${AZURE_CREDS_PSW} --tenant ${AZURE_CREDS_TENANTID}
            az aks get-credentials --resource-group ${RESOURCE_GROUP} --name ${AKS_CLUSTER_NAME}
            '''
        }
      }

    }
    stage('Create ConfigMap') {
      steps {
        script {
          writeFile file: 'kubernetes/config-map.yaml', text: """
apiVersion: v1
kind: ConfigMap
metadata:
  name: alchemy-config
data:
  ALCHEMY_API_KEY: "${env.ALCHEMY_API_KEY}"
"""
          sh 'kubectl apply -f kubernetes/config-map.yaml'
        }
      }
    }
    stage('Deploy to AKS') {
      steps {
        script {
          sh 'kubectl apply -f kubernetes/deployment.yaml'
          sh 'kubectl apply -f kubernetes/ingress.yaml'
        }
      }
    }
    stage('Deploy Monitoring Tools') {
      steps {
        script {
          sh 'kubectl apply -f kubernetes/monitoring/prometheus-config.yaml'
          sh 'kubectl apply -f kubernetes/monitoring/prometheus-deployment.yaml'
          sh 'kubectl apply -f kubernetes/monitoring/grafana-deployment.yaml'
        }
      }
    }
  }
}
