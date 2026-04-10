'use strict';

// ── Default data ─────────────────────────────────────────────────────────────

const DEFAULT_STATE = {
    day: 7,
    books: [
        { title: "Droit aérien 010",                          currentPage: 84,  dailyPages: 12, totalPages: 354 },
        { title: "Cellule et systèmes 021-1",                 currentPage: 84,  dailyPages: 12, totalPages: 346 },
        { title: "Motorisation 021-2",                        currentPage: 99,  dailyPages: 14, totalPages: 422 },
        { title: "Électricité et équip de secours 021-3",     currentPage: 57,  dailyPages: 8,  totalPages: 220 },
        { title: "Instrumentation 022",                       currentPage: 185, dailyPages: 15, totalPages: 454 },
        { title: "Masse et centrage 031",                     currentPage: 36,  dailyPages: 5,  totalPages: 150 },
        { title: "Préparation de vol 033",                    currentPage: 100, dailyPages: 9,  totalPages: 256 },
        { title: "Performance humaine 040",                   currentPage: 57,  dailyPages: 8,  totalPages: 240 },
        { title: "Météorologie 050",                          currentPage: 77,  dailyPages: 11, totalPages: 318 },
        { title: "Navigation 061",                            currentPage: 35,  dailyPages: 5,  totalPages: 146 },
        { title: "Radionavigation 062",                       currentPage: 49,  dailyPages: 7,  totalPages: 210 },
        { title: "Procédures opérationnelles 070",            currentPage: 56,  dailyPages: 8,  totalPages: 244 },
        { title: "Principe de vol 082",                       currentPage: 57,  dailyPages: 8,  totalPages: 228 },
        { title: "Communications 090",                        currentPage: 49,  dailyPages: 7,  totalPages: 184 },
    ],
};

const STORAGE_KEY = 'atpl_tracker';

// ── State management ──────────────────────────────────────────────────────────

function loadState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : JSON.parse(JSON.stringify(DEFAULT_STATE));
    } catch {
        return JSON.parse(JSON.stringify(DEFAULT_STATE));
    }
}

function saveState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function pct(book) {
    return Math.round((book.currentPage / book.totalPages) * 100);
}

function progressColor(p) {
    if (p >= 80) return '#22c55e';
    if (p >= 50) return '#3b82f6';
    return '#fff';
}

function accentColor(p) {
    if (p >= 80) return 'linear-gradient(90deg, #22c55e, #4ade80)';
    if (p >= 50) return 'linear-gradient(90deg, #3b82f6, #60a5fa)';
    return 'linear-gradient(90deg, #f59e0b, #fbbf24)';
}

function getBadge(book, day) {
    if (book.currentPage >= book.totalPages) {
        return { cls: 'badge-done', text: 'Terminé' };
    }
    const target = book.dailyPages * day;
    const diff = book.currentPage - target;
    if (diff > 0)  return { cls: 'badge-ok',   text: `+${diff} p.` };
    if (diff === 0) return { cls: 'badge-ok',  text: 'Parfait !' };
    if (diff >= -book.dailyPages) return { cls: 'badge-warn', text: `${diff} p.` };
    return { cls: 'badge-late', text: `${diff} p.` };
}

function getActiveIndex(state) {
    return state.books.findIndex(
        b => b.currentPage < b.totalPages && b.currentPage < b.dailyPages * state.day
    );
}

// ── Render ────────────────────────────────────────────────────────────────────

function renderStats(state) {
    const totalToday  = state.books.reduce((acc, b) => acc + (b.currentPage < b.totalPages ? b.dailyPages : 0), 0);
    const totalRead   = state.books.reduce((acc, b) => acc + b.currentPage, 0);
    const totalPages  = state.books.reduce((acc, b) => acc + b.totalPages, 0);
    const done        = state.books.filter(b => b.currentPage >= b.totalPages).length;
    const globalPct   = Math.round((totalRead / totalPages) * 100);

    document.getElementById('dayNum').textContent    = state.day;
    document.getElementById('statToday').textContent = totalToday + ' pages';
    document.getElementById('statRead').textContent  = totalRead.toLocaleString('fr-FR');
    document.getElementById('statGlobal').textContent = globalPct + '%';
}

function renderCards(state) {
    const grid = document.getElementById('grid');
    grid.innerHTML = '';

    state.books.forEach((book, i) => {
        const p      = pct(book);
        const badge  = getBadge(book, state.day);
        const target = Math.min(book.currentPage + book.dailyPages, book.totalPages);
        const color  = progressColor(p);

        const card = document.createElement('div');
        card.className = 'card';
        card.style.setProperty('--card-accent', accentColor(p));

        const activeIndex = getActiveIndex(state);
        if (i === activeIndex) card.classList.add('card--active');

        card.innerHTML = `
      <div class="card-top">
        <div class="card-title">${book.title}</div>
        <span class="badge ${badge.cls}">${badge.text}</span>
      </div>
      <div class="progress-wrap">
        <div class="progress-track">
          <div class="progress-fill" style="width:${p}%; background:${color}"></div>
        </div>
      </div>
      <div class="card-meta">
        <div class="meta-item">
          <span class="meta-label">Page actuelle</span>
          <span class="meta-val">${book.currentPage} / ${book.totalPages}</span>
        </div>
        <div class="meta-item" style="align-items:center">
          <span class="today-num" style="color:${color}">${book.dailyPages}</span>
          <span class="today-unit">pages/jour</span>
        </div>
        <div class="meta-item" style="align-items:flex-end">
          <span class="meta-label">Objectif</span>
          <span class="meta-target">${book.currentPage >= (book.dailyPages * state.day)+book.dailyPages ? 'En avance !' : target < book.totalPages ? 'p. ' + target : 'Fini !'}</span>
        </div>
      </div>
    `;

        card.addEventListener('click', () => openModal(i));
        grid.appendChild(card);
    });
}

function render(state) {
    renderStats(state);
    renderCards(state);
}

// ── Modal ─────────────────────────────────────────────────────────────────────

let activeIdx = null;

function openModal(i) {
    activeIdx = i;
    const book   = appState.books[i];
    const input = document.getElementById('pageInput');
    input.min   = book.currentPage;
    input.max   = book.totalPages;
    input.value = Math.min(book.currentPage + book.dailyPages, book.totalPages);


    document.getElementById('modalTitle').textContent = book.title;
    document.getElementById('modalSub').textContent   =
        `Jusqu'à quelle page as-tu lu aujourd'hui ? (actuellement p. ${book.currentPage})`;


    document.getElementById('modalHint').textContent  =
        `Objectif du jour : p. ${Math.min(book.currentPage + book.dailyPages, book.totalPages)} · Total : ${book.totalPages} pages`;

    document.getElementById('overlay').classList.add('open');
}

function closeModal() {
    document.getElementById('overlay').classList.remove('open');
    activeIdx = null;
}

function saveModal() {
    if (activeIdx === null) return;
    appState.books[activeIdx].currentPage = parseInt(document.getElementById('pageInput').value, 10);
    saveState(appState);
    closeModal();
    render(appState);
}

// ── Events ────────────────────────────────────────────────────────────────────

document.getElementById('btnDay').addEventListener('click', () => {
    appState.day++;
    saveState(appState);
    render(appState);
});

document.getElementById('btnDayMinus').addEventListener('click', () => {
    appState.day--;
    saveState(appState);
    render(appState);
});


document.getElementById('btnCancel').addEventListener('click', closeModal);
document.getElementById('btnSave').addEventListener('click', saveModal);

document.getElementById('overlay').addEventListener('click', function (e) {
    if (e.target === this) closeModal();
});

document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeModal();
});

// ── Init ──────────────────────────────────────────────────────────────────────

const appState = loadState();
render(appState);
