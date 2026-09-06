import health from '@service.health';

export const DATA_TYPES = health.DATA_TYPES;

export function getRecent(dataTypes) {
  return health
    .getRecentSamples({ dataTypes })
    .then((list) =>
      (list || []).map((it) => ({
        ok: true,
        dataType: it.dataType,
        value: it.data && it.data.value,
        timeStamp: it.data && it.data.timeStamp,
      })),
    )
    .catch(() => []);
}
export function subscribe(dataType, onSample, onError) {
  health.subscribeSample({
    dataType,
    callback: (sample) => {
      onSample({ ok: true, dataType, value: sample.value, timeStamp: sample.timeStamp });
    },
    fail: (data, code) => {
      if (onError) {
        onError({ ok: false, code, unsupported: code === 203 });
      }
    },
  });
}

export function unsubscribe(dataType) {
  health.unsubscribeSample({ dataType });
}
