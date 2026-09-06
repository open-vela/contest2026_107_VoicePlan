const http = require('http');
const https = require('https');

const SYSTEM_PROMPT = [
  '你是腕上计划生成引擎。只输出 JSON，不输出 Markdown。',
  '根据用户目标、计划周期、重要事项、天气、心情和健康状态生成短小可执行的计划。',
  '压力偏高时减少任务密度并加入休息；心率偏高时降低运动强度；血氧偏低时暂停高强度运动。',
  '不做医疗诊断，不给疾病治疗建议。',
].join('');

function parsePlanResponse(content) {
  if (content && typeof content === 'object') {
    validatePlan(content);
    return content;
  }

  const text = String(content || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end < start) {
    throw new Error('MiMo response is not a JSON object');
  }

  const parsed = JSON.parse(text.slice(start, end + 1));
  validatePlan(parsed);
  return parsed;
}

function validatePlan(plan) {
  if (!plan || typeof plan !== 'object') {
    throw new Error('MiMo plan must be an object');
  }
  if (!Array.isArray(plan.tasks)) {
    throw new Error('MiMo plan tasks must be an array');
  }
  plan.tasks.forEach((task, index) => {
    if (!task || !task.time || !task.name) {
      throw new Error(`MiMo task ${index + 1} is missing time or name`);
    }
    if (!Number.isFinite(Number(task.duration)) || Number(task.duration) <= 0) {
      throw new Error(`MiMo task ${index + 1} has invalid duration`);
    }
  });
}

function requestJson(apiUrl, options) {
  return new Promise((resolve, reject) => {
    const target = new URL(apiUrl);
    const transport = target.protocol === 'http:' ? http : https;
    const req = transport.request(target, {
      method: options.method || 'GET',
      headers: options.headers || {},
    }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          reject(new Error(`MiMo request failed with status ${res.statusCode}`));
          return;
        }
        try {
          resolve(JSON.parse(body));
        } catch (error) {
          reject(new Error('MiMo response is not valid JSON'));
        }
      });
    });

    req.setTimeout(options.timeoutMs || 12000, () => {
      req.destroy(new Error('MiMo request timed out'));
    });
    req.on('error', reject);
    req.write(options.body || '');
    req.end();
  });
}

async function createMimoPlan(payload, config) {
  const settings = config || {};
  if (!settings.apiKey || !settings.apiUrl || !settings.model) {
    throw new Error('MiMo configuration is incomplete');
  }

  const request = settings.request || requestJson;
  const response = await request(settings.apiUrl, {
    method: 'POST',
    timeoutMs: settings.timeoutMs,
    headers: {
      Authorization: `Bearer ${settings.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: settings.model,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: JSON.stringify(payload || {}) },
      ],
    }),
  });

  const message = response && response.choices && response.choices[0] && response.choices[0].message;
  const plan = parsePlanResponse(message && message.content);
  return {
    ...plan,
    period: payload && payload.period,
    important: Boolean(payload && payload.important),
    reminderTime: payload && payload.reminderTime,
    weather: payload && payload.weather,
    mood: payload && payload.mood,
    vitals: payload && payload.vitals,
    source: 'mimo',
  };
}

module.exports = {
  createMimoPlan,
  parsePlanResponse,
};
