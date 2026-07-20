import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import * as esbuild from 'esbuild';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(scriptDir, '..');
const srcDir = path.join(appDir, 'src');

const [{ APP_HTML }, sceneSvg, cssSource, bundle] = await Promise.all([
  import(`${pathToFileURL(path.join(srcDir, 'template.js')).href}?build=${Date.now()}`),
  readFile(path.join(srcDir, 'scene.svg'), 'utf8'),
  readFile(path.join(srcDir, 'styles.css'), 'utf8'),
  esbuild.build({
    entryPoints: [path.join(srcDir, 'main.js')],
    bundle: true,
    write: false,
    format: 'iife',
    platform: 'browser',
    target: ['es2022'],
    minify: true,
    legalComments: 'none',
    treeShaking: true,
    charset: 'utf8'
  })
]);

const css = (await esbuild.transform(cssSource, {
  loader: 'css',
  minify: true,
  target: 'es2022'
})).code.trim();

const scene = sceneSvg
  .replace(/^\s*<\?xml[^>]*>\s*/i, '')
  .replace(/<!--([\s\S]*?)-->/g, '')
  .trim();

if (!scene.startsWith('<svg') || !scene.includes('id="trumpet-scene"')) {
  throw new Error('src/scene.svg에 #trumpet-scene이 없습니다.');
}

const appMarkup = APP_HTML.replace('{{SCENE_SVG}}', scene);
if (appMarkup.includes('{{SCENE_SVG}}')) {
  throw new Error('SVG placeholder가 남아 있습니다.');
}

const javascript = bundle.outputFiles[0].text
  .replaceAll('</script', '<\\/script')
  .trim();

const html = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#17302e">
<meta name="description" content="B♭ 트럼펫 계이름과 손가락·피스톤 움직임을 함께 익히는 오프라인 모바일 학습 앱">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data:; media-src data:; connect-src 'none'; font-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'">
<title>손으로 익히는 트럼펫 운지</title>
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='16' fill='%2317302e'/%3E%3Ctext x='32' y='45' text-anchor='middle' font-size='42' fill='%23d6ae38'%3E%E2%99%AA%3C/text%3E%3C/svg%3E">
<style>${css}</style>
</head>
<body>
${appMarkup}
<script>${javascript}</script>
</body>
</html>
`;

const bytes = Buffer.byteLength(html, 'utf8');
const limit = 350 * 1024;
if (bytes > limit) {
  throw new Error(`최종 HTML ${bytes} bytes가 350KB 제한 ${limit} bytes를 초과했습니다.`);
}

const appOutput = path.join(appDir, 'index.html');
const distDir = path.resolve(appDir, '..', 'dist');
const distOutput = path.join(distDir, 'index.html');
await mkdir(distDir, { recursive: true });
await Promise.all([
  writeFile(appOutput, html, 'utf8'),
  writeFile(distOutput, html, 'utf8')
]);

console.log(JSON.stringify({
  output: 'app/index.html',
  deploymentOutput: 'dist/index.html',
  bytes,
  limit,
  withinBudget: true
}, null, 2));
