import record from '@system.record';

export function startRecording(onSuccess, onFail) {
  record.start({
    duration: 8000,
    sampleRate: 16000,
    numberOfChannels: 1,
    format: 'wav',
    success: onSuccess,
    fail: onFail,
  });
}

export function stopRecording() {
  record.stop();
}
