// Headless GLSL ES 3.00 validation: compile + link the project's shaders in a real
// WebGL2 context (ANGLE/SwiftShader via Playwright) — the exact pipeline the app
// uses in-browser, so a pass/fail here is ground truth. This is the validator the
// research found no mature MCP server provides (see research/findings/).
//
//   node tools/mcp/lib/validate.mjs     # CLI: prints status, exits 1 on any error
//
// Also imported by the MCP server's `validate_shaders` tool.

import { fileURLToPath } from 'node:url';
import { launchBrowser } from './browser.mjs';

// The shaders ship as JS modules exporting complete GLSL strings (COMMON_GLSL is
// already interpolated into the fragment sources), so we compile them as-is.
import { FULLSCREEN_VERT } from '../../../src/shaders/fullscreen.vert.js';
import { SLIME_FRAG } from '../../../src/shaders/slime.frag.js';
import { POST_FRAG } from '../../../src/shaders/post.frag.js';

// Compile+link each program exactly as src/gl/renderer.js does.
export async function validateShaders() {
  const programs = [
    { name: 'slime', vert: FULLSCREEN_VERT, frag: SLIME_FRAG },
    { name: 'post', vert: FULLSCREEN_VERT, frag: POST_FRAG },
  ];

  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    const res = await page.evaluate((programs) => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return { glOk: false, programs: [] };
      const compile = (type, src) => {
        const sh = gl.createShader(type);
        gl.shaderSource(sh, src);
        gl.compileShader(sh);
        const ok = gl.getShaderParameter(sh, gl.COMPILE_STATUS);
        return { sh, ok, log: ok ? '' : gl.getShaderInfoLog(sh) || '' };
      };
      const out = [];
      for (const p of programs) {
        const v = compile(gl.VERTEX_SHADER, p.vert);
        const f = compile(gl.FRAGMENT_SHADER, p.frag);
        let linkOk = false;
        let linkLog = '';
        if (v.ok && f.ok) {
          const prog = gl.createProgram();
          gl.attachShader(prog, v.sh);
          gl.attachShader(prog, f.sh);
          gl.linkProgram(prog);
          linkOk = gl.getProgramParameter(prog, gl.LINK_STATUS);
          linkLog = linkOk ? '' : gl.getProgramInfoLog(prog) || '';
        }
        out.push({ name: p.name, vertOk: v.ok, vertLog: v.log, fragOk: f.ok, fragLog: f.log, linkOk, linkLog });
      }
      return { glOk: true, programs: out };
    }, programs);

    const errors = [];
    if (!res.glOk) errors.push('WebGL2 context unavailable in headless Chromium.');
    for (const p of res.programs) {
      if (!p.vertOk) errors.push(`[${p.name}] vertex: ${p.vertLog.trim()}`);
      if (!p.fragOk) errors.push(`[${p.name}] fragment: ${p.fragLog.trim()}`);
      if (p.vertOk && p.fragOk && !p.linkOk) errors.push(`[${p.name}] link: ${p.linkLog.trim()}`);
    }
    return { ok: res.glOk && errors.length === 0, glOk: res.glOk, programs: res.programs, errors };
  } finally {
    await browser.close().catch(() => {});
  }
}

// --- CLI -------------------------------------------------------------------
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const res = await validateShaders();
  for (const p of res.programs) {
    console.log(`${p.linkOk ? 'ok  ' : 'FAIL'} ${p.name} (vert ${p.vertOk ? '✓' : '✗'}, frag ${p.fragOk ? '✓' : '✗'}, link ${p.linkOk ? '✓' : '✗'})`);
  }
  if (!res.ok) {
    console.error('\nShader validation FAILED:\n' + res.errors.join('\n'));
    process.exit(1);
  }
  console.log('\nAll shaders compiled and linked.');
  process.exit(0);
}
