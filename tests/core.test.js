import test from 'node:test';
import assert from 'node:assert/strict';
import { questions } from '../questions.js';
import { createAttempt, score, restoreAttempt, DURATION, isExpired, bn, clock } from '../core.js';

test('all 30 questions have four distinct choices and an answer explanation', () => {
  assert.equal(questions.length, 30);
  assert.equal(new Set(questions.map(q => q.q)).size, 30);
  for (const q of questions) {
    assert.equal(q.o.length, 4);
    assert.equal(new Set(q.o).size, 4);
    assert.ok(Number.isInteger(q.a) && q.a >= 0 && q.a < 4);
    assert.ok(q.topic && q.q && q.e);
  }
});
test('marks distinguish correct, wrong and skipped, including negative total', () => {
  assert.deepEqual(score(Array(30).fill(null)), {correct:0,wrong:0,skipped:30,answered:0,net:0,accuracy:0});
  assert.equal(score(questions.map(q => q.a)).net, 30);
  assert.equal(score(questions.map(q => (q.a + 1) % 4)).net, -15);
  const answers = Array(30).fill(null);
  answers[0] = questions[0].a;
  answers[1] = (questions[1].a + 1) % 4;
  assert.deepEqual(score(answers), {correct:1,wrong:1,skipped:28,answered:2,net:0.5,accuracy:50});
});
test('timer expires by absolute deadline even without intervening ticks', () => {
  const attempt = createAttempt('timed', 1000000);
  assert.equal(isExpired(attempt, 1000000 + DURATION - 1), false);
  assert.equal(isExpired(attempt, 1000000 + DURATION), true);
  assert.equal(isExpired(attempt, 1000000 + DURATION * 10), true);
  attempt.finishedAt = attempt.deadline;
  assert.equal(isExpired(attempt, attempt.deadline + 1000), false);
  assert.equal(isExpired(createAttempt('untimed',1000000), 1000000 + DURATION * 10), false);
});
test('saved attempt restores answers, mode and original deadline', () => {
  for (const mode of ['timed','untimed']) {
    const attempt = createAttempt(mode);
    attempt.answers[20] = 2;
    assert.deepEqual(restoreAttempt(JSON.stringify(attempt)), attempt);
  }
});
test('six-page attempts migrate without losing answers or resetting the timer', () => {
  const attempt = createAttempt('timed');
  attempt.answers[29] = questions[29].a;
  assert.deepEqual(restoreAttempt(JSON.stringify({...attempt, page: 5})), attempt);
});
test('corrupt, outdated and malformed browser data is ignored', () => {
  assert.equal(restoreAttempt('{invalid'), null);
  assert.equal(restoreAttempt(null), null);
  for (const change of [{set:'old'},{set:'bcs-practice-01-v1'},{mode:'other'},{deadline:0},{answers:[]},{finishedAt:0},{auto:'true'}]) {
    assert.equal(restoreAttempt(JSON.stringify({...createAttempt('timed'),...change})), null);
  }
  const attempt = createAttempt('timed');
  attempt.answers[0] = 9;
  assert.equal(restoreAttempt(JSON.stringify(attempt)),null);
});
test('Bengali clock rounds up remaining seconds and never goes negative', () => {
  assert.equal(clock(DURATION), '৩০:০০');
  assert.equal(clock(1501), '০০:০২');
  assert.equal(clock(-1000), '০০:০০');
  assert.equal(bn(-0.5), '-০.৫');
});
