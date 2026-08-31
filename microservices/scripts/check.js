const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.join(__dirname, '..');
let failed = false;

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.git'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && full.endsWith('.js')) {
      try {
        execFileSync(process.execPath, ['--check', full], { stdio: 'pipe' });
      } catch (error) {
        failed = true;
        console.error(`Syntax error: ${full}`);
        console.error(error.stderr?.toString() || error.message);
      }
    }
  }
}

function resolveLocal(fromFile, specifier) {
  const base = path.resolve(path.dirname(fromFile), specifier);
  const candidates = [base, `${base}.js`, `${base}.json`, path.join(base, 'index.js')];
  return candidates.find(fs.existsSync);
}

function checkLocalImports(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.git'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) checkLocalImports(full);
    else if (entry.isFile() && full.endsWith('.js')) {
      const source = fs.readFileSync(full, 'utf8');
      const regex = /require\(\s*['"](\.{1,2}\/[^'"]+)['"]\s*\)/g;
      let match;
      while ((match = regex.exec(source))) {
        const specifier = match[1];
        if (!resolveLocal(full, specifier)) {
          failed = true;
          console.error(`Missing local require: ${full} -> ${specifier}`);
        }
      }
    }
  }
}

function checkForbiddenSharedImports() {
  const servicesDir = path.join(root, 'services');
  if (fs.existsSync(path.join(root, 'shared'))) {
    failed = true;
    console.error('Forbidden shared/ implementation directory exists.');
  }
  for (const service of fs.readdirSync(servicesDir, { withFileTypes: true })) {
    if (!service.isDirectory()) continue;
    const serviceDir = path.join(servicesDir, service.name);
    for (const file of allJs(serviceDir)) {
      const source = fs.readFileSync(file, 'utf8');
      if (/shared[\\/]/.test(source)) {
        failed = true;
        console.error(`Forbidden shared import: ${file}`);
      }
    }
  }
}

function allJs(dir) {
  const result = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && !['node_modules', '.git'].includes(entry.name)) result.push(...allJs(full));
    else if (entry.isFile() && full.endsWith('.js')) result.push(full);
  }
  return result;
}

walk(root);
checkLocalImports(root);
checkForbiddenSharedImports();

if (failed) process.exit(1);
console.log('Static validation passed: syntax, local imports, and shared-boundary checks are clean.');
