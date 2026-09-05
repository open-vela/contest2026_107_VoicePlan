const assert = require('assert');
const planner = require('../../quickapp/hello_quickapp/src/pages/index/planner.js');

const highStressPlan = planner.createPlan({
  category: 'mixed',
  text: '今天下午要写比赛代码，晚上想运动，但压力有点高，只有3小时',
  vitals: { heartRate: 96, spo2: 97, stress: 42 },
  now: new Date('2026-09-02T14:00:00+08:00'),
});

assert.strictEqual(highStressPlan.category, 'mixed');
assert.ok(highStressPlan.tasks.length >= 3);
assert.ok(highStressPlan.summary.includes('压力'));
assert.ok(highStressPlan.tasks.some((task) => task.type === 'rest'));

const fitnessPlan = planner.createPlan({
  category: 'fitness',
  text: '今天想跑步30分钟',
  vitals: { heartRate: 125, spo2: 96, stress: 20 },
  now: new Date('2026-09-02T18:00:00+08:00'),
});

assert.ok(fitnessPlan.tasks.some((task) => task.name.includes('快走') || task.name.includes('拉伸')));
assert.notStrictEqual(fitnessPlan.riskLevel, 'normal');

const lowSpo2Plan = planner.createPlan({
  category: 'fitness',
  text: '今晚训练一小时',
  vitals: { heartRate: 78, spo2: 92, stress: 18 },
  now: new Date('2026-09-02T19:00:00+08:00'),
});

assert.ok(lowSpo2Plan.nextAdvice.includes('低强度'));

const completedPlan = planner.completeNextTask(highStressPlan);
assert.notStrictEqual(completedPlan, highStressPlan);
assert.strictEqual(completedPlan.tasks[0].completed, true);
assert.strictEqual(highStressPlan.tasks[0].completed, undefined);
assert.strictEqual(completedPlan.tasks[1].completed, undefined);

assert.strictEqual(
  planner.parsePlanResponse('```json\n{"title":"AI计划","tasks":[{"time":"09:00","name":"专注工作","duration":30}]}\n```').tasks.length,
  1,
);

console.log('planner tests passed');
