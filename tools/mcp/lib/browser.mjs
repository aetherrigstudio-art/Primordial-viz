// Shared headless-Chromium launch for the WebGL2 dev tools (shader validation,
// render checks). Forces CPU rendering (SwiftShader via ANGLE) so WebGL2 works on
// a GPU-less container — the same flags test/render-check.mjs uses. Requires
// Playwright Chromium (a dev/test-only dependency; the app runtime has none).

export const GL_ARGS = [
  '--use-gl=angle',
  '--use-angle=swiftshader',
  '--enable-unsafe-swiftshader',
  '--ignore-gpu-blocklist',
];

// Dynamic-import Playwright so a missing dev-dep yields a clear message rather
// than a module-resolution crash.
export async function launchBrowser() {
  let chromium;
  try {
    ({ chromium } = await import('playwright'));
  } catch {
    throw new Error(
      'Playwright not installed. Run `npm i -D playwright` and ' +
        '`npx playwright install chromium`.',
    );
  }
  return chromium.launch({ args: GL_ARGS });
}
