const fs = require('fs');
const path = require('path');
const { createRequire } = require('module');

const watchRoot = path.resolve(__dirname, '../../quickapp/hello_quickapp');
const watchRequire = createRequire(path.join(watchRoot, 'package.json'));

function loadWatchModule(relativePath, overrides = {}, timers = {}) {
  const filename = path.join(watchRoot, relativePath);
  let source = fs.readFileSync(filename, 'utf8');
  if (filename.endsWith('.ux')) source = source.match(/<script>([\s\S]*?)<\/script>/)[1];
  const { code } = watchRequire('@babel/core').transformSync(source, {
    filename: filename + '.js',
    babelrc: false,
    configFile: false,
    plugins: [watchRequire.resolve('@babel/plugin-transform-modules-commonjs')],
  });
  const result = { exports: {} };
  const localRequire = createRequire(filename);
  const resolve = (name) => Object.prototype.hasOwnProperty.call(overrides, name)
    ? overrides[name] : localRequire(name);
  new Function('require', 'module', 'exports', 'setTimeout', 'clearTimeout', code)(
    resolve, result, result.exports, timers.setTimeout || setTimeout,
    timers.clearTimeout || clearTimeout,
  );
  return result.exports;
}

function fakeClock() {
  let nextId = 0;
  const pending = new Map();
  return {
    setTimeout(fn) { const id = ++nextId; pending.set(id, fn); return id; },
    clearTimeout(id) { pending.delete(id); },
    expire() {
      const callbacks = Array.from(pending.values());
      pending.clear();
      callbacks.forEach((fn) => fn());
    },
    size() { return pending.size; },
  };
}

module.exports = { loadWatchModule, fakeClock };
