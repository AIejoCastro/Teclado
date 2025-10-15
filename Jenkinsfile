pipeline {
    agent any
    
    environment {
        NGINX_HOST = '10.0.1.4'
        NGINX_USER = 'adminuser'
        DEPLOY_PATH = '/var/www/teclado'
        SONARQUBE_HOST = '10.0.1.6'
        SONARQUBE_TOKEN = credentials('sonarqube-token')
    }
    
    stages {
        stage('SCM') {
            steps {
                echo 'Clonando repositorio...'
                checkout scm
            }
        }
        
        stage('Run tests') {
            steps {
                echo 'Instalando dependencias y ejecutando tests (generando coverage)...'
                sh '''
                    set -e
                    export NVM_DIR="$HOME/.nvm"
                    if [ -s "$NVM_DIR/nvm.sh" ]; then
                        . "$NVM_DIR/nvm.sh"
                    fi
                    if ! command -v npm >/dev/null 2>&1; then
                        echo "Instalando Node.js mediante nvm..."
                        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
                        . "$NVM_DIR/nvm.sh"
                    fi
                    if command -v nvm >/dev/null 2>&1; then
                        nvm install 18 >/dev/null 2>&1 || true
                        nvm use 18
                    fi
                    command -v npm >/dev/null 2>&1 || { echo "npm no disponible incluso después de instalar nvm"; exit 1; }
                    npm ci || npm install
                    npm test -- --coverage --coverageReporters=lcov --coverageDirectory=coverage
                    echo "Contenido de coverage/"
                    ls -la coverage || true
                    wc -c coverage/lcov.info || true
                    head -n 40 coverage/lcov.info || true
                '''
                // stash coverage so sonar stage can run on another agent if needed
                stash includes: 'coverage/**', name: 'coverage'
            }
        }
        
        stage('SonarQube Analysis') {
            steps {
                echo 'Ejecutando análisis con SonarQube...'
                script {
                    try {
                        unstash 'coverage'
                    } catch (err) {
                        echo 'No se encontró stash "coverage" (posiblemente ejecutando en el mismo agente)'
                    }
                }
                sh '''
                    ls -la coverage || true
                    head -n 20 coverage/lcov.info || true
                    /opt/sonar-scanner/bin/sonar-scanner \
                        -Dsonar.projectKey=teclado \
                        -Dsonar.projectName=Teclado \
                        -Dsonar.javascript.lcov.reportPaths=${WORKSPACE}/coverage/lcov.info \
                        -Dsonar.host.url=http://10.0.1.6:9000 \
                        -Dsonar.login=${SONARQUBE_TOKEN} \
                        -X
                '''
            }
        }
        
        stage('Deploy a Nginx') {
            steps {
                echo 'Desplegando archivos a Nginx...'
                sh '''
                    set -euo pipefail
                    SSH_OPTS="-o StrictHostKeyChecking=no -o ConnectTimeout=10 -o ServerAliveInterval=5 -o ServerAliveCountMax=2"
                    TEMP_DIR="/tmp/teclado-deploy-$$"
                    PACKAGE="/tmp/teclado-package-$$.tgz"

                    echo "Creando paquete temporal..."
                    tar -czf teclado-build.tgz index.html script.js css

                    echo "Enviando y desplegando artefacto en ${NGINX_HOST}..."
                    scp ${SSH_OPTS} teclado-build.tgz ${NGINX_USER}@${NGINX_HOST}:"$PACKAGE"

                    ssh ${SSH_OPTS} ${NGINX_USER}@${NGINX_HOST} "TEMP_DIR='$TEMP_DIR' DEPLOY_PATH='${DEPLOY_PATH}' PACKAGE='$PACKAGE' bash -s" <<'REMOTE'
                        set -euo pipefail
                        sudo rm -rf "$TEMP_DIR"
                        sudo mkdir -p "$TEMP_DIR"
                        sudo tar -xzf "$PACKAGE" -C "$TEMP_DIR"
                        sudo rm -f "$PACKAGE"
                        sudo rm -rf "$DEPLOY_PATH"/*
                        sudo mv "$TEMP_DIR"/index.html "$DEPLOY_PATH"/
                        sudo mv "$TEMP_DIR"/script.js "$DEPLOY_PATH"/
                        sudo rm -rf "$DEPLOY_PATH"/css
                        sudo mv "$TEMP_DIR"/css "$DEPLOY_PATH"/
                        sudo chown -R www-data:www-data "$DEPLOY_PATH"
                        sudo chmod -R 755 "$DEPLOY_PATH"
                        sudo rm -rf "$TEMP_DIR"
                        sudo systemctl reload nginx
REMOTE

                    rm -f teclado-build.tgz
                '''
            }
        }
        
        stage('Verificar Deploy') {
            steps {
                echo 'Verificando que la aplicación está accesible...'
                sh '''
                    sleep 3
                    ssh -o StrictHostKeyChecking=no ${NGINX_USER}@${NGINX_HOST} "ls -la ${DEPLOY_PATH}/"
                    curl -I http://${NGINX_HOST}/teclado/ || echo "Verificación completada"
                '''
            }
        }
    }
    
    post {
        success {
            echo '✓ Pipeline completado exitosamente'
            echo "✓ Análisis SonarQube: http://4.206.42.81:9000/dashboard?id=teclado"
            echo "✓ App disponible en: http://4.206.67.190/teclado/"
        }
        failure {
            echo '✗ Pipeline falló'
            sh '''
                ssh -o StrictHostKeyChecking=no ${NGINX_USER}@${NGINX_HOST} "ls -la ${DEPLOY_PATH}/" || true
            '''
        }
    }
}