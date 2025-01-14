#!/usr/bin/env groovy

// Label will be set to the Jenkins BUILD_TAG aka ${JOB_NAME}-${BUILD_NUMBER}
// also removes problematic slashes and special characters to avoid problems
// with accessing the containers
// We prepend the "AK_" prefix to avoid special characters as first char.
String label = "AK_" + env.BUILD_TAG.replace("/", "_").replace("%2F", "_").replace("-", "_").replaceAll(" ", "").reverse().take(60).reverse()

// Don't change this two line
String slackChannel = '#university-pipelines'
String currentStage = 'Setup'

class KubeConfig {
  static String registryRepository = "business-school/android-build-box"
  static String registryUrl = "businessschool.azurecr.io"
  static String kubernetesService = "android-build-box"
  static String developmentNamespace = "lae-development"
  static String testingNamespace = "lae-testing"
  static String stagingNamespace = "lae-staging"
  static String productionNamespace = "lae-production"
}

boolean deployDevelopment = env.BRANCH_NAME == 'main'
boolean deploy = deployDevelopment

properties([
  // adjust thresholds as needed, but try to keep it as low as possible. This is already a good configuration.
  buildDiscarder(logRotator(artifactDaysToKeepStr: '10', artifactNumToKeepStr: '5', daysToKeepStr: '10', numToKeepStr: '10')),
  // disableConcurrentBuilds is mandatory when using Kubernetes or you should risk to broke everything
  disableConcurrentBuilds(),
  // this options force Jenkins to keep in memory build logs until the build is done
  durabilityHint('PERFORMANCE_OPTIMIZED'),
  // limit to 4 builds per hour, but also allow users to manually start the build
  [$class: 'JobPropertyImpl', throttle: [count: 4, durationName: 'hour', userBoost: true]]
])

String imageTag = ''

def buildImageTag() {
  // Building the image tag
  String commitHash = sh(
    script: 'git rev-parse --short HEAD',
    returnStdout: true
  ).trim()
  echo "Image tag: ${commitHash}"
  return "${commitHash}"
}

def kubeSubst(placeholder, value, file) {
  sh "sed -i \"s|${placeholder}|${value}|\" ${file}"
}

// this function install the kubectl configuration
def setupKubeConfig(kubeConfigPath) {
  sh "mkdir -p ~/.kube"
  sh "cp ${kubeConfigPath} ~/.kube/config"
}

def buildAndPushImage(imageTag) {
  docker.withRegistry("https://" + "${KubeConfig.registryUrl}", "${KubeConfig.registryUrl}") {
    def imageName = "${KubeConfig.registryUrl}/${KubeConfig.registryRepository}"
    def latestImageName = "${imageName}:latest"

    echo "Pulling latest image..."
    docker.image("${latestImageName}").pull()

    def dockerImage
    try {
      dockerImage = docker.build("${imageName}:${imageTag}", "--cache-from ${imageName}:latest .")
    } catch (Exception e) {
      echo "Will not build a new image from cached image. Error: ${e}"
      dockerImage = docker.build("${imageName}:${imageTag}", " --pull .")
    }

    retry(3) {
      dockerImage.push()
      dockerImage.push('latest')
    }
  }
}

// this function apply the deployment file to the a namespace
def stageImage(String kubernetesTeamNamespacePrefix,
               String environment,
               String credentials,
               String imageTag
) {
  container('kubectl') {
    withCredentials([
      [$class: "FileBinding",
       credentialsId: credentials,
       variable: 'KUBE_CONFIG'
      ]
    ]) {
      setupKubeConfig(env.KUBE_CONFIG)
      kubeSubst("IMAGE_TAG", imageTag, "deployment/${environment}/deployment.yaml")
      sh "kubectl apply -f deployment/${environment}"
      sh "kubectl rollout status deployment ${KubeConfig.kubernetesService} --namespace ${kubernetesTeamNamespacePrefix}"
    }
  }
}

def validateK8SConfigs(String environment, String credentials, String imageTag) {
  container('kubectl') {
    withCredentials([
      [$class: "FileBinding",
       credentialsId: credentials,
       variable: 'KUBE_CONFIG'
      ]
    ]) {
      setupKubeConfig(env.KUBE_CONFIG)
      kubeSubst("IMAGE_TAG", imageTag, "deployment/${environment}/deployment.yaml")
      sh "kubectl apply --validate=true --dry-run=client -f deployment/${environment}"
    }
  }
}

def buildAndPushImageStage(String imageTag) {
  stage('Build and Push Docker Image') {
    currentStage = 'Build and Push Docker Image'
    container('docker') {
      withCredentials([[$class          : 'UsernamePasswordMultiBinding',
                        credentialsId   : KubeConfig.registryUrl,
                        usernameVariable: 'registryUser',
                        passwordVariable: 'registryPassword']]) {
        buildAndPushImage(imageTag)
      }
    }
  }
}

def createMonitorJson() {
  // git informations
  String commitHash = sh(
    script: 'git rev-parse --short HEAD',
    returnStdout: true
  ).trim()
  String commitDate = sh(
    script: 'git log -1 --pretty=format:"%cd"',
    returnStdout: true
  ).trim()
  String fullCommitHash = sh(
    script: 'git log -1 --pretty=format:"%H"',
    returnStdout: true
  ).trim()
  //  build informations
  Date buildTimeDate = new Date()
  String buildTime = buildTimeDate.format("yyyyMMddHHmm")
  sh "echo '{\"git\":{\"commit\":{\"time\":\"${commitDate}\", \"id\":\"${commitHash}\"},\"branch\":\"${fullCommitHash}\"},\"build\":{\"time\":\"${buildTime}\"}}' >> git-info.json"
}

timeout(time: 60, unit: 'MINUTES') {
  timestamps {
    podTemplate(
      label: label,
      annotations: [
        podAnnotation(key: 'botkube.io/channel', value: 'university-k8s')
      ],
      cloud: 'k8s-ci-cd',
      namespace: 'lae-jenkins',
      inheritFrom: 'pod-base-configuration-with-dind',
      containers: [
        containerTemplate(
          name: 'linux',
          image: 'alpine:3.17.3',
          ttyEnabled: true,
          command: 'cat',
          resourceLimitCpu: '0.5',
          resourceLimitMemory: '512Mi',
          alwaysPullImage: false
        )
      ],
      envVars: [
        envVar(key: 'BRANCH_NAME', value: env.BRANCH_NAME)
      ]) {

      node(label) {
        stage('Checkout') {
          currentStage = 'Checkout'
          checkout scm

          imageTag = buildImageTag()
          createMonitorJson()
        }

        stage('Validate K8S configs Dev') {
          currentStage = 'Validate K8S configs Dev'
          validateK8SConfigs('development', 'kubeconfig-lae-development-azure-cicd', imageTag)
        }

        if (deploy) {
          buildAndPushImageStage(imageTag)

          if (deployDevelopment) {
            stage('Deploy Dev') {
              currentStage = 'Deploy Dev'
              stageImage(KubeConfig.developmentNamespace, 'development', 'kubeconfig-lae-development-azure-cicd', imageTag)
            }
          }

        }
      }
    }
  }
}
