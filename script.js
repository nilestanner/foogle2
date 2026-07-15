/**
 * Boggle Clone Script
 * Handles game logic, state, and UI interactions.
 */

// --- Constants & Data ---

const CLASSIC_DICE = [
  "AACIOT", "ABILTY", "ABJMOQu", "ACDEMP",
  "ACELRS", "ADENVZ", "AHMORS", "BIFORX",
  "DENOSW", "DKNOTU", "EEFHIY", "EGKLUY",
  "EGINTV", "EHINPS", "ELPSTU", "GILRUW"
];

const NEW_DICE = [
  "AAEEGN", "ABBJOO", "ACHOPS", "AFFKPS",
  "AOOTTW", "CIMOTU", "DEILRX", "DELRVY",
  "DISTTY", "EEGHNW", "EEINSU", "EHRTVW",
  "EIOSST", "ELRTTY", "HIMNUQu", "HLNNRZ"
];

// --- State Management ---

const state = {
  board: [], // Array of {letter: string, rotation: number}
  selectedPath: [], // Array of indices [0-15]
  foundWords: new Set(),
  score: 0,
  timeLeft: 180,
  timerInterval: null,
  isPlaying: false,
  dictionary: new Set(),
  settings: {
    theme: 'light',
    timerDuration: 180, // seconds
    minLength: 3,
    diceType: 'new',
    randomOrientation: false
  }
};

// --- DOM Elements ---
const dom = {
  gameBoard: document.getElementById('game-board'),
  currentWord: document.getElementById('current-word'),
  submitBtn: document.getElementById('submit-word-btn'),
  timerDisplay: document.getElementById('timer-display'),
  scoreDisplay: document.getElementById('score-display'),
  foundWordsList: document.getElementById('words-list'),
  newGameBtn: document.getElementById('new-game-btn'),
  rotateBtn: document.getElementById('rotate-btn'),
  settingsBtn: document.getElementById('settings-btn'),
  settingsModal: document.getElementById('settings-modal'),
  closeSettingsBtn: document.getElementById('close-settings-btn'),
  highScoreBtn: document.getElementById('high-score-btn'),
};

// --- Initialization ---

async function init() {
  loadSettings();
  applyTheme(state.settings.theme);

  // Load Dictionary
  try {
    const response = await fetch('words_alpha.txt');
    if (!response.ok) throw new Error('Failed to load dictionary');
    const text = await response.text();
    text.split(/\r?\n/).forEach(word => state.dictionary.add(word.trim().toUpperCase()));
    console.log(`Dictionary loaded: ${state.dictionary.size} words`);
  } catch (e) {
    console.error("Dictionary Load Error:", e);
    alert("Error loading dictionary. Game logic may fail.");
  }

  setupEventListeners();
  startNewGame();
}

function setupEventListeners() {
  dom.newGameBtn.addEventListener('click', startNewGame);
  dom.submitBtn.addEventListener('click', submitWord);
  dom.rotateBtn.addEventListener('click', rotateBoardView);

  // Settings Logic
  dom.settingsBtn.addEventListener('click', () => dom.settingsModal.classList.remove('hidden'));
  dom.closeSettingsBtn.addEventListener('click', () => {
    saveSettingsFromUI();
    dom.settingsModal.classList.add('hidden');
    // Restart game if critical settings changed? For now, let user manually restart.
  });

  // Theme switching live preview
  document.getElementById('theme-select').addEventListener('change', (e) => applyTheme(e.target.value));
}

function loadSettings() {
  const saved = localStorage.getItem('foogle-settings');
  if (saved) {
    state.settings = { ...state.settings, ...JSON.parse(saved) };
    // Sync UI
    document.getElementById('theme-select').value = state.settings.theme;
    document.getElementById('timer-select').value = state.settings.timerDuration;
    document.getElementById('min-length-select').value = state.settings.minLength;
    document.getElementById('dice-type-select').value = state.settings.diceType;
    document.getElementById('random-orientation').checked = state.settings.randomOrientation;
  }
}

function saveSettingsFromUI() {
  state.settings.theme = document.getElementById('theme-select').value;
  state.settings.timerDuration = parseInt(document.getElementById('timer-select').value);
  state.settings.minLength = parseInt(document.getElementById('min-length-select').value);
  state.settings.diceType = document.getElementById('dice-type-select').value;
  state.settings.randomOrientation = document.getElementById('random-orientation').checked;

  localStorage.setItem('foogle-settings', JSON.stringify(state.settings));
}

function applyTheme(theme) {
  document.body.setAttribute('data-theme', theme);
}

// --- Game Logic ---

// --- UI Utilities ---

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => toast.classList.add('show'));

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

// --- Game Logic ---

function startNewGame() {
  clearInterval(state.timerInterval);
  state.score = 0;
  state.foundWords.clear();
  state.selectedPath = [];
  state.isPlaying = true;
  state.timeLeft = state.settings.timerDuration;

  // Check if unlimited time
  const unlimited = state.settings.timerDuration === 0;
  dom.timerDisplay.textContent = unlimited ? "∞" : formatTime(state.timeLeft);

  updateScoreDisplay();
  dom.foundWordsList.innerHTML = '';
  dom.currentWord.textContent = '';
  dom.submitBtn.disabled = true;

  generateBoard();

  if (!unlimited) {
    state.timerInterval = setInterval(() => {
      state.timeLeft--;
      dom.timerDisplay.textContent = formatTime(state.timeLeft);
      if (state.timeLeft <= 0) endGame();
    }, 1000);
  }
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function endGame() {
  clearInterval(state.timerInterval);
  state.isPlaying = false;
  showToast(`Time's up! Final Score: ${state.score}`, 'success');
  saveHighScore(state.score);
}

function saveHighScore(score) {
  const scores = JSON.parse(localStorage.getItem('foogle-scores') || '[]');
  const date = new Date().toLocaleDateString();
  // Save current settings snapshot
  const settingsSnapshot = { ...state.settings };
  scores.push({ score, date, settings: settingsSnapshot });
  scores.sort((a, b) => b.score - a.score); // Descending
  const topScores = scores.slice(0, 10); // Keep top 10
  localStorage.setItem('foogle-scores', JSON.stringify(topScores));
  updateHighScoresUI();
}

function updateHighScoresUI() {
  const list = document.getElementById('high-scores-list');
  const scores = JSON.parse(localStorage.getItem('foogle-scores') || '[]');

  if (scores.length === 0) {
    list.innerHTML = '<li class="no-scores">No games played yet</li>';
    return;
  }

  list.innerHTML = scores.map((s, i) => {
    // Format settings for display
    const set = s.settings || {}; // Handle old scores without settings
    const timeStr = set.timerDuration === 0 ? '∞' : Math.floor(set.timerDuration / 60) + 'm';
    const diceStr = set.diceType === 'classic' ? 'Classic' : 'New';
    const minLen = set.minLength ? `Min ${set.minLength}` : '';
    const randStr = set.randomOrientation ? 'Rand' : '';

    const details = [timeStr, diceStr, minLen, randStr].filter(Boolean).join(' • ');

    return `
            <li class="score-item">
                <div class="score-header">
                    <span class="rank">#${i + 1}</span>
                    <span class="points">${s.score} pts</span>
                    <span class="date">${s.date}</span>
                </div>
                <div class="score-details">
                    ${details}
                </div>
            </li>
        `;
  }).join('');
}
dom.highScoreBtn.addEventListener('click', () => {
  updateHighScoresUI();
  document.getElementById('high-scores-modal').classList.remove('hidden');
});
document.getElementById('close-scores-btn').addEventListener('click', () => {
  document.getElementById('high-scores-modal').classList.add('hidden');
});

function generateBoard() {
  const dicePool = state.settings.diceType === 'classic' ? [...CLASSIC_DICE] : [...NEW_DICE];
  // Fisher-Yates shuffle
  for (let i = dicePool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [dicePool[i], dicePool[j]] = [dicePool[j], dicePool[i]];
  }

  state.board = dicePool.map(die => {
    const char = smartFacePick(die);
    return {
      letter: char,
      rotation: state.settings.randomOrientation ? Math.floor(Math.random() * 4) * 90 : 0
    };
  });

  renderBoard();
}

function smartFacePick(dieString) {
  if (dieString.includes('Qu')) {
    // "Qu" is treated as one face in Boggle.
    // The strings in array are like "HIMNUQu" (length 7, but 6 faces: H,I,M,N,U,Qu)
    // We need to parse the faces first.
    const faces = [];
    let i = 0;
    while (i < dieString.length) {
      if (dieString[i] === 'Q' && dieString[i + 1] === 'u') {
        faces.push('Qu');
        i += 2;
      } else {
        faces.push(dieString[i]);
        i++;
      }
    }
    return faces[Math.floor(Math.random() * faces.length)];
  }
  return dieString[Math.floor(Math.random() * dieString.length)];
}

function renderBoard() {
  dom.gameBoard.innerHTML = '';
  state.board.forEach((cell, index) => {
    const el = document.createElement('div');
    el.className = 'die';
    el.dataset.index = index;
    if (cell.letter === 'Qu') el.classList.add('die-qu');

    const uiRotation = cell.rotation;
    if (uiRotation) el.classList.add(`rotate-${uiRotation}`);

    const span = document.createElement('span');
    span.textContent = cell.letter;
    el.appendChild(span);

    el.addEventListener('click', () => handleCellClick(index));
    dom.gameBoard.appendChild(el);
  });
}

function handleCellClick(index) {
  if (!state.isPlaying && state.timeLeft > 0) return; // Paused? or just safety.
  if (!state.isPlaying) return;

  const pathIndex = state.selectedPath.indexOf(index);

  // Deselect if clicking earlier item (truncate path back to there)
  if (pathIndex !== -1) {
    if (pathIndex === state.selectedPath.length - 1) {
      // Clicked last item -> pop it
      state.selectedPath.pop();
    } else {
      // Clicked middle item -> truncate to this item (removes subsequent)
      // User request: "unselect a letter by clicking it again"
      // Interpretation: Clicking 'B' in A->B->C should probably go back to A (deselect B and C) OR go back to A->B (deselect C).
      // "Unselect a letter" implies removing it. Since it's a path, removing middle breaks path.
      // Standard behavior: Cut path back to clicked item (exclusive tests show inclusive is better UX often, but let's do exclusive or inclusive logic).
      // Let's do: Clicking 'B' in A-B-C removing 'B' means we must remove 'C'. 
      // Let's make it remove 'B' and 'C', leaving 'A'.
      state.selectedPath = state.selectedPath.slice(0, pathIndex);
    }
    updateSelectionUI();
    return;
  }

  // New Selection
  if (state.selectedPath.length === 0) {
    state.selectedPath.push(index);
  } else {
    const lastIndex = state.selectedPath[state.selectedPath.length - 1];
    if (isAdjacent(lastIndex, index)) {
      state.selectedPath.push(index);
    } else {
      // Shake or feedback?
      showToast("Must be adjacent", "error");
    }
  }

  updateSelectionUI();
}

function isAdjacent(idx1, idx2) {
  const x1 = idx1 % 4;
  const y1 = Math.floor(idx1 / 4);
  const x2 = idx2 % 4;
  const y2 = Math.floor(idx2 / 4);
  return Math.abs(x1 - x2) <= 1 && Math.abs(y1 - y2) <= 1;
}

// ... isAdjacent ...

function updateSelectionUI() {
  const cells = dom.gameBoard.children;
  for (let c of cells) c.classList.remove('selected', 'valid-neighbor');

  let word = "";
  state.selectedPath.forEach(idx => {
    cells[idx].classList.add('selected');
    word += state.board[idx].letter;
  });

  // Highlight neighbors
  if (state.selectedPath.length > 0) {
    const lastIdx = state.selectedPath[state.selectedPath.length - 1];
    // Check all potential neighbors
    for (let i = 0; i < 16; i++) {
      if (isAdjacent(lastIdx, i) && !state.selectedPath.includes(i)) {
        cells[i].classList.add('valid-neighbor');
      }
    }
  }

  dom.currentWord.textContent = word;
  dom.submitBtn.disabled = word.length < state.settings.minLength;
}

function submitWord() {
  const word = dom.currentWord.textContent;
  if (!word) return;

  if (word.length < state.settings.minLength) {
    showToast(`Too short (min ${state.settings.minLength})`, 'error');
    return;
  }

  if (state.foundWords.has(word)) {
    showToast("Already found!", "error");
    resetSelection();
    return;
  }

  // Check dictionary (normalize to uppercase to handle "Qu")
  if (state.dictionary.has(word.toUpperCase())) {
    state.foundWords.add(word);
    const pts = calculateScore(word);
    state.score += pts;
    updateScoreDisplay();
    addWordToFoundList(word, pts);
    showToast(`+${pts} Points!`, 'success');
    resetSelection();
  } else {
    showToast("Not in dictionary", "error");
    resetSelection();
  }
}

function calculateScore(word) {
  const len = word.length;
  if (len <= 4) return 1;
  if (len === 5) return 2;
  if (len === 6) return 3;
  if (len === 7) return 5;
  return 11;
}

function updateScoreDisplay() {
  dom.scoreDisplay.textContent = state.score;
}

function updateTimerDisplay() {
  const m = Math.floor(state.timeLeft / 60);
  const s = state.timeLeft % 60;
  dom.timerDisplay.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function addWordToFoundList(word, pts) {
  const tag = document.createElement('span');
  tag.className = 'found-word-tag';
  tag.textContent = `${word} (${pts})`;
  dom.foundWordsList.prepend(tag);
}

function resetSelection() {
  state.selectedPath = [];
  updateSelectionUI();
}

function rotateBoardView() {
  state.boardRotation = (state.boardRotation || 0) + 90;
  dom.gameBoard.style.transform = `rotate(${state.boardRotation}deg)`;
  updateLetterOrientations();
}

function updateLetterOrientations() {
  const letters = document.querySelectorAll('.die span');

  // If NOT random, we need to counter-rotate letters so they appear upright
  if (!state.settings.randomOrientation) {
    letters.forEach(span => {
      span.style.transform = `rotate(-${state.boardRotation || 0}deg)`;
    });
  } else {
    // If random, we remove any override so the CSS class rules apply
    // (which are relative to the die, which rotates with the board)
    letters.forEach(span => {
      span.style.transform = '';
    });
  }
}

// Ensure orientations are correct on render too
const originalRenderBoard = renderBoard;
renderBoard = function () {
  originalRenderBoard();
  updateLetterOrientations();
};

// Start
if (typeof process === 'undefined' || process.env.NODE_ENV !== 'test') {
  init();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { formatTime, isAdjacent };
}
