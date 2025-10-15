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

## Cambios realizados 

He documentado aquí todos los cambios que se han realizado en el repositorio para añadir pruebas, generar cobertura y facilitar el análisis de SonarQube.

Archivos añadidos:

- `.gitignore` — Ignora `node_modules/`, `coverage/`, logs, `.DS_Store`, `.env`, y configuraciones de IDE.
- `package.json` — Configuración del proyecto para pruebas con Jest y scripts `test`/`test:lcov`.
- `__tests__/script.test.js` — Tests unitarios que usan `jsdom` para validar la funcionalidad principal.

Archivos modificados:

- `script.js` — Refactorizado para:
  - Corregir la implementación de `getRandomNumber` a una versión estándar (retorna entero entre min..max inclusive).
  - Añadir la función `getKeys()` para obtener dinámicamente las teclas desde el DOM.
  - Añadir comprobaciones defensivas: devolver `null` si no hay teclas, y evitar errores si `document.getElementById` no encuentra un elemento.
  - Extraer la lógica de manejo de teclas a `handleKeydown` para poder probarla directamente.
  - Exportar funciones (`getKeys`, `getRandomNumber`, `getRandomKey`, `targetRandomKey`, `handleKeydown`) mediante `module.exports` para facilitar testing en Node/Jest.
- `sonar-project.properties` — Se añadió `sonar.javascript.lcov.reportPaths=coverage/lcov.info` para que SonarQube lea el reporte LCOV generado por Jest.

Comandos ejecutados durante el proceso (en el entorno local):

```bash
# instalar dependencias dev
npm install
npm install --save-dev jest-environment-jsdom@^29.0.0

# ejecutar tests y generar coverage
npm test
```

Resultados de la ejecución de tests:

- Tests: 5 passed, 0 failed.
- Cobertura generada: `coverage/lcov.info`.
- Cobertura global: 87.87% (superior al umbral solicitado del 80%).

Notas importantes sobre el refactor y tests:

- Ahora `script.js` es compatible con el uso directo en navegador (sigue añadiendo el listener de `keydown` y llamando a `targetRandomKey()` si `document` existe) y, al mismo tiempo, exporta funciones para el entorno de pruebas.
- Los tests usan `jsdom` para simular el DOM y verificar:
  - Que se selecciona una tecla al inicializar.
  - Que `getRandomNumber` devuelve números enteros dentro del rango.
  - Que `getRandomKey` maneja el caso sin teclas.
  - Que `handleKeydown` no falla con teclas no mapeadas y que procesa correctamente una pulsación coincidente.

Recomendaciones para integración en CI (Jenkins):

1. Asegúrate de que el agente Jenkins tenga Node.js y npm instalados.
2. Añade un stage antes del análisis de SonarQube que ejecute:

```groovy
sh 'npm ci'
sh 'npm test -- --coverage'
```

3. Asegúrate de que el directorio `coverage/lcov.info` sea accesible desde el mismo workspace donde se ejecuta `sonar-scanner` o pasa la ruta con `-Dsonar.javascript.lcov.reportPaths=coverage/lcov.info` al invocar `sonar-scanner`.

Posibles mejoras futuras

- Aumentar la granularidad de tests exportando más funciones o reestructurando el código a módulos ES6 (si el entorno lo permite).
- Añadir tests para UI avanzada (animaciones, ciclo de selección de teclas) usando herramientas de integración o E2E si es necesario.
- Añadir un stage de formato/lint y/o pre-commit hooks.

Si quieres que actualice el `Jenkinsfile` para añadir la ejecución de tests y cobertura antes del análisis SonarQube, lo hago ahora y actualizo el archivo.
