const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.resolve(__dirname, './index.html'), 'utf8');

document.documentElement.innerHTML = html.toString();

const { formatTime, isAdjacent } = require('./script.js');

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

describe('isAdjacent', () => {
  it('returns true for horizontal adjacency', () => {
    expect(isAdjacent(0, 1)).toBe(true);
    expect(isAdjacent(1, 2)).toBe(true);
    expect(isAdjacent(5, 6)).toBe(true);
  });

  it('returns true for vertical adjacency', () => {
    expect(isAdjacent(0, 4)).toBe(true);
    expect(isAdjacent(5, 9)).toBe(true);
  });

  it('returns true for diagonal adjacency', () => {
    expect(isAdjacent(0, 5)).toBe(true);
    expect(isAdjacent(5, 0)).toBe(true);
    expect(isAdjacent(1, 4)).toBe(true);
    expect(isAdjacent(4, 1)).toBe(true);
    expect(isAdjacent(5, 10)).toBe(true);
  });

  it('returns true for identical cells', () => {
    expect(isAdjacent(0, 0)).toBe(true);
    expect(isAdjacent(5, 5)).toBe(true);
  });

  it('returns false for non-adjacent cells in the same row', () => {
    expect(isAdjacent(0, 2)).toBe(false);
    expect(isAdjacent(1, 3)).toBe(false);
  });

  it('returns false for non-adjacent cells in the same column', () => {
    expect(isAdjacent(0, 8)).toBe(false);
    expect(isAdjacent(1, 9)).toBe(false);
  });

  it('returns false for completely disjoint cells', () => {
    expect(isAdjacent(0, 15)).toBe(false);
    expect(isAdjacent(3, 12)).toBe(false);
  });

  it('handles edge wrapping correctly (e.g. end of row 1, start of row 2)', () => {
    // Indices 3 (row 1, col 4) and 4 (row 2, col 1) are mathematically close but not adjacent on grid
    expect(isAdjacent(3, 4)).toBe(false);
    // Indices 7 (row 2, col 4) and 8 (row 3, col 1)
    expect(isAdjacent(7, 8)).toBe(false);
  });
});
