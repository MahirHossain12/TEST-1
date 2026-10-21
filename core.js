import { QUESTION_SET, questions } from './questions.js';

export const DURATION = 30 * 60 * 1000;
export const STORAGE_KEY = 'prostuti.exam.v1';
export const bn = value => String(value).replace(/[0-9]/g, digit => '০১২৩৪৫৬৭৮৯'[digit]);
export const clock = ms => {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  return bn(`${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`);
};

export function createAttempt(mode, now = Date.now()) {
  return {set: QUESTION_SET, mode, startedAt: now, deadline: mode === 'timed' ? now + DURATION : null,
    finishedAt: null, auto: false, answers: questions.map(() => null)};
}

export function score(answers) {
  let correct = 0, wrong = 0, skipped = 0;
  questions.forEach((q, i) => {
    if (answers[i] == null) skipped++;
    else if (answers[i] === q.a) correct++;
    else wrong++;
  });
  return {correct, wrong, skipped, answered: correct + wrong, net: correct - wrong * 0.5,
    accuracy: correct + wrong ? Math.round(correct / (correct + wrong) * 100) : 0};
}

export function restoreAttempt(raw) {
  try {
    const s = JSON.parse(raw);
    if (!s || s.set !== QUESTION_SET || !['timed', 'untimed'].includes(s.mode)
      || !Number.isFinite(s.startedAt) || s.startedAt <= 0
      || (s.mode === 'timed' ? s.deadline !== s.startedAt + DURATION : s.deadline !== null)
      || (s.finishedAt !== null && (!Number.isFinite(s.finishedAt) || s.finishedAt < s.startedAt))
      || typeof s.auto !== 'boolean'
      || !Array.isArray(s.answers) || s.answers.length !== questions.length
      || !s.answers.every((a, i) => a === null || (Number.isInteger(a) && a >= 0 && a < questions[i].o.length))) return null;
    // Keep existing answers/deadlines when migrating from the six-page layout.
    // Only return fields still used by the exam; the legacy page field is ignored.
    const {set, mode, startedAt, deadline, finishedAt, auto, answers} = s;
    return {set, mode, startedAt, deadline, finishedAt, auto, answers};
  } catch { return null; }
}

export function isExpired(s, now = Date.now()) {
  return !!s && s.finishedAt === null && s.mode === 'timed' && now >= s.deadline;
}
