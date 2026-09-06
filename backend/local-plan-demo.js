const planner = require('../quickapp/hello_quickapp/src/pages/index/planner.js');

const input = process.argv.slice(2).join(' ') || '今天下午要写比赛代码，晚上想运动，但压力有点高，只有3小时';

const plan = planner.createPlan({
  text: input,
  period: 'today',
  important: true,
  reminderTime: '18:00',
  weather: 'rain',
  mood: 'low',
  vitals: {
    heartRate: 96,
    spo2: 97,
    stress: 42,
  },
  now: new Date('2026-09-02T14:00:00+08:00'),
});

console.log(JSON.stringify(plan, null, 2));
