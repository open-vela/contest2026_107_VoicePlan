let period = 'today';
let weather = 'clear';
let currentPlan = null;
const goal = document.querySelector('#goal');
const tasks = document.querySelector('#tasks');
const title = document.querySelector('#title');
const summary = document.querySelector('#summary');
const context = document.querySelector('#context');
const reminder = document.querySelector('#reminder');
const hr = document.querySelector('#hr');
const spo2 = document.querySelector('#spo2');
const stress = document.querySelector('#stress');

function vitals() {
  return {
    heartRate: Number(hr.textContent),
    spo2: Number(spo2.textContent),
    stress: Number(stress.textContent),
  };
}

async function generate() {
  const response = await fetch('/api/plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: goal.value,
      period,
      important: document.querySelector('#important').checked,
      reminderTime: document.querySelector('#reminderTime').value,
      weather,
      mood: document.querySelector('#moodLow').checked ? 'low' : 'normal',
      vitals: vitals(),
    }),
  });
  const plan = await response.json();
  currentPlan = plan;
  generateView(plan);
}

document.querySelectorAll('[data-period]').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('[data-period]').forEach((item) => item.classList.remove('active'));
    button.classList.add('active');
    period = button.dataset.period;
    generate();
  });
});

document.querySelectorAll('[data-weather]').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('[data-weather]').forEach((item) => item.classList.remove('active'));
    button.classList.add('active');
    weather = button.dataset.weather;
    generate();
  });
});

document.querySelector('#generate').addEventListener('click', generate);

document.querySelector('#finish').addEventListener('click', () => {
  if (!currentPlan) return;
  const task = currentPlan.tasks.find((item) => item.status !== 'done');
  if (!task) return;
  task.status = 'done';
  generateView(currentPlan);
});

function generateView(plan) {
  title.textContent = plan.title;
  summary.textContent = plan.summary;
  context.textContent = plan.context || '';
  reminder.textContent = plan.important ? `应用内提醒：${plan.reminderTime}` : '未设置重要事项提醒';
  tasks.innerHTML = plan.tasks.map((task) => `
    <article class="task ${task.status === 'done' ? 'done' : ''}">
      <time>${task.time}</time>
      <div><strong>${task.name}</strong><span>${task.duration} 分钟 · ${task.tip}</span><small>${task.adjustmentReason || ''}</small></div>
    </article>`).join('');
}

[
  ['#hrRange', hr],
  ['#spo2Range', spo2],
  ['#stressRange', stress],
].forEach(([selector, target]) => {
  document.querySelector(selector).addEventListener('input', (event) => {
    target.textContent = event.target.value;
    generate();
  });
});

generate();
