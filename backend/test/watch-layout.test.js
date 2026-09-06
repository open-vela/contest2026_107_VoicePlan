const assert = require('assert');
const fs = require('fs');
const path = require('path');

const uxPath = path.join(
  __dirname,
  '../../quickapp/hello_quickapp/src/pages/index/index.ux',
);
const source = fs.readFileSync(uxPath, 'utf8');
const manifestRoot = path.resolve(__dirname, '../../quickapp/hello_quickapp');
const manifest = JSON.parse(fs.readFileSync(path.join(manifestRoot, 'manifest.json'), 'utf8'));
const sourceManifest = JSON.parse(fs.readFileSync(path.join(manifestRoot, 'src/manifest.json'), 'utf8'));
assert.deepStrictEqual(sourceManifest, manifest, 'both build manifests must agree');
assert.strictEqual(manifest.config.designWidth, 390, 'design width must match the 390px page');
assert.ok(manifest.features.some((feature) => feature.name === 'system.file'));
assert.match(source, /<scroll\s+class="page"\s+scroll-y="true">/);
assert.ok(!source.includes('选择类别'), 'the unified plan must not require a category');
assert.ok(!source.includes('setDaily') && !source.includes('setStudy')
  && !source.includes('setFitness') && !source.includes('setMixed'),
  'category actions must be removed from the watch page');
assert.match(source, /setPeriodToday/);
assert.match(source, /setPeriodWeek/);
assert.match(source, /setPeriodMonth/);
assert.match(source, /setPeriodQuarter/);
assert.match(source, /重要事项/);
assert.match(source, /reminderTime/);
assert.match(source, /天气/);
assert.match(source, /setWeatherRain/);
assert.match(source, /心情/);
assert.match(source, /plan\.context/);
assert.match(source, /adjustmentReason/);
assert.match(source, /plan-store\.js/);

function rule(name) {
  const match = source.match(new RegExp(`\\.${name}\\s*\\{([\\s\\S]*?)\\}`));
  assert.ok(match, `missing .${name} rule`);
  return match[1];
}

function px(ruleText, property) {
  const match = ruleText.match(new RegExp(`${property}\\s*:\\s*(\\d+)px`));
  assert.ok(match, `missing ${property}`);
  return Number(match[1]);
}

function horizontalValue(ruleText, property) {
  const match = ruleText.match(new RegExp(`${property}\\s*:\\s*([^;]+)`));
  assert.ok(match, `missing ${property}`);
  const values = match[1].trim().split(/\s+/).map((value) => Number(value.replace('px', '')));
  return values.length === 1 ? values[0] : values[1];
}

const page = rule('page');
assert.strictEqual(px(page, 'width'), 390);
assert.strictEqual(px(page, 'height'), 450);
assert.match(page, /flex-direction\s*:\s*column/);

const vitals = rule('vitals');
const metric = rule('metric');
const metricWidth = px(metric, 'width');
const metricPaddingX = horizontalValue(metric, 'padding');
const vitalsPaddingX = horizontalValue(vitals, 'padding');
assert.ok(
  3 * (metricWidth + 2 * metricPaddingX) <= 390 - 2 * vitalsPaddingX,
  'health metrics overflow the 390px watch viewport',
);

const section = rule('section');
const sectionMarginX = horizontalValue(section, 'margin');
const sectionPadding = px(section, 'padding');
const contentWidth = 390 - 2 * sectionMarginX - 2 * sectionPadding;

const input = rule('input');
const inputWidth = px(input, 'width');
const inputPadding = Number((input.match(/padding:\s*0\s+(\d+)px/) || [])[1]);
assert.ok(Number.isFinite(inputPadding), 'missing input horizontal padding');
assert.ok(inputWidth + 2 * inputPadding <= contentWidth, 'goal input overflows its section');
assert.match(source, /<text class="goal-preview">{{ goalText }}<\/text>/,
  'show the complete editable goal, not only a clipped single-line input');
assert.ok(px(rule('goal-preview'), 'width') <= contentWidth);

const task = rule('task');
const taskPadding = px(task, 'padding');
const time = px(rule('time'), 'width');
const taskMain = px(rule('task-main'), 'width');
assert.ok(time + taskMain + 2 * taskPadding <= contentWidth, 'task row overflows its section');

console.log('watch layout tests passed');
