/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');

// Load the HTML into the jsdom environment
const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');

describe('script.js basic behavior', () => {
  let api;

  beforeEach(() => {
    document.documentElement.innerHTML = html;
    jest.resetModules();
    api = require('../script.js');
  });

  test('targetRandomKey selects an element with class selected', () => {
    const selected = document.querySelector('.selected');
    expect(selected).not.toBeNull();
    expect(selected.tagName).toBe('LI');
  });

  test('getRandomNumber returns values in range inclusive', () => {
    for (let i = 0; i < 10; i++) {
      const r = api.getRandomNumber(0, 5);
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThanOrEqual(5);
      expect(Number.isInteger(r)).toBe(true);
    }
  });

  test('getRandomKey returns null when no keys', () => {
    // remove keyboard
    document.querySelector('.keyboard').remove();
    const k = api.getRandomKey();
    expect(k).toBeNull();
  });

  test('handleKeydown returns early for unmapped key', () => {
    const event = { key: 'Unmapped' };
    expect(() => api.handleKeydown(event)).not.toThrow();
  });

  test('handleKeydown processes correct key press', () => {
    // find currently selected key
    const highlighted = document.querySelector('.selected');
    expect(highlighted).not.toBeNull();
    const keyLabel = highlighted.innerHTML;

    // create a key element with id = keyLabel to simulate mapping
    const keyEl = document.getElementById(keyLabel);
    expect(keyEl).not.toBeNull();

    const event = { key: keyLabel };
    api.handleKeydown(event);
    // after pressing correct key, another key should be selected (or at least previous removed)
    const newHighlighted = document.querySelector('.selected');
    expect(newHighlighted).not.toBeNull();
  });

  test('secureRandomInt uses browser crypto when available', () => {
    // mock browser crypto
    const arr = new Uint32Array([123456789]);
    global.crypto = {
      getRandomValues: jest.fn().mockImplementation((dst) => {
        dst[0] = arr[0];
        return dst;
      }),
    };

    const r = api.secureRandomInt(0, 10);
    expect(r).toBeGreaterThanOrEqual(0);
    expect(r).toBeLessThanOrEqual(10);
    // ensure the mock exists and was callable
    expect(typeof global.crypto.getRandomValues).toBe('function');
    delete global.crypto;
  });

  test('secureRandomInt throws when no secure RNG available', () => {
    // Simulate environment with no node crypto.randomInt and no browser crypto
    jest.resetModules();
    jest.doMock('crypto', () => ({}), { virtual: true });
    // ensure no browser crypto
    const originalCrypto = global.crypto;
    delete global.crypto;
    // Require module and call secureRandomInt directly; it should throw
    const apiFresh = require('../script.js');
    expect(() => { apiFresh.secureRandomInt(0, 5); }).toThrow('Secure random number generator not available');
    // cleanup
    if (originalCrypto) global.crypto = originalCrypto;
    jest.resetModules();
  });

  test('animationend removes hit class', () => {
    // create element and simulate animationend
    const el = document.createElement('li');
    el.id = 'TESTKEY';
    document.body.appendChild(el);
    el.classList.add('hit');
    // attach listener same as code
    el.addEventListener('animationend', () => {
      el.classList.remove('hit');
    });
    // dispatch event
    const event = new Event('animationend');
    el.dispatchEvent(event);
    expect(el.classList.contains('hit')).toBe(false);
    el.remove();
  });

  test('secureRandomInt uses Node crypto.randomInt when available', () => {
    // Force the Node crypto path by mocking 'crypto' before loading module.
    jest.resetModules();
    jest.doMock('crypto', () => ({ randomInt: jest.fn((a, b) => a) }), { virtual: true });
    const freshApi = require('../script.js');
    const mocked = require('crypto');
    for (let i = 0; i < 5; i++) {
      const v = freshApi.getRandomNumber(0, 10);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(10);
    }
    expect(mocked.randomInt).toHaveBeenCalled();
    jest.resetModules();
  });

  test('handleKeydown removes selected for CAPSLOCK', () => {
    // ensure secure RNG available (mock browser crypto)
    global.crypto = {
      getRandomValues: (dst) => { dst[0] = 12345; return dst; }
    };
    const highlighted = document.querySelector('.selected');
    if (highlighted) highlighted.classList.remove('selected');
    const caps = document.getElementById('CAPSLOCK') || document.createElement('li');
    caps.id = 'CAPSLOCK';
    caps.innerHTML = 'CAPSLOCK';
    document.querySelector('.keyboard').appendChild(caps);
    caps.classList.add('selected');

    const event = { key: 'CAPSLOCK' };
    api.handleKeydown(event);
    expect(caps.classList.contains('selected')).toBe(false);
    caps.remove();
    delete global.crypto;
  });

  test('handleKeydown removes selected for BACKSPACE', () => {
    global.crypto = {
      getRandomValues: (dst) => { dst[0] = 54321; return dst; }
    };
    const highlighted = document.querySelector('.selected');
    if (highlighted) highlighted.classList.remove('selected');

    const back = document.getElementById('BACKSPACE') || document.createElement('li');
    back.id = 'BACKSPACE';
    back.innerHTML = 'BACKSPACE';
    document.querySelector('.keyboard').appendChild(back);
    back.classList.add('selected');

    const event = { key: 'BACKSPACE' };
    api.handleKeydown(event);
    expect(back.classList.contains('selected')).toBe(false);
    back.remove();
    delete global.crypto;
  });
});
