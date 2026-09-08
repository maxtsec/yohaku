/* Yohaku prototype.
 *
 * Exercises the interaction design in DESIGN.md against a real YouTube player,
 * using the bundled fixture in fixture.js instead of a transcript provider and
 * Gemini. Everything the backend would do is either precomputed in the fixture
 * or simulated in `runAnalysis` below, and clearly labelled where it is faked.
 */

'use strict';

const POLL_MS = 250;             // TECHNICAL.md section 8
const AUTOSCROLL_SLACK_PX = 60;  // treat "close to the bottom" as "following"

const state = {
  lang: 'zh-Hant',
  showTranslation: true,
  revealed: new Set(),   // learning point IDs already added to the right column
  openPointId: null,
  currentSentenceId: null,
  tab: 'points',
  player: null,
  pollTimer: null,
  following: true,       // user has not scrolled away from the newest point
};

const $ = (id) => document.getElementById(id);

/* ---------------------------------------------------------------- helpers */

function fmtTime(ms) {
  const total = Math.floor(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

const t = {
  'zh-Hant': {
    points: '學習重點', translation: '翻譯', summary: 'Summary',
    idle: '（這段時間沒有字幕）',
    empty: '學習重點會隨影片進度出現在這裡。普通的句子可以沒有重點。',
    newBelow: '下面有新的重點 ↓',
    pausedHint: '影片已暫停。點擊時間可跳到該句。',
    source: '出處',
    merged: '已合併',
    coverageOk: (n, m) => `${n} 個重點全部收錄在 ${m} 個項目中。`,
    coverageBad: (n) => `覆蓋檢查失敗：${n} 個重點未收錄。`,
  },
  en: {
    points: 'Learning points', translation: 'Translation', summary: 'Summary',
    idle: '(no subtitle at this time)',
    empty: 'Learning points appear here as the video plays. Ordinary sentences may produce none.',
    newBelow: 'New points below ↓',
    pausedHint: 'Video paused. Click the timestamp to jump to the sentence.',
    source: 'Source',
    merged: 'merged',
    coverageOk: (n, m) => `All ${n} learning points are covered by ${m} summary items.`,
    coverageBad: (n) => `Coverage check failed: ${n} learning points are missing.`,
  },
};

const L = () => t[state.lang];

function allPoints() {
  return FIXTURE.sentences.flatMap((s) => s.points.map((p) => ({ ...p, sentence: s })));
}

function sentenceOfPoint(pointId) {
  return FIXTURE.sentences.find((s) => s.points.some((p) => p.id === pointId));
}

/* ------------------------------------------------------ URL validation
 * The real API validates the URL server-side and never fetches an arbitrary
 * user-supplied address (TECHNICAL.md section 3, step 2). Same rules here.
 */

function parseYouTubeId(raw) {
  const input = String(raw || '').trim();
  if (!input) return { error: 'invalid_url', message: 'Enter a YouTube URL.' };

  let url;
  try {
    url = new URL(input.includes('://') ? input : `https://${input}`);
  } catch {
    return { error: 'invalid_url', message: 'That is not a valid URL.' };
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    return { error: 'invalid_url', message: 'Only http(s) URLs are supported.' };
  }

  const host = url.hostname.replace(/^www\./, '').replace(/^m\./, '');
  let id = null;

  if (host === 'youtu.be') {
    id = url.pathname.slice(1).split('/')[0];
  } else if (host === 'youtube.com' || host === 'music.youtube.com') {
    if (url.pathname === '/watch') id = url.searchParams.get('v');
    else if (url.pathname.startsWith('/embed/')) id = url.pathname.slice(7).split('/')[0];
    else if (url.pathname.startsWith('/shorts/')) id = url.pathname.slice(8).split('/')[0];
    else if (url.pathname.startsWith('/live/')) id = url.pathname.slice(6).split('/')[0];
  } else {
    return { error: 'invalid_url', message: 'Only YouTube links are supported.' };
  }

  if (!id || !/^[A-Za-z0-9_-]{11}$/.test(id)) {
    return { error: 'invalid_url', message: 'Could not find a video ID in that link.' };
  }
  return { id };
}

/* ---------------------------------------------- fixture self-validation
 * Stands in for the backend validation described in TECHNICAL.md sections 6
 * and 7: unique IDs, at most three points per sentence, known categories, and
 * a summary that covers every learning point exactly once.
 */

function validateFixture() {
  const problems = [];
  const pts = allPoints();
  const ids = pts.map((p) => p.id);

  if (new Set(ids).size !== ids.length) problems.push('duplicate learning point IDs');

  FIXTURE.sentences.forEach((s, i) => {
    if (s.points.length > 3) problems.push(`${s.id}: more than 3 learning points`);
    if (!s.tr['zh-Hant'] || !s.tr.en) problems.push(`${s.id}: missing a translation`);
    if (i > 0 && s.startMs < FIXTURE.sentences[i - 1].endMs) {
      problems.push(`${s.id}: overlaps the previous sentence`);
    }
    if (s.startMs >= s.endMs) problems.push(`${s.id}: non-positive duration`);
  });

  pts.forEach((p) => {
    if (!FIXTURE.categories.includes(p.category)) problems.push(`${p.id}: unknown category`);
    for (const lang of ['zh-Hant', 'en']) {
      if (!p.short[lang] || !p.detailed[lang]) problems.push(`${p.id}: missing ${lang} text`);
    }
  });

  const merged = FIXTURE.summaryMerges.flatMap((m) => m.ids);
  merged.forEach((id) => { if (!ids.includes(id)) problems.push(`summary merge references unknown ${id}`); });
  if (new Set(merged).size !== merged.length) problems.push('a point is merged into two summary items');

  const covered = new Set(buildSummary().flatMap((item) => item.sourceIds));
  const missing = ids.filter((id) => !covered.has(id));
  if (missing.length) problems.push(`summary misses: ${missing.join(', ')}`);

  const label = problems.length ? 'FIXTURE INVALID' : 'fixture OK';
  console.log(`[yohaku] ${label} — ${FIXTURE.sentences.length} sentences, ${ids.length} learning points`);
  problems.forEach((p) => console.error('[yohaku]', p));
  return problems;
}

/* --------------------------------------------------------------- summary
 * Merges the groups declared in the fixture and passes every other point
 * through one-to-one, then groups by category (TECHNICAL.md section 7).
 * Source sentence, translation and time are read back from the fixture, never
 * rewritten, which is what the real Summary is required to do.
 */

function buildSummary() {
  const inMerge = new Map();
  FIXTURE.summaryMerges.forEach((m, i) => m.ids.forEach((id) => inMerge.set(id, i)));

  const items = [];
  const seenMerge = new Set();

  allPoints().forEach((p) => {
    const mi = inMerge.get(p.id);
    if (mi === undefined) {
      items.push({
        category: p.category,
        expression: p.expression,
        short: p.short,
        sourceIds: [p.id],
        sortMs: p.sentence.startMs,
      });
      return;
    }
    if (seenMerge.has(mi)) return;
    seenMerge.add(mi);
    const m = FIXTURE.summaryMerges[mi];
    items.push({
      category: m.category,
      expression: m.expression,
      short: m.short,
      sourceIds: m.ids.slice(),
      sortMs: Math.min(...m.ids.map((id) => sentenceOfPoint(id).startMs)),
      merged: true,
    });
  });

  return items.sort((a, b) => a.sortMs - b.sortMs);
}

/* ------------------------------------------------------------- screen 1 */

function showScreen(name) {
  $('screenInput').hidden = name !== 'input';
  $('screenAnalyzing').hidden = name !== 'analyzing';
  $('screenLearning').hidden = name !== 'learning';
}

function bindLangPicker(el, onPick) {
  el.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-lang]');
    if (!btn) return;
    [...el.querySelectorAll('button')].forEach((b) => b.classList.toggle('is-active', b === btn));
    onPick(btn.dataset.lang);
  });
}

function syncLangPickers() {
  ['langPicker', 'langPickerLearning'].forEach((id) => {
    [...$(id).querySelectorAll('button')].forEach((b) => {
      b.classList.toggle('is-active', b.dataset.lang === state.lang);
    });
  });
}

/* ------------------------------------------------------------- screen 2
 * Simulated. The real flow enqueues a Hangfire job and the frontend polls
 * GET /api/analyses/{id} roughly every 3 seconds; nothing here talks to a
 * server, the stages just play out on a timer so the wait is visible.
 */

const STAGES = [
  { key: 'transcript', title: 'Fetching transcript', detail: 'Japanese subtitles with timings' },
  { key: 'segmenting', title: 'Segmenting sentences', detail: 'Grouping cues into reading units' },
  { key: 'batch1', title: 'Analysing batch 1 / 3', detail: 'Translation and learning points' },
  { key: 'batch2', title: 'Analysing batch 2 / 3', detail: 'Translation and learning points' },
  { key: 'batch3', title: 'Analysing batch 3 / 3', detail: 'Translation and learning points' },
  { key: 'summary', title: 'Building summary', detail: 'Merging and grouping learning points' },
];

function runAnalysis() {
  showScreen('analyzing');
  $('stageList').innerHTML = STAGES
    .map((s) => `<li data-key="${s.key}"><span class="mark"></span><span>${s.title}</span></li>`)
    .join('');

  let i = 0;
  const step = () => {
    if (i > 0) {
      const prev = $('stageList').querySelector(`[data-key="${STAGES[i - 1].key}"]`);
      prev.classList.remove('is-active');
      prev.classList.add('is-done');
      prev.querySelector('.mark').textContent = '✓';
    }
    if (i === STAGES.length) {
      $('stageTitle').textContent = 'Ready';
      $('stageDetail').textContent = 'Opening the learning screen';
      $('progressBar').style.width = '100%';
      setTimeout(enterLearning, 500);
      return;
    }
    const s = STAGES[i];
    $('stageTitle').textContent = s.title;
    $('stageDetail').textContent = s.detail;
    $('progressBar').style.width = `${(i / STAGES.length) * 100}%`;
    const li = $('stageList').querySelector(`[data-key="${s.key}"]`);
    li.classList.add('is-active');
    li.querySelector('.mark').textContent = '›';
    i += 1;
    setTimeout(step, 700);
  };
  step();
}

/* ------------------------------------------------------------- screen 3 */

function enterLearning() {
  showScreen('learning');
  $('videoTitle').textContent = `${FIXTURE.video.title} · ${FIXTURE.video.channel}`;
  renderSummary();
  renderPoints();
  renderSentence(null);
  createPlayer();
}

/* --- YouTube player --- */

let apiReadyPromise = null;

function loadYouTubeApi() {
  if (apiReadyPromise) return apiReadyPromise;
  apiReadyPromise = new Promise((resolve) => {
    if (window.YT && window.YT.Player) return resolve();
    window.onYouTubeIframeAPIReady = resolve;
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
  });
  return apiReadyPromise;
}

function createPlayer() {
  loadYouTubeApi().then(() => {
    state.player = new YT.Player('player', {
      videoId: FIXTURE.video.youtubeId,
      playerVars: { rel: 0, modestbranding: 1, playsinline: 1 },
      events: {
        onReady: startPolling,
        onStateChange: () => tick(),
      },
    });
  });
}

function startPolling() {
  clearInterval(state.pollTimer);
  state.pollTimer = setInterval(tick, POLL_MS);
  tick();
}

function currentMs() {
  const p = state.player;
  if (!p || typeof p.getCurrentTime !== 'function') return 0;
  return Math.round(p.getCurrentTime() * 1000);
}

/* The core loop. Reveals every point whose sentence has started by now, which
 * gives all three behaviours DESIGN.md asks for at once: points accumulate,
 * rewinding adds nothing new because the IDs are already in the set, and
 * jumping forward reveals everything up to that time. */
function tick() {
  const ms = currentMs();

  const sentence = FIXTURE.sentences.find((s) => ms >= s.startMs && ms < s.endMs) || null;
  if ((sentence && sentence.id) !== state.currentSentenceId) {
    state.currentSentenceId = sentence ? sentence.id : null;
    renderSentence(sentence);
  }

  let added = 0;
  FIXTURE.sentences.forEach((s) => {
    if (s.startMs > ms) return;
    s.points.forEach((p) => {
      if (!state.revealed.has(p.id)) { state.revealed.add(p.id); added += 1; }
    });
  });
  if (added) renderPoints({ animateNew: true });
}

function seekTo(ms) {
  if (state.player && state.player.seekTo) {
    state.player.seekTo(ms / 1000, true);
    setTimeout(tick, 60);
  }
}

function pauseVideo() {
  if (state.player && state.player.pauseVideo) state.player.pauseVideo();
}

/* --- current sentence --- */

function renderSentence(sentence) {
  const jp = $('sentenceJp');
  const tr = $('sentenceTr');

  if (!sentence) {
    jp.textContent = L().idle;
    jp.classList.add('is-idle');
    tr.textContent = '';
    tr.hidden = true;
    $('sentenceTime').textContent = fmtTime(currentMs());
    $('sentenceIndex').textContent = '';
    return;
  }

  jp.textContent = sentence.jp;
  jp.classList.remove('is-idle');
  tr.textContent = sentence.tr[state.lang];
  tr.hidden = !state.showTranslation;
  $('sentenceTime').textContent = fmtTime(sentence.startMs);
  const n = FIXTURE.sentences.indexOf(sentence) + 1;
  $('sentenceIndex').textContent = `${n} / ${FIXTURE.sentences.length}`;
}

/* --- learning points column --- */

function renderPoints({ animateNew = false } = {}) {
  const scroll = $('pointsScroll');
  const list = $('pointsList');
  const visible = allPoints().filter((p) => state.revealed.has(p.id));

  $('pointCount').textContent = String(visible.length);
  $('pointsEmpty').hidden = visible.length > 0;

  const wasFollowing = state.following;

  list.innerHTML = visible.map((p) => {
    const open = state.openPointId === p.id;
    const cat = FIXTURE.categoryLabels[p.category][state.lang];
    return `
      <article class="point${open ? ' is-open' : ''}" data-point="${p.id}"
               style="--cat: var(--c-${p.category})">
        <div class="point-head">
          <span class="cat-tag">${cat}</span>
          <span class="point-expression">${escapeHtml(p.expression)}</span>
        </div>
        <p class="point-short">${escapeHtml(p.short[state.lang])}</p>
        ${open ? `
          <div class="point-detail">
            <p>${escapeHtml(p.detailed[state.lang])}</p>
            <div class="point-source">
              <p class="src-jp">${escapeHtml(p.sentence.jp)}</p>
              <p class="src-tr">${escapeHtml(p.sentence.tr[state.lang])}</p>
              <button class="time-chip" data-seek="${p.sentence.startMs}">${fmtTime(p.sentence.startMs)}</button>
            </div>
            <p class="paused-hint">${L().pausedHint}</p>
          </div>` : ''}
      </article>`;
  }).join('');

  if (animateNew && wasFollowing) {
    scroll.scrollTop = scroll.scrollHeight;
    $('jumpLatest').hidden = true;
  } else if (animateNew) {
    $('jumpLatest').hidden = false;
  }
}

function renderSummary() {
  const items = buildSummary();
  const byCat = new Map(FIXTURE.categories.map((c) => [c, []]));
  items.forEach((it) => byCat.get(it.category).push(it));

  $('summaryList').innerHTML = FIXTURE.categories.map((cat) => {
    const group = byCat.get(cat);
    if (!group.length) return '';
    return `
      <section class="summary-group" style="--cat: var(--c-${cat})">
        <h3>${FIXTURE.categoryLabels[cat][state.lang]} · ${group.length}</h3>
        ${group.map((it) => `
          <div class="summary-item">
            <div>
              <span class="si-expression">${escapeHtml(it.expression)}</span>
              ${it.merged ? `<span class="merged-tag">${L().merged} ${it.sourceIds.length}</span>` : ''}
            </div>
            <p class="si-short">${escapeHtml(it.short[state.lang])}</p>
            <div class="si-times">
              ${it.sourceIds.map((id) => {
                const s = sentenceOfPoint(id);
                return `<button class="time-chip" data-seek="${s.startMs}">${fmtTime(s.startMs)}</button>`;
              }).join('')}
            </div>
          </div>`).join('')}
      </section>`;
  }).join('');

  const total = allPoints().length;
  const covered = new Set(items.flatMap((i) => i.sourceIds)).size;
  const el = $('summaryCoverage');
  const ok = covered === total;
  el.textContent = ok ? L().coverageOk(total, items.length) : L().coverageBad(total - covered);
  el.className = `coverage ${ok ? 'is-ok' : 'is-bad'}`;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/* --------------------------------------------------------------- labels */

function applyLanguage() {
  $('tabPointsLabel').textContent = L().points;
  $('tabSummaryLabel').textContent = L().summary;
  $('translationToggleLabel').textContent = L().translation;
  $('jumpLatest').textContent = L().newBelow;
  $('pointsEmpty').textContent = L().empty;
  syncLangPickers();

  if (!$('screenLearning').hidden) {
    renderSummary();
    renderPoints();
    renderSentence(FIXTURE.sentences.find((s) => s.id === state.currentSentenceId) || null);
  }
}

/* ----------------------------------------------------------------- wiring */

$('analyzeBtn').addEventListener('click', () => {
  const parsed = parseYouTubeId($('urlInput').value);
  const err = $('urlError');
  if (parsed.error) {
    err.textContent = parsed.message;
    err.hidden = false;
    return;
  }
  err.hidden = true;
  runAnalysis();
});

$('urlInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') $('analyzeBtn').click();
});

bindLangPicker($('langPicker'), (lang) => { state.lang = lang; applyLanguage(); });
bindLangPicker($('langPickerLearning'), (lang) => { state.lang = lang; applyLanguage(); });

$('translationToggle').addEventListener('change', (e) => {
  state.showTranslation = e.target.checked;
  $('sentenceTr').hidden = !state.showTranslation || !state.currentSentenceId;
});

$('tabs').addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-tab]');
  if (!btn) return;
  state.tab = btn.dataset.tab;
  [...$('tabs').querySelectorAll('button')].forEach((b) => b.classList.toggle('is-active', b === btn));
  $('panelPoints').hidden = state.tab !== 'points';
  $('panelSummary').hidden = state.tab !== 'summary';
});

// Clicking a learning point pauses the video and expands the full explanation;
// only the timestamp seeks (DESIGN.md 7.3, TECHNICAL.md 8).
$('pointsList').addEventListener('click', (e) => {
  const seekBtn = e.target.closest('[data-seek]');
  if (seekBtn) { e.stopPropagation(); seekTo(Number(seekBtn.dataset.seek)); return; }

  const card = e.target.closest('[data-point]');
  if (!card) return;
  const id = card.dataset.point;
  state.openPointId = state.openPointId === id ? null : id;
  if (state.openPointId) pauseVideo();
  renderPoints();
});

$('summaryList').addEventListener('click', (e) => {
  const seekBtn = e.target.closest('[data-seek]');
  if (seekBtn) seekTo(Number(seekBtn.dataset.seek));
});

// Scrolling up stops the column from yanking itself to the newest point.
$('pointsScroll').addEventListener('scroll', () => {
  const el = $('pointsScroll');
  state.following = el.scrollHeight - el.scrollTop - el.clientHeight < AUTOSCROLL_SLACK_PX;
  if (state.following) $('jumpLatest').hidden = true;
});

$('jumpLatest').addEventListener('click', () => {
  const el = $('pointsScroll');
  el.scrollTop = el.scrollHeight;
  state.following = true;
  $('jumpLatest').hidden = true;
});

$('restartBtn').addEventListener('click', () => {
  clearInterval(state.pollTimer);
  if (state.player && state.player.destroy) state.player.destroy();
  state.player = null;
  state.revealed = new Set();
  state.openPointId = null;
  state.currentSentenceId = null;
  state.following = true;
  state.tab = 'points';

  // The player replaces #player with an iframe, so put a fresh mount point back.
  document.querySelector('.player-frame').innerHTML = '<div id="player"></div>';

  $('jumpLatest').hidden = true;
  $('panelPoints').hidden = false;
  $('panelSummary').hidden = true;
  [...$('tabs').querySelectorAll('button')].forEach((b) => {
    b.classList.toggle('is-active', b.dataset.tab === 'points');
  });

  showScreen('input');
});

// Expose a little of the internals so the behaviours can be driven from the
// console when checking the prototype.
window.yohaku = { state, FIXTURE, seekTo, tick, buildSummary, parseYouTubeId, validateFixture };

applyLanguage();
validateFixture();
