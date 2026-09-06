const assert = require('assert');
const { createMimoPlan, parsePlanResponse } = require('../mimo-client');

const payload = {
  text: '下午写比赛代码，晚上轻运动，只有3小时',
  period: 'today',
  important: true,
  reminderTime: '18:00',
  weather: 'rain',
  vitals: { heartRate: 96, spo2: 97, stress: 42 },
};

(async () => {
  const aiPlan = await createMimoPlan(payload, {
    apiKey: 'test-key',
    apiUrl: 'https://example.test/v1/chat/completions',
    model: 'test-model',
    request: async () => ({
      choices: [
        {
          message: {
            content: JSON.stringify({
              title: '今日混合计划',
              summary: '压力偏高，先放松再完成重点任务。',
              riskLevel: 'caution',
              tasks: [
                { time: '14:00', type: 'rest', name: '呼吸放松', duration: 5, tip: '先降低压力' },
                { time: '14:10', type: 'study', name: '完成核心代码', duration: 45, tip: '只做最重要一项' },
              ],
              reviewQuestion: '今天完成得怎么样？',
              nextAdvice: '明天减少一项低优先级任务。',
            }),
          },
        },
      ],
    }),
  });

  assert.strictEqual(aiPlan.source, 'mimo');
  assert.ok(!Object.prototype.hasOwnProperty.call(aiPlan, 'category'));
  assert.strictEqual(aiPlan.tasks.length, 2);
  assert.strictEqual(aiPlan.tasks[0].duration, 5);

  assert.deepStrictEqual(
    parsePlanResponse('```json\n{"title":"今日计划","tasks":[]}\n```'),
    { title: '今日计划', tasks: [] },
  );

  assert.throws(
    () => parsePlanResponse('{"title":"缺少任务"}'),
    /tasks/,
  );

  console.log('mimo client tests passed');
})().catch((error) => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
