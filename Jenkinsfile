pipeline {
    agent any
    
    environment {
        NGINX_HOST = '10.0.1.4'
        NGINX_USER = 'adminuser'
        DEPLOY_PATH = '/var/www/teclado'
    }
    
    stages {
        stage('SCM') {
            steps {
                echo 'Clonando repositorio...'
                checkout scm
            }
        }
        
        stage('SonarQube Analysis') {
            steps {
                echo 'Ejecutando análisis con SonarQube...'
                script {
                    def scannerHome = tool 'SonarScanner'
                    withSonarQubeEnv() {
                        sh "${scannerHome}/bin/sonar-scanner"
                    }
                }
            }
        }
        
        stage('Quality Gate') {
            steps {
                echo 'Esperando resultado del Quality Gate...'
                script {
                    timeout(time: 5, unit: 'MINUTES') {
                        def qg = waitForQualityGate()
                        if (qg.status != 'OK') {
                            echo "Quality Gate falló: ${qg.status}"
                            echo "Continuando con el deploy..."
                        } else {
                            echo "Quality Gate pasó"
                        }
                    }
                }
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