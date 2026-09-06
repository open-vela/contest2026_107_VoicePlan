const PERIODS = {
  today: { label: '今日', days: 1 },
  week: { label: '本周', days: 7 },
  month: { label: '本月', days: 30 },
  quarter: { label: '本季度', days: 90 },
};

const WEATHER_SCENARIOS = {
  clear: { label: '晴朗', outdoor: true },
  rain: { label: '下雨', outdoor: false },
  hot: { label: '高温', outdoor: true },
  wind: { label: '大风', outdoor: false },
};

function pad2(n) {
  return n < 10 ? `0${n}` : `${n}`;
}

function timeText(date) {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function numberOr(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function average(values, fallback) {
  const numbers = (Array.isArray(values) ? values : [values])
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value));
  if (!numbers.length) return fallback;
  return Math.round(numbers.reduce((sum, value) => sum + value, 0) / numbers.length);
}

function normalizeProfile(profile) {
  const source = profile || {};
  return {
    age: Math.min(90, Math.max(13, numberOr(source.age, 20))),
    restingHeartRate: Math.min(100, Math.max(40, numberOr(source.restingHeartRate, 65))),
  };
}

function normalizeVitals(vitals, profile) {
  const user = normalizeProfile(profile);
  const source = vitals || {};
  const heartRate = average(
    Array.isArray(source.heartRates) ? source.heartRates : source.heartRate,
    user.restingHeartRate,
  );
  const maxHeartRate = Math.round(208 - 0.7 * user.age);
  const heartRateReserve = Math.max(1, maxHeartRate - user.restingHeartRate);
  const moderateLow = Math.round(user.restingHeartRate + heartRateReserve * 0.5);
  const moderateHigh = Math.round(user.restingHeartRate + heartRateReserve * 0.7);
  const elevatedThreshold = Math.max(100, user.restingHeartRate + 20);
  return {
    heartRate,
    spo2: numberOr(source.spo2, 97),
    stress: numberOr(source.stress, 20),
    maxHeartRate,
    heartRateReserve,
    moderateLow,
    moderateHigh,
    elevatedThreshold,
    heartRateElevated: heartRate >= elevatedThreshold,
  };
}

function healthStatus(vitals, profile) {
  const v = normalizeVitals(vitals, profile);
  const flags = [];
  if (v.stress >= 40) flags.push('压力偏高');
  if (v.heartRateElevated) flags.push('心率高于个人基线');
  if (v.spo2 < 95) flags.push('血氧偏低');
  return Object.assign({}, v, {
    flags,
    riskLevel: flags.length ? 'caution' : 'normal',
    label: flags.length ? flags.join('、') : '状态平稳',
  });
}

function weatherAdjustment(weather) {
  const scenario = WEATHER_SCENARIOS[weather] ? weather : 'clear';
  const item = WEATHER_SCENARIOS[scenario];
  const reasons = {
    clear: '天气晴朗，可以按原计划执行',
    rain: '正在下雨，户外活动改为室内活动或延期',
    hot: '天气高温，户外活动缩短并增加补水安排',
    wind: '风力较大，户外活动改为室内活动或延期',
  };
  return {
    scenario,
    label: item.label,
    outdoor: item.outdoor,
    adverse: scenario !== 'clear',
    reason: reasons[scenario],
  };
}

function parseHours(text) {
  const raw = text || '';
  const hourMatch = raw.match(/(\d+(?:\.\d+)?)\s*(小时|个小时|h|H)/);
  if (hourMatch) return Math.max(1, Math.round(Number(hourMatch[1]) * 60));
  const minuteMatch = raw.match(/(\d+)\s*(分钟|分|min|m)/i);
  if (minuteMatch) return Math.max(15, Number(minuteMatch[1]));
  return 180;
}

function parsePlanResponse(content) {
  if (content && typeof content === 'object') {
    validatePlan(content);
    return content;
  }
  const text = String(content || '').trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '');
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end < start) throw new Error('AI response is not a JSON object');
  const parsed = JSON.parse(text.slice(start, end + 1));
  validatePlan(parsed);
  return parsed;
}

function validatePlan(plan) {
  if (!plan || typeof plan !== 'object' || !Array.isArray(plan.tasks)) {
    throw new Error('AI plan must contain a tasks array');
  }
  plan.tasks.forEach((item, index) => {
    if (!item || !item.time || !item.name) {
      throw new Error(`AI task ${index + 1} is missing time or name`);
    }
    if (!Number.isFinite(Number(item.duration)) || Number(item.duration) <= 0) {
      throw new Error(`AI task ${index + 1} has invalid duration`);
    }
  });
}

function task(id, dayOffset, time, type, name, duration, tip) {
  return {
    id,
    dayOffset,
    time,
    type,
    name,
    duration,
    tip,
    priority: 'normal',
    reminderTime: '',
    status: 'pending',
    adjustmentReason: '',
  };
}

function buildTasks(period, text, minutes, now) {
  const goalName = text.includes('比赛') ? '推进比赛目标' : '推进今日目标';
  if (period === 'today') {
    const start = timeText(now);
    return [
      task('goal-0', 0, start, 'goal', goalName, Math.min(50, Math.max(25, Math.round(minutes * 0.35))), '先完成最重要的一步'),
      task('rest-0', 0, timeText(addMinutes(now, 60)), 'rest', '短休息', 8, '喝水并离开屏幕'),
      task('fitness-0', 0, timeText(addMinutes(now, 75)), 'fitness', '轻运动', Math.min(30, Math.max(15, Math.round(minutes * 0.15))), '散步、拉伸二选一'),
      task('review-0', 0, timeText(addMinutes(now, 115)), 'review', '今日复盘', 5, '记录完成感受'),
    ];
  }

  if (period === 'week') {
    return [
      task('goal-0', 0, '09:00', 'goal', '启动本周目标', 35, '先完成可提交部分'),
      task('rest-1', 1, '12:30', 'rest', '恢复与整理', 10, '保持稳定节奏'),
      task('fitness-2', 2, '18:30', 'fitness', '本周运动', 25, '选择适合当天状态的强度'),
      task('goal-3', 3, '09:00', 'goal', '推进本周目标', 35, '处理下一项重点'),
      task('fitness-4', 4, '18:30', 'fitness', '轻量活动', 20, '保持规律活动'),
      task('goal-5', 5, '09:00', 'goal', '整理阶段成果', 30, '补齐记录和材料'),
      task('review-6', 6, '20:00', 'review', '本周复盘', 10, '查看完成率和下周重点'),
    ];
  }

  const offsets = period === 'month' ? [0, 7, 14, 21, 29] : [0, 30, 60, 89];
  return offsets.map((dayOffset, index) => task(
    `${period}-${index}`,
    dayOffset,
    '09:00',
    index === offsets.length - 1 ? 'review' : 'milestone',
    index === offsets.length - 1 ? `${PERIODS[period].label}复盘` : `${PERIODS[period].label}关键节点 ${index + 1}`,
    index === offsets.length - 1 ? 10 : 30,
    index === offsets.length - 1 ? '根据完成情况调整下一阶段' : '拆成可执行的小目标',
  ));
}

function applyContext(tasks, health, weather) {
  const reasons = [];
  let result = tasks.map((item) => Object.assign({}, item));

  if (health.stress >= 40) {
    result.unshift(task('rest-context', 0, '08:50', 'rest', '呼吸放松', 5, '先缓解压力再开始', ''));
    result[0].adjustmentReason = '压力偏高，已加入恢复安排';
    reasons.push('压力偏高，已加入呼吸放松');
  }

  result = result.map((item) => {
    if (item.type !== 'fitness') return item;
    const next = Object.assign({}, item);
    const changes = [];
    if (health.spo2 < 95) {
      next.name = '恢复性拉伸';
      next.duration = Math.min(next.duration, 10);
      next.tip = '先休息，避免高强度活动';
      changes.push('血氧指标偏低');
    } else if (health.heartRateElevated) {
      next.name = '低强度散步';
      next.duration = Math.min(next.duration, 15);
      next.tip = '保持可以正常说话的强度';
      changes.push('心率高于个人基线');
    }
    if (weather.scenario === 'rain' || weather.scenario === 'wind') {
      next.name = '室内活动';
      next.duration = Math.min(next.duration, 15);
      next.tip = '室内拉伸或简单活动';
      changes.push(weather.label);
    } else if (weather.scenario === 'hot') {
      next.duration = Math.max(10, Math.round(next.duration * 0.7));
      next.tip = '注意补水，避开高温时段';
      changes.push('高温');
    }
    next.adjustmentReason = changes.join('，');
    if (next.adjustmentReason) reasons.push(`${next.adjustmentReason}，已调整运动安排`);
    return next;
  });

  return { tasks: result, reasons };
}

function createPlan(options) {
  const opts = options || {};
  const period = PERIODS[opts.period] ? opts.period : 'today';
  const text = String(opts.text || '').trim() || '完成今天最重要的一件事';
  const profile = normalizeProfile(opts.profile);
  const health = healthStatus(opts.vitals, profile);
  const weather = weatherAdjustment(opts.weather);
  const rawTasks = buildTasks(period, text, parseHours(text), opts.now ? new Date(opts.now) : new Date());
  const contextResult = applyContext(rawTasks, health, weather);
  const tasks = contextResult.tasks;
  const importantIndex = tasks.findIndex((item) => item.type === 'goal' || item.type === 'milestone');
  if (opts.important && importantIndex >= 0) {
    tasks[importantIndex].priority = 'important';
    tasks[importantIndex].reminderTime = String(opts.reminderTime || '09:00');
  }
  const contextReasons = [];
  if (health.flags.length) contextReasons.push(`${health.label}，心率参考个人基线`);
  if (opts.mood === 'low') contextReasons.push('你标记了心情低落，可加入休息、散步或呼吸练习');
  contextReasons.push(weather.reason);
  contextReasons.push(...contextResult.reasons);
  const context = contextReasons.join('；');
  const caution = health.riskLevel !== 'normal' || weather.adverse || opts.mood === 'low';
  return {
    id: `plan-${Date.now()}`,
    period,
    title: `${PERIODS[period].label}计划`,
    goal: text,
    summary: caution ? `已结合当前状态调整${PERIODS[period].label}安排` : `按当前状态生成${PERIODS[period].label}安排`,
    context,
    riskLevel: health.riskLevel,
    important: Boolean(opts.important),
    reminderTime: String(opts.reminderTime || ''),
    weather: weather.scenario,
    mood: opts.mood === 'low' ? 'low' : 'normal',
    profile,
    vitals: {
      heartRate: health.heartRate,
      spo2: health.spo2,
      stress: health.stress,
    },
    tasks,
    reviewQuestion: '哪些任务完成了？强度是太累、刚好还是太轻松？',
    nextAdvice: health.spo2 < 95 || health.heartRateElevated
      ? '明日建议保持低强度，优先休息和轻量活动。'
      : caution
        ? '明日根据完成率减少一项低优先级任务。'
        : '明日可保持当前节奏，并逐步增加一项重点任务。',
  };
}

function completeNextTask(plan) {
  const source = plan || {};
  const tasks = Array.isArray(source.tasks) ? source.tasks : [];
  const index = tasks.findIndex((item) => item.status !== 'done' && !item.completed);
  if (index < 0) return source;
  return Object.assign({}, source, {
    tasks: tasks.map((item, itemIndex) => itemIndex === index
      ? Object.assign({}, item, { status: 'done', completed: true })
      : item),
  });
}

module.exports = {
  PERIODS,
  WEATHER_SCENARIOS,
  completeNextTask,
  createPlan,
  healthStatus,
  parsePlanResponse,
  parseHours,
  weatherAdjustment,
};
