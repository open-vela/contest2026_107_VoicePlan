const STORAGE_KEY = 'velaplan.plan.v2';

function ensureStorage(storage) {
  if (!storage || typeof storage.set !== 'function' || typeof storage.get !== 'function') {
    throw new Error('storage API is unavailable');
  }
}

function savePlan(storage, plan) {
  ensureStorage(storage);
  return new Promise((resolve, reject) => {
    storage.set({
      key: STORAGE_KEY,
      value: JSON.stringify(plan || null),
      success: () => resolve(plan || null),
      fail: (data, code) => reject(new Error(`storage.set failed: ${code || data || 'unknown'}`)),
    });
  });
}

function loadPlan(storage) {
  ensureStorage(storage);
  return new Promise((resolve) => {
    storage.get({
      key: STORAGE_KEY,
      success: (data) => {
        try {
          resolve(typeof data === 'string' ? JSON.parse(data) : data || null);
        } catch (error) {
          resolve(null);
        }
      },
      fail: () => resolve(null),
    });
  });
}

function clearPlan(storage) {
  ensureStorage(storage);
  return savePlan(storage, null);
}

module.exports = { STORAGE_KEY, clearPlan, loadPlan, savePlan };
