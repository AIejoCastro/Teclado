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
});
