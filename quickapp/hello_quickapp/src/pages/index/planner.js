const CATEGORY_LABELS = {
  daily: '日常',
  study: '学习',
  fitness: '健身',
  mixed: '混合',
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

function normalizeVitals(vitals) {
  const v = vitals || {};
  return {
    heartRate: Number(v.heartRate || 76),
    spo2: Number(v.spo2 || 97),
    stress: Number(v.stress || 20),
  };
}

function parseHours(text) {
  const raw = text || '';
  const hourMatch = raw.match(/(\d+(?:\.\d+)?)\s*(小时|个小时|h|H)/);
  if (hourMatch) {
    return Math.max(1, Math.round(Number(hourMatch[1]) * 60));
  }
  const minuteMatch = raw.match(/(\d+)\s*(分钟|分|min|m)/i);
  if (minuteMatch) {
    return Math.max(15, Number(minuteMatch[1]));
  }
  return 180;
}

function parsePlanResponse(content) {
  if (content && typeof content === 'object') {
    validatePlan(content);
    return content;
  }

  const text = String(content || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end < start) {
    throw new Error('AI response is not a JSON object');
  }

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

function healthStatus(vitals) {
  const v = normalizeVitals(vitals);
  const flags = [];
  let riskLevel = 'normal';

  if (v.stress >= 40) {
    flags.push('压力偏高');
    riskLevel = 'caution';
  }
  if (v.heartRate >= 110) {
    flags.push('心率偏高');
    riskLevel = 'caution';
  }
  if (v.spo2 < 95) {
    flags.push('血氧偏低');
    riskLevel = 'caution';
  }

  return {
    ...v,
    flags,
    riskLevel,
    label: flags.length ? flags.join('、') : '状态平稳',
  };
}

function task(time, type, name, duration, tip) {
  return { time, type, name, duration, tip };
}

function makeTaskBuilder(start) {
  let cursor = new Date(start.getTime());
  return function build(type, name, duration, tip, gap) {
    const item = task(timeText(cursor), type, name, duration, tip);
    cursor = addMinutes(cursor, duration + (gap == null ? 10 : gap));
    return item;
  };
}

function baseTasks(category, text, minutes, status, now) {
  const build = makeTaskBuilder(now);
  const compact = minutes <= 90;
  const tasks = [];

  if (status.stress >= 40) {
    tasks.push(build('rest', '呼吸放松', 5, '先降低压力再开始', 5));
  }

  if (category === 'study') {
    tasks.push(build('study', '整理重点', compact ? 20 : 30, '先列3个目标', 5));
    tasks.push(build('study', '专注学习', compact ? 35 : 50, '只做最重要一项', 10));
    tasks.push(build('review', '学习复盘', 8, '记录卡点和收获', 0));
    return tasks;
  }

  if (category === 'fitness') {
    if (status.heartRate >= 110 || status.spo2 < 95 || status.stress >= 40) {
      tasks.push(build('fitness', '动态拉伸', 8, '避免直接高强度', 4));
      tasks.push(build('fitness', '低强快走', compact ? 15 : 25, '保持能说话的强度', 6));
    } else {
      tasks.push(build('fitness', '热身激活', 8, '肩髋踝活动', 4));
      tasks.push(build('fitness', '主训练', compact ? 20 : 35, '按计划完成动作', 8));
    }
    tasks.push(build('review', '训练记录', 5, '反馈太累/刚好/轻松', 0));
    return tasks;
  }

  if (category === 'daily') {
    tasks.push(build('daily', '整理待办', 10, '保留3件要事', 5));
    tasks.push(build('daily', '处理要事', compact ? 30 : 45, '先完成最难一项', 10));
    tasks.push(build('rest', '短休息', 8, '离开屏幕活动一下', 5));
    tasks.push(build('review', '今日复盘', 5, '标记完成情况', 0));
    return tasks;
  }

  tasks.push(build('study', text.includes('比赛') ? '比赛开发' : '重点任务', compact ? 35 : 50, '先做可提交部分', 8));
  tasks.push(build('rest', '短休息', 8, '喝水活动一下', 5));
  tasks.push(build('study', '补齐文档', compact ? 20 : 35, '同步记录思路', 8));

  if (status.heartRate >= 110 || status.spo2 < 95 || status.stress >= 40) {
    tasks.push(build('fitness', '轻量活动', 15, '快走或拉伸即可', 5));
  } else {
    tasks.push(build('fitness', '轻运动', 25, '跑步/跳绳二选一', 5));
  }

  tasks.push(build('review', '睡前复盘', 5, '生成明日建议', 0));
  return tasks;
}

function createPlan(options) {
  const opts = options || {};
  const category = CATEGORY_LABELS[opts.category] ? opts.category : 'mixed';
  const text = opts.text || '';
  const status = healthStatus(opts.vitals);
  const minutes = parseHours(text);
  const now = opts.now ? new Date(opts.now) : new Date();
  const tasks = baseTasks(category, text, minutes, status, now);
  const categoryLabel = CATEGORY_LABELS[category];
  const caution = status.riskLevel !== 'normal';

  return {
    title: `今日${categoryLabel}计划`,
    category,
    summary: caution
      ? `检测到${status.label}，计划已降低密度并加入恢复安排。`
      : `当前${status.label}，按${categoryLabel}场景安排今日任务。`,
    riskLevel: status.riskLevel,
    vitals: {
      heartRate: status.heartRate,
      spo2: status.spo2,
      stress: status.stress,
    },
    tasks,
    reviewQuestion: '今天哪些任务完成了？强度是太累、刚好还是太轻松？',
    nextAdvice: status.spo2 < 95
      ? '明日建议保持低强度，优先休息和轻量活动。'
      : caution
        ? '明日根据完成率减少一项低优先级任务。'
        : '明日可保持当前节奏，并逐步增加一项重点任务。',
  };
}

function completeNextTask(plan) {
  const source = plan || {};
  const tasks = Array.isArray(source.tasks) ? source.tasks : [];
  const index = tasks.findIndex((item) => !item.completed);
  if (index < 0) {
    return source;
  }

  return Object.assign({}, source, {
    tasks: tasks.map((item, itemIndex) => itemIndex === index
      ? Object.assign({}, item, { completed: true })
      : item),
  });
}

module.exports = {
  CATEGORY_LABELS,
  completeNextTask,
  createPlan,
  healthStatus,
  parsePlanResponse,
  parseHours,
};
