const assert = require('assert');
const planner = require('../../quickapp/hello_quickapp/src/pages/index/planner.js');

const baseOptions = {
  text: '今天完成比赛代码两小时，晚上运动三十分钟',
  profile: { age: 20, restingHeartRate: 65 },
  vitals: { heartRates: [76, 78, 80], spo2: 98, stress: 20 },
  now: new Date('2026-09-02T14:00:00+08:00'),
};

const weekPlan = planner.createPlan(Object.assign({}, baseOptions, {
  period: 'week',
  important: true,
  reminderTime: '09:00',
  weather: 'rain',
}));

assert.strictEqual(weekPlan.category, undefined);
assert.strictEqual(weekPlan.period, 'week');
assert.strictEqual(weekPlan.tasks[0].dayOffset, 0);
assert.ok(weekPlan.tasks.some((task) => task.dayOffset === 6));
assert.strictEqual(weekPlan.tasks[0].priority, 'important');
assert.strictEqual(weekPlan.tasks[0].reminderTime, '09:00');
assert.ok(weekPlan.context.includes('下雨'));
assert.ok(weekPlan.tasks.some((task) => task.adjustmentReason.includes('下雨')));

const elevatedPlan = planner.createPlan(Object.assign({}, baseOptions, {
  period: 'today',
  vitals: { heartRates: [104, 106, 108], spo2: 98, stress: 20 },
}));

assert.strictEqual(elevatedPlan.vitals.heartRate, 106);
assert.ok(elevatedPlan.context.includes('个人基线'));
assert.ok(elevatedPlan.tasks.some((task) => task.adjustmentReason.includes('心率')));

const lowSpo2Plan = planner.createPlan(Object.assign({}, baseOptions, {
  period: 'today',
  text: '今晚进行高强度训练一小时',
  vitals: { heartRates: [78], spo2: 92, stress: 18 },
}));

assert.ok(lowSpo2Plan.nextAdvice.includes('低强度'));
assert.ok(lowSpo2Plan.tasks.some((task) => task.adjustmentReason.includes('血氧')));

const completedPlan = planner.completeNextTask(weekPlan);
assert.notStrictEqual(completedPlan, weekPlan);
assert.strictEqual(completedPlan.tasks[0].status, 'done');
assert.strictEqual(weekPlan.tasks[0].status, 'pending');
assert.strictEqual(completedPlan.tasks[1].status, 'pending');

assert.strictEqual(
  planner.parsePlanResponse('```json\n{"title":"AI计划","tasks":[{"time":"09:00","name":"专注工作","duration":30}]}\n```').tasks.length,
  1,
);

console.log('planner tests passed');
