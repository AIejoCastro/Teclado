function getKeys() {
  return document.querySelectorAll('.keyboard li');
}

/**
 * secureRandomInt: tries to use cryptographically secure RNG when possible.
 * - In Node.js: use crypto.randomInt
 * - In browsers: use crypto.getRandomValues
 * - Fallback: Math.random (not cryptographically secure)
 */
function secureRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  // node crypto.randomInt
  try {
    if (typeof require === 'function') {
      const nodeCrypto = require('crypto');
      if (typeof nodeCrypto.randomInt === 'function') {
        // randomInt is exclusive on the max param, so add +1
        return nodeCrypto.randomInt(min, max + 1);
      }
    }
  } catch (err) {
    // ignore require errors in browsers
  }

  // browser crypto
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    // generate a random 32-bit unsigned int and scale
    const range = max - min + 1;
    const maxUint32 = 0xffffffff;
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    const random = arr[0] / (maxUint32 + 1);
    return Math.floor(random * range) + min;
  }

  // If we reach here, no secure RNG is available in the environment. Fail fast.
  throw new Error('Secure random number generator not available in this environment');
}

function getRandomNumber(min, max) {
  return secureRandomInt(min, max);
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
  try {
    targetRandomKey();
  } catch (err) {
    // In some test environments secure RNG may not be available; avoid failing on module import
    // The rest of the module (exports) remains usable for tests.
    if (typeof console !== 'undefined' && typeof console.warn === 'function') {
      console.warn('targetRandomKey initialization skipped:', err.message);
    }
  }
}

// Exports for testing (CommonJS)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getKeys,
    getRandomNumber,
    getRandomKey,
    targetRandomKey,
    handleKeydown,
    secureRandomInt,
  };
}
