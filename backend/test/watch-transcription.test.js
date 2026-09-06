const assert = require('assert');
const { fakeClock, loadWatchModule } = require('./watch-test-loader');
const { createTranscriber, CONFIG_URI, MAX_AUDIO_BYTES } = require(
  '../../quickapp/hello_quickapp/src/pages/index/transcription',
);

const URI = 'internal://cache/goal.wav';
const wav = Buffer.alloc(364);
wav.write('RIFF', 0);
wav.writeUInt32LE(wav.length - 8, 4);
wav.write('WAVEfmt ', 8);
wav.writeUInt32LE(16, 16);
wav.writeUInt16LE(1, 20);
wav.writeUInt16LE(1, 22);
wav.writeUInt32LE(16000, 24);
wav.writeUInt32LE(32000, 28);
wav.writeUInt16LE(2, 32);
wav.writeUInt16LE(16, 34);
wav.write('data', 36);
wav.writeUInt32LE(320, 40);

function response(text = 'Study for two hours') {
  return { code: 200, data: { choices: [{
    finish_reason: 'stop', message: { content: JSON.stringify({ text }) },
  }] } };
}

function fixture(options = {}) {
  const clock = fakeClock();
  const calls = { read: 0, requests: [], deleted: [] };
  const config = options.config || { apiKey: 'sk-test-placeholder' };
  const file = {
    get({ uri, success, fail }) {
      if (options.noConfig && uri === CONFIG_URI) return fail({}, 1);
      if (options.getFail && uri === URI) return fail({}, 1);
      success({ length: uri === CONFIG_URI ? JSON.stringify(config).length : (options.size || wav.length) });
    },
    readText({ success }) { success({ text: options.badConfig || JSON.stringify(config) }); },
    readArrayBuffer(request) {
      calls.read++;
      calls.readRequest = request;
      if (options.readFail) return request.fail({}, 1);
      if (!options.holdRead) request.success({ buffer: options.buffer || new Uint8Array(wav) });
    },
    delete({ uri }) { calls.deleted.push(uri); },
  };
  const fetch = { fetch(request) {
    calls.requests.push(request);
    if (options.throwFetch) throw new Error('private server detail');
    if (options.networkFail) return request.fail('private server detail', 1);
    if (!options.holdFetch) request.success(options.response || response());
  } };
  return { calls, clock, transcribe: createTranscriber({ file, fetch, ...clock }) };
}

async function main() {
  let f = fixture();
  assert.strictEqual(await f.transcribe(URI).promise, 'Study for two hours');
  const request = f.calls.requests[0];
  const body = JSON.parse(request.data);
  assert.strictEqual(request.url, 'https://api.xiaomimimo.com/v1/chat/completions');
  assert.strictEqual(request.header['api-key'], 'sk-test-placeholder');
  assert.strictEqual(request.header['Content-Type'], 'application/json');
  assert.strictEqual(request.method, 'POST');
  assert.strictEqual(body.model, 'mimo-v2.5');
  assert.deepStrictEqual(body.thinking, { type: 'disabled' });
  assert.deepStrictEqual(body.response_format, { type: 'json_object' });
  assert.strictEqual(body.stream, false);
  assert.ok(body.messages[0].content.includes('JSON'));
  const audio = body.messages[1].content.find((part) => part.type === 'input_audio');
  assert.strictEqual(audio.input_audio.data, `data:audio/wav;base64,${wav.toString('base64')}`);
  assert.ok(!request.data.includes(URI), 'a device file URI is not a cloud audio upload');
  assert.deepStrictEqual(f.calls.deleted, [URI]);
  assert.strictEqual(f.clock.size(), 0);

  f = fixture({ config: { apiKey: 'tp-test-placeholder' } });
  await f.transcribe(URI).promise;
  assert.strictEqual(f.calls.requests[0].url, 'https://token-plan-cn.xiaomimimo.com/v1/chat/completions');

  f = fixture({ buffer: wav.buffer.slice(wav.byteOffset, wav.byteOffset + wav.byteLength) });
  await f.transcribe(URI).promise;

  const cases = [
    [{ noConfig: true }, 'CONFIG'],
    [{ badConfig: '{oops' }, 'CONFIG'],
    [{ config: { apiKey: '' } }, 'CONFIG'],
    [{ config: { apiKey: 'sk-test\nunsafe' } }, 'CONFIG'],
    [{ config: { apiKey: 'sk-test', apiUrl: 'http://api.xiaomimimo.com/v1/chat/completions' } }, 'CONFIG'],
    [{ config: { apiKey: 'sk-test', apiUrl: 'https://untrusted.example/v1/chat/completions' } }, 'CONFIG'],
    [{ size: MAX_AUDIO_BYTES + 1 }, 'AUDIO_SIZE'],
    [{ buffer: new Uint8Array(364) }, 'AUDIO_FORMAT'],
    [{ buffer: new Uint8Array(4) }, 'AUDIO_SIZE'],
    [{ getFail: true }, 'FILE'],
    [{ readFail: true }, 'FILE'],
    [{ networkFail: true }, 'NETWORK'],
    [{ throwFetch: true }, 'NETWORK'],
    [{ response: { code: 401, data: 'private server detail' } }, 'AUTH'],
    [{ response: { code: 403 } }, 'AUTH'],
    [{ response: { code: 429 } }, 'RATE_LIMIT'],
    [{ response: { code: 500 } }, 'SERVER'],
    [{ response: { code: 400 } }, 'REQUEST'],
    [{ response: { code: 200, data: 'invalid json' } }, 'RESPONSE'],
    [{ response: response('') }, 'EMPTY'],
    [{ response: response('x'.repeat(501)) }, 'RESPONSE'],
    [{ response: { code: 200, data: { choices: [{ finish_reason: 'length', message: { content: '{"text":"partial"}' } }] } } }, 'RESPONSE'],
    [{ response: { code: 200, data: { choices: [{ finish_reason: 'stop', message: { content: '', reasoning_content: 'never show this' } }] } } }, 'RESPONSE'],
    [{ response: { code: 200, data: { choices: [{ finish_reason: 'stop', message: { content: '{"text":123}' } }] } } }, 'RESPONSE'],
  ];
  for (const [options, code] of cases) {
    f = fixture(options);
    await assert.rejects(f.transcribe(URI).promise, (error) => error.code === code && !error.message.includes('private'));
    assert.deepStrictEqual(f.calls.deleted, [URI], `${code}: discard temporary audio`);
    assert.strictEqual(f.clock.size(), 0);
    if (code === 'CONFIG' || options.size) assert.strictEqual(f.calls.read, 0);
  }

  f = fixture();
  await assert.rejects(f.transcribe('internal://files/private.json').promise, { code: 'FILE' });
  assert.deepStrictEqual(f.calls.deleted, [], 'never delete a non-recording file');

  for (const cancel of [false, true]) {
    f = fixture({ holdFetch: true });
    const job = f.transcribe(URI);
    const rejected = assert.rejects(job.promise, { code: cancel ? 'CANCELLED' : 'TIMEOUT' });
    if (cancel) job.cancel(); else f.clock.expire();
    await rejected;
    f.calls.requests[0].success(response('late response'));
    f.calls.requests[0].fail('late error', 1);
    assert.deepStrictEqual(f.calls.deleted, [URI]);
    assert.strictEqual(f.clock.size(), 0);
  }

  f = fixture({ holdRead: true });
  const job = f.transcribe(URI);
  const rejected = assert.rejects(job.promise, { code: 'CANCELLED' });
  job.cancel();
  await rejected;
  f.calls.readRequest.success({ buffer: new Uint8Array(wav) });
  assert.strictEqual(f.calls.requests.length, 0, 'cancelled file read must never upload');

  let recordOptions;
  let stops = 0;
  const adapter = loadWatchModule('src/pages/index/voice.js', {
    '@system.record': { start(options) { recordOptions = options; }, stop() { stops++; } },
    '@system.file': {}, '@system.fetch': {},
  });
  const onSuccess = () => {};
  adapter.startRecording(onSuccess, () => {});
  assert.strictEqual(recordOptions.success, onSuccess);
  assert.strictEqual(recordOptions.duration, 8000);
  assert.strictEqual(recordOptions.sampleRate, 16000);
  assert.strictEqual(recordOptions.numberOfChannels, 1);
  assert.strictEqual(recordOptions.format, 'wav');
  assert.strictEqual(recordOptions.frameSize, undefined);
  adapter.stopRecording();
  assert.strictEqual(stops, 1);
  console.log('watch transcription tests passed');
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
