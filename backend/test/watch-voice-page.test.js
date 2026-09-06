const assert = require('assert');
const { loadWatchModule, fakeClock } = require('./watch-test-loader');

function fixture() {
  const clock = fakeClock();
  const calls = { starts: 0, stops: 0, asks: [], uploads: [], deleted: [] };
  const stored = {};
  let recordSuccess;
  let recordFail;
  const voice = {
    startRecording(success, fail) { calls.starts++; recordSuccess = success; recordFail = fail; },
    stopRecording() { calls.stops++; },
    discardRecording(uri) { calls.deleted.push(uri); },
    transcribeRecording(uri) {
      let resolve;
      let reject;
      const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
      const job = { uri, promise, resolve, reject, cancelled: false };
      job.cancel = () => { job.cancelled = true; reject(new Error('CANCELLED')); };
      calls.uploads.push(job);
      return job;
    },
  };
  const definition = loadWatchModule('src/pages/index/index.ux', {
    './voice.js': voice,
    './health.js': {
      DATA_TYPES: {}, unsubscribe() {}, subscribe() {}, getRecent: () => Promise.resolve([]),
    },
    '@system.velaclaw': { ask: (request) => calls.asks.push(request) },
    '@system.storage': {
      set(options) { stored[options.key] = options.value; options.success(); },
      get(options) {
        if (Object.prototype.hasOwnProperty.call(stored, options.key)) options.success(stored[options.key]);
        else options.fail('missing', 404);
      },
    },
  }, clock).default;
  const page = Object.assign({}, definition, JSON.parse(JSON.stringify(definition.private)));
  if (page.onInit) page.onInit();
  return { page, calls, clock, stored, recorded: (data) => recordSuccess(data), failed: () => recordFail({}, 1) };
}

async function main() {
  let f = fixture();
  f.page.onGoalChange({ value: '' });
  assert.strictEqual(f.page.goalText, '', 'users must be able to clear the goal');

  f = fixture();
  const originalGoal = f.page.goalText;
  f.page.toggleVoice();
  assert.strictEqual(f.page.recording, true);
  f.page.generatePlan();
  assert.strictEqual(f.calls.asks.length, 0, 'do not generate from unconfirmed recording');
  f.page.toggleVoice();
  f.page.toggleVoice();
  assert.strictEqual(f.calls.stops, 1, 'stop once while waiting for the recording URI');
  assert.strictEqual(f.calls.starts, 1);
  f.recorded({ uri: 'internal://cache/goal.wav' });
  assert.strictEqual(f.calls.uploads.length, 1, 'recorded audio must be transcribed');
  f.page.toggleVoice();
  assert.strictEqual(f.calls.starts, 1, 'prevent overlapping uploads');
  assert.strictEqual(f.page.goalText, originalGoal);
  f.calls.uploads[0].resolve('Study for two hours');
  await Promise.resolve();
  assert.strictEqual(f.page.goalText, 'Study for two hours');
  assert.strictEqual(f.page.voiceBusy, false);
  assert.strictEqual(f.calls.asks.length, 0, 'transcription needs explicit user confirmation');
  f.page.generatePlan();
  assert.strictEqual(f.calls.asks.length, 1);
  assert.ok(f.calls.asks[0].query.includes('Study for two hours'));
  const request = f.calls.asks[0];
  f.page.onGoalChange({ value: 'Travel tomorrow' });
  const oldPlan = f.page.plan;
  request.success({ reply: JSON.stringify({ title: 'stale', tasks: [] }) });
  assert.strictEqual(f.page.plan, oldPlan, 'old plan response must not overwrite a new goal');
  f.page.onDestroy();
  assert.strictEqual(f.clock.size(), 0);

  f = fixture();
  f.page.toggleVoice();
  f.recorded({ uri: 'internal://cache/goal.wav' });
  f.page.onGoalChange({ value: 'My edited goal' });
  assert.strictEqual(f.calls.uploads[0].cancelled, true);
  f.calls.uploads[0].resolve('old transcript');
  await Promise.resolve();
  assert.strictEqual(f.page.goalText, 'My edited goal');
  assert.strictEqual(f.page.voiceBusy, false);

  f = fixture();
  const saved = f.page.goalText;
  f.page.toggleVoice();
  f.recorded({ uri: 'internal://cache/goal.wav' });
  f.calls.uploads[0].reject(Object.assign(new Error('NETWORK'), { code: 'NETWORK' }));
  await Promise.resolve();
  assert.strictEqual(f.page.goalText, saved, 'failure must preserve user input');
  assert.strictEqual(f.page.voiceBusy, false);
  assert.strictEqual(f.page.recording, false);
  assert.ok(!f.page.voiceStatus.includes('完成'), 'do not claim transcription success');

  for (const action of ['destroy', 'demo', 'timeout', 'fail']) {
    f = fixture();
    f.page.toggleVoice();
    if (action === 'destroy') f.page.onDestroy();
    if (action === 'demo') {
      f.page.fillDemo();
      f.page.onDestroy();
    }
    if (action === 'timeout') f.clock.expire();
    if (action === 'fail') f.failed();
    f.recorded({ uri: 'internal://cache/late.wav' });
    assert.strictEqual(f.calls.uploads.length, 0, `${action}: ignore late audio`);
    assert.deepStrictEqual(f.calls.deleted, ['internal://cache/late.wav']);
    assert.strictEqual(f.page.voiceBusy, false);
    assert.strictEqual(f.clock.size(), 0);
  }

  f = fixture();
  f.page.toggleVoice();
  f.recorded({});
  assert.strictEqual(f.page.voiceBusy, false, 'missing recording URI must unlock the page');
  assert.strictEqual(f.calls.uploads.length, 0);
  console.log('watch voice page tests passed');
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
