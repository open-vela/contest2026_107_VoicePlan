const assert = require('assert');
const planStore = require('../../quickapp/hello_quickapp/src/pages/index/plan-store.js');

function fakeStorage() {
  const values = {};
  return {
    values,
    set(options) {
      values[options.key] = options.value;
      options.success();
    },
    get(options) {
      if (Object.prototype.hasOwnProperty.call(values, options.key)) {
        options.success(values[options.key]);
      } else {
        options.fail('missing', 404);
      }
    },
  };
}

async function run() {
  const storage = fakeStorage();
  const plan = { id: 'plan-1', period: 'week', tasks: [{ status: 'pending' }] };

  await planStore.savePlan(storage, plan);
  assert.strictEqual(typeof storage.values[planStore.STORAGE_KEY], 'string');
  assert.deepStrictEqual(await planStore.loadPlan(storage), plan);

  storage.values[planStore.STORAGE_KEY] = '{invalid';
  assert.strictEqual(await planStore.loadPlan(storage), null);

  await planStore.clearPlan(storage);
  assert.strictEqual(await planStore.loadPlan(storage), null);
  console.log('plan store tests passed');
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
