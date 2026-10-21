import { questions, SET_LABEL, SET_DESCRIPTION } from './questions.js';
import { PAGE_SIZE, PAGE_COUNT, STORAGE_KEY, bn, clock, createAttempt, restoreAttempt, score, isExpired } from './core.js';

const main = document.querySelector('#main');
const dialog = document.querySelector('#confirm-dialog');
const announce = message => { document.querySelector('#announcement').textContent = message; };
const esc = text => String(text).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const icon = (name, cls = '') => {
  const paths = {
    arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
    back: '<path d="M19 12H5m6-6-6 6 6 6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    book: '<path d="M12 5v15M3 4c4-1 7-1 9 1 2-2 5-2 9-1v15c-4-1-7-1-9 1-2-2-5-2-9-1Z"/>',
    spark: '<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z"/>',
    grid: '<rect x="3" y="3" width="6" height="6" rx="1"/><rect x="15" y="3" width="6" height="6" rx="1"/><rect x="3" y="15" width="6" height="6" rx="1"/><rect x="15" y="15" width="6" height="6" rx="1"/>',
    close: '<path d="m6 6 12 12M6 18 18 6"/>',
    infinity: '<path d="M12 12C8 6 3 7 3 12s5 6 9 0 9-5 9 0-5 6-9 0Z"/>',
  };
  return `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.check}</svg>`;
};

let attempt;
let storageAvailable = true;
try { attempt = restoreAttempt(localStorage.getItem(STORAGE_KEY)); } catch { storageAvailable = false; }
let view = attempt?.finishedAt ? 'results' : 'home';
let filter = 'all';
let pendingConfirm = null;

function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(attempt)); }
  catch {
    storageAvailable = false;
    document.querySelectorAll('[data-storage-note]').forEach(el => {el.textContent = storageNote();});
  }
}
function storageNote() {
  return storageAvailable ? 'উত্তর এই ব্রাউজারেই সেভ থাকে। রিফ্রেশ হলেও হারাবে না।' : 'এই ব্রাউজারে সেভ করা যাচ্ছে না। পরীক্ষা চলাকালে পেজ রিফ্রেশ করবেন না।';
}
function focusTop() {
  window.scrollTo({top: 0, behavior: 'instant'});
  main.focus({preventScroll: true});
}
function render(focus = false) {
  document.body.dataset.view = view;
  if (view === 'home') home();
  else if (view === 'exam') exam();
  else results();
  if (focus) focusTop();
}

function home() {
  const active = attempt && attempt.finishedAt === null;
  main.innerHTML = `
    <section class="landing">
      <div class="hero-copy">
        <div class="edition"><span class="status-dot"></span> বিসিএস মিনি মডেল টেস্ট <span class="edition-number">${SET_LABEL}</span></div>
        <h1>বড় স্বপ্নের পথে,<br>আজ <span class="highlight">৩০টি প্রশ্ন।<svg viewBox="0 0 320 15" preserveAspectRatio="none" aria-hidden="true"><path d="M2 10Q160-3 318 6"/></svg></span></h1>
        <p class="hero-description">${SET_DESCRIPTION}।<br>সময় ধরে পরীক্ষা দিন, কিংবা শিখুন নিজের গতিতে।</p>
        <div class="hero-meta"><span>${icon('book')} ৩০টি বহুনির্বাচনি প্রশ্ন</span><span>${icon('grid')} প্রতি পাতায় ৫টি প্রশ্ন</span></div>
        <div class="mode-choices">
          <button class="mode-card timed" data-action="start" data-mode="timed">
            <span class="mode-icon">${icon('clock')}</span><span class="mode-text"><strong>সময় ধরে পরীক্ষা</strong><small>৩০ মিনিট · পরীক্ষার মতো অভিজ্ঞতা</small></span><span class="mode-arrow">${icon('arrow')}</span>
          </button>
          <button class="mode-card untimed" data-action="start" data-mode="untimed">
            <span class="mode-icon">${icon('infinity')}</span><span class="mode-text"><strong>নিজের গতিতে অনুশীলন</strong><small>সময়ের সীমা নেই · ভেবেচিন্তে উত্তর দিন</small></span><span class="mode-arrow">${icon('arrow')}</span>
          </button>
        </div>
        ${active ? `<div class="resume-card"><span><strong>আপনার একটি পরীক্ষা চলছে</strong><small>${bn(score(attempt.answers).answered)}টি উত্তর দেওয়া হয়েছে · ${attempt.mode === 'timed' ? 'সময় চলছে' : 'সময়ের সীমা নেই'}</small></span><button class="text-button" data-action="resume">চালিয়ে যান ${icon('arrow')}</button></div>` : ''}
        <p class="local-note">${icon('check')} লগইন লাগবে না। সম্পূর্ণ বিনামূল্যে।</p>
      </div>
      <div class="hero-art" aria-hidden="true">
        <div class="art-orbit orbit-one"></div><div class="art-orbit orbit-two"></div>
        <span class="floating-spark">✳</span>
        <div class="exam-paper">
          <div class="paper-top"><span>আপনার পরবর্তী পদক্ষেপ</span><span>০১ / ০৬</span></div>
          <div class="paper-heading">একটু অনুশীলন,<br>আরও একটু আত্মবিশ্বাস<span>।</span></div>
          <div class="paper-question">সফল প্রস্তুতির শুরু কোথায়?</div>
          <div class="paper-option"><i>ক</i> শুধু পরিকল্পনায়</div>
          <div class="paper-option picked"><i>${icon('check')}</i> আজকের ছোট্ট চেষ্টায় ${icon('spark')}</div>
          <div class="paper-option"><i>গ</i> আগামীকালের অপেক্ষায়</div>
          <div class="paper-bottom"><span>প্রতিটি চেষ্টাই এগিয়ে যাওয়া।</span><span>↗</span></div>
        </div>
        <div class="art-sticker">${icon('check')} আজ একটু এগিয়ে থাকুন</div>
        <span class="art-caption">একটি ছোট পরীক্ষা। নতুন করে শুরু করার সাহস।</span>
      </div>
    </section>
    <section class="before-start" aria-labelledby="before-heading">
      <div class="before-title"><span class="eyebrow">শুরু করার আগে</span><h2 id="before-heading">ছোট পরীক্ষা, পরিষ্কার নিয়ম।</h2></div>
      <div class="rule"><span class="rule-number">০১</span><div><h3>সঠিক উত্তরে +১</h3><p>ভুল উত্তরে −০.৫ নম্বর। উত্তর না দিলে ০।</p></div></div>
      <div class="rule"><span class="rule-number">০২</span><div><h3>উত্তর বদলাতে পারবেন</h3><p>জমা দেওয়ার আগে যেকোনো পাতায় ফিরে যান।</p></div></div>
      <div class="rule"><span class="rule-number">০৩</span><div><h3>শেষেই শেখার শুরু</h3><p>ফলাফলের সঙ্গে সঠিক উত্তর ও ছোট ব্যাখ্যা।</p></div></div>
    </section>
    <div class="subject-strip"><span>এই সেটের বিষয়গুলো</span><div>${['পদ্মা সেতু','মেট্রোরেল ও টানেল','বিদ্যুৎ ও বন্দর','ব-দ্বীপ পরিকল্পনা','প্রত্নতাত্ত্বিক নিদর্শন','ঐতিহাসিক স্থাপনা'].map(t => `<span>${t}</span>`).join('')}</div></div>
    <p class="home-footnote" data-storage-note>${storageNote()}</p>`;
}

function exam() {
  const answered = score(attempt.answers).answered;
  const start = attempt.page * PAGE_SIZE;
  main.innerHTML = `
    <section class="exam-shell" aria-labelledby="exam-title">
      <div class="exam-heading"><div><span class="eyebrow">বিসিএস মিনি মডেল টেস্ট / ${SET_LABEL}</span><h1 id="exam-title">মনোযোগ থাকুক প্রশ্নে<span class="brand-dot">।</span></h1></div><button class="text-button exit-button" data-action="home">${icon('back')} শুরুর পাতা</button></div>
      <div class="exam-dashboard">
        <div class="dashboard-top"><span class="page-label">পাতা <b>${bn(attempt.page + 1)}</b> / ${bn(PAGE_COUNT)}</span><span class="timer ${attempt.mode === 'timed' ? '' : 'no-limit'}" id="timer-box">${icon(attempt.mode === 'timed' ? 'clock' : 'infinity')} <span id="timer" role="timer" aria-label="অবশিষ্ট সময়">${attempt.mode === 'timed' ? clock(attempt.deadline - Date.now()) : 'সময়ের সীমা নেই'}</span></span></div>
        <div class="progress-track" role="progressbar" aria-label="উত্তর দেওয়া হয়েছে" aria-valuemin="0" aria-valuemax="30" aria-valuenow="${answered}"><span style="width:${answered / questions.length * 100}%"></span></div>
        <div class="dashboard-bottom"><span id="answered-count">${bn(answered)} / ৩০টি উত্তর দেওয়া হয়েছে</span><span>সঠিক +১ &nbsp; ভুল −০.৫</span></div>
        <details class="question-map"><summary>${icon('grid')} প্রশ্নের তালিকা <span>যেকোনো প্রশ্নে যান</span></summary><div class="map-grid">${questions.map((q, i) => `<button class="map-number ${attempt.answers[i] !== null ? 'answered' : ''} ${Math.floor(i / PAGE_SIZE) === attempt.page ? 'current-page' : ''}" data-jump="${i}" aria-label="প্রশ্ন ${bn(i + 1)}, ${attempt.answers[i] !== null ? 'উত্তর দেওয়া' : 'উত্তর বাকি'}">${bn(i + 1)}</button>`).join('')}</div><div class="map-legend"><span><i></i> উত্তর দেওয়া</span><span><i></i> উত্তর বাকি</span></div></details>
      </div>
      <div class="question-list">${questions.slice(start, start + PAGE_SIZE).map((q, offset) => questionCard(q, start + offset)).join('')}</div>
      <p class="save-note" data-storage-note>${storageNote()}</p>
      <nav class="exam-controls" aria-label="পরীক্ষার পাতাসমূহ"><div class="controls-inner"><button class="button secondary previous" data-action="previous" ${attempt.page === 0 ? 'disabled' : ''}>${icon('back')} আগের পাতা</button><button class="text-button submit-early" data-action="submit">জমা দিন</button>${attempt.page === PAGE_COUNT - 1 ? `<button class="button primary next" data-action="submit">পরীক্ষা শেষ করুন ${icon('check')}</button>` : `<button class="button primary next" data-action="next">পরের পাতা ${icon('arrow')}</button>`}</div></nav>
    </section>`;
  updateTimer();
}

function questionCard(q, i) {
  return `<article class="question-card" id="question-${i}" tabindex="-1"><div class="question-meta"><span>প্রশ্ন ${bn(i + 1).padStart(2, '০')}</span><span>${esc(q.topic)}</span></div><fieldset><legend>${esc(q.q)}</legend><div class="options">${q.o.map((o, j) => `<label class="option ${attempt.answers[i] === j ? 'selected' : ''}"><input type="radio" name="question-${i}" value="${j}" data-question="${i}" ${attempt.answers[i] === j ? 'checked' : ''}><span class="option-letter" aria-hidden="true">${'কখগঘ'[j]}</span><span class="option-text">${esc(o)}</span><span class="option-check" aria-hidden="true">${icon('check')}</span></label>`).join('')}</div></fieldset><button class="clear-answer" data-clear="${i}" ${attempt.answers[i] === null ? 'hidden' : ''}>উত্তর মুছুন</button></article>`;
}

function updateAnswer(i, answer) {
  if (!attempt || attempt.finishedAt !== null) return;
  if (isExpired(attempt)) { finish(true); return; }
  attempt.answers[i] = answer;
  save();
  const card = document.querySelector(`#question-${i}`);
  card.querySelectorAll('input').forEach(input => {
    input.checked = Number(input.value) === answer;
    input.closest('.option').classList.toggle('selected', input.checked);
  });
  card.querySelector('[data-clear]').hidden = answer === null;
  const answered = score(attempt.answers).answered;
  document.querySelector('#answered-count').textContent = `${bn(answered)} / ৩০টি উত্তর দেওয়া হয়েছে`;
  const progress = document.querySelector('[role=progressbar]');
  progress.setAttribute('aria-valuenow', answered);
  progress.firstElementChild.style.width = `${answered / questions.length * 100}%`;
  const mapButton = document.querySelector(`[data-jump="${i}"]`);
  mapButton.classList.toggle('answered', answer !== null);
  mapButton.setAttribute('aria-label', `প্রশ্ন ${bn(i + 1)}, ${answer !== null ? 'উত্তর দেওয়া' : 'উত্তর বাকি'}`);
  announce(`প্রশ্ন ${bn(i + 1)}: ${answer === null ? 'উত্তর মুছে দেওয়া হয়েছে' : 'উত্তর বেছে নেওয়া হয়েছে'}`);
}

function results() {
  const s = score(attempt.answers);
  const elapsed = Math.max(0, (attempt.auto ? attempt.deadline : attempt.finishedAt) - attempt.startedAt);
  const items = questions.map((q, i) => ({q, i, type: attempt.answers[i] === null ? 'skipped' : attempt.answers[i] === q.a ? 'correct' : 'wrong'})).filter(item => filter === 'all' || item.type === filter);
  main.innerHTML = `<section class="results-shell">
    <div class="result-intro"><span class="eyebrow">চেষ্টা করেছেন। এবার শিখে নেওয়ার পালা।</span><h1>আপনার প্রস্তুতির এক ঝলক<span class="brand-dot">।</span></h1><p>${attempt.auto ? '৩০ মিনিট শেষ হয়েছে। আপনার দেওয়া উত্তরগুলো স্বয়ংক্রিয়ভাবে জমা হয়েছে।' : 'পরীক্ষা জমা হয়েছে। সঠিক উত্তর ও ব্যাখ্যা মিলিয়ে নিন।'}</p></div>
    <div class="result-summary"><div class="score-main"><span class="score-eyebrow">আপনার মোট নম্বর</span><div class="big-score">${bn(Number(s.net.toFixed(1)))}<span> / ৩০</span></div><span class="score-calculation">${bn(s.correct)} − (${bn(s.wrong)} × ০.৫)</span><div class="result-message">${s.net >= 24 ? 'দারুণ এগোচ্ছেন। চর্চাটা ধরে রাখুন!' : s.net >= 15 ? 'ভালো শুরু। ভুলগুলোই হোক পরের প্রস্তুতি।' : 'প্রতিটি ভুলই শেখার নতুন সুযোগ।'}</div></div>
      <div class="score-detail"><div class="stat-row"><span><i class="stat-dot correct"></i> সঠিক উত্তর</span><strong>${bn(s.correct)}<small>টি</small></strong></div><div class="stat-row"><span><i class="stat-dot wrong"></i> ভুল উত্তর</span><strong>${bn(s.wrong)}<small>টি</small></strong></div><div class="stat-row"><span><i class="stat-dot skipped"></i> উত্তর দেওয়া হয়নি</span><strong>${bn(s.skipped)}<small>টি</small></strong></div><div class="result-meta"><span>সময় লেগেছে <b>${clock(elapsed)}</b></span><span>নির্ভুলতা <b>${bn(s.accuracy)}%</b></span></div><small class="accuracy-note">নির্ভুলতা = সঠিক উত্তর ÷ দেওয়া উত্তর × ১০০</small></div></div>
    <div class="result-actions"><p>${icon('book')} নম্বরের চেয়ে শেখাটাই বড়।</p><button class="button primary" data-action="restart">আবার অনুশীলন ${icon('arrow')}</button></div>
    <div class="review-heading"><div><span class="eyebrow">উত্তরপত্র</span><h2>মিলিয়ে নিন, মনে রাখুন।</h2></div><span class="review-count">${bn(items.length)}টি প্রশ্ন</span></div>
    <div class="review-filters" role="group" aria-label="উত্তর ফিল্টার">${[['all','সবগুলো',30],['wrong','ভুল',s.wrong],['skipped','উত্তর বাকি',s.skipped],['correct','সঠিক',s.correct]].map(([id, label, n]) => `<button class="filter-button ${filter === id ? 'active' : ''}" data-filter="${id}" aria-pressed="${filter === id}">${label}<span>${bn(n)}</span></button>`).join('')}</div>
    <div class="review-list">${items.length ? items.map(({q, i, type}) => `<article class="review-card ${type}"><div class="question-meta"><span>প্রশ্ন ${bn(i + 1).padStart(2, '০')} · ${esc(q.topic)}</span><span class="review-status">${type === 'correct' ? '✓ সঠিক · +১' : type === 'wrong' ? '× ভুল · −০.৫' : '— উত্তর দেওয়া হয়নি'}</span></div><h3>${esc(q.q)}</h3><div class="review-answer correct-answer">${icon('check')}<span><small>সঠিক উত্তর</small>${'কখগঘ'[q.a]}. ${esc(q.o[q.a])}</span></div>${type === 'wrong' ? `<div class="your-answer">আপনার উত্তর: ${'কখগঘ'[attempt.answers[i]]}. ${esc(q.o[attempt.answers[i]])}</div>` : ''}<p class="explanation"><strong>কেন?</strong> ${esc(q.e)}</p></article>`).join('') : `<div class="empty-state">${icon('spark')}<h3>এই তালিকায় কোনো প্রশ্ন নেই।</h3><p>অন্য ফিল্টার দিয়ে উত্তরগুলো দেখুন।</p></div>`}</div>
    <div class="review-bottom"><button class="button secondary" data-action="restart">শুরুর পাতায় ফিরুন ${icon('back')}</button><p>একই সেট আবার দিতে পারবেন। নতুন প্রশ্ন যোগ হলে সেট নম্বর বদলাবে।</p></div>
  </section>`;
}

function ask(title, description, label, callback) {
  pendingConfirm = callback;
  document.querySelector('#dialog-title').textContent = title;
  document.querySelector('#dialog-description').textContent = description;
  document.querySelector('#dialog-confirm').textContent = label;
  dialog.showModal();
}
dialog.addEventListener('close', () => {
  const callback = pendingConfirm;
  pendingConfirm = null;
  if (dialog.returnValue === 'confirm') callback?.();
});
function start(mode) {
  const run = () => { attempt = createAttempt(mode); save(); view = 'exam'; render(true); };
  if (attempt && attempt.finishedAt === null) {
    ask('নতুন করে শুরু করবেন?', 'চলমান পরীক্ষার উত্তর মুছে নতুন পরীক্ষা শুরু হবে। চাইলে ফিরে গিয়ে আগের পরীক্ষা চালিয়ে যেতে পারেন।', 'নতুন পরীক্ষা শুরু', run);
  } else run();
}
function finish(auto = false) {
  if (!attempt || attempt.finishedAt !== null) return;
  if (dialog.open) { pendingConfirm = null; dialog.close('cancel'); }
  attempt.auto = auto;
  attempt.finishedAt = auto ? attempt.deadline : Date.now();
  save(); view = 'results'; filter = 'all'; render(true);
  announce(auto ? 'সময় শেষ। পরীক্ষা জমা হয়েছে। ফলাফল দেখুন।' : 'পরীক্ষা জমা হয়েছে। ফলাফল দেখুন।');
}
let warned = false;
function updateTimer() {
  if (isExpired(attempt)) { finish(true); return; }
  if (!attempt || attempt.finishedAt !== null || attempt.mode !== 'timed') return;
  const remaining = attempt.deadline - Date.now();
  const timer = document.querySelector('#timer');
  if (timer) timer.textContent = clock(remaining);
  document.querySelector('#timer-box')?.classList.toggle('urgent', remaining <= 5 * 60 * 1000);
  if (remaining <= 5 * 60 * 1000 && !warned) { announce('আর পাঁচ মিনিটের কম সময় বাকি।'); warned = true; }
}
function navigatePage(page) {
  attempt.page = Math.max(0, Math.min(PAGE_COUNT - 1, page));
  save(); render(true);
}
main.addEventListener('change', event => {
  const input = event.target.closest('[data-question]');
  if (input) updateAnswer(Number(input.dataset.question), Number(input.value));
});
main.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button) return;
  if (isExpired(attempt)) { finish(true); return; }
  if (button.dataset.clear !== undefined) {
    const index = Number(button.dataset.clear);
    // The clear button disappears; return keyboard focus to this question's first option.
    document.querySelector(`#question-${index} input`).focus({preventScroll: true});
    updateAnswer(index, null); return;
  }
  if (button.dataset.jump !== undefined) {
    const index = Number(button.dataset.jump);
    navigatePage(Math.floor(index / PAGE_SIZE));
    const target = document.querySelector(`#question-${index}`);
    target.scrollIntoView({block: 'start'}); target.focus({preventScroll: true}); return;
  }
  if (button.dataset.filter) {
    const scrollY = window.scrollY;
    filter = button.dataset.filter; render();
    document.querySelector(`[data-filter="${filter}"]`).focus({preventScroll: true});
    window.scrollTo(0, scrollY); return;
  }
  switch (button.dataset.action) {
    case 'start': warned = false; start(button.dataset.mode); break;
    case 'resume': view = 'exam'; render(true); break;
    case 'home': view = 'home'; render(true); break;
    case 'previous': navigatePage(attempt.page - 1); break;
    case 'next': navigatePage(attempt.page + 1); break;
    case 'submit': {
      const {skipped} = score(attempt.answers);
      ask('উত্তরপত্র জমা দেবেন?', skipped ? `এখনো ${bn(skipped)}টি প্রশ্নের উত্তর দেওয়া হয়নি। জমা দেওয়ার পর উত্তর বদলানো যাবে না।` : 'সব প্রশ্নের উত্তর দেওয়া হয়েছে। জমা দেওয়ার পর উত্তর বদলানো যাবে না।', 'হ্যাঁ, জমা দিন', () => finish(isExpired(attempt)));
      break;
    }
    case 'restart': view = 'home'; render(true); break;
  }
});

document.querySelector('.brand').addEventListener('click', event => {
  event.preventDefault();
  if (isExpired(attempt)) finish(true);
  else { view = 'home'; render(true); }
});
document.addEventListener('visibilitychange', () => { if (!document.hidden) updateTimer(); });
window.addEventListener('pageshow', updateTimer);
setInterval(updateTimer, 1000);
render();
updateTimer();
