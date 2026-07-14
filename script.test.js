const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.resolve(__dirname, './index.html'), 'utf8');

document.documentElement.innerHTML = html.toString();

const { formatTime } = require('./script.js');

describe('formatTime', () => {
  it('formats 0 seconds as "00:00"', () => {
    expect(formatTime(0)).toBe('00:00');
  });

  it('formats single-digit seconds correctly', () => {
    expect(formatTime(9)).toBe('00:09');
  });

  it('formats exactly one minute correctly', () => {
    expect(formatTime(60)).toBe('01:00');
  });

  it('formats minutes and seconds correctly', () => {
    expect(formatTime(65)).toBe('01:05');
  });

  it('formats double-digit minutes correctly', () => {
    expect(formatTime(600)).toBe('10:00');
  });

  it('formats very long times properly', () => {
    expect(formatTime(3599)).toBe('59:59');
  });
});
