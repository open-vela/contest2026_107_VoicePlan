import record from '@system.record';
import file from '@system.file';
import fetch from '@system.fetch';
import transcription from './transcription.js';

export const transcribeRecording = transcription.createTranscriber({ file, fetch });

export function discardRecording(uri) {
  transcription.discardRecording(file, uri);
}

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
