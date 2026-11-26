/**
 * Main Application Controller (Spirolateral 3D Generator)
 */

// 4 curated palettes per mode, layer order: line, fill, base
const PALETTES_BY_MODE = {
  3: [
    {
      id: 'p3_1',
      name: 'Vánoční',
      line: { name: 'Zlatá (Gold)', color: '#F5C842', silk: true },
      fill: { name: 'Červená (Lipstick Red)', color: '#C8102E' },
      base: { name: 'Zelená (Green Pearl)', color: '#2E6F40' }
    },
    {
      id: 'p3_2',
      name: 'Ledová',
      line: { name: 'Tmavá modrá (Pearl Blue)', color: '#0c2370' },
      fill: { name: 'Světlá modrá (Sky Blue)', color: '#89cff0' },
      base: { name: 'Bílá (Snowflake)', color: '#ffffff' }
    },
    {
      id: 'p3_3',
      name: 'Zmrzlina',
      line: { name: 'Světlá zelená (Frozen Mint)', color: '#A8E6CF' },
      fill: { name: 'Světlá růžová (Blossom Spirit)', color: '#FFB7B2' },
      base: { name: 'Bílá (Snowflake)', color: '#F8F9FA' }
    },
    {
      id: 'p3_4',
      name: 'Noční obloha',
      line: { name: 'Stříbrná (Silver)', color: '#C0C0C0', silk: true },
      fill: { name: 'Tmavá modrá (Galaxy Blue)', color: '#1B3B6F' },
      base: { name: 'Černá (Galaxy Black)', color: '#111111' }
    }
  ],
  2: [
    {
      id: 'p2_1',
      name: 'Vánoční',
      line: { name: 'Zlatá (Gold)', color: '#F5C842', silk: true },
      fill: { name: 'Červená (Lipstick Red)', color: '#C8102E' }
    },
    {
      id: 'p2_2',
      name: 'Ledová',
      line: { name: 'Světlá modrá (Sky Blue)', color: '#89CFF0' },
      fill: { name: 'Bílá (Snowflake)', color: '#F8F9FA' }
    },
    {
      id: 'p2_3',
      name: 'Zmrzlina',
      line: { name: 'Světlá zelená (Frozen Mint)', color: '#A8E6CF' },
      fill: { name: 'Světlá růžová (Blossom Spirit)', color: '#FFB7B2' }
    },
    {
      id: 'p2_4',
      name: 'Noční obloha',
      line: { name: 'Stříbrná (Silver)', color: '#C0C0C0', silk: true },
      fill: { name: 'Černá (Galaxy Black)', color: '#111111' }
    }
  ],
  1: [
    { id: 'p1_1', name: 'Zlatá', line: { name: 'Zlatá (Gold)', color: '#F5C842', silk: true } },
    { id: 'p1_2', name: 'Bílá', line: { name: 'Bílá (Snowflake)', color: '#F8F9FA' } },
    { id: 'p1_3', name: 'Stříbrno - růžová', line: { name: 'Stříbrno - růžová (Glamour)', color: '#D896A8', silk: true } },
    { id: 'p1_4', name: 'Stříbrná', line: { name: 'Stříbrná (Silver)', color: '#C0C0C0', silk: true } }
  ]
};

// Safe angles for random generation (excluding 144 deg)
const SAFE_RANDOM_ANGLES = [60, 72, 90, 98, 108, 120, 135];

// Remembered line width per color mode
const savedLineWidthByMode = {
  3: 0.80,
  2: 0.80,
  1: 1.20
};

const state = {
  viewMode: '3D',
  studentName: 'Návštěva',
  isAdmin: false,
  sheetName: 'Projekty_2026',
  studentsSheetName: 'Seznam_Deti',
  scriptUrl: 'https://script.google.com/macros/s/AKfycbyxKhB2lXP9XdtYGV86iE1iztUNV4Asidd4kzb6P4u0-HhZnc9EnMu4YMC3G0NNQQEh/exec',
  segmentNr: 25,
  angle: 120,
  reverseTurns: [],
  cornerRounding: 0.0,
  segmentCurving: 0.0,
  addLoop: true,
  addLoop: true,
  mirrorSymmetry: false,
  colorMode: 3,
  selectedPaletteIndex: 0,
  lineWidthMm: 0.80,
  isSpinning: false
};

const spiro = new Spirolateral(state.segmentNr, state.angle);

// DOM elements
const canvas2d = document.getElementById('canvas2d');
const ctx2d = canvas2d.getContext('2d');
const container3d = document.getElementById('canvas3d');

const wheelWidget = document.getElementById('wheelWidget');
const wheelDisk = document.getElementById('wheelDisk');

const sliderSegments = document.getElementById('sliderSegments');
const numSegments = document.getElementById('numSegments');

const sliderAngle = document.getElementById('sliderAngle');
const numAngle = document.getElementById('numAngle');
const btnAnglePresets = document.getElementById('btnAnglePresets');
const anglePresetDropdown = document.getElementById('anglePresetDropdown');

const sliderRounding = document.getElementById('sliderRounding');
const numRounding = document.getElementById('numRounding');
const btnResetRounding = document.getElementById('btnResetRounding');

const sliderCurving = document.getElementById('sliderCurving');
const numCurving = document.getElementById('numCurving');
const btnResetCurving = document.getElementById('btnResetCurving');

const sliderLineWidth = document.getElementById('sliderLineWidth');
const numLineWidth = document.getElementById('numLineWidth');

const reversalGrid = document.getElementById('reversalGrid');
const chkAddLoop = document.getElementById('chkAddLoop');
const chkMirrorSymmetry = document.getElementById('chkMirrorSymmetry');
const paletteList = document.getElementById('paletteList');
const statusBadge = document.getElementById('statusBadge');

const studentSelect = document.getElementById('studentSelect');
const btnUserDropdown = document.getElementById('btnUserDropdown');
const userDropdownMenu = document.getElementById('userDropdownMenu');
const currentUserLabel = document.getElementById('currentUserLabel');

const btnAdminSettings = document.getElementById('btnAdminSettings');
const btnOpenGallery = document.getElementById('btnOpenGallery');

// Segmented buttons for color mode selection
const modeBtns = {
  3: document.getElementById('btnMode3'),
  2: document.getElementById('btnMode2'),
  1: document.getElementById('btnMode1')
};

function getActivePalette() {
  const list = PALETTES_BY_MODE[state.colorMode] || PALETTES_BY_MODE[3];
  const idx = Math.min(state.selectedPaletteIndex, list.length - 1);
  const p = list[idx] || list[0];
  return {
    id: p.id,
    name: p.name,
    lineColor: p.line.color,
    lineName: p.line.name,
    lineSilk: Boolean(p.line.silk),
    fillColor: p.fill ? p.fill.color : null,
    fillName: p.fill ? p.fill.name : null,
    fillSilk: Boolean(p.fill && p.fill.silk),
    baseColor: p.base ? p.base.color : null,
    baseName: p.base ? p.base.name : null,
    baseSilk: Boolean(p.base && p.base.silk)
  };
}

/**
 * Full-width slider gradient (#E58FA2 -> #FDE08A).
 */
function updateSliderFill(slider) {
  const min = parseFloat(slider.min);
  const max = parseFloat(slider.max);
  const val = parseFloat(slider.value);
  const pct = Math.max(0, Math.min(100, ((val - min) / (max - min)) * 100)).toFixed(2);

  slider.style.background = `
    linear-gradient(to right, transparent ${pct}%, #e0ded7 ${pct}%),
    linear-gradient(to right, #E58FA2 0%, #FDE08A 100%)
  `;
}

function updateAllSliderFills() {
  updateSliderFill(sliderSegments);
  updateSliderFill(sliderAngle);
  updateSliderFill(sliderRounding);
  updateSliderFill(sliderCurving);
  updateSliderFill(sliderLineWidth);
}

// Update reset button disabled states
function updateResetButtonsState() {
  btnResetRounding.disabled = (state.cornerRounding === 0.0);
  btnResetCurving.disabled = (state.segmentCurving === 0.0);
}

// Wheel of fortune with closed-shape validation and balanced segment count
let currentWheelRotation = 0;
function spinWheelOfFortune() {
  if (state.isSpinning) return;
  state.isSpinning = true;

  const extraSpins = 4 + Math.floor(Math.random() * 3);
  const randomAngle = Math.floor(Math.random() * 360);
  currentWheelRotation += extraSpins * 360 + randomAngle;
  wheelDisk.style.transform = `rotate(${currentWheelRotation}deg)`;

  setTimeout(() => {
    let chosenSeg = 25;
    let chosenAngle = 120;
    let chosenRevs = [];
    let chosenCurvePct = 0;
    let found = false;

    for (let attempt = 0; attempt < 70; attempt++) {
      chosenSeg = Math.floor(Math.random() * 16) + 3; // 3 to 18
      chosenAngle = SAFE_RANDOM_ANGLES[Math.floor(Math.random() * SAFE_RANDOM_ANGLES.length)];

      const revCount = Math.floor(Math.random() * 3);
      chosenRevs = [];
      for (let i = 0; i < revCount; i++) {
        const r = Math.floor(Math.random() * chosenSeg) + 1;
        if (!chosenRevs.includes(r)) chosenRevs.push(r);
      }
      chosenRevs.sort((a, b) => a - b);

      // Wall curving in range -50% to +50%
      chosenCurvePct = Math.random() < 0.4 ? (Math.floor(Math.random() * 21) - 10) * 5 : 0;

      const testSpiro = new Spirolateral(chosenSeg, chosenAngle);
      testSpiro.setReverseTurns(chosenRevs);

      if (!testSpiro.isClosed()) continue;

      const totalSegments = testSpiro.rawPolygon.length - 1;
      if (totalSegments < 12 || totalSegments > 350) continue;

      found = true;
      break;
    }

    if (!found) {
      chosenSeg = 25;
      chosenAngle = 120;
      chosenRevs = [];
      chosenCurvePct = 0;
    }

    state.segmentNr = chosenSeg;
    state.angle = chosenAngle;
    state.reverseTurns = chosenRevs;
    state.cornerRounding = 0.0;
    state.segmentCurving = chosenCurvePct / 100.0;

    syncInputsToState();
    spiro.setSegmentNumber(state.segmentNr);
    spiro.setAngle(state.angle);
    spiro.setReverseTurns(state.reverseTurns);
    spiro.setRoundingAndCurving(state.cornerRounding, state.segmentCurving);

    renderReversalChips();
    updateVisualization();
    state.isSpinning = false;
  }, 550);
}

wheelWidget.onclick = spinWheelOfFortune;

const reversalAccordion = document.getElementById('reversalAccordion');
const btnToggleReversals = document.getElementById('btnToggleReversals');
const reversalDrawer = document.getElementById('reversalDrawer');
const revActivePills = document.getElementById('revActivePills');
const btnResetReversals = document.getElementById('btnResetReversals');

if (btnToggleReversals) {
  btnToggleReversals.onclick = () => {
    const isHidden = reversalDrawer.style.display === 'none';
    reversalDrawer.style.display = isHidden ? 'block' : 'none';
    if (reversalAccordion) {
      reversalAccordion.classList.toggle('open', isHidden);
    }
  };
}

if (btnResetReversals) {
  btnResetReversals.onclick = (e) => {
    e.stopPropagation();
    state.reverseTurns = [];
    spiro.setReverseTurns([]);
    renderReversalChips();
    updateVisualization();
  };
}

// Render reversal turn chips and clickable inline step pills
function renderReversalChips() {
  reversalGrid.innerHTML = '';
  for (let i = 1; i <= state.segmentNr; i++) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'turn-chip' + (state.reverseTurns.includes(i) ? ' active' : '');
    btn.textContent = i;
    btn.title = `Otočit směr v kroku ${i}`;
    btn.onclick = () => {
      if (state.reverseTurns.includes(i)) {
        state.reverseTurns = state.reverseTurns.filter(t => t !== i);
      } else {
        state.reverseTurns.push(i);
        state.reverseTurns.sort((a, b) => a - b);
      }
      spiro.setReverseTurns(state.reverseTurns);
      renderReversalChips();
      updateVisualization();
    };
    reversalGrid.appendChild(btn);
  }

  // Render clickable mini-pills (max 4 visible: first 2 + ... + last 2)
  if (revActivePills) {
    revActivePills.innerHTML = '';
    const turns = state.reverseTurns;
    const maxVisible = 4;

    const createStepPill = (stepNum) => {
      const pill = document.createElement('button');
      pill.type = 'button';
      pill.className = 'rev-mini-pill';
      pill.textContent = stepNum;
      pill.title = `Kliknutím vypneš opačnou zatáčku v kroku ${stepNum}`;
      pill.onclick = (e) => {
        e.stopPropagation();
        state.reverseTurns = state.reverseTurns.filter(t => t !== stepNum);
        spiro.setReverseTurns(state.reverseTurns);
        renderReversalChips();
        updateVisualization();
      };
      return pill;
    };

    if (turns.length <= maxVisible) {
      turns.forEach(stepNum => revActivePills.appendChild(createStepPill(stepNum)));
    } else {
      const firstTwo = turns.slice(0, 2);
      const lastTwo = turns.slice(-2);
      const hiddenSteps = turns.slice(2, -2);

      firstTwo.forEach(stepNum => revActivePills.appendChild(createStepPill(stepNum)));

      const dots = document.createElement('span');
      dots.className = 'rev-pills-ellipsis';
      dots.textContent = '…';
      dots.title = `Další aktivní kroky (${hiddenSteps.length}): ${hiddenSteps.join(', ')}`;
      revActivePills.appendChild(dots);

      lastTwo.forEach(stepNum => revActivePills.appendChild(createStepPill(stepNum)));
    }
  }

  if (btnResetReversals) {
    btnResetReversals.disabled = (state.reverseTurns.length === 0);
  }
}

// Highlight active angle preset in dropdown
function updateAnglePresetActiveState() {
  document.querySelectorAll('.angle-item').forEach(item => {
    const itemAngle = parseInt(item.getAttribute('data-angle'), 10);
    item.classList.toggle('active', itemAngle === state.angle);
  });
}

// Angle preset dropdown toggle
btnAnglePresets.onclick = (e) => {
  e.stopPropagation();
  userDropdownMenu.classList.remove('open');
  anglePresetDropdown.classList.toggle('open');
};

document.querySelectorAll('.angle-item').forEach(item => {
  item.onclick = (e) => {
    e.stopPropagation();
    state.angle = parseInt(item.getAttribute('data-angle'), 10);
    syncInputsToState();
    spiro.setAngle(state.angle);
    anglePresetDropdown.classList.remove('open');
    updateVisualization();
  };
});

// Custom password dialog with masked input and show/hide eye toggle
function askPasswordModal(titleText = 'Zadejte heslo administrátora:') {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed; inset:0; background:rgba(24,38,34,0.38); backdrop-filter:blur(3px); display:flex; align-items:center; justify-content:center; z-index:9999;';

    const box = document.createElement('div');
    box.style.cssText = 'background:#f8fbf9; border:1px solid #c5dad3; border-radius:16px; padding:18px 20px; width:300px; box-shadow:0 14px 34px rgba(20,36,31,0.18); font-family:inherit;';

    const eyeOpenSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
    const eyeOffSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;

    box.innerHTML = `
      <div style="font-weight:700; font-size:0.92rem; color:#283330; margin-bottom:10px;">${titleText}</div>
      <div style="position:relative; margin-bottom:14px;">
        <input type="password" id="adminPwdInput" autocomplete="current-password"
          style="width:100%; box-sizing:border-box; padding:8px 36px 8px 10px; border-radius:10px; border:1px solid #b8d0c8; font-size:0.95rem; outline:none; background:#fff; color:#283330;" />
        <button type="button" id="adminPwdToggle" title="Zobrazit/skrýt heslo"
          style="position:absolute; right:6px; top:50%; transform:translateY(-50%); border:none; background:transparent; color:#68857c; cursor:pointer; padding:4px; display:flex; align-items:center; justify-content:center; border-radius:6px;">
          ${eyeOpenSvg}
        </button>
      </div>
      <div style="display:flex; justify-content:flex-end; gap:8px;">
        <button type="button" id="adminPwdCancel" class="btn btn-secondary" style="padding:6px 12px; font-size:0.82rem;">Zrušit</button>
        <button type="button" id="adminPwdOk" class="btn btn-primary" style="padding:6px 14px; font-size:0.82rem;">Potvrdit</button>
      </div>
    `;

    overlay.appendChild(box);
    document.body.appendChild(overlay);

    const input = box.querySelector('#adminPwdInput');
    const btnToggle = box.querySelector('#adminPwdToggle');
    const btnOk = box.querySelector('#adminPwdOk');
    const btnCancel = box.querySelector('#adminPwdCancel');

    btnToggle.onclick = () => {
      const isHidden = input.type === 'password';
      input.type = isHidden ? 'text' : 'password';
      btnToggle.innerHTML = isHidden ? eyeOffSvg : eyeOpenSvg;
      input.focus();
    };

    const close = (val) => {
      overlay.remove();
      resolve(val);
    };

    btnOk.onclick = () => close(input.value);
    btnCancel.onclick = () => close(null);
    overlay.onclick = (e) => { if (e.target === overlay) close(null); };

    input.onkeydown = (e) => {
      if (e.key === 'Enter') close(input.value);
      if (e.key === 'Escape') close(null);
    };

    setTimeout(() => input.focus(), 20);
  });
}

// Unified custom user dropdown logic
async function selectUserRole(selectedUser) {
  if (selectedUser === 'Admin' && !state.isAdmin) {
    const entered = await askPasswordModal('Zadejte heslo administrátora:');
    if (entered === null) return; // User clicked Cancel or pressed Esc
    if (await verifyAdminPassword(entered)) {
      state.studentName = 'Admin';
      state.isAdmin = true;
    } else {
      alert('Nesprávné heslo!');
      return;
    }
  } else {
    state.studentName = selectedUser;
    state.isAdmin = (selectedUser === 'Admin');
  }

  studentSelect.value = state.studentName;
  updateUserBadge();

  document.querySelectorAll('.user-item').forEach(item => {
    item.classList.toggle('active', item.getAttribute('data-user') === state.studentName);
  });

  updateUiRoleVisibility();
}

function rebuildUserDropdownItems(extraStudents = []) {
  const allUsers = ['Návštěva', ...extraStudents.filter(s => s !== 'Návštěva' && s !== 'Admin'), 'Admin'];
  userDropdownMenu.innerHTML = '';
  studentSelect.innerHTML = '';

  allUsers.forEach(user => {
    const opt = document.createElement('option');
    opt.value = user;
    opt.textContent = user;
    studentSelect.appendChild(opt);

    const div = document.createElement('div');
    div.className = 'preset-item user-item' + (state.studentName === user ? ' active' : '');
    div.setAttribute('data-user', user);
    div.textContent = user;
    div.onclick = (e) => {
      e.stopPropagation();
      userDropdownMenu.classList.remove('open');
      selectUserRole(user);
    };
    userDropdownMenu.appendChild(div);
  });

  studentSelect.value = state.studentName;
  updateUserBadge();
}

btnUserDropdown.onclick = (e) => {
  e.stopPropagation();
  anglePresetDropdown.classList.remove('open');
  userDropdownMenu.classList.toggle('open');
};

document.addEventListener('click', () => {
  anglePresetDropdown.classList.remove('open');
  userDropdownMenu.classList.remove('open');
});

// Fetch student list from Google Sheet if configured
async function fetchStudentListIfAvailable() {
  const apiUrl = state.scriptUrl.trim();
  if (!apiUrl) return;
  try {
    const sheet = encodeURIComponent(state.studentsSheetName.trim() || 'Seznam_Deti');
    const res = await fetch(`${apiUrl}?action=listStudents&sheet=${sheet}`);
    const data = await res.json();
    if (data && Array.isArray(data.students) && data.students.length > 0) {
      rebuildUserDropdownItems(data.students);
    }
  } catch (err) {
    // Fallback to default users silently
  }
}

// Reset buttons
btnResetRounding.onclick = () => {
  state.cornerRounding = 0.0;
  syncInputsToState();
  spiro.setRoundingAndCurving(state.cornerRounding, state.segmentCurving);
  updateVisualization();
};

btnResetCurving.onclick = () => {
  state.segmentCurving = 0.0;
  syncInputsToState();
  spiro.setRoundingAndCurving(state.cornerRounding, state.segmentCurving);
  updateVisualization();
};

/**
 * Smart color mode switching
 */
function setMode(mode) {
  const currentWidth = state.lineWidthMm;

  savedLineWidthByMode[state.colorMode] = currentWidth;

  if (currentWidth >= 1.2 - 1e-4) {
    savedLineWidthByMode[3] = currentWidth;
    savedLineWidthByMode[2] = currentWidth;
    savedLineWidthByMode[1] = currentWidth;
  }

  state.colorMode = mode;

  Object.keys(modeBtns).forEach(k => {
    modeBtns[k].classList.toggle('active', parseInt(k, 10) === mode);
  });

  const minAllowed = (mode === 1) ? 1.2 : 0.4;
  const maxAllowed = 2.4;

  sliderLineWidth.min = minAllowed.toFixed(1);
  sliderLineWidth.max = maxAllowed.toFixed(1);
  sliderLineWidth.step = '0.4';
  numLineWidth.min = minAllowed.toFixed(1);
  numLineWidth.max = maxAllowed.toFixed(1);
  numLineWidth.step = '0.4';

  if (currentWidth >= minAllowed - 1e-4 && currentWidth <= maxAllowed + 1e-4) {
    state.lineWidthMm = Math.round(currentWidth / 0.4) * 0.4;
    savedLineWidthByMode[mode] = state.lineWidthMm;
  } else {
    const remembered = savedLineWidthByMode[mode] || minAllowed;
    state.lineWidthMm = Math.max(minAllowed, Math.min(maxAllowed, Math.round(remembered / 0.4) * 0.4));
  }

  syncInputsToState();
  renderPalettes();
  updateVisualization();
}

Object.keys(modeBtns).forEach(k => {
  modeBtns[k].onclick = () => setMode(parseInt(k, 10));
});

// Render 4 palette cards with top-right sparkle indicator for silk filaments
function renderPalettes() {
  paletteList.innerHTML = '';
  const list = PALETTES_BY_MODE[state.colorMode] || PALETTES_BY_MODE[3];

  list.forEach((p, idx) => {
    const card = document.createElement('div');
    card.className = 'palette-card' + (state.selectedPaletteIndex === idx ? ' active' : '');

    const makeSwatch = (item, role) => {
      if (!item) return '';
      const isSilk = item.silk ? ' silk' : '';
      return `<span class="swatch${isSilk}" style="background:${item.color}" title="${role}: ${item.name}${item.silk ? ' (Silk lesk)' : ''}"></span>`;
    };

    let swatchesHtml = '';
    if (state.colorMode === 3) {
      swatchesHtml = `
        <div class="swatches">
          ${makeSwatch(p.line, 'Linka')}
          ${makeSwatch(p.fill, 'Výplň')}
          ${makeSwatch(p.base, 'Základna')}
        </div>`;
    } else if (state.colorMode === 2) {
      swatchesHtml = `
        <div class="swatches">
          ${makeSwatch(p.line, 'Linka')}
          ${makeSwatch(p.fill, 'Výplň')}
        </div>`;
    } else {
      swatchesHtml = `
        <div class="swatches">
          ${makeSwatch(p.line, 'Linka')}
        </div>`;
    }

    card.innerHTML = `
      ${swatchesHtml}
      <span class="palette-name">${p.name}</span>
    `;

    card.onclick = () => {
      state.selectedPaletteIndex = idx;
      renderPalettes();
      updateVisualization();
    };

    paletteList.appendChild(card);
  });
}

function syncInputsToState() {
  sliderSegments.value = state.segmentNr;
  numSegments.value = state.segmentNr;

  sliderAngle.value = state.angle;
  numAngle.value = state.angle;
  updateAnglePresetActiveState();

  const roundPct = Math.round(state.cornerRounding * 100);
  sliderRounding.value = roundPct;
  numRounding.value = roundPct;

  const curvePct = Math.round(state.segmentCurving * 100);
  sliderCurving.value = curvePct;
  numCurving.value = curvePct;

  sliderLineWidth.value = state.lineWidthMm.toFixed(1);
  numLineWidth.value = state.lineWidthMm.toFixed(1);

  chkAddLoop.checked = state.addLoop;
  if (chkMirrorSymmetry) chkMirrorSymmetry.checked = state.mirrorSymmetry;
  studentSelect.value = state.studentName;
  updateUserBadge();

  updateResetButtonsState();
  updateAllSliderFills();
}

function bindSliderAndSpinbox(slider, spinbox, isInteger, onChange) {
  let debounceTimer = null;
  let pending = false;

  const commit = (val) => {
    clearTimeout(debounceTimer);
    debounceTimer = null;
    if (!pending) return;
    pending = false;
    onChange(val);
  };

  const scheduleUpdate = (val) => {
    spinbox.value = isInteger ? val : val.toFixed(1);
    updateSliderFill(slider);

    // Debounce heavy 3D Clipper rebuilds while dragging or scrolling rapidly
    pending = true;
    clearTimeout(debounceTimer);
    const delay = state.viewMode === '3D' ? 140 : 30;
    debounceTimer = setTimeout(() => commit(val), delay);
  };

  slider.oninput = (e) => {
    scheduleUpdate(parseFloat(e.target.value));
  };

  // Flush immediately when the user releases the slider handle
  slider.onchange = (e) => {
    commit(parseFloat(e.target.value));
  };

  // Support mouse wheel scrolling directly over the slider
  slider.addEventListener('wheel', (e) => {
    if (e.deltaY === 0) return;
    e.preventDefault();

    const min = parseFloat(slider.min);
    const max = parseFloat(slider.max);
    const step = parseFloat(slider.step) || 1;
    const current = parseFloat(slider.value);
    const dir = e.deltaY < 0 ? 1 : -1;

    let next = Math.max(min, Math.min(max, current + dir * step));
    next = isInteger ? Math.round(next) : parseFloat(next.toFixed(1));
    if (next === current) return;

    slider.value = isInteger ? next : next.toFixed(1);
    scheduleUpdate(next);
  }, { passive: false });

  spinbox.onchange = (e) => {
    let val = parseFloat(e.target.value);
    val = Math.max(parseFloat(slider.min), Math.min(parseFloat(slider.max), val));
    slider.value = val;
    spinbox.value = isInteger ? val : val.toFixed(1);
    updateSliderFill(slider);
    clearTimeout(debounceTimer);
    pending = false;
    onChange(val);
  };
}

bindSliderAndSpinbox(sliderSegments, numSegments, true, (val) => {
  state.segmentNr = Math.round(val);
  spiro.setSegmentNumber(state.segmentNr);
  state.reverseTurns = [...spiro.reverseTurns];
  renderReversalChips();
  updateVisualization();
});

bindSliderAndSpinbox(sliderAngle, numAngle, true, (val) => {
  state.angle = Math.round(val);
  updateAnglePresetActiveState();
  spiro.setAngle(state.angle);
  updateVisualization();
});

bindSliderAndSpinbox(sliderRounding, numRounding, true, (val) => {
  state.cornerRounding = val / 100.0;
  updateResetButtonsState();
  spiro.setRoundingAndCurving(state.cornerRounding, state.segmentCurving);
  updateVisualization();
});

bindSliderAndSpinbox(sliderCurving, numCurving, true, (val) => {
  state.segmentCurving = val / 100.0;
  updateResetButtonsState();
  spiro.setRoundingAndCurving(state.cornerRounding, state.segmentCurving);
  updateVisualization();
});

bindSliderAndSpinbox(sliderLineWidth, numLineWidth, false, (val) => {
  state.lineWidthMm = parseFloat(val);
  savedLineWidthByMode[state.colorMode] = state.lineWidthMm;
  if (state.lineWidthMm >= 1.2 - 1e-4) {
    savedLineWidthByMode[3] = state.lineWidthMm;
    savedLineWidthByMode[2] = state.lineWidthMm;
    savedLineWidthByMode[1] = state.lineWidthMm;
  }
  updateVisualization();
});

chkAddLoop.onchange = (e) => {
  state.addLoop = e.target.checked;
  updateVisualization();
};

if (chkMirrorSymmetry) {
  chkMirrorSymmetry.onchange = (e) => {
    state.mirrorSymmetry = e.target.checked;
    spiro.setMirrorSymmetry(state.mirrorSymmetry);
    updateVisualization();
  };
}

const ADMIN_PASS_SHA256 = '42d92f7b1f09096d3540a1d880a291502f2278e8279129f158972b750a695354';

async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyAdminPassword(pwd) {
  if (!pwd) return false;
  const hash = await sha256(pwd.trim());
  return hash === ADMIN_PASS_SHA256;
}

const btnSubmitSheet = document.getElementById('btnSubmitSheet');
const btnDownload3MF = document.getElementById('btnDownload3MF');
const primaryBtnClass = btnSubmitSheet ? btnSubmitSheet.className : 'btn btn-primary';
const secondaryBtnClass = btnDownload3MF ? btnDownload3MF.className : 'btn btn-secondary';

function updateUiRoleVisibility() {
  const isVisitor = (state.studentName === 'Návštěva');

  if (btnOpenGallery) {
    btnOpenGallery.style.display = isVisitor ? 'none' : 'inline-flex';
  }

  if (btnAdminSettings) {
    btnAdminSettings.style.display = 'none';
  }

  const btnBatch = document.getElementById('btnBatchExport3MF');
  if (btnBatch) {
    btnBatch.style.display = state.isAdmin ? 'inline-flex' : 'none';
  }

  if (btnSubmitSheet && btnDownload3MF) {
    if (isVisitor) {
      btnSubmitSheet.style.display = 'none';
      btnDownload3MF.className = primaryBtnClass;
    } else {
      btnSubmitSheet.style.display = 'inline-flex';
      btnSubmitSheet.className = primaryBtnClass;
      btnDownload3MF.className = secondaryBtnClass;
    }
  }
}

// 2D Preview rendering with realistic outer base offset & crisp multi-layer drop shadow
function render2D(targetCanvas = canvas2d, customSpiro = spiro, customPalette = getActivePalette(), customMode = state.colorMode) {
  const ctx = targetCanvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = targetCanvas.getBoundingClientRect();
  const w = rect.width || targetCanvas.parentElement.clientWidth || 600;
  const h = rect.height || targetCanvas.parentElement.clientHeight || 600;

  targetCanvas.width = w * dpr;
  targetCanvas.height = h * dpr;
  ctx.save();
  ctx.scale(dpr, dpr);

  if (targetCanvas === canvas2d) {
    ctx.clearRect(0, 0, w, h);

    // Subtle sage-tinted dot grid
    ctx.fillStyle = 'rgba(72, 124, 109, 0.14)';
    const gridSize = 24;
    for (let gx = gridSize / 2; gx < w; gx += gridSize) {
      for (let gy = gridSize / 2; gy < h; gy += gridSize) {
        ctx.beginPath();
        ctx.arc(gx, gy, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else {
    ctx.fillStyle = '#f2f6f4';
    ctx.fillRect(0, 0, w, h);
  }

  const poly = customSpiro.getPolygon();
  const polys = (typeof customSpiro.getPolygons === 'function')
    ? customSpiro.getPolygons()
    : [customSpiro.getPolygon()];
  const bounds = customSpiro.getBoundingRect();

  const isMobile = window.innerWidth <= 860;

  // Keep ornament at 58% on desktop, 72% on compact mobile viewport
  const maxSpan = targetCanvas === canvas2d
    ? Math.min(w, h) * (isMobile ? 0.72 : 0.58)
    : Math.min(w, h) - 24;

  const scale = maxSpan / Math.max(bounds.width, bounds.height, 1e-4);
  const paddingLeft = (w - scale * bounds.width) / 2;
  const paddingTop = (h - scale * bounds.height) / 2 + (targetCanvas === canvas2d ? (isMobile ? 20 : 8) : 0);

  ctx.translate(paddingLeft, paddingTop);

  function traceSinglePolygon(poly) {
    poly.forEach((pt, idx) => {
      const sx = pt.x * scale;
      const sy = pt.y * scale;
      if (idx === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    });
    if (customSpiro.isClosed()) ctx.closePath();
  }

  function traceAllPolygons() {
    for (const poly of polys) {
      traceSinglePolygon(poly);
    }
  }

  let topX = 0, topY = Infinity;
  for (const poly of polys) {
    for (const pt of poly) {
      if (pt.y < topY) {
        topY = pt.y;
        topX = pt.x;
      }
    }
  }

  const modelScaleMm = (Math.max(bounds.width, bounds.height) * scale) / 74;
  const loopScreenX = topX * scale;
  const loopScreenY = topY * scale - 1.2 * modelScaleMm;
  const loopR = 2.0 * modelScaleMm;
  const holeR = 1.2 * modelScaleMm;

  const strokePx = targetCanvas === canvas2d
    ? Math.max(1.4, state.lineWidthMm * modelScaleMm)
    : 1.8;

  function traceLoopPath() {
    ctx.moveTo(loopScreenX + loopR, loopScreenY);
    ctx.arc(loopScreenX, loopScreenY, loopR, 0, Math.PI * 2, false);
    ctx.moveTo(loopScreenX + holeR, loopScreenY);
    ctx.arc(loopScreenX, loopScreenY, holeR, 0, Math.PI * 2, true);
  }

  // Helper: applies a two-stage shadow (ambient elevation + crisp contact edge for white/pastel filaments)
  function drawUnifiedShadowPass() {
    const isMain = (targetCanvas === canvas2d);
    const passes = isMain
      ? [
          { color: 'rgba(32, 48, 43, 0.22)', blur: 18, offsetY: 6 },
          { color: 'rgba(32, 48, 43, 0.24)', blur: 2.5, offsetY: 1 }
        ]
      : [
          { color: 'rgba(32, 48, 43, 0.20)', blur: 5, offsetY: 2 }
        ];

    passes.forEach(pass => {
      ctx.save();
      ctx.shadowColor = pass.color;
      ctx.shadowBlur = pass.blur;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = pass.offsetY;

      ctx.strokeStyle = 'rgba(0,0,0,1)';
      ctx.fillStyle = 'rgba(0,0,0,1)';
      ctx.lineWidth = strokePx;
      ctx.lineJoin = 'miter';
      ctx.miterLimit = 25;

      if (customMode === 3 && customSpiro.isClosed()) {
        // Fill each polygon silhouette individually to avoid winding cancellation
        for (const poly of polys) {
          ctx.beginPath();
          traceSinglePolygon(poly);
          ctx.fill('nonzero');
        }
        if (state.addLoop) {
          ctx.beginPath();
          traceLoopPath();
          ctx.fill('nonzero');
        }
      } else if (customMode === 2 && customSpiro.isClosed()) {
        ctx.beginPath();
        traceAllPolygons();
        ctx.fill('evenodd');
        if (state.addLoop) {
          ctx.beginPath();
          traceLoopPath();
          ctx.fill('nonzero');
        }
      }

      ctx.beginPath();
      traceAllPolygons();
      ctx.stroke();

      if (state.addLoop && (customMode === 1 || !customSpiro.isClosed())) {
        ctx.beginPath();
        traceLoopPath();
        ctx.fill('nonzero');
      }
      ctx.restore();
    });
  }

  // 0. Draw shadow underneath the whole ornament first
  drawUnifiedShadowPass();

  // 1. Base layer (3-color mode)
  if (customMode === 3 && customSpiro.isClosed()) {
    ctx.save();
    ctx.fillStyle = customPalette.baseColor;
    ctx.strokeStyle = customPalette.baseColor;
    ctx.lineWidth = strokePx;
    ctx.lineJoin = 'miter';
    ctx.miterLimit = 25;

    for (const poly of polys) {
      ctx.beginPath();
      traceSinglePolygon(poly);
      ctx.fill('nonzero');
    }
    if (state.addLoop) {
      ctx.beginPath();
      traceLoopPath();
      ctx.fill('nonzero');
    }

    // Outer base rim matching Clipper 3D geometry
    ctx.beginPath();
    traceAllPolygons();
    ctx.stroke();
    ctx.restore();
  }

  // 2. Fill layer (3-color and 2-color modes using combined even-odd rule)
  if (customMode >= 2 && customSpiro.isClosed()) {
    ctx.save();
    ctx.fillStyle = customPalette.fillColor;
    ctx.beginPath();
    traceAllPolygons();
    ctx.fill('evenodd');

    if (customMode === 2 && state.addLoop) {
      ctx.beginPath();
      traceLoopPath();
      ctx.fill('nonzero');
    }
    ctx.restore();
  }

  // 3. Top line layer
  ctx.save();
  ctx.strokeStyle = customPalette.lineColor;
  ctx.lineWidth = strokePx;
  ctx.lineJoin = 'miter';
  ctx.miterLimit = 25;

  ctx.beginPath();
  traceAllPolygons();
  ctx.stroke();

  if (customMode === 1 && state.addLoop) {
    ctx.beginPath();
    traceLoopPath();
    ctx.fillStyle = customPalette.lineColor;
    ctx.fill('nonzero');
  }
  ctx.restore();

  ctx.restore();
}


// Clean 3D Studio Viewport: centered ornament, silk highlights & layer self-shadowing
let scene, camera, renderer, ornamentGroup;
let webglFailed = false;

const view3DState = {
  isDragging: false,
  prevX: 0,
  prevY: 0,
  rotX: -0.14,
  rotY: -0.18,
  targetRotX: -0.14,
  targetRotY: -0.18,
  camDistance: 175,
  targetCamDistance: 175
};

function init3D() {
  if (renderer || webglFailed) return;

  scene = new THREE.Scene();

  const rect = container3d.getBoundingClientRect();
  const w = Math.max(100, rect.width || container3d.parentElement.clientWidth || 600);
  const h = Math.max(100, rect.height || container3d.parentElement.clientHeight || 600);

  camera = new THREE.PerspectiveCamera(35, w / h, 1, 1000);
  camera.position.set(0, 0, view3DState.camDistance);
  camera.lookAt(0, 0, 0);

  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (e1) {
    try {
      renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
    } catch (e2) {
      webglFailed = true;
      container3d.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#5c6e68;font-weight:600;">Prohlížeč vyčerpal paměť pro 3D (WebGL). Zavři prosím tuto záložku a otevři ji v nové kartě.</div>';
      return;
    }
  }

  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(w, h);

  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  if (THREE.sRGBEncoding !== undefined) {
    renderer.outputEncoding = THREE.sRGBEncoding;
  }

  container3d.innerHTML = '';
  container3d.appendChild(renderer.domElement);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.36);
  scene.add(ambientLight);

  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x6e8f85, 0.30);
  hemiLight.position.set(0, 120, 40);
  scene.add(hemiLight);

  // Front-left key light: lower intensity (0.50 instead of 0.72) so pastels never blow out to white
  const leftKeyLight = new THREE.DirectionalLight(0xfffdf8, 0.50);
  leftKeyLight.position.set(-46, 38, 118);
  leftKeyLight.castShadow = true;
  leftKeyLight.shadow.mapSize.width = 1024;
  leftKeyLight.shadow.mapSize.height = 1024;
  leftKeyLight.shadow.camera.near = 50;
  leftKeyLight.shadow.camera.far = 220;
  const d = 45;
  leftKeyLight.shadow.camera.left = -d;
  leftKeyLight.shadow.camera.right = d;
  leftKeyLight.shadow.camera.top = d;
  leftKeyLight.shadow.camera.bottom = -d;
  leftKeyLight.shadow.radius = 2.5;
  leftKeyLight.shadow.bias = -0.0006;
  scene.add(leftKeyLight);

  // Glint light reduced so it adds sheen to Silk without washing out matte colors
  const silkGlintLight = new THREE.DirectionalLight(0xfff6e0, 0.20);
  silkGlintLight.position.set(-22, -12, 135);
  scene.add(silkGlintLight);

  // Right-back rim light
  const rimLight = new THREE.DirectionalLight(0xd8eae4, 0.24);
  rimLight.position.set(75, -20, -45);
  scene.add(rimLight);

  ornamentGroup = new THREE.Group();
  ornamentGroup.rotation.set(view3DState.rotX, view3DState.rotY, 0);
  scene.add(ornamentGroup);

  const dom = renderer.domElement;

  dom.addEventListener('pointerdown', (e) => {
    view3DState.isDragging = true;
    view3DState.prevX = e.clientX;
    view3DState.prevY = e.clientY;
    dom.setPointerCapture(e.pointerId);
  });

  dom.addEventListener('pointermove', (e) => {
    if (!view3DState.isDragging) return;
    const dx = e.clientX - view3DState.prevX;
    const dy = e.clientY - view3DState.prevY;
    view3DState.prevX = e.clientX;
    view3DState.prevY = e.clientY;

    view3DState.targetRotY += dx * 0.009;
    view3DState.targetRotX = Math.max(-Math.PI * 0.46, Math.min(Math.PI * 0.46, view3DState.targetRotX + dy * 0.009));
  });

  const stopDrag = (e) => {
    view3DState.isDragging = false;
    try { dom.releasePointerCapture(e.pointerId); } catch (_) {}
  };
  dom.addEventListener('pointerup', stopDrag);
  dom.addEventListener('pointercancel', stopDrag);

  dom.addEventListener('dblclick', () => {
    view3DState.targetRotX = -0.14;
    view3DState.targetRotY = -0.18;
    view3DState.targetCamDistance = 175;
  });

  dom.addEventListener('wheel', (e) => {
    e.preventDefault();
    view3DState.targetCamDistance = Math.max(110, Math.min(240, view3DState.targetCamDistance + e.deltaY * 0.08));
  }, { passive: false });

  function animate() {
    requestAnimationFrame(animate);
    if (state.viewMode === '3D' && renderer && scene && camera && ornamentGroup) {
      view3DState.rotX += (view3DState.targetRotX - view3DState.rotX) * 0.14;
      view3DState.rotY += (view3DState.targetRotY - view3DState.rotY) * 0.14;
      view3DState.camDistance += (view3DState.targetCamDistance - view3DState.camDistance) * 0.14;

      ornamentGroup.rotation.set(view3DState.rotX, view3DState.rotY, 0);
      camera.position.set(0, 0, view3DState.camDistance);
      renderer.render(scene, camera);
    }
  }
  animate();
}

window.addEventListener('beforeunload', () => {
  if (renderer) {
    renderer.dispose();
    if (renderer.forceContextLoss) renderer.forceContextLoss();
  }
});

function createFilamentMaterial(hexColor, isSilk = false) {
  const col = new THREE.Color(hexColor);
  if (col.convertSRGBToLinear) {
    col.convertSRGBToLinear();
  }
  if (isSilk) {
    return new THREE.MeshStandardMaterial({
      color: col,
      roughness: 0.20,
      metalness: 0.32,
      flatShading: true
    });
  }

  return new THREE.MeshStandardMaterial({
    color: col,
    roughness: 0.78,
    metalness: 0.04,
    flatShading: true
  });
}

function render3D() {
  if (!renderer) {
    init3D();
  }
  if (!renderer || !ornamentGroup) return;

  const rect = container3d.getBoundingClientRect();
  const w = Math.max(100, rect.width || container3d.parentElement.clientWidth || 600);
  const h = Math.max(100, rect.height || container3d.parentElement.clientHeight || 600);

  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();

  // On mobile screens, shift 3D model down below top UI buttons and zoom in slightly
  const isMobile = window.innerWidth <= 860;
  ornamentGroup.position.y = isMobile ? -7.5 : 0;
  if (!view3DState.isDragging) {
    view3DState.targetCamDistance = isMobile ? 140 : 175;
    view3DState.camDistance = view3DState.targetCamDistance;
  }

  while (ornamentGroup.children.length > 0) {
    const child = ornamentGroup.children[0];
    if (child.geometry) child.geometry.dispose();
    if (child.material) child.material.dispose();
    ornamentGroup.remove(child);
  }

  const pal = getActivePalette();
  const { baseGeo, fillGeo, lineGeo } = buildOrnamentLayers(spiro, {
    targetSizeMm: 74,
    lineWidthMm: state.lineWidthMm,
    colorMode: state.colorMode,
    addLoop: state.addLoop
  });

  function addLayerMesh(geo, color, isSilk) {
    geo.translate(0, 0, -0.9);
    const mat = createFilamentMaterial(color, isSilk);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    ornamentGroup.add(mesh);
  }

  if (baseGeo && state.colorMode === 3) {
    addLayerMesh(baseGeo, pal.baseColor, pal.baseSilk);
  }
  if (fillGeo && state.colorMode >= 2) {
    addLayerMesh(fillGeo, pal.fillColor, pal.fillSilk);
  }
  if (lineGeo) {
    addLayerMesh(lineGeo, pal.lineColor, pal.lineSilk);
  }

  renderer.render(scene, camera);
}

function updateVisualization() {
  const closed = spiro.isClosed();
  statusBadge.style.display = closed ? 'none' : 'inline-flex';
  statusBadge.textContent = '⚠ Otevřený';

  if (state.viewMode === '2D') {
    render2D();
  } else {
    render3D();
  }
}

const btnView2D = document.getElementById('btnView2D');
const btnView3D = document.getElementById('btnView3D');

btnView2D.onclick = () => {
  state.viewMode = '2D';
  btnView2D.classList.add('active');
  btnView3D.classList.remove('active');
  canvas2d.style.display = 'block';
  container3d.style.display = 'none';
  render2D();
};

btnView3D.onclick = () => {
  state.viewMode = '3D';
  btnView3D.classList.add('active');
  btnView2D.classList.remove('active');
  canvas2d.style.display = 'none';
  container3d.style.display = 'block';
  requestAnimationFrame(() => render3D());
};

window.addEventListener('resize', () => {
  if (state.viewMode === '2D') {
    render2D();
  } else if (renderer) {
    render3D();
  }
});

function getExportFileName(ext) {
  const revPart = state.reverseTurns.length > 0 ? `_${state.reverseTurns.join('-')}` : '';
  const symPart = state.mirrorSymmetry ? '_sym' : '';
  return `Spirolateral_${state.segmentNr}_${state.angle}${revPart}${symPart}.${ext}`;
}

// Download .3MF
document.getElementById('btnDownload3MF').onclick = async () => {
  const btn = document.getElementById('btnDownload3MF');
  const label = btn.querySelector('span') || btn;
  const origText = label.textContent;
  label.textContent = 'Generuji...';
  btn.disabled = true;

  try {
    const student = state.studentName || 'Model';
    const geometries = buildOrnamentLayers(spiro, {
      targetSizeMm: 74,
      lineWidthMm: state.lineWidthMm,
      colorMode: state.colorMode,
      addLoop: state.addLoop
    });

    const blob = await generate3MFBlob([{ name: student, geometries }], getActivePalette(), state.colorMode);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = getExportFileName('3mf');
    a.click();
    URL.revokeObjectURL(url);
  } finally {
    label.textContent = origText;
    btn.disabled = false;
  }
};

// Download .SVG
document.getElementById('btnDownloadSVG').onclick = () => {
  const polys = (typeof spiro.getPolygons === 'function')
    ? spiro.getPolygons()
    : [spiro.getPolygon()];
  const bounds = spiro.getBoundingRect();
  const pal = getActivePalette();
  const pad = 12;
  const w = bounds.width + pad * 2;
  const h = bounds.height + pad * 2;

  const toPtsStr = (poly) =>
    poly.map(p => `${(p.x + pad).toFixed(2)},${(p.y + pad).toFixed(2)}`).join(' ');

  const combinedPathD = polys
    .map(poly =>
      poly.map((p, i) => `${i === 0 ? 'M' : 'L'}${(p.x + pad).toFixed(2)},${(p.y + pad).toFixed(2)}`).join(' ') +
      (spiro.isClosed() ? ' Z' : '')
    )
    .join(' ');

  let layersSvg = '';
  if (state.colorMode === 3 && spiro.isClosed()) {
    polys.forEach(poly => {
      layersSvg += `<polygon points="${toPtsStr(poly)}" fill="${pal.baseColor}" stroke="none"/>\n`;
    });
  }
  if (state.colorMode >= 2 && spiro.isClosed()) {
    layersSvg += `<path d="${combinedPathD}" fill="${pal.fillColor}" fill-rule="evenodd" stroke="none"/>\n`;
  }
  const lineTag = spiro.isClosed() ? 'polygon' : 'polyline';
  polys.forEach(poly => {
    layersSvg += `<${lineTag} points="${toPtsStr(poly)}" fill="none" stroke="${pal.lineColor}" stroke-width="${state.lineWidthMm}" stroke-linejoin="miter"/>\n`;
  });

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="600" height="600">
    <rect width="100%" height="100%" fill="#f6faf8"/>
    ${layersSvg}
  </svg>`;

  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = getExportFileName('svg');
  a.click();
  URL.revokeObjectURL(url);
};

// Submit to Google Sheet / LocalStorage
document.getElementById('btnSubmitSheet').onclick = async () => {
  if (state.studentName === 'Návštěva') return;
  const student = state.studentName;
  const pal = getActivePalette();
  const payload = {
    sheetName: state.sheetName,
    student: student,
    colorMode: state.colorMode,
    paletteId: pal.id,
    params: {
      segmentNr: state.segmentNr,
      angle: state.angle,
      reverseTurns: state.reverseTurns,
      cornerRounding: state.cornerRounding,
      segmentCurving: state.segmentCurving,
      addLoop: state.addLoop,
      mirrorSymmetry: state.mirrorSymmetry,
      lineWidthMm: state.lineWidthMm
    },
    timestamp: new Date().toISOString()
  };

  const localItems = JSON.parse(localStorage.getItem('spiro_saved_projects') || '[]');
  localItems.unshift(payload);
  localStorage.setItem('spiro_saved_projects', JSON.stringify(localItems));

  const apiUrl = state.scriptUrl.trim();
  const btn = document.getElementById('btnSubmitSheet');
  const label = btn.querySelector('span') || btn;
  const origText = label.textContent;

  if (apiUrl) {
    label.textContent = 'Odesílám...';
    btn.disabled = true;
    try {
      await fetch(apiUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      label.textContent = 'Odesláno!';
    } catch (err) {
      alert('Uloženo lokálně (chyba tabulky: ' + err.message + ')');
    } finally {
      setTimeout(() => {
        label.textContent = origText;
        btn.disabled = false;
      }, 2000);
    }
  } else {
    label.textContent = 'Uloženo!';
    setTimeout(() => { label.textContent = origText; }, 1600);
  }
};

// Gallery Modal
const modal = document.getElementById('sheetModal');
const projectGrid = document.getElementById('projectGrid');
let currentlyLoadedItems = [];

btnOpenGallery.onclick = () => {
  modal.classList.add('open');
  loadProjectsIntoGallery();
};

document.getElementById('btnCloseModal').onclick = () => {
  modal.classList.remove('open');
};

function loadProjectItemIntoEditor(item) {
  const p = item.params;
  const targetMode = item.colorMode || 3;
  state.segmentNr = p.segmentNr || 25;
  state.angle = p.angle || 120;
  state.reverseTurns = p.reverseTurns || [];
  state.cornerRounding = p.cornerRounding || 0.0;
  state.segmentCurving = p.segmentCurving || 0.0;
  state.addLoop = p.addLoop !== undefined ? p.addLoop : true;
  state.mirrorSymmetry = Boolean(p.mirrorSymmetry);
  state.lineWidthMm = p.lineWidthMm || 0.80;
  savedLineWidthByMode[targetMode] = state.lineWidthMm;

  const modeList = PALETTES_BY_MODE[targetMode] || PALETTES_BY_MODE[3];
  const foundIdx = modeList.findIndex(x => x.id === item.paletteId);
  if (foundIdx >= 0) {
    state.selectedPaletteIndex = foundIdx;
  }

  setMode(targetMode);
  spiro.setSegmentNumber(state.segmentNr);
  spiro.setAngle(state.angle);
  spiro.setReverseTurns(state.reverseTurns);
  spiro.setRoundingAndCurving(state.cornerRounding, state.segmentCurving);
  spiro.setMirrorSymmetry(state.mirrorSymmetry);

  syncInputsToState();
  renderReversalChips();
  renderPalettes();
  updateVisualization();
  modal.classList.remove('open');
}

async function loadProjectsIntoGallery() {
  projectGrid.innerHTML = '<p style="color:#5c6e68; font-size:0.85rem;">Načítám modely...</p>';
  const apiUrl = state.scriptUrl.trim();
  const sheetName = state.sheetName.trim() || 'Projekty_2026';

  let items = [];
  if (apiUrl) {
    try {
      const res = await fetch(`${apiUrl}?action=loadSheet&sheet=${encodeURIComponent(sheetName)}`);
      const data = await res.json();
      if (data && Array.isArray(data.items)) {
        items = data.items;
      }
    } catch (e) {
      console.warn('Fallback to local models:', e);
    }
  }

  if (items.length === 0) {
    items = JSON.parse(localStorage.getItem('spiro_saved_projects') || '[]');
  }

  currentlyLoadedItems = items;
  projectGrid.innerHTML = '';

  // Admin sees all models; a selected student sees only their own models
  const visibleItems = state.isAdmin
    ? items
    : items.filter(item => item.student === state.studentName);

  if (visibleItems.length === 0) {
    projectGrid.innerHTML = '<p style="grid-column:1/-1; color:#5c6e68; font-size:0.85rem;">Zatím tu nejsou žádné uložené modely.</p>';
    return;
  }

  visibleItems.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'project-card';
    const thumbCanvas = document.createElement('canvas');
    const title = document.createElement('div');
    title.style.fontWeight = '700';
    title.style.fontSize = '0.82rem';
    title.textContent = `${item.student}`;

    const meta = document.createElement('div');
    meta.style.fontSize = '0.72rem';
    meta.style.color = '#5c6e68';
    meta.textContent = `${item.colorMode || 3}b | ${item.params.segmentNr}s | ${item.params.angle}°${item.params.mirrorSymmetry ? ' | sym' : ''}`;

    card.appendChild(thumbCanvas);
    card.appendChild(title);
    card.appendChild(meta);
    projectGrid.appendChild(card);

    const tempSpiro = new Spirolateral(item.params.segmentNr, item.params.angle);
    tempSpiro.setReverseTurns(item.params.reverseTurns || []);
    tempSpiro.setRoundingAndCurving(item.params.cornerRounding || 0, item.params.segmentCurving || 0);
    tempSpiro.setMirrorSymmetry(Boolean(item.params.mirrorSymmetry));

    const list = PALETTES_BY_MODE[item.colorMode || 3] || PALETTES_BY_MODE[3];
    const p = list.find(x => x.id === item.paletteId) || list[0];
    const pal = {
      lineColor: p.line.color,
      fillColor: p.fill ? p.fill.color : null,
      baseColor: p.base ? p.base.color : null
    };

    setTimeout(() => render2D(thumbCanvas, tempSpiro, pal, item.colorMode || 3), 10);
    card.onclick = () => loadProjectItemIntoEditor(item);
  });
}

function updateUserBadge() {
  const iconEl = document.getElementById('userVisitorIcon');
  const initialsEl = document.getElementById('currentUserInitials');
  const isVisitor = (state.studentName === 'Návštěva');

  if (btnUserDropdown) {
    btnUserDropdown.title = `Uživatel: ${state.studentName} (klikni pro změnu)`;
    btnUserDropdown.classList.toggle('has-user', !isVisitor);
  }

  if (currentUserLabel) {
    currentUserLabel.textContent = state.studentName;
  }

  if (isVisitor) {
    if (iconEl) iconEl.style.display = 'block';
    if (initialsEl) initialsEl.style.display = 'none';
  } else {
    if (iconEl) iconEl.style.display = 'none';
    if (initialsEl) {
      const parts = state.studentName.trim().split(/\s+/);
      const initials = parts.length > 1
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : state.studentName.slice(0, 2).toUpperCase();
      initialsEl.textContent = initials;
      initialsEl.style.display = 'block';
    }
  }
}

// Batch export entire gallery into a single .3MF build plate
document.getElementById('btnBatchExport3MF').onclick = async () => {
  if (currentlyLoadedItems.length === 0) {
    alert('Nejsou načtené žádné modely k exportu.');
    return;
  }

  const btn = document.getElementById('btnBatchExport3MF');
  const orig = btn.textContent;
  btn.textContent = 'Skládám plato...';
  btn.disabled = true;

  try {
    const batchList = currentlyLoadedItems.map((item, idx) => {
      const s = new Spirolateral(item.params.segmentNr, item.params.angle);
      s.setReverseTurns(item.params.reverseTurns || []);
      s.setRoundingAndCurving(item.params.cornerRounding || 0, item.params.segmentCurving || 0);
      s.setMirrorSymmetry(Boolean(item.params.mirrorSymmetry));

      const geometries = buildOrnamentLayers(s, {
        targetSizeMm: 74,
        lineWidthMm: item.params.lineWidthMm || 0.80,
        colorMode: item.colorMode || 3,
        addLoop: item.params.addLoop !== false
      });

      return {
        name: `${item.student}_${idx + 1}`,
        geometries
      };
    });

    const blob = await generate3MFBlob(batchList, getActivePalette(), state.colorMode);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Plato_Modelu_${state.sheetName}.3mf`;
    a.click();
    URL.revokeObjectURL(url);
  } finally {
    btn.textContent = orig;
    btn.disabled = false;
  }
};

// Initial setup
rebuildUserDropdownItems();
fetchStudentListIfAvailable();
updateUiRoleVisibility();
syncInputsToState();
renderReversalChips();
renderPalettes();

canvas2d.style.display = 'none';
container3d.style.display = 'block';
setTimeout(() => updateVisualization(), 40);