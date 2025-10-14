# Teclado — Juego de Mecanografía

Proyecto simple de front-end que muestra un teclado en pantalla para practicar mecanografía. El objetivo es resaltar una tecla aleatoria y que el usuario la presione en su teclado físico: si acierta, se selecciona otra tecla.

## Contenido del repositorio

- `index.html` — Página principal que renderiza el teclado en pantalla.
- `script.js` — Lógica JavaScript para seleccionar teclas al azar y escuchar eventos de teclado.
- `css/style.css` — Estilos CSS compilados utilizados por la página.
- `css/style.scss` — Fuente SCSS de los estilos.
- `Jenkinsfile` — Pipeline de Jenkins que realiza análisis con SonarQube y despliega los archivos a un servidor Nginx remoto.
- `sonar-project.properties` — Configuración de SonarQube para el proyecto.

## Descripción breve

Al cargar la página, una tecla del teclado en pantalla recibe la clase `selected` y se anima. El usuario debe presionar la misma tecla en su teclado físico. Cuando se detecta la pulsación correcta, se marca visualmente la tecla (animación `hit`) y se selecciona otra tecla aleatoria.

Puntos importantes del comportamiento:
- El script convierte la tecla pulsada a mayúsculas y la compara con el contenido (`innerHTML`) de la tecla destacada.
- Hay soporte para teclas especiales (por ejemplo `CAPSLOCK`, `BACKSPACE` y `ENTER`).

## Cómo ejecutar localmente

1. Abrir `index.html` en un navegador moderno (Chrome, Firefox, Safari).
2. Asegúrate de que `script.js` y la carpeta `css/` estén junto a `index.html`.

No hay dependencias de servidor para ejecutar la aplicación; es una página estática.

## Estructura y detalles técnicos

- `index.html` usa una lista de elementos (`li`) organizados por filas para representar las teclas. Cada tecla tiene un `id` igual a su etiqueta mostrada (por ejemplo `A`, `ENTER`, `BACKSPACE`).
- `script.js`:
  - `getRandomNumber(min, max)` — genera un entero aleatorio entre `min` y `max` (hay una implementación que usa `Math.ceil`, ver notas de mejora abajo).
  - `getRandomKey()` — elige un elemento `li` aleatorio.
  - `targetRandomKey()` — marca la tecla elegida con la clase `selected`.
  - `keydown` listener — compara la tecla pulsada con la tecla seleccionada; añade la clase `hit` para animación y reelige una nueva tecla si coincide.

## Pipeline (Jenkins)

El `Jenkinsfile` incluido contiene las etapas:

- `SCM` — checkout del repositorio.
- `SonarQube Analysis` — ejecuta `sonar-scanner` apuntando a un servidor en `http://10.0.1.6:9000` y utiliza la credencial `sonarqube-token` en Jenkins.
- `Deploy a Nginx` — copia `index.html`, `script.js` y `css/` a un servidor Nginx remoto (`NGINX_HOST`) usando `scp` y comandos `ssh` para mover a `DEPLOY_PATH`, ajustar permisos y recargar Nginx.
- `Verificar Deploy` — lista archivos y hace una petición `curl` para comprobar disponibilidad.

Variables relevantes del pipeline (definidas en `environment`):

- `NGINX_HOST`, `NGINX_USER`, `DEPLOY_PATH` — para despliegue remoto.
- `SONARQUBE_HOST`, `SONARQUBE_TOKEN` — para análisis SonarQube.

Notas de seguridad y configuración:
- El pipeline asume que el usuario configurado en Jenkins tiene acceso SSH sin intervención humana (o que las credenciales/llaves están gestionadas adecuadamente).
- El `sonar-scanner` se invoca desde `/opt/sonar-scanner/bin/sonar-scanner`; asegúrate de que esté instalado en el agente Jenkins.
