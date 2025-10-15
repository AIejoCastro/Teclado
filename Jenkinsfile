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
                // retrieve coverage if it was stashed
                unstash 'coverage' || true
                sh '''
                    ls -la coverage || true
                    head -n 20 coverage/lcov.info || true
                    /opt/sonar-scanner/bin/sonar-scanner \
                        -Dsonar.projectKey=teclado \
                        -Dsonar.projectName=Teclado \
                        -Dsonar.sources=. \
                        -Dsonar.exclusions=.git/**,node_modules/** \
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
                    TEMP_DIR="/tmp/teclado-deploy-$$"
                    
                    # Crea carpeta temporal en Nginx
                    ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no ${NGINX_USER}@${NGINX_HOST} \
                        "sudo rm -rf $TEMP_DIR && mkdir -p $TEMP_DIR"
                    
                    # Copia archivos
                    scp -o StrictHostKeyChecking=no -r \
                        index.html \
                        script.js \
                        css \
                        ${NGINX_USER}@${NGINX_HOST}:$TEMP_DIR/
                    
                    # Mueve a destino final
                    ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no ${NGINX_USER}@${NGINX_HOST} \
                        "sudo rm -rf ${DEPLOY_PATH}/* && sudo mv $TEMP_DIR/* ${DEPLOY_PATH}/ && sudo rm -rf $TEMP_DIR"
                    
                    # Configura permisos
                    ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no ${NGINX_USER}@${NGINX_HOST} \
                        "sudo chown -R www-data:www-data ${DEPLOY_PATH} && sudo chmod -R 755 ${DEPLOY_PATH}"
                    
                    # Recarga Nginx
                    ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no ${NGINX_USER}@${NGINX_HOST} \
                        "sudo systemctl reload nginx"
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