let category = 'mixed';
const goal = document.querySelector('#goal');
const tasks = document.querySelector('#tasks');
const title = document.querySelector('#title');
const summary = document.querySelector('#summary');
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
      category,
      text: goal.value,
      vitals: vitals(),
    }),
  });
  const plan = await response.json();
  title.textContent = plan.title;
  summary.textContent = plan.summary;
  tasks.innerHTML = plan.tasks
    .map(
      (task) => `
        <article class="task">
          <time>${task.time}</time>
          <div>
            <strong>${task.name}</strong>
            <span>${task.duration} 分钟 · ${task.tip}</span>
          </div>
        </article>
      `,
    )
    .join('');
}

document.querySelectorAll('[data-category]').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('[data-category]').forEach((item) => item.classList.remove('active'));
    button.classList.add('active');
    category = button.dataset.category;
    generate();
  });
});

document.querySelector('#generate').addEventListener('click', generate);

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
