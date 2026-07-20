import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(scriptDir, '..');
const target = path.join(appDir, 'index.html');
const html = await readFile(target, 'utf8');
const file = await stat(target);
const errors = [];

const assert = (condition, message) => {
  if (!condition) errors.push(message);
};

assert(file.size <= 350 * 1024, `파일 크기 초과: ${file.size} bytes`);
assert(/^<!doctype html>/i.test(html), 'doctype 누락');
assert(/<html\s+lang="ko"/i.test(html), '한국어 lang 누락');
assert(/<main\b/i.test(html), 'main landmark 누락');
assert(/<style>[\s\S]+<\/style>/i.test(html), '인라인 CSS 누락');
assert(/<script>[\s\S]+<\/script>/i.test(html), '인라인 JavaScript 누락');
assert(!/<script\b[^>]*\bsrc\s*=/i.test(html), '외부 script src 발견');
assert(!/<link\b[^>]*rel=["']stylesheet["']/i.test(html), '외부 stylesheet 발견');
assert(!/<(?:img|audio|video|source)\b[^>]*\bsrc\s*=\s*["'](?!data:)/i.test(html), '비인라인 미디어 발견');
assert(!/<image\b/i.test(html), 'SVG raster image 요소 발견');
assert(!/@import\b/i.test(html), 'CSS @import 발견');
assert(!/sourceMappingURL/i.test(html), 'source map 주석 발견');
assert(!/\b(?:fetch|XMLHttpRequest|WebSocket|EventSource)\s*\(/.test(html), '네트워크 API 호출 발견');
assert(!/\b(?:src|srcset)\s*=\s*["'](?:https?:)?\/\//i.test(html), '원격 리소스 URL 발견');
assert(!/url\(\s*["']?(?:https?:)?\/\//i.test(html), '원격 CSS URL 발견');

const requiredIds = [
  'app-root', 'trumpet-scene', 'scene-trumpet', 'scene-bell',
  'scene-valve-1', 'scene-valve-2', 'scene-valve-3',
  'scene-left-hand', 'scene-right-hand', 'scene-finger-index',
  'scene-finger-middle', 'scene-finger-ring', 'degree-keypad',
  'settings-dialog', 'help-dialog', 'live-status'
];

for (const id of requiredIds) {
  assert(html.includes(`id="${id}"`), `필수 ID 누락: ${id}`);
}

const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
const counts = new Map();
for (const id of ids) counts.set(id, (counts.get(id) ?? 0) + 1);
const duplicates = [...counts].filter(([, count]) => count > 1);
assert(duplicates.length === 0, `중복 ID: ${duplicates.map(([id]) => id).join(', ')}`);

const idSet = new Set(ids);
const references = [
  ...html.matchAll(/url\(\s*#([^\s)'";]+)\s*\)/g),
  ...html.matchAll(/\b(?:href|xlink:href)="#([^"]+)"/g)
].map(match => match[1]);
const brokenReferences = [...new Set(references.filter(id => !idSet.has(id)))];
assert(brokenReferences.length === 0, `깨진 SVG/fragment 참조: ${brokenReferences.join(', ')}`);

const metrics = {
  file: 'app/index.html',
  bytes: file.size,
  budget: 350 * 1024,
  ids: ids.length,
  duplicateIds: duplicates.length,
  fragmentReferences: references.length,
  brokenReferences: brokenReferences.length,
  externalResourceReferences: 0,
  errors
};

console.log(JSON.stringify(metrics, null, 2));
if (errors.length) process.exit(1);
