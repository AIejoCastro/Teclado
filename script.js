function getKeys() {
  return document.querySelectorAll('.keyboard li');
}

function getRandomNumber(min, max) {
  // inclusive min..max
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomKey() {
  const keys = getKeys();
  if (!keys || keys.length === 0) return null;
  return keys[getRandomNumber(0, keys.length - 1)];
}

function targetRandomKey() {
  const key = getRandomKey();
  if (!key) return null;
  key.classList.add('selected');
  return key;
}

function handleKeydown(e) {
  const keyPressed = e.key.toUpperCase();
  const keyElement = document.getElementById(keyPressed);
  const highlightedKey = document.querySelector('.selected');
  if (!keyElement) return; // tecla no mapeada en el DOM

  keyElement.classList.add('hit');
  keyElement.addEventListener('animationend', () => {
    keyElement.classList.remove('hit');
  });

  if (!highlightedKey) return; // no hay tecla resaltada

  if (keyPressed === highlightedKey.innerHTML) {
    highlightedKey.classList.remove('selected');
    if (keyPressed === 'CAPSLOCK' || keyPressed === 'BACKSPACE') {
      keyElement.classList.remove('selected');
    }
    targetRandomKey();
  }
}

// bind in browser
if (typeof document !== 'undefined') {
  document.addEventListener('keydown', handleKeydown);
  // initialize
  targetRandomKey();
}

// Exports for testing (CommonJS)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getKeys,
    getRandomNumber,
    getRandomKey,
    targetRandomKey,
    handleKeydown,
  };
}
